/* harvest.js */
QingheModules.define("./harvest.js", function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HarvestSimulation = void 0;
const conveyor_js_1 = require("./conveyor.js");
// Air transport consumes only crates explicitly staged by the manual ground picker.
const CRUISE_HEIGHT = 9;
const BATCH_WEIGHT = 25;
const CONVEYOR_SECONDS = conveyor_js_1.CONVEYOR_DURATION_SECONDS;
const PHASE_SECONDS = { outbound: 8, descending: 3, grabbing: 3, lifting: 3, transporting: 9, dropping: 3, returning: 9 };
const MISSION_SECONDS = Object.values(PHASE_SECONDS).reduce((sum, value) => sum + value, 0);
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const copy = (point) => ({ x: point.x, y: point.y, z: point.z });
const interpolate = (from, to, t) => ({
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t,
});
class HarvestSimulation {
    constructor(fields, logistics, onEvent = () => { }) {
        const validPoint = (point) => point && [point.x, point.y, point.z].every(Number.isFinite);
        if (!Array.isArray(fields) || !fields.length || !validPoint(logistics?.pad) ||
            !validPoint(logistics?.intake) || !Array.isArray(logistics?.conveyorPath) ||
            logistics.conveyorPath.length < 2 || !logistics.conveyorPath.every(validPoint) ||
            !Array.isArray(logistics.stagePoints) || logistics.stagePoints.length !== fields.length ||
            !logistics.stagePoints.every(validPoint)) {
            throw new TypeError('转运模拟需要田地、大屏集货点、充电位、投放点和完整输送带路径。');
        }
        this.fields = fields;
        this.logistics = {
            pad: copy(logistics.pad),
            intake: copy(logistics.intake),
            conveyorPath: logistics.conveyorPath.map(copy),
            stagePoints: logistics.stagePoints.map(copy),
            warehouse: logistics.warehouse ? copy(logistics.warehouse) : copy(logistics.conveyorPath.at(-1)),
        };
        this.onEvent = typeof onEvent === 'function' ? onEvent : () => { };
        this.automatic = false;
        this.parcels = [];
        this.inventory = { totalWeight: 0, totalBatches: 0, byCrop: {} };
        this.metrics = { harvestedBatches: 0, deliveredBatches: 0 };
        this.drone = {
            id: 'HARV-01', state: 'ready', position: copy(this.logistics.pad), heading: 0,
            battery: 100, target: null, progress: 0, armExtension: 0, grip: 0,
            carrying: false, load: null,
        };
        this.fields.forEach((field) => {
            field.harvestable = Number.isFinite(field.harvestable) ? Math.max(0, Math.floor(field.harvestable)) : 4;
            field.harvested = Number.isFinite(field.harvested) ? Math.max(0, Math.floor(field.harvested)) : 0;
            if (!Array.isArray(field.stagedLoads))
                field.stagedLoads = [];
            field.stagedBatches = field.stagedLoads.length;
            this.inventory.byCrop[field.name] ??= { name: field.name, weight: 0, batches: 0 };
        });
        this._phaseTime = 0;
        this._missionTime = 0;
        this._route = null;
        this._grabbedThisMission = false;
        this._releasedThisMission = false;
        this._returnRequested = false;
        this._lowBatteryWarned = false;
        this._credited = new Set();
        this._conveyorPath = (0, conveyor_js_1.createConveyorPathSampler)(this.logistics.conveyorPath);
        this._pathLength = this._conveyorPath.length;
    }
    _emit(type, message) { this.onEvent({ type, message, time: Date.now() }); }
    _result(ok, message) { return { ok, message }; }
    dispatch(fieldIndex) {
        const field = this.fields[fieldIndex];
        const drone = this.drone;
        if (!Number.isInteger(fieldIndex) || !field)
            return this._result(false, '请选择有效的转运田块。');
        if (drone.state !== 'ready')
            return this._result(false, `${drone.id} 正在作业或充电。`);
        const next = field.stagedLoads.find(l => !field.groundClaims?.has(l.id));
        if (!next)
            return this._result(false, field.stagedLoads.length ? '这些货箱已分配给无人车整车清运。' : '请先手动调度采摘机器人，将作物送至该田块大屏旁。');
        if (drone.battery < 35)
            return this._result(false, `${drone.id} 电量不足，请先返航充电。`);
        field.airClaim = next.id;
        drone.target = fieldIndex;
        drone.progress = 0;
        drone.armExtension = 0;
        drone.grip = 0;
        drone.carrying = false;
        drone.load = null;
        this._missionTime = 0;
        this._grabbedThisMission = false;
        this._releasedThisMission = false;
        this._returnRequested = false;
        this._lowBatteryWarned = false;
        const start = copy(drone.position);
        const pickup = this._pickupPoint(fieldIndex);
        this._startPhase('outbound', [
            { time: 0, ...start },
            { time: 2, x: start.x, y: CRUISE_HEIGHT, z: start.z },
            { time: 8, x: pickup.x, y: CRUISE_HEIGHT, z: pickup.z },
        ]);
        const message = `${drone.id} 已起飞，前往${field.name}田大屏集货区提货。`;
        this._emit('info', message);
        return this._result(true, message);
    }
    _pickupPoint(fieldIndex) {
        const stage = this.logistics.stagePoints[fieldIndex];
        return { x: stage.x, y: stage.y + 2.9, z: stage.z };
    }
    _startPhase(state, route = null) {
        this.drone.state = state;
        this._phaseTime = 0;
        this._route = route;
    }
    _startReturn(message, type = 'info') {
        const field = this.fields[this.drone.target];
        if (field)
            field.airClaim = null;
        const start = copy(this.drone.position);
        const pad = this.logistics.pad;
        this._returnArmStart = this.drone.armExtension;
        this._returnGripStart = this.drone.grip;
        this._startPhase('returning', [
            { time: 0, ...start },
            { time: 1.5, x: start.x, y: CRUISE_HEIGHT, z: start.z },
            { time: 7.5, x: pad.x, y: CRUISE_HEIGHT, z: pad.z },
            { time: 9, ...pad },
        ]);
        if (message)
            this._emit(type, message);
    }
    returnHome() {
        const drone = this.drone;
        if (drone.state === 'returning')
            return this._result(false, `${drone.id} 正在返航。`);
        if (drone.state === 'charging')
            return this._result(false, `${drone.id} 已在充电位充电。`);
        if (drone.state === 'ready') {
            if (drone.battery >= 100)
                return this._result(false, `${drone.id} 已在充电位，电量充足。`);
            this._startPhase('charging');
            const message = `${drone.id} 开始充电。`;
            this._emit('info', message);
            return this._result(true, message);
        }
        if (drone.carrying) {
            this._returnRequested = true;
            const message = `${drone.id} 已载货，将先安全交付输送带，再返航充电。`;
            this._emit('info', message);
            return this._result(true, message);
        }
        const message = `${drone.id} 已收到返航指令，返回货运充电位。`;
        this._startReturn(message);
        return this._result(true, message);
    }
    setAutomatic(enabled) {
        this.automatic = Boolean(enabled);
        this._emit('info', this.automatic ? '自动转运已开启：仅转运机器人已送至大屏旁的集货箱。' : '自动转运已关闭，当前任务继续执行。');
        if (this.automatic)
            this._scheduleAutomatic();
    }
    _scheduleAutomatic() {
        if (!this.automatic || this.drone.state !== 'ready')
            return;
        if (this.drone.battery < 35) {
            this._startPhase('charging');
            this._emit('warning', `${this.drone.id} 电量不足，先充电后继续自动转运。`);
            return;
        }
        const candidates = this.fields.map((field, index) => ({ field, index }))
            .filter(({ field }) => field.stagedLoads.some(l => !field.groundClaims?.has(l.id)))
            .sort((a, b) => b.field.stagedLoads.length - a.field.stagedLoads.length || a.index - b.index);
        if (candidates.length)
            this.dispatch(candidates[0].index);
    }
    _move(position) {
        const dx = position.x - this.drone.position.x;
        const dz = position.z - this.drone.position.z;
        if (dx * dx + dz * dz > 0.000001)
            this.drone.heading = Math.atan2(dx, dz);
        Object.assign(this.drone.position, position);
    }
    _followRoute() {
        const route = this._route;
        let endIndex = route.findIndex((point, index) => index > 0 && point.time >= this._phaseTime);
        if (endIndex < 0)
            endIndex = route.length - 1;
        const start = route[endIndex - 1];
        const end = route[endIndex];
        this._move(interpolate(start, end, ease((this._phaseTime - start.time) / (end.time - start.time))));
    }
    _pickup() {
        if (this._grabbedThisMission)
            return true;
        const field = this.fields[this.drone.target];
        const index = field.stagedLoads.findIndex(l => l.id === field.airClaim && !field.groundClaims?.has(l.id));
        if (index < 0) {
            this._startReturn(`${this.drone.id} 当前大屏集货区已无货物，返航待命。`, 'warning');
            return false;
        }
        const [source] = field.stagedLoads.splice(index, 1);
        field.airClaim = null;
        field.stagedBatches = field.stagedLoads.length;
        this._grabbedThisMission = true;
        this.metrics.harvestedBatches += 1;
        this.drone.load = {
            ...source, fieldIndex: this.drone.target, crop: source.crop || field.name, weight: source.weight ?? BATCH_WEIGHT,
        };
        this.drone.carrying = true;
        this._emit('success', `${this.drone.id} 已从大屏集货区提取${this.drone.load.crop}，本箱 ${this.drone.load.weight} kg。`);
        return true;
    }
    tryFeed(load, byAir = false) {
        // Keep the full X + Z crate footprint clear through the right-angle transfer.
        const feedInterval = 2.6 / (this._pathLength / CONVEYOR_SECONDS);
        if (!load || this._credited.has(load.id) || this.parcels.some(p => p.id === load.id || p._elapsed < feedInterval))
            return false;
        if (!byAir && this.drone.state === 'dropping' && this.drone.carrying)
            return false;
        this.parcels.push({ ...load, position: copy(this.logistics.conveyorPath[0]), progress: 0, _elapsed: 0 });
        return true;
    }
    _releaseCargo() {
        if (this._releasedThisMission || !this.drone.load)
            return;
        const load = this.drone.load;
        // Parcel position is the crate base on the belt surface, not its held-cargo anchor.
        if (!this.tryFeed(load, true))
            return;
        this._releasedThisMission = true;
        this.drone.carrying = false;
        this.drone.load = null;
        this.drone.grip = 0;
        this._emit('info', `${load.crop} ${load.weight} kg 已放至输送带，正在送往仓库。`);
    }
    _creditParcel(parcel) {
        if (this._credited.has(parcel.id))
            return;
        this._credited.add(parcel.id);
        const crop = this.inventory.byCrop[parcel.crop] ??= { name: parcel.crop, weight: 0, batches: 0 };
        crop.weight += parcel.weight;
        crop.batches += 1;
        this.inventory.totalWeight += parcel.weight;
        this.inventory.totalBatches += 1;
        this.metrics.deliveredBatches += 1;
        this._emit('success', `${parcel.crop} ${parcel.weight} kg 已沿输送带抵达仓库，入库完成。`);
    }
    _updateParcels(seconds) {
        for (let index = this.parcels.length - 1; index >= 0; index -= 1) {
            const parcel = this.parcels[index];
            parcel._elapsed = Math.min(CONVEYOR_SECONDS, parcel._elapsed + seconds);
            parcel.progress = clamp(parcel._elapsed / CONVEYOR_SECONDS);
            parcel.position = this._conveyorPath.sample(parcel.progress);
            if (parcel.progress >= 1 - 1e-8) {
                parcel.progress = 1;
                parcel.position = copy(this.logistics.conveyorPath.at(-1));
                this._creditParcel(parcel);
                this.parcels.splice(index, 1);
            }
        }
    }
    _step(seconds) {
        // Existing parcels continue along the belt during return flights and charging.
        this._updateParcels(seconds);
        const drone = this.drone;
        if (drone.state === 'ready') {
            this._scheduleAutomatic();
            return;
        }
        if (drone.state === 'charging') {
            drone.battery = clamp(drone.battery + seconds * 3, 0, 100);
            if (drone.battery >= 100) {
                drone.state = 'ready';
                drone.progress = 0;
                this._emit('success', `${drone.id} 充电完成，转运待命。`);
                this._scheduleAutomatic();
            }
            return;
        }
        this._phaseTime = Math.min(PHASE_SECONDS[drone.state], this._phaseTime + seconds);
        this._missionTime += seconds;
        drone.progress = clamp(this._missionTime / MISSION_SECONDS, 0, 0.99);
        drone.battery = clamp(drone.battery - seconds * (drone.state === 'grabbing' || drone.state === 'dropping' ? 0.2 : 0.28), 0, 100);
        if (drone.battery <= 20 && drone.state !== 'returning') {
            if (!drone.carrying) {
                this._startReturn(`${drone.id} 电量偏低，自动返航充电。`, 'warning');
                return;
            }
            if (!this._lowBatteryWarned) {
                this._lowBatteryWarned = true;
                this._returnRequested = true;
                this._emit('warning', `${drone.id} 电量偏低，将先安全交付载货再返航。`);
            }
        }
        const duration = PHASE_SECONDS[drone.state];
        const progress = clamp(this._phaseTime / duration);
        const finished = this._phaseTime >= duration - 1e-7;
        if (drone.state === 'outbound') {
            this._followRoute();
            if (finished) {
                const pickup = this._pickupPoint(drone.target);
                this._startPhase('descending', [{ time: 0, ...copy(drone.position) }, { time: 3, ...pickup }]);
            }
        }
        else if (drone.state === 'descending') {
            this._followRoute();
            drone.armExtension = ease(progress);
            if (finished)
                this._startPhase('grabbing');
        }
        else if (drone.state === 'grabbing') {
            drone.armExtension = 1;
            drone.grip = ease(progress / 0.75);
            if (progress >= 0.75 && !this._pickup())
                return;
            if (finished) {
                const start = copy(drone.position);
                this._startPhase('lifting', [{ time: 0, ...start }, { time: 3, x: start.x, y: CRUISE_HEIGHT, z: start.z }]);
            }
        }
        else if (drone.state === 'lifting') {
            this._followRoute();
            drone.armExtension = 1 - ease(progress) * 0.75;
            drone.grip = 1;
            if (finished) {
                const intake = this.logistics.intake;
                this._startPhase('transporting', [{ time: 0, ...copy(drone.position) }, { time: 9, x: intake.x, y: CRUISE_HEIGHT, z: intake.z }]);
            }
        }
        else if (drone.state === 'transporting') {
            this._followRoute();
            if (finished) {
                this._dropStart = copy(drone.position);
                this._startPhase('dropping');
            }
        }
        else if (drone.state === 'dropping') {
            const intake = this.logistics.intake;
            // Extended gripper is 2.9 below the body; the hanging crate base is another 0.7 below.
            this._move(interpolate(this._dropStart, { x: intake.x, y: intake.y + 2.9 + 0.7, z: intake.z }, ease(progress / 0.72)));
            drone.armExtension = 0.25 + ease(progress / 0.65) * 0.75;
            drone.grip = 1 - ease((progress - 0.82) / 0.1);
            if (progress >= 0.92)
                this._releaseCargo();
            if (finished && this._releasedThisMission)
                this._startReturn();
        }
        else if (drone.state === 'returning') {
            this._followRoute();
            drone.armExtension = this._returnArmStart * (1 - ease(this._phaseTime / 1.5));
            drone.grip = this._returnGripStart * (1 - ease(this._phaseTime / 1.5));
            if (finished) {
                Object.assign(drone.position, this.logistics.pad);
                drone.target = null;
                drone.progress = 1;
                drone.armExtension = 0;
                drone.grip = 0;
                this._startPhase('charging');
                this._emit('info', `${drone.id} 已降落，正在充电。`);
            }
        }
    }
    tick(dt) {
        if (!Number.isFinite(dt) || dt <= 0)
            return;
        let remaining = Math.min(dt, 3600);
        while (remaining > 1e-8) {
            const seconds = Math.min(0.1, remaining);
            this._step(seconds);
            remaining -= seconds;
        }
    }
}
exports.HarvestSimulation = HarvestSimulation;

});

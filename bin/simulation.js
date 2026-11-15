/* simulation.js */
QingheModules.define("./simulation.js", function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FarmSimulation = void 0;
// Browser-local, deterministic mission simulation. All values are demonstrative.
const FLIGHT_ALTITUDE = 7;
const IRRIGATION_SECONDS = 24;
const DRYING_RATE = 0.012;
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const smooth = (value) => value * value * (3 - 2 * value);
const copyPosition = (point) => ({ x: point.x, y: point.y, z: point.z });
class FarmSimulation {
    constructor(fields, pads, onEvent = () => { }) {
        if (!Array.isArray(fields) || !fields.length || !Array.isArray(pads) || pads.length !== 4) {
            throw new TypeError('农场模拟需要田地数据和四个充电位。');
        }
        this.fields = fields;
        this.pads = pads.map((pad) => ({ x: pad.x, y: 1.1, z: pad.z }));
        this.onEvent = typeof onEvent === 'function' ? onEvent : () => { };
        this.automatic = false;
        this.elapsed = 0;
        this.metrics = { waterUsed: 0, totalMissions: 0, flightSeconds: 0, areaIrrigated: 0 };
        this.drones = this.pads.map((pad, index) => ({
            id: `UAV-${String(index + 1).padStart(2, '0')}`,
            state: 'ready',
            position: copyPosition(pad),
            battery: 100,
            water: 100,
            target: null,
            progress: 0,
            heading: 0,
            flightTime: 0,
            _route: null,
            _irrigationTime: 0,
            _moistureRate: 0,
        }));
    }
    _emit(type, message) {
        this.onEvent({ type, message, time: Date.now() });
    }
    _result(ok, message) {
        return { ok, message };
    }
    dispatch(index, fieldIndex) {
        const drone = this.drones[index];
        const field = this.fields[fieldIndex];
        if (!Number.isInteger(index) || !drone || !Number.isInteger(fieldIndex) || !field) {
            return this._result(false, '请选择有效的无人机和田地。');
        }
        if (drone.state !== 'ready')
            return this._result(false, `${drone.id} 正在执行任务或充电。`);
        if (drone.battery < 30 || drone.water < 20) {
            return this._result(false, `${drone.id} 电量或水量不足，请先返航补给。`);
        }
        if (this.drones.some((other) => other !== drone && other.target === fieldIndex &&
            (other.state === 'outbound' || other.state === 'irrigating'))) {
            return this._result(false, `${field.name}田已有无人机作业。`);
        }
        const start = copyPosition(drone.position);
        const first = { x: field.x - 7.5, y: FLIGHT_ALTITUDE, z: field.z - 5 };
        drone.state = 'outbound';
        drone.target = fieldIndex;
        drone.progress = 0;
        drone._irrigationTime = 0;
        drone._route = {
            elapsed: 0,
            duration: 9,
            points: [
                { time: 0, ...start },
                { time: 2, x: start.x, y: FLIGHT_ALTITUDE, z: start.z },
                { time: 9, ...first },
            ],
        };
        const message = `${drone.id} 已起飞，前往${field.name}田灌溉。`;
        this._emit('info', message);
        return this._result(true, message);
    }
    _startReturn(index, message, type = 'info') {
        const drone = this.drones[index];
        const start = copyPosition(drone.position);
        const pad = this.pads[index];
        drone.state = 'returning';
        drone._route = {
            elapsed: 0,
            duration: 9.5,
            points: [
                { time: 0, ...start },
                { time: 1.2, x: start.x, y: FLIGHT_ALTITUDE, z: start.z },
                { time: 7.5, x: pad.x, y: FLIGHT_ALTITUDE, z: pad.z },
                { time: 9.5, ...pad },
            ],
        };
        if (message)
            this._emit(type, message);
    }
    returnHome(index) {
        const drone = this.drones[index];
        if (!Number.isInteger(index) || !drone)
            return this._result(false, '请选择有效的无人机。');
        if (drone.state === 'returning')
            return this._result(false, `${drone.id} 正在返航。`);
        if (drone.state === 'charging')
            return this._result(false, `${drone.id} 已在充电补给。`);
        if (drone.state === 'ready') {
            if (drone.battery >= 100 && drone.water >= 100) {
                return this._result(false, `${drone.id} 已在充电位，补给充足。`);
            }
            drone.state = 'charging';
            const message = `${drone.id} 开始充电补水。`;
            this._emit('info', message);
            return this._result(true, message);
        }
        const message = `${drone.id} 已收到返航指令，返回调度总站。`;
        this._startReturn(index, message);
        return this._result(true, message);
    }
    dispatchAll() {
        const occupied = new Set(this.drones.filter((drone) => drone.state === 'outbound' || drone.state === 'irrigating').map((drone) => drone.target));
        return this.drones.map((drone, index) => {
            const preferred = index % this.fields.length;
            if (drone.state !== 'ready')
                return this.dispatch(index, preferred);
            const target = occupied.has(preferred)
                ? this.fields.findIndex((field, fieldIndex) => !occupied.has(fieldIndex))
                : preferred;
            if (target < 0)
                return this._result(false, '所有田块均已有无人机作业。');
            const result = this.dispatch(index, target);
            if (result.ok)
                occupied.add(target);
            return result;
        });
    }
    returnAll() {
        return this.drones.map((drone, index) => this.returnHome(index));
    }
    setAutomatic(enabled) {
        this.automatic = Boolean(enabled);
        this._emit('info', this.automatic ? '自动调度已开启：优先灌溉湿度低于 50% 的田地。' : '自动调度已关闭，现有任务继续执行。');
        if (this.automatic)
            this._scheduleAutomatic();
    }
    _scheduleAutomatic() {
        if (!this.automatic)
            return;
        const occupied = new Set(this.drones.filter((drone) => drone.state === 'outbound' || drone.state === 'irrigating').map((drone) => drone.target));
        const candidates = this.fields.map((field, index) => ({ field, index }))
            .filter(({ field, index }) => field.moisture < 50 && !occupied.has(index))
            .sort((a, b) => a.field.moisture - b.field.moisture);
        for (const drone of this.drones) {
            if (!candidates.length)
                break;
            if (drone.state !== 'ready' || drone.battery < 30 || drone.water < 20)
                continue;
            const candidate = candidates.shift();
            this.dispatch(this.drones.indexOf(drone), candidate.index);
        }
    }
    _followRoute(drone, seconds) {
        const route = drone._route;
        route.elapsed = Math.min(route.duration, route.elapsed + seconds);
        const endIndex = route.points.findIndex((point, index) => index > 0 && point.time >= route.elapsed);
        const to = route.points[endIndex < 0 ? route.points.length - 1 : endIndex];
        const from = route.points[Math.max(0, (endIndex < 0 ? route.points.length - 1 : endIndex) - 1)];
        const fraction = smooth(clamp((route.elapsed - from.time) / (to.time - from.time), 0, 1));
        const oldX = drone.position.x;
        const oldZ = drone.position.z;
        drone.position.x = from.x + (to.x - from.x) * fraction;
        drone.position.y = from.y + (to.y - from.y) * fraction;
        drone.position.z = from.z + (to.z - from.z) * fraction;
        this._updateHeading(drone, oldX, oldZ);
        return route.elapsed >= route.duration - 1e-7;
    }
    _updateHeading(drone, oldX, oldZ) {
        const dx = drone.position.x - oldX;
        const dz = drone.position.z - oldZ;
        if (dx * dx + dz * dz > 0.000001)
            drone.heading = Math.atan2(dx, dz);
    }
    _irrigate(index, seconds) {
        const drone = this.drones[index];
        const field = this.fields[drone.target];
        const oldProgress = drone.progress;
        const oldX = drone.position.x;
        const oldZ = drone.position.z;
        const remaining = Math.max(0, IRRIGATION_SECONDS - drone._irrigationTime);
        const applied = Math.min(remaining, seconds);
        drone._irrigationTime += applied;
        drone.progress = clamp(drone._irrigationTime / IRRIGATION_SECONDS, 0, 1);
        // A continuous, four-row serpentine covers the rectangular planting bed.
        const rowProgress = drone.progress * 4;
        const row = Math.min(3, Math.floor(rowProgress));
        const along = row === 3 && drone.progress === 1 ? 1 : rowProgress - row;
        const direction = row % 2 === 0 ? 1 : -1;
        drone.position.x = field.x + direction * (-7.5 + 15 * along);
        // Smoothly traverse to the next row near each turn, without teleportation.
        const turnFraction = smooth(clamp((along - 0.8) / 0.2, 0, 1));
        drone.position.z = field.z - 5 + (row + (row < 3 ? turnFraction : 0)) * (10 / 3);
        drone.position.y = FLIGHT_ALTITUDE;
        this._updateHeading(drone, oldX, oldZ);
        const waterUsed = Math.min(drone.water, applied * 2.25);
        drone.water = clamp(drone.water - waterUsed);
        this.metrics.waterUsed += waterUsed * 1.2;
        this.metrics.areaIrrigated += Math.max(0, Number(field.area) || 0) * (drone.progress - oldProgress);
        field.moisture = clamp(field.moisture + drone._moistureRate * applied, 0, 95);
        if (drone.battery <= 20 || drone.water <= 10) {
            const reason = drone.battery <= 20 ? '电量偏低' : '水量偏低';
            this._startReturn(index, `${drone.id} ${reason}，自动返航补给。`, 'warning');
        }
        else if (drone.progress >= 1) {
            this.metrics.totalMissions += 1;
            field.moisture = Math.max(field.moisture, 75);
            this._startReturn(index, `${drone.id} 已完成${field.name}田灌溉，返航充电。`, 'success');
        }
    }
    _step(seconds) {
        this.elapsed += seconds;
        for (const field of this.fields)
            field.moisture = clamp(field.moisture - DRYING_RATE * seconds);
        this.drones.forEach((drone, index) => {
            if (drone.state === 'ready')
                return;
            if (drone.state === 'charging') {
                drone.battery = clamp(drone.battery + seconds * 3);
                drone.water = clamp(drone.water + seconds * 12);
                if (drone.battery >= 100 && drone.water >= 100) {
                    drone.state = 'ready';
                    drone.progress = 0;
                    this._emit('success', `${drone.id} 充电补水完成，待命中。`);
                }
                return;
            }
            drone.flightTime += seconds;
            this.metrics.flightSeconds += seconds;
            drone.battery = clamp(drone.battery - seconds * (drone.state === 'irrigating' ? 0.42 : 0.32));
            if (drone.state === 'outbound') {
                if (drone.battery <= 20 || drone.water <= 10) {
                    this._startReturn(index, `${drone.id} 补给不足，自动返航。`, 'warning');
                }
                else if (this._followRoute(drone, seconds)) {
                    drone.state = 'irrigating';
                    drone._route = null;
                    drone._moistureRate = Math.max(0, (75 - this.fields[drone.target].moisture) / IRRIGATION_SECONDS) + DRYING_RATE;
                    this._emit('info', `${drone.id} 已抵达${this.fields[drone.target].name}田，开始灌溉。`);
                }
            }
            else if (drone.state === 'irrigating') {
                this._irrigate(index, seconds);
            }
            else if (drone.state === 'returning' && this._followRoute(drone, seconds)) {
                drone.position = copyPosition(this.pads[index]);
                drone.state = 'charging';
                drone.target = null;
                drone._route = null;
                this._emit('info', `${drone.id} 已降落，正在充电补水。`);
            }
        });
        this._scheduleAutomatic();
    }
    tick(dt) {
        if (!Number.isFinite(dt) || dt <= 0)
            return;
        // Small fixed upper steps make resource thresholds reliable at any render FPS.
        let remaining = Math.min(dt, 300);
        while (remaining > 1e-8) {
            const seconds = Math.min(0.1, remaining);
            this._step(seconds);
            remaining -= seconds;
        }
    }
}
exports.FarmSimulation = FarmSimulation;

});

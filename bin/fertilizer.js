/* fertilizer.js */
QingheModules.define("./fertilizer.js", function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FertilizerSimulation = exports.BASE_GROWTH_WET = exports.BASE_GROWTH_DRY = exports.FERTILIZER_PAYLOAD_KG = exports.FERTILIZER_GROWTH_MULTIPLIER = exports.FERTILIZER_EFFECT_SECONDS = void 0;
exports.advanceGrowth = advanceGrowth;
// Demonstration agronomy and an independent fertilizer aircraft. No DOM or Three.js.
exports.FERTILIZER_EFFECT_SECONDS = 180;
exports.FERTILIZER_GROWTH_MULTIPLIER = 3;
exports.FERTILIZER_PAYLOAD_KG = 60;
exports.BASE_GROWTH_DRY = 0.08;
exports.BASE_GROWTH_WET = 0.12;
const FLIGHT_HEIGHT = 7;
const APPLICATION_SECONDS = 18;
const NUTRIENT_DECAY = 0.015;
const clamp = (value, low = 0, high = 100) => Math.min(high, Math.max(low, value));
const smooth = (value) => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
const point = (value) => ({ x: value.x, y: value.y, z: value.z });
function initializeField(field) {
    field.nutrients = clamp(Number.isFinite(field.nutrients) ? field.nutrients : 30);
    field.fertilizerRemaining = Math.max(0, Number.isFinite(field.fertilizerRemaining) ? field.fertilizerRemaining : 0);
    field.fertilizerBoost = field.fertilizerRemaining > 0 ? exports.FERTILIZER_GROWTH_MULTIPLIER : 1;
    field.maturity = clamp(Number.isFinite(field.maturity) ? field.maturity : 0);
}
// Call exactly once per global simulation step, outside FertilizerSimulation.tick().
// Splitting an elapsed interval at expiry makes growth independent of frame size.
function advanceGrowth(fields, dt) {
    if (!Array.isArray(fields) || !Number.isFinite(dt) || dt <= 0)
        return;
    for (const field of fields) {
        initializeField(field);
        const activeSeconds = Math.min(dt, field.fertilizerRemaining);
        const base = Number(field.moisture) >= 45 ? exports.BASE_GROWTH_WET : exports.BASE_GROWTH_DRY;
        if (field.harvestable !== 0 && field.maturity < 100) {
            field.maturity = clamp(field.maturity + base * (activeSeconds * exports.FERTILIZER_GROWTH_MULTIPLIER + dt - activeSeconds));
        }
        field.nutrients = clamp(field.nutrients - NUTRIENT_DECAY * dt);
        field.fertilizerRemaining = Math.max(0, field.fertilizerRemaining - dt);
        field.fertilizerBoost = field.fertilizerRemaining > 0 ? exports.FERTILIZER_GROWTH_MULTIPLIER : 1;
    }
}
class FertilizerSimulation {
    constructor(fields, pad, onEvent = () => { }) {
        if (!Array.isArray(fields) || !fields.length || !pad || ![pad.x, pad.y, pad.z].every(Number.isFinite)) {
            throw new TypeError('施肥模拟需要田地和有效的无人机充电位。');
        }
        this.fields = fields;
        this.pad = point(pad);
        this.onEvent = typeof onEvent === 'function' ? onEvent : () => { };
        this.fields.forEach(initializeField);
        this.drone = {
            id: 'FERT-01', state: 'ready', position: point(pad), heading: 0,
            battery: 100, fertilizer: 100, target: null, progress: 0,
        };
        // fertilizerUsed is kilograms, not hopper percentage.
        this.metrics = { fertilizerUsed: 0, totalMissions: 0 };
        this._route = null;
        this._applicationTime = 0;
        this._nutrientRate = 0;
    }
    _emit(type, message) { this.onEvent({ type, message, time: Date.now() }); }
    _result(ok, message) { return { ok, message }; }
    dispatch(fieldIndex) {
        const field = this.fields[fieldIndex], drone = this.drone;
        if (!Number.isInteger(fieldIndex) || !field || ![field.x, field.z].every(Number.isFinite)) {
            return this._result(false, '请选择有效的施肥田块。');
        }
        if (drone.state !== 'ready')
            return this._result(false, `${drone.id} 正在作业或补给。`);
        if (field.maturity >= 100)
            return this._result(false, `${field.name}已成熟，无需施肥。`);
        if (field.harvestable === 0)
            return this._result(false, `${field.name}田本季已采完，无需施肥。`);
        if (drone.battery < 30 || drone.fertilizer < 20)
            return this._result(false, `${drone.id} 电量或肥料不足，请先返航补给。`);
        const start = point(drone.position);
        drone.state = 'outbound';
        drone.target = fieldIndex;
        drone.progress = 0;
        this._applicationTime = 0;
        this._route = {
            elapsed: 0, duration: 9,
            points: [
                { time: 0, ...start },
                { time: 2, x: start.x, y: FLIGHT_HEIGHT, z: start.z },
                { time: 9, x: field.x - 7.5, y: FLIGHT_HEIGHT, z: field.z - 5 },
            ],
        };
        const message = `${drone.id} 已起飞，前往${field.name}田施肥。`;
        this._emit('info', message);
        return this._result(true, message);
    }
    _startReturn(message, type = 'info') {
        const drone = this.drone, start = point(drone.position);
        drone.state = 'returning';
        this._route = {
            elapsed: 0, duration: 9,
            points: [
                { time: 0, ...start },
                { time: 1.2, x: start.x, y: FLIGHT_HEIGHT, z: start.z },
                { time: 7, x: this.pad.x, y: FLIGHT_HEIGHT, z: this.pad.z },
                { time: 9, ...this.pad },
            ],
        };
        if (message)
            this._emit(type, message);
    }
    returnHome() {
        const drone = this.drone;
        if (drone.state === 'returning')
            return this._result(false, `${drone.id} 正在返航。`);
        if (drone.state === 'charging')
            return this._result(false, `${drone.id} 已在充电补肥。`);
        if (drone.state === 'ready') {
            if (drone.battery >= 100 && drone.fertilizer >= 100)
                return this._result(false, `${drone.id} 已在充电位，补给充足。`);
            drone.state = 'charging';
            const message = `${drone.id} 开始充电补肥。`;
            this._emit('info', message);
            return this._result(true, message);
        }
        const message = `${drone.id} 已收到返航指令，返回施肥充电位。`;
        this._startReturn(message);
        return this._result(true, message);
    }
    _move(next) {
        const drone = this.drone, dx = next.x - drone.position.x, dz = next.z - drone.position.z;
        if (dx * dx + dz * dz > 1e-6)
            drone.heading = Math.atan2(dx, dz);
        Object.assign(drone.position, next);
    }
    _followRoute(seconds) {
        const route = this._route;
        route.elapsed = Math.min(route.duration, route.elapsed + seconds);
        let end = route.points.findIndex((p, index) => index > 0 && p.time >= route.elapsed);
        if (end < 0)
            end = route.points.length - 1;
        const a = route.points[end - 1], b = route.points[end], t = smooth((route.elapsed - a.time) / (b.time - a.time));
        this._move({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
        return route.elapsed >= route.duration - 1e-7;
    }
    _apply(seconds) {
        const drone = this.drone, field = this.fields[drone.target];
        if (field.maturity >= 100 || field.harvestable === 0) {
            this._startReturn(`${field.name}已成熟或完成采收，${drone.id} 停止施肥并返航。`);
            return;
        }
        const applied = Math.min(seconds, APPLICATION_SECONDS - this._applicationTime, Math.max(0, drone.fertilizer - 10) / 4);
        this._applicationTime += applied;
        drone.progress = clamp(this._applicationTime / APPLICATION_SECONDS, 0, 1);
        const rowProgress = drone.progress * 4, row = Math.min(3, Math.floor(rowProgress));
        const along = drone.progress >= 1 ? 1 : rowProgress - row;
        const direction = row % 2 === 0 ? 1 : -1, turn = smooth((along - .8) / .2);
        this._move({
            x: field.x + direction * (-7.5 + 15 * along),
            y: FLIGHT_HEIGHT,
            z: field.z - 5 + (row + (row < 3 ? turn : 0)) * (10 / 3),
        });
        if (applied > 0) {
            const used = applied * 4;
            drone.fertilizer = clamp(drone.fertilizer - used);
            this.metrics.fertilizerUsed += used * exports.FERTILIZER_PAYLOAD_KG / 100;
            field.nutrients = clamp(field.nutrients + this._nutrientRate * applied, 0, 95);
            field.fertilizerRemaining = exports.FERTILIZER_EFFECT_SECONDS;
            field.fertilizerBoost = exports.FERTILIZER_GROWTH_MULTIPLIER;
        }
        if (drone.battery <= 20 || drone.fertilizer <= 10 + 1e-7) {
            this._startReturn(`${drone.id} ${drone.battery <= 20 ? '电量' : '肥料'}偏低，自动返航补给。`, 'warning');
        }
        else if (drone.progress >= 1 - 1e-7) {
            field.nutrients = Math.min(95, Math.max(field.nutrients, 90));
            this.metrics.totalMissions += 1;
            this._startReturn(`${drone.id} 已完成${field.name}田施肥，作物获得 3× 生长加速，返航补给。`, 'success');
        }
    }
    _step(seconds) {
        const drone = this.drone;
        if (drone.state === 'ready')
            return;
        if (drone.state === 'charging') {
            drone.battery = clamp(drone.battery + seconds * 3);
            drone.fertilizer = clamp(drone.fertilizer + seconds * 3);
            if (drone.battery >= 100 && drone.fertilizer >= 100) {
                drone.state = 'ready';
                drone.progress = 0;
                this._emit('success', `${drone.id} 充电补肥完成，待命中。`);
            }
            return;
        }
        drone.battery = clamp(drone.battery - seconds * (drone.state === 'fertilizing' ? .38 : .3));
        if (drone.state === 'outbound') {
            if (drone.battery <= 20 || drone.fertilizer <= 10) {
                this._startReturn(`${drone.id} 补给不足，自动返航。`, 'warning');
            }
            else if (this._followRoute(seconds)) {
                drone.state = 'fertilizing';
                this._route = null;
                this._nutrientRate = Math.max(0, 90 - this.fields[drone.target].nutrients) / APPLICATION_SECONDS;
                this._emit('info', `${drone.id} 已抵达${this.fields[drone.target].name}田，开始精准施肥。`);
            }
        }
        else if (drone.state === 'fertilizing') {
            this._apply(seconds);
        }
        else if (drone.state === 'returning' && this._followRoute(seconds)) {
            Object.assign(drone.position, this.pad);
            drone.state = 'charging';
            drone.target = null;
            this._route = null;
            this._emit('info', `${drone.id} 已降落，正在充电补肥。`);
        }
    }
    tick(dt) {
        if (!Number.isFinite(dt) || dt <= 0)
            return;
        let remaining = Math.min(dt, 300);
        while (remaining > 1e-8) {
            const seconds = Math.min(.1, remaining);
            this._step(seconds);
            remaining -= seconds;
        }
    }
}
exports.FertilizerSimulation = FertilizerSimulation;

});

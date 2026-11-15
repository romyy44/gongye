/* seeding.js */
QingheModules.define("./seeding.js", function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedingSimulation = exports.fieldLabel = exports.CROPS = void 0;
// Plant identity travels with the crop, never with the field that last grew it.
exports.CROPS = [
    { name: '玉米', english: 'CORN', emoji: '🌽', color: '#bfca74' },
    { name: '番茄', english: 'TOMATO', emoji: '🍅', color: '#ce8a73' },
    { name: '胡萝卜', english: 'CARROT', emoji: '🥕', color: '#d6ad6c' },
    { name: '土豆', english: 'POTATO', emoji: '🥔', color: '#ada07c' },
];
const fieldLabel = f => f.harvestable > 0 ? f.name : f.sowOrder ? '待播 · ' + exports.CROPS[f.sowOrder.crop].name : '空田';
exports.fieldLabel = fieldLabel;
const validCrop = n => Number.isInteger(n) && !!exports.CROPS[n];
const point = p => ({ x: p.x, y: p.y, z: p.z });
const mix = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
const snap = t => (t = Math.min(1, Math.max(0, t)), t * t * (3 - 2 * t));
const answer = (ok, message) => ({ ok, message });
function sweep(f, t) {
    // Six rows, with explicit connecting segments so the scatter head never teleports.
    const q = Math.min(5.999999, t * 6), row = Math.floor(q), s = q - row, dir = row % 2 ? -1 : 1;
    return { x: f.x + dir * (-8 + 16 * Math.min(1, s / .86)), y: 4.6, z: f.z - 5.75 + 2.3 * (row + (row < 5 ? snap((s - .86) / .14) : 0)) };
}
class SeedingSimulation {
    constructor(fields, pad, onEvent = () => { }, groundClear = () => true) {
        this.fields = fields;
        this.pad = point(pad);
        this.emit = (type, message) => onEvent({ type, message, time: Date.now() });
        this.groundClear = groundClear;
        this.plan = fields.map(f => { const i = exports.CROPS.findIndex(c => c.name === f.name); return i < 0 ? null : i; });
        this.automatic = false;
        this.cursor = 0;
        this.completed = 0;
        this.elapsed = 0;
        this.order = null;
        this.drone = { id: 'SEED-01', position: point(pad), state: 'ready', target: null, heading: 0, battery: 100, seed: 100, progress: 0 };
        fields.forEach((f, i) => { f.season ??= 1; f.cropIndex ??= this.plan[i]; f.sowOrder = null; });
    }
    reason(i) {
        const f = this.fields[i];
        if (!Number.isInteger(i) || !f)
            return '请选择有效田块';
        if (f.harvestable !== 0)
            return '还有 ' + f.harvestable + ' 批在田，须先手动采完';
        if (f.sowOrder)
            return '已锁定播种任务';
        if (!this.groundClear(i))
            return '等待采摘无人车驶离种植区';
        return '';
    }
    setPlan(i, crop) {
        if (!this.fields[i] || (crop !== null && !validCrop(crop)))
            return answer(false, '无效播种计划');
        if (this.fields[i].sowOrder)
            return answer(false, '本次任务已锁定，返航后可修改');
        this.plan[i] = crop;
        if (this.automatic && this.plan.every(x => x === null))
            this.setAutomatic(false);
        return answer(true, '已更新计划');
    }
    setAutomatic(enabled) {
        if (enabled && this.plan.every(x => x === null))
            return answer(false, '请先为至少一块田选择作物');
        this.automatic = Boolean(enabled);
        this.emit('info', enabled ? '全自动播种已开启，按计划等待空田。' : '已停止自动派发播种任务。');
        return answer(true, '已更新');
    }
    dispatch(i, crop = this.plan[i]) {
        const d = this.drone, why = this.reason(i);
        if (why)
            return answer(false, why);
        if (!validCrop(crop))
            return answer(false, '请先在计划中选择播种作物');
        if (d.state !== 'ready')
            return answer(false, '播种机正在作业或补给');
        if (d.battery < 25 || d.seed < 50)
            return answer(false, '种量或电量不足');
        this.order = { crop, season: this.fields[i].season };
        this.fields[i].sowOrder = this.order;
        d.target = i;
        d.state = 'outbound';
        d.progress = 0;
        this.elapsed = 0;
        this.emit('info', 'SEED-01 已前往 ' + this.fields[i].id + ' 播种' + exports.CROPS[crop].name + '。');
        return answer(true, '已派发');
    }
    _release() { const f = this.fields[this.drone.target]; if (f && f.sowOrder === this.order)
        f.sowOrder = null; this.order = null; }
    _home() { this.origin = point(this.drone.position); this._release(); this.elapsed = 0; this.drone.state = 'returning'; }
    returnHome() {
        const d = this.drone;
        if (!['outbound', 'sowing'].includes(d.state))
            return answer(false, '当前无需返航');
        if (this.automatic)
            this.setAutomatic(false);
        if (d.state === 'sowing') {
            this.emit('info', '已开始落种，将完成本田后返航。');
            return answer(true, '本田完成后返航');
        }
        this._home();
        this.emit('info', '播种任务已取消，空田已解除锁定。');
        return answer(true, '已返航');
    }
    _move(p) { const d = this.drone, dx = p.x - d.position.x, dz = p.z - d.position.z; if (dx * dx + dz * dz > 1e-10)
        d.heading = Math.atan2(dx, dz); Object.assign(d.position, p); }
    _fly(a, b, t) {
        const h = 8.6;
        if (t < .20)
            return mix(a, { ...a, y: h }, snap(t / .20));
        if (t > .80)
            return mix({ ...b, y: h }, b, snap((t - .80) / .20));
        return mix({ ...a, y: h }, { ...b, y: h }, snap((t - .20) / .60));
    }
    _step(dt) {
        const d = this.drone;
        if (d.state === 'ready') {
            if (this.automatic)
                for (let k = 0; k < this.fields.length; k++) {
                    const i = (this.cursor + k) % this.fields.length;
                    if (this.plan[i] !== null && !this.reason(i) && this.dispatch(i).ok) {
                        this.cursor = (i + 1) % this.fields.length;
                        break;
                    }
                }
            return;
        }
        if (d.state === 'charging') {
            d.battery = Math.min(100, d.battery + 4 * dt);
            d.seed = Math.min(100, d.seed + 5 * dt);
            if (d.battery >= 100 && d.seed >= 100) {
                d.state = 'ready';
                d.progress = 0;
            }
            return;
        }
        const f = this.fields[d.target];
        this.elapsed += dt;
        d.battery = Math.max(0, d.battery - dt * .48);
        if (d.state === 'returning') {
            const t = Math.min(1, this.elapsed / 8);
            this._move(this._fly(this.origin, this.pad, t));
            if (t >= 1) {
                d.state = 'charging';
                d.target = null;
                d.progress = 0;
            }
            return;
        }
        if (f.harvestable !== 0 || f.sowOrder !== this.order || f.season !== this.order.season) {
            this._home();
            this.emit('warning', '田块状态已改变，已停止播种并返航。');
            return;
        }
        if (d.state === 'outbound') {
            const t = Math.min(1, this.elapsed / 8);
            this._move(this._fly(this.pad, sweep(f, 0), t));
            if (t >= 1) {
                if (!this.groundClear(d.target)) {
                    this._home();
                    return;
                }
                d.state = 'sowing';
                this.elapsed = 0;
                this.emit('info', f.id + ' 开始逐行播种。');
            }
            return;
        }
        const old = d.progress;
        d.progress = Math.min(1, this.elapsed / 18);
        this._move(sweep(f, d.progress));
        d.seed = Math.max(0, d.seed - (d.progress - old) * 50);
        if (d.progress >= 1) {
            const crop = this.order.crop;
            // Do not touch stagedLoads, lifetime pick totals, soil readings or warehouse records.
            Object.assign(f, exports.CROPS[crop], { cropIndex: crop, season: f.season + 1, maturity: 0, harvestable: 4, harvested: 0, fertilizerBoost: 1, fertilizerRemaining: 0 });
            this.completed++;
            this.emit('success', f.id + ' 已播下' + f.name + '，第 ' + f.season + ' 季开始生长。');
            this._home();
        }
    }
    tick(dt) { if (!Number.isFinite(dt) || dt <= 0)
        return; for (let r = Math.min(dt, 3600); r > 1e-8;) {
        const s = Math.min(.1, r);
        this._step(s);
        r -= s;
    } }
}
exports.SeedingSimulation = SeedingSimulation;

});

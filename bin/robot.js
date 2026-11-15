/* robot.js */
QingheModules.define("./robot.js", function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RobotSimulation = void 0;
const ground_nav_js_1 = require("./ground-nav.js");
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const angle = a => Math.atan2(Math.sin(a), Math.cos(a));
const ok = message => ({ ok: true, message }), no = message => ({ ok: false, message });
const point = p => ({ x: p.x, y: p.y, z: p.z });
const moving = ['driving', 'delivering', 'collecting', 'toBelt', 'returning'];
class RobotSimulation {
    constructor(fields, logistics, onEvent = () => { }) {
        this.fields = fields;
        this.logistics = logistics;
        this.onEvent = onEvent;
        this.nav = new ground_nav_js_1.GroundNav(fields, logistics);
        const pad = logistics.robotPad;
        this.robot = { id: 'ROVER-01', state: 'ready', position: point(pad), heading: 0, battery: 100, target: null,
            armExtension: 0, grip: 0, progress: 0, loads: [], get carrying() { return this.loads.length > 0; }, get load() { return this.loads[0] || null; },
            wheelDistance: 0, sideDistance: [0, 0], pickupPoint: null, stagePoint: null, jobSize: 0, jobDone: 0 };
        fields.forEach(f => { f.harvestable ??= 4; f.harvested ??= 0; f.pickedBatches ??= f.harvested; f.stagedLoads ??= []; f.stagedBatches = f.stagedLoads.length; f.groundClaims = new Set(); });
        this.metrics = { pickedBatches: 0, stagedBatches: 0, drivenDistance: 0, bulkTrips: 0, bulkDelivered: 0 };
        this.serial = fields.reduce((n, f) => n + f.pickedBatches, 0);
        this.route = [];
        this.haul = null;
        this.recall = false;
        this.phaseTime = 0;
    }
    _event(type, message) { this.onEvent({ type, message, time: Date.now() }); }
    _state(s) { const r = this.robot; r.state = s; r.progress = 0; r.armExtension = 0; r.grip = 0; this.phaseTime = 0; }
    _navigate(state, end, finalHeading, planned) {
        const r = this.robot, path = planned || this.nav.route(r.position, end);
        if (!path)
            return false;
        this.route = path;
        this.segment = 1;
        this.length = path.slice(1).reduce((sum, p, i) => sum + (0, ground_nav_js_1.dist)(p, path[i]), 0);
        this.travelled = 0;
        this.finalHeading = finalHeading;
        this._state(state);
        return true;
    }
    _pivot(goal, dt) {
        const r = this.robot, a = angle(goal - r.heading), v = clamp(a, -2.6 * dt, 2.6 * dt);
        r.heading = angle(r.heading + v);
        r.sideDistance[0] += v * .94;
        r.sideDistance[1] -= v * .94;
        return Math.abs(a) < .0001;
    }
    _drive(dt) {
        const r = this.robot, p = r.position;
        if (this.segment >= this.route.length)
            return this._pivot(this.finalHeading, dt);
        const q = this.route[this.segment], dx = q.x - p.x, dz = q.z - p.z, len = Math.hypot(dx, dz);
        if (len < 1e-7) {
            this.segment++;
            return false;
        }
        if (!this._pivot(Math.atan2(dx, dz), dt))
            return false;
        const step = Math.min(len, 5 * dt), next = { x: p.x + step * dx / len, y: p.y, z: p.z + step * dz / len };
        if (!this.nav.clear(p, next)) {
            this._blocked();
            return false;
        }
        Object.assign(p, next);
        r.wheelDistance += step;
        r.sideDistance[0] += step;
        r.sideDistance[1] += step;
        this.metrics.drivenDistance += step;
        this.travelled += step;
        r.progress = clamp(this.travelled / (this.length || 1));
        if (len - step < 1e-7)
            this.segment++;
        return false;
    }
    _blocked() { this._state('blocked'); this._event('warning', '道路无安全通路，无人车已停车，货物保持原位。'); }
    clearForSeeding(i) {
        const r = this.robot, f = this.fields[i], p = r.position;
        return !(Math.abs(p.x - f.x) < 10.22 && Math.abs(p.z - f.z) < 7.74) &&
            !(r.target === i && (['driving', 'arrived', 'picking'].includes(r.state) || (r.state === 'delivering' && (0, ground_nav_js_1.dist)(p, (0, ground_nav_js_1.pickDock)(f, p.y)) < 2.4)));
    }
    driveTo(i) {
        const r = this.robot, f = this.fields[i];
        if (!Number.isInteger(i) || !f)
            return no('请选择有效田块。');
        if (!['ready', 'arrived'].includes(r.state))
            return no('无人车正在作业或补给。');
        if (r.state === 'arrived' && r.target === i)
            return no('已在田边，请手动开始采摘。');
        if (!f.harvestable || f.sowOrder)
            return no('该田块没有在田作物。');
        if (r.battery < 20)
            return no('请先返回总站充电。');
        const end = (0, ground_nav_js_1.pickDock)(f, r.position.y);
        if (!this._navigate('driving', end, Math.PI))
            return no('采摘泊位没有安全通路。');
        r.target = i;
        r.pickupPoint = { x: end.x, y: 1.2, z: f.z + 5.75 };
        r.stagePoint = point(this.logistics.stagePoints[i]);
        this.recall = false;
        this._event('info', 'ROVER-01 已沿避障路线前往 ' + f.id + ' 的田边采摘位。');
        return ok('已出发');
    }
    startPicking(mode = 'all') {
        const r = this.robot, f = this.fields[r.target];
        if (r.state !== 'arrived')
            return no('请先驾驶到田边，再手动开始采摘。');
        if (!f || !(f.maturity >= 90) || !f.harvestable)
            return no('田里没有达到 90% 成熟度的可采作物。');
        if (r.battery < 20)
            return no('请先返回总站充电。');
        r.jobSize = mode === 'single' ? 1 : f.harvestable;
        r.jobDone = 0;
        this._state('picking');
        this._event('info', '开始采摘 ' + f.id + '：本次 ' + r.jobSize + ' 批，采完同车送往大屏。');
        return ok('已开始');
    }
    _pickOne() {
        const r = this.robot, f = this.fields[r.target];
        if (!f.harvestable || !(f.maturity >= 90))
            return false;
        const load = { id: 'ROVER-' + String(++this.serial).padStart(5, '0'), fieldIndex: r.target, crop: f.name, weight: 25 };
        r.loads.push(load);
        r.jobDone++;
        f.harvestable--;
        f.harvested++;
        f.pickedBatches++;
        this.metrics.pickedBatches++;
        if (!f.harvestable)
            f.maturity = 0;
        return true;
    }
    _stageTrip() {
        const r = this.robot, p = this.logistics.stagePoints[r.target], end = (0, ground_nav_js_1.stageDock)(p, r.position.y);
        if (!this._navigate('delivering', end, Math.atan2(p.x - end.x, p.z - end.z)))
            this._blocked();
    }
    _unloadStage() {
        const r = this.robot, f = this.fields[r.target], n = r.loads.length;
        f.stagedLoads.push(...r.loads.splice(0));
        f.stagedBatches = f.stagedLoads.length;
        this.metrics.stagedBatches += n;
        this._event('success', f.id + ' 大屏旁整车卸货：' + n + ' 批 / ' + n * 25 + ' kg。');
        if (this.recall)
            this._home();
        else
            this._state('ready');
    }
    pendingHaul() { return this.fields.reduce((n, f) => n + f.stagedLoads.filter(l => l.id !== f.airClaim && !f.groundClaims.has(l.id)).length, 0); }
    haulAll(belt) {
        const r = this.robot;
        if (!['ready', 'arrived'].includes(r.state) || r.carrying)
            return no('请等待无人车完成当前任务。');
        if (!belt || typeof belt.tryFeed !== 'function')
            return no('传送带尚未就绪。');
        const stops = this.fields.map((f, i) => ({ i, ids: f.stagedLoads.filter(l => l.id !== f.airClaim && !f.groundClaims.has(l.id)).map(l => l.id) })).filter(s => s.ids.length);
        if (!stops.length)
            return no('目前没有可清运的集货箱。');
        if (r.battery < 25)
            return no('请先返回总站充电，再发起整车清运。');
        const y = r.position.y;
        let from = r.position;
        const itinerary = [];
        while (stops.length) {
            let best = null;
            for (const stop of stops) {
                const end = (0, ground_nav_js_1.stageDock)(this.logistics.stagePoints[stop.i], y), path = this.nav.route(from, end);
                if (!path)
                    continue;
                const length = path.slice(1).reduce((n, p, j) => n + (0, ground_nav_js_1.dist)(p, path[j]), 0);
                if (!best || length < best.length)
                    best = { stop, path, end, length };
            }
            if (!best)
                return no('部分集货点没有安全通路，未锁定货箱。');
            itinerary.push({ ...best.stop, path: best.path, end: best.end });
            from = best.end;
            stops.splice(stops.indexOf(best.stop), 1);
        }
        const end = (0, ground_nav_js_1.beltDock)(this.logistics.intake, y), lastPath = this.nav.route(from, end);
        if (!lastPath)
            return no('传送带接驳位没有安全通路。');
        for (const s of itinerary)
            for (const id of s.ids)
                this.fields[s.i].groundClaims.add(id);
        r.jobSize = itinerary.reduce((n, s) => n + s.ids.length, 0);
        r.jobDone = 0;
        this.recall = false;
        this.haul = { itinerary, cursor: 0, belt, end, lastPath };
        this._nextStop();
        this._event('info', '整车清运已派发：巡访 ' + itinerary.length + ' 个集货点，提取 ' + r.jobSize + ' 批。');
        return ok('已派发');
    }
    _nextStop() {
        const h = this.haul, r = this.robot, s = h.itinerary[h.cursor];
        if (s) {
            r.target = s.i;
            const p = this.logistics.stagePoints[s.i];
            this._navigate('collecting', s.end, Math.atan2(p.x - s.end.x, p.z - s.end.z), s.path);
        }
        else {
            r.target = null;
            if (!this._navigate('toBelt', h.end, Math.PI / 2, this.recall ? null : h.lastPath))
                this._blocked();
        }
    }
    _loadStop() {
        const r = this.robot, h = this.haul, s = h.itinerary[h.cursor], f = this.fields[s.i], ids = new Set(s.ids);
        const got = f.stagedLoads.filter(l => ids.has(l.id));
        f.stagedLoads = f.stagedLoads.filter(l => !ids.has(l.id));
        f.stagedBatches = f.stagedLoads.length;
        got.forEach(l => r.loads.push(l));
        r.jobDone += got.length;
        for (const id of ids)
            f.groundClaims.delete(id);
        h.cursor++;
        this._nextStop();
    }
    _clearClaims() { if (this.haul)
        for (const s of this.haul.itinerary)
            for (const id of s.ids)
                this.fields[s.i].groundClaims.delete(id); }
    _home() {
        this._clearClaims();
        this.haul = null;
        this.recall = false;
        if (!this._navigate('returning', this.logistics.robotPad, 0))
            this._blocked();
    }
    returnHome() {
        const r = this.robot;
        if (['charging', 'returning'].includes(r.state))
            return no('无人车正在返航或充电。');
        if ((0, ground_nav_js_1.dist)(r.position, this.logistics.robotPad) < .01 && !r.carrying && !this.haul && r.state === 'ready' && r.battery >= 100)
            return no('无人车已在总站，电量充足。');
        this.recall = true;
        if (r.carrying) {
            if (this.haul) {
                this._clearClaims();
                this.haul.cursor = this.haul.itinerary.length;
                if (!['toBelt', 'feeding'].includes(r.state))
                    this._nextStop();
            }
            else if (!['delivering', 'unloading'].includes(r.state))
                this._stageTrip();
            this._event('info', '已载货，将先交付车上货物再返航。');
            return ok('优先安全交货');
        }
        this._home();
        this._event('info', '无人车沿安全路线返回总站。');
        return ok('已返航');
    }
    _step(dt) {
        const r = this.robot, s = r.state;
        if (['ready', 'arrived', 'blocked'].includes(s))
            return;
        if (s === 'charging') {
            r.battery = Math.min(100, r.battery + dt * 3);
            if (r.battery >= 100)
                this._state('ready');
            return;
        }
        r.battery = clamp(r.battery - .12 * dt, 0, 100);
        if (r.battery <= 12 && !this.recall && s !== 'returning') {
            this.returnHome();
            return;
        }
        if (moving.includes(s)) {
            if (!this._drive(dt))
                return;
            if (s === 'driving') {
                this._state('arrived');
                r.progress = 1;
                this._event('info', '无人车已停稳，等待手动采摘。');
            }
            else if (s === 'returning') {
                this._state('charging');
                r.target = null;
            }
            else
                this._state(s === 'collecting' ? 'loading' : s === 'toBelt' ? 'feeding' : 'unloading');
            return;
        }
        this.phaseTime += dt;
        if (s === 'picking') {
            const period = 3, elapsed = this.phaseTime, phase = clamp(elapsed / period);
            r.armExtension = Math.sin(Math.PI * phase);
            r.grip = phase > .45 && phase < .82 ? 1 : 0;
            r.progress = clamp((r.jobDone + phase) / r.jobSize);
            if (elapsed >= period - 1e-8) {
                const got = this._pickOne();
                this.phaseTime = 0;
                if (!got || r.jobDone >= r.jobSize) {
                    if (r.carrying)
                        this._stageTrip();
                    else
                        this._state('arrived');
                }
            }
        }
        else if (s === 'loading' || s === 'unloading') {
            r.progress = clamp(this.phaseTime / 2);
            r.armExtension = Math.sin(Math.PI * r.progress);
            if (r.progress >= 1 - 1e-8) {
                if (s === 'loading')
                    this._loadStop();
                else
                    this._unloadStage();
            }
        }
        else if (s === 'feeding') {
            const h = this.haul;
            if (r.loads.length && h.belt.tryFeed(r.loads[0])) {
                r.loads.shift();
                this.metrics.bulkDelivered++;
            }
            r.progress = 1 - r.loads.length / Math.max(1, r.jobDone);
            if (!r.loads.length) {
                this.metrics.bulkTrips++;
                this._event('success', '整车清运完成：' + r.jobDone + ' 批已交付传送带。');
                this._clearClaims();
                this.haul = null;
                r.target = null;
                if (this.recall)
                    this._home();
                else
                    this._state('ready');
            }
        }
    }
    tick(dt) { if (!Number.isFinite(dt) || dt <= 0)
        return; for (let left = Math.min(dt, 3600); left > 1e-8;) {
        const s = Math.min(.05, left);
        this._step(s);
        left -= s;
    } }
}
exports.RobotSimulation = RobotSimulation;

});

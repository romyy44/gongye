/* ground-nav.js */
QingheModules.define("./ground-nav.js", function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroundNav = exports.dist = exports.beltDock = exports.stageDock = exports.pickDock = exports.irrigationPads = exports.lamps = exports.trees = exports.TRAVEL_RADIUS = void 0;
exports.obstacles = obstacles;
// Metres in world X/Z. The folded rover (including loaded bins) sweeps <1.68 m.
// Expand obstacles before planning so a stopped vehicle can pivot at every vertex.
exports.TRAVEL_RADIUS = 1.74;
exports.trees = [[-48, -23], [-48, -12], [-48, 1], [-48, 23], [29, -24], [29, -9], [32, 4], [32, 23], [-20, -25], [-5, -25], [10, -25], [24, -25], [53, -24], [53, -11], [53, 3], [52, 22]];
exports.lamps = [[-24, -23], [-24, 23], [0, -23], [0, 23], [25, -23], [25, 23]];
exports.irrigationPads = [[-36, -7], [-30, -7], [-36, 7], [-30, 7]];
const rect = (name, x, z, hx, hz) => ({ name, x0: x - hx, x1: x + hx, z0: z - hz, z1: z + hz });
function obstacles(fields, logistics) {
    const list = [rect('指挥中心', -36, -18.8, 9.15, 5.15), rect('仓库与门柱', 42, -9.1, 8.8, 9.1),
        rect('总站机柜', -44, 1.3, 1.25, 1.91), rect('灌溉泵组', -25, 21.2, 1.2, .96), rect('气象杆', -24.7, -23, .76, .52)];
    for (const [x, z] of exports.irrigationPads) {
        list.push(rect('飞机和停机坪', x, z, 2.4, 2.4), rect('充电桩与线缆', x + 2.3, z - 1.55, .57, .4));
    }
    for (const [x, z, r] of [[-42, 15, 3.6], [-43, -9, 2.9], [-30, 16, 2.75]])
        list.push(rect('专用停机坪', x, z, r, r));
    for (const [x, z] of exports.trees)
        list.push(rect('树池与低树冠', x, z, 2.55, 2.55));
    for (const [x, z] of exports.lamps)
        list.push(rect('路灯', x, z, .27, .27));
    fields.forEach((f, i) => { const s = logistics.stagePoints[i]; list.push(rect('种植床和田埂', f.x, f.z, 10.22, 7.74), rect('田前屏和基座', f.x, f.z + 8.55, 3.44, .6), rect('集货托盘', s.x, s.z, 1.6, 1.48)); });
    const path = logistics.conveyorPath || [];
    for (let n = 1; n < path.length; n++) {
        const a = path[n - 1], b = path[n];
        list.push(rect('输送机及外置电机', .5 * (a.x + b.x), .5 * (a.z + b.z), Math.abs(a.x - b.x) / 2 + 2.36, Math.abs(a.z - b.z) / 2 + 2.36));
    }
    const p = logistics.intake || { x: 35, z: 15 };
    list.push(rect('投放口和标识', p.x, p.z, 2.22, 1.91));
    return list;
}
// Exact slab intersection of a swept line with an expanded AABB (includes grazing).
function intersects(a, b, o) {
    let lo = 0, hi = 1;
    for (const k of ['x', 'z']) {
        const d = b[k] - a[k], v = a[k], mn = o[k + '0'], mx = o[k + '1'];
        if (Math.abs(d) < 1e-10) {
            if (v < mn || v > mx)
                return false;
            continue;
        }
        const u = (mn - v) / d, w = (mx - v) / d;
        lo = Math.max(lo, Math.min(u, w));
        hi = Math.min(hi, Math.max(u, w));
        if (lo > hi)
            return false;
    }
    return true;
}
const pickDock = (f, y) => ({ x: f.x - 6.3, y, z: f.z + 9.69 });
exports.pickDock = pickDock;
const stageDock = (p, y) => ({ x: p.x + 3.52, y, z: p.z + .64 });
exports.stageDock = stageDock;
const beltDock = (p, y) => ({ x: p.x - 4.35, y, z: p.z });
exports.beltDock = beltDock;
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
exports.dist = dist;
class GroundNav {
    constructor(fields, logistics) {
        this.raw = obstacles(fields, logistics);
        this.blocks = this.raw.map(o => ({ ...o, x0: o.x0 - exports.TRAVEL_RADIUS, x1: o.x1 + exports.TRAVEL_RADIUS, z0: o.z0 - exports.TRAVEL_RADIUS, z1: o.z1 + exports.TRAVEL_RADIUS }));
        this.bounds = { x0: -46.8, x1: 49.8, z0: -26.4, z1: 26.4 };
        this.nodes = [];
        const e = .035;
        for (const b of [...this.blocks, this.bounds])
            for (const x of [b.x0 - e, b.x1 + e])
                for (const z of [b.z0 - e, b.z1 + e])
                    if (this.clear({ x, z }, { x, z }))
                        this.nodes.push({ x, z });
        this.graph = this.nodes.map(() => []);
        this.nodes.forEach((a, i) => { for (let j = 0; j < i; j++)
            if (this.clear(a, this.nodes[j])) {
                const w = (0, exports.dist)(a, this.nodes[j]);
                this.graph[i].push([j, w]);
                this.graph[j].push([i, w]);
            } });
    }
    clear(a, b) { const k = this.bounds; return [a, b].every(p => p.x >= k.x0 && p.x <= k.x1 && p.z >= k.z0 && p.z <= k.z1) && !this.blocks.some(o => intersects(a, b, o)); }
    route(start, end) {
        if (this.clear(start, end))
            return [start, end].map(p => ({ ...p }));
        if (!this.clear(start, start) || !this.clear(end, end))
            return null;
        const s = this.nodes.length, t = s + 1, pts = [...this.nodes, start, end], edges = this.graph.map(e => [...e]);
        edges.push([], []);
        for (const [k, p] of [[s, start], [t, end]])
            this.nodes.forEach((n, j) => { if (this.clear(n, p)) {
                const w = (0, exports.dist)(n, p);
                edges[k].push([j, w]);
                edges[j].push([k, w]);
            } });
        const cost = pts.map(() => Infinity), parent = pts.map(() => -1), used = new Set();
        cost[s] = 0;
        for (;;) {
            let i = -1, best = Infinity;
            for (let j = 0; j < pts.length; j++)
                if (!used.has(j) && cost[j] < best) {
                    i = j;
                    best = cost[j];
                }
            if (i < 0)
                return null;
            if (i === t)
                break;
            used.add(i);
            for (const [j, w] of edges[i])
                if (cost[i] + w < cost[j]) {
                    cost[j] = cost[i] + w;
                    parent[j] = i;
                }
        }
        const route = [];
        for (let i = t; i !== -1; i = parent[i])
            route.unshift({ ...pts[i], y: start.y });
        return route;
    }
}
exports.GroundNav = GroundNav;

});

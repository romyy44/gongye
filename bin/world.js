/* world.js */
QingheModules.define("./world.js", function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorld = createWorld;
const ground_nav_js_1 = require("./ground-nav.js");
const detail_js_1 = require("./detail.js");
const conveyor_js_1 = require("./conveyor.js");
const seeding_js_1 = require("./seeding.js");
const river_js_1 = require("./river.js");
// Lightweight, fully procedural agricultural twin. No external textures or models.
function createWorld(THREE, scene, fields) {
    const world = new THREE.Group();
    scene.add(world);
    const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.02, ...extra });
    const m = {
        ground: material('#dce4cc'), edge: material('#c6d0b4'), grass: material('#a8c285'),
        white: material('#f6f7ec'), cream: material('#e7eadc'), road: material('#e9e9dd'),
        green: material('#35775d'), dark: material('#244b40'), sage: material('#7f9b79'),
        glass: material('#a7d2d0', { roughness: 0.16, metalness: 0.08, transparent: true, opacity: 0.48, depthWrite: false }),
        frame: material('#355b52', { metalness: 0.3, roughness: 0.4 }),
        solar: material('#315969', { metalness: 0.35, roughness: 0.32 }),
        soil: material('#a18a68'), bed: material('#b69b72'), trunk: material('#9f8060'),
        leaf: material('#55924c'), leafLight: material('#74a752'), leafDark: material('#397d46'),
        corn: material('#e3c653'), tomato: material('#df6547'), carrot: material('#e29c45'),
        flower: material('#bba1cf'), prop: material('#3a514d', { roughness: 0.48 }),
        mint: material('#a9d1b8'), yellow: material('#e7c66e'),
        bark: material('#79664f', { roughness: .94 }), steel: material('#65736c', { metalness: .58, roughness: .42 }),
        rubber: material('#303c38', { roughness: .8 }), gold: material('#d5af61', { metalness: .48, roughness: .4 }),
    };
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const sphereGeometry = new THREE.SphereGeometry(1, 7, 5);
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 8);
    const coneGeometry = new THREE.ConeGeometry(1, 1, 7);
    function mesh(geometry, mat, parent, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
        const object = new THREE.Mesh(geometry, mat);
        object.position.set(x, y, z);
        object.scale.set(sx, sy, sz);
        object.castShadow = true;
        object.receiveShadow = true;
        (parent || world).add(object);
        return object;
    }
    const box = (mat, parent, x, y, z, w, h, d) => mesh(boxGeometry, mat, parent, x, y, z, w, h, d);
    const sphere = (mat, parent, x, y, z, sx, sy, sz) => mesh(sphereGeometry, mat, parent, x, y, z, sx, sy, sz);
    const cylinder = (mat, parent, x, y, z, r, h) => mesh(cylinderGeometry, mat, parent, x, y, z, r, h, r);
    const dummy = new THREE.Object3D();
    function instanced(geometry, mat, transforms, parent = world) {
        const object = new THREE.InstancedMesh(geometry, mat, transforms.length);
        for (let i = 0; i < transforms.length; i++) {
            const t = transforms[i];
            dummy.position.set(t.x || 0, t.y || 0, t.z || 0);
            dummy.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0);
            dummy.scale.set(t.sx ?? 1, t.sy ?? 1, t.sz ?? 1);
            dummy.updateMatrix();
            object.setMatrixAt(i, dummy.matrix);
            if (t.color)
                object.setColorAt(i, new THREE.Color(t.color));
        }
        object.instanceMatrix.needsUpdate = true;
        object.castShadow = true;
        object.receiveShadow = true;
        parent.add(object);
        return object;
    }
    function roundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
    function textTexture(text, sub = '', background = '#f6f7ed', foreground = '#275749', width = 1024, height = 256) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = foreground;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `600 ${sub ? 62 : 72}px "Microsoft YaHei", "PingFang SC", sans-serif`;
        ctx.fillText(text, width / 2, sub ? height * .39 : height * .5);
        if (sub) {
            ctx.globalAlpha = .65;
            ctx.font = '24px Arial, sans-serif';
            ctx.fillText(sub, width / 2, height * .73);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }
    function sign(text, sub, x, y, z, w, h, bg, fg, parent = world) {
        const texture = textTexture(text, sub, bg, fg);
        const plane = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: texture, roughness: .8 }), parent, x, y, z);
        plane.castShadow = false;
        return plane;
    }
    // Raised landscape plinth and an ordered network of pale service paths.
    box(m.edge, world, 3, -.67, 0, 108, 1.25, 58);
    box(m.ground, world, 3, -.03, 0, 107.5, .12, 57.5);
    const river = (0, river_js_1.createRiver)(THREE, world);
    box(m.road, world, -25, .065, 0, 3.2, .15, 51);
    box(m.road, world, 0, .065, 1, 47, .15, 4.1);
    box(m.road, world, 0, .065, -21, 49, .15, 3.2);
    box(m.road, world, 0, .065, 24, 49, .15, 3.2);
    box(m.road, world, 25, .065, 1, 3.2, .15, 49);
    box(m.road, world, 0, .065, 1, 3.2, .15, 49);
    box(m.road, world, -36, .065, -.3, 21, .15, 47);
    box(m.road, world, 39, .065, 1, 25, .15, 49);
    box(m.road, world, 41, .065, 24, 26, .15, 3.2);
    // Connect the field-edge bays, south bypass and apron at tyre contact height.
    for (const [x, z, w, d] of [[0, 1.35, 55, 6.15], [0, 23.45, 55, 7.55], [-33, 24.8, 23, 4.8], [27, 14, 7.5, 26], [0, -20.7, 54, 6.2]])
        box(m.road, world, x, .083, z, w, .105, d);
    // Command centre: crisp white shell, glazing and a compact photovoltaic roof.
    const station = new THREE.Group();
    station.position.set(-36, 0, -18.8);
    world.add(station);
    box(m.cream, station, 0, .3, 0, 18, .5, 8.7);
    box(m.white, station, 0, .64, -.8, 16, .22, 7);
    box(m.white, station, 0, 2.5, -4.08, 16, 4.3, .44);
    box(m.white, station, -7.78, 2.5, -.8, .44, 4.3, 7);
    box(m.white, station, 7.78, .92, -.8, .44, .52, 7);
    box(m.white, station, 7.78, 4.12, -.8, .44, 1.05, 7);
    const sideGlass = box(m.glass, station, 7.81, 2.4, -.8, .09, 2.4, 6.7);
    sideGlass.castShadow = false;
    for (const z of [-3.9, -.8, 2.5])
        box(m.white, station, 7.86, 2.4, z, .18, 2.5, .14);
    const frontGlass = box(m.glass, station, 0, 2.25, 2.73, 14.7, 2.65, .09);
    frontGlass.castShadow = false;
    box(m.white, station, 0, 4.05, 2.55, 16, 1.1, .35);
    box(m.frame, station, 0, .92, 2.83, 15.1, .18, .13);
    for (const x of [-7.1, -3.6, 0, 3.6, 7.1])
        box(m.white, station, x, 2.33, 2.88, .13, 2.7, .16);
    box(m.dark, station, 0, 1.73, 2.9, 1.55, 2.25, .1);
    box(m.glass, station, 0, 1.95, 2.97, 1.2, 1.62, .07);
    box(m.white, station, 0, 4.78, -.5, 17.4, .38, 8.5);
    box(m.green, station, 0, 4.99, 3.75, 17.6, .22, .3);
    sign('农业指挥中心', 'AGRICULTURAL COMMAND CENTER', 0, 3.96, 2.81, 10.2, 1.12, '#f6f7ed', '#2b6650', station);
    // Visible dispatch workstations behind the glazed front and side facades.
    for (const x of [-4.3, 4.3]) {
        box(m.cream, station, x, 1.25, .25, 4.4, .16, 1.45);
        box(m.frame, station, x, 1, .25, .32, .7, .95);
        box(m.frame, station, x, 1.54, -.05, .12, .46, .12);
        const monitorTexture = textTexture('实时调度', 'FLIGHT CONTROL', '#173f35', '#a6d6b8', 512, 256);
        const monitor = mesh(new THREE.PlaneGeometry(1.65, .86), new THREE.MeshBasicMaterial({ map: monitorTexture, toneMapped: false }), station, x, 1.97, -.05);
        monitor.castShadow = false;
    }
    for (const [x, title, subtitle] of [[-3.05, '农田数据总览', 'FIELD STATUS'], [3.05, '无人机调度', 'DRONE TELEMETRY']]) {
        const wallTexture = textTexture(title, subtitle, '#173f35', '#a6d6b8', 768, 256);
        const wallScreen = mesh(new THREE.PlaneGeometry(5.25, 1.95), new THREE.MeshBasicMaterial({ map: wallTexture, toneMapped: false }), station, x, 2.83, -3.84);
        wallScreen.castShadow = false;
    }
    const solarRows = [];
    for (let x = -5.5; x <= 5.6; x += 2.2)
        for (let z = -2.6; z <= .1; z += 1.35)
            solarRows.push({ x, y: 5.12, z, sx: 1.95, sy: .09, sz: 1.12, rx: -.08 });
    instanced(boxGeometry, m.solar, solarRows, station);
    box(m.white, station, 6.4, 5.2, 2.3, 1.45, .45, 1.35);
    cylinder(m.frame, station, -7.1, 5.7, -2.8, .055, 2);
    sphere(m.mint, station, -7.1, 6.72, -2.8, .13, .13, .13);
    const stationLabel = sign('调度总站', 'FARM OPERATIONS HUB', -32, .19, 23.8, 9, 1.7, '#e9e9dd', '#648271');
    stationLabel.rotation.x = -Math.PI / 2;
    // Charging pads with inset concentric rings and a clean service pedestal.
    const pads = ground_nav_js_1.irrigationPads.map(([x, z]) => new THREE.Vector3(x, 1.15, z));
    pads.forEach((pad, i) => {
        cylinder(m.white, world, pad.x, .18, pad.z, 2.35, .3);
        cylinder(m.sage, world, pad.x, .35, pad.z, 1.96, .055);
        const ring = mesh(new THREE.TorusGeometry(1.58, .045, 5, 36), m.mint, world, pad.x, .4, pad.z);
        ring.rotation.x = -Math.PI / 2;
        const h = sign(`H  0${i + 1}`, '', pad.x, .416, pad.z, 2.6, 1.2, '#7f9b79', '#f3f7eb');
        h.rotation.x = -Math.PI / 2;
        box(m.white, world, pad.x + 2.3, .78, pad.z - 1.55, .48, 1.55, .55);
        box(m.mint, world, pad.x + 2.3, 1.3, pad.z - 1.25, .3, .36, .04);
    });
    box(m.white, world, -44, 1.5, 1.3, 2.2, 3, 3.2);
    box(m.green, world, -44, 2, 2.93, 1.55, 1.05, .06);
    sign('充电站', 'CHARGING', -44, 2, 2.99, 1.42, .82, '#35775d', '#f6f7ed');
    const fieldMeshes = [];
    const screenEntries = [];
    const cropInstances = [];
    const harvestRank = new Array(60);
    Array.from({ length: 60 }, (_, index) => ({ index, distance: (-8.1 + (index % 10) * 1.8 + 6.3) ** 2 + (-5.75 + Math.floor(index / 10) * 2.3 - 5.75) ** 2 }))
        .sort((a, b) => a.distance - b.distance || a.index - b.index)
        .forEach((plant, rank) => { harvestRank[plant.index] = rank; });
    const stagePoints = fields.map(field => ({ x: field.x + 4.5, y: 1.6, z: field.z + 9.2 }));
    function combineGeometry(geometries) {
        const positions = [], normals = [];
        for (const source of geometries) {
            const g = source.index ? source.toNonIndexed() : source;
            positions.push(...g.attributes.position.array);
            normals.push(...g.attributes.normal.array);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        return geometry;
    }
    function tubes(paths, radius = .02, segments = 7, radial = 5) {
        return combineGeometry(paths.map(path => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path.map(p => new THREE.Vector3(...p))), segments, radius, radial, false)));
    }
    // Folded leaf surfaces with a raised midrib, arched centerline and shaped margins.
    function leafGeometry({ width = .24, segments = 8, bend = .15, drop = 0, lobes = 0 } = {}) {
        const vertices = [], indices = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments, w = Math.pow(Math.sin(t * Math.PI), .72) * width * (1 + lobes * Math.sin(t * Math.PI * 9));
            const y = t - drop * t * t, z = bend * t * t, fold = .045 * Math.sin(Math.PI * t);
            vertices.push(-w, y, z, 0, y, z + fold, w, y, z);
            if (i < segments) {
                const a = i * 3, b = a + 3;
                indices.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2);
            }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }
    const cornLeafGeometry = leafGeometry({ width: .105, segments: 10, bend: 1, drop: .72 });
    const tomatoLeafGeometry = leafGeometry({ width: .31, segments: 9, bend: .24, lobes: .22 });
    const potatoLeafGeometry = leafGeometry({ width: .39, segments: 9, bend: .19, lobes: .12 });
    const tomatoVineGeometry = tubes([[[0, 0, 0], [.04, .55, -.03], [-.03, 1, .05], [.04, 1.65, 0]], [[0, .45, 0], [.26, .67, .18], [.48, .88, .24]], [[0, .8, 0], [-.27, 1, -.2], [-.41, 1.19, -.33]], [[0, 1.13, 0], [.23, 1.35, -.19], [.36, 1.51, -.29]]], .025, 5, 4);
    const potatoStemGeometry = tubes([[[0, 0, 0], [.05, .33, 0], [0, .72, .02]], [[0, .2, 0], [.25, .43, .12], [.35, .6, .2]], [[0, .35, 0], [-.2, .51, -.14], [-.37, .64, -.22]]], .02, 4, 4);
    const tasselPaths = [[[0, 0, 0], [0, .3, 0], [0, .62, 0]]];
    for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        tasselPaths.push([[0, .12, 0], [Math.cos(a) * .14, .3, Math.sin(a) * .14], [Math.cos(a) * .23, .46, Math.sin(a) * .23]]);
    }
    const tasselGeometry = tubes(tasselPaths, .012, 3, 3);
    const carrotFrondParts = [tubes([[[0, 0, 0], [0, .32, .05], [0, .75, .16]]], .012, 5, 4)];
    for (let row = 0; row < 7; row++)
        for (const side of [-1, 1]) {
            const t = (row + 1) / 9, y = t * .75, z = t * t * .16, length = .22 * (1 - t * .6);
            const blade = new THREE.BufferGeometry();
            blade.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -.08, .45, .03, 0, .5, .09, .08, .45, .03, 0, 1, .12], 3));
            blade.setIndex([0, 1, 2, 0, 2, 3, 1, 4, 2, 2, 4, 3]);
            blade.computeVertexNormals();
            const transform = new THREE.Object3D();
            transform.position.set(0, y, z);
            transform.rotation.z = side * (1.1 + .2 * t);
            transform.scale.set(.7, length, .65);
            transform.updateMatrix();
            blade.applyMatrix4(transform.matrix);
            carrotFrondParts.push(blade);
        }
    const carrotFrondGeometry = combineGeometry(carrotFrondParts);
    const carrotRootGeometry = new THREE.LatheGeometry([[0, -.62], [.025, -.48], [.065, -.25], [.125, .01], [.14, .11], [.09, .19], [0, .2]].map(([r, y]) => new THREE.Vector2(r, y)), 14);
    const cornCobGeometry = new THREE.LatheGeometry([[0, 0], [.072, .035], [.115, .13], [.12, .37], [.09, .5], [.035, .57], [0, .585]].map(([r, y]) => new THREE.Vector2(r, y)), 14);
    const tomatoFruitGeometry = new THREE.SphereGeometry(1, 12, 8);
    const tomatoPositions = tomatoFruitGeometry.attributes.position;
    for (let i = 0; i < tomatoPositions.count; i++) {
        const x = tomatoPositions.getX(i), y = tomatoPositions.getY(i), z = tomatoPositions.getZ(i), a = Math.atan2(z, x), r = 1 + .055 * Math.cos(a * 5) * (1 - y * y);
        tomatoPositions.setXYZ(i, x * r, y * .86, z * r);
    }
    tomatoFruitGeometry.computeVertexNormals();
    function starGeometry(points = 5, inner = .34, rise = .1) {
        const vertices = [0, rise, 0], indices = [];
        for (let i = 0; i < points * 2; i++) {
            const a = i * Math.PI / points, r = i % 2 ? inner : 1;
            vertices.push(Math.cos(a) * r, Math.sin(a * 2) * .05, Math.sin(a) * r);
        }
        for (let i = 0; i < points * 2; i++)
            indices.push(0, i + 1, (i + 1) % (points * 2) + 1);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }
    const calyxGeometry = starGeometry(5, .24, .11), blossomGeometry = starGeometry(5, .5, .15);
    const stemMaterial = material('#47784a', { roughness: .9 });
    const foliageMaterial = material('#4d823e', { roughness: .86, side: THREE.DoubleSide });
    const tomatoFoliage = material('#428047', { roughness: .87, side: THREE.DoubleSide });
    const carrotFoliage = material('#4d8a43', { roughness: .86, side: THREE.DoubleSide });
    const potatoFoliage = material('#487b3b', { roughness: .88, side: THREE.DoubleSide });
    const cobCanvas = document.createElement('canvas');
    cobCanvas.width = 128;
    cobCanvas.height = 256;
    const cobContext = cobCanvas.getContext('2d');
    cobContext.fillStyle = '#c59731';
    cobContext.fillRect(0, 0, 128, 256);
    for (let y = 0; y < 256; y += 15)
        for (let x = 0; x < 128; x += 15) {
            cobContext.fillStyle = (x + y) % 3 ? '#ebcc63' : '#e1b546';
            cobContext.beginPath();
            cobContext.ellipse(x + 7, y + 7, 6, 6, 0, 0, Math.PI * 2);
            cobContext.fill();
        }
    const cobTexture = new THREE.CanvasTexture(cobCanvas);
    cobTexture.colorSpace = THREE.SRGBColorSpace;
    const cobMaterial = material('#f2d374', { map: cobTexture, bumpMap: cobTexture, bumpScale: .025, roughness: .67 });
    const fruitMaterial = material('#cf4933', { roughness: .42 });
    const carrotMaterial = material('#df8a39', { roughness: .73 });
    const bloomMaterial = material('#e8ddf0', { roughness: .74, side: THREE.DoubleSide });
    const smallStemGeometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
    const cropKeys = [], renderedCrop = [];
    function buildCrops(index, type) {
        const { x, z } = fields[index];
        for (const batch of cropInstances[index] || []) {
            world.remove(batch.mesh);
            batch.mesh.dispose();
        }
        renderedCrop[index] = type;
        const stalks = [], leaves = [], produce = [], extras = [], details = [], husks = [], ties = [];
        const plantParts = [stalks, leaves, produce, extras, details, husks, ties];
        for (let r = 0; r < 6; r++)
            for (let c = 0; c < 10; c++) {
                const starts = plantParts.map(list => list.length);
                const px = x - 8.1 + c * 1.8, pz = z - 5.75 + r * 2.3;
                const vary = .92 + .12 * Math.sin(r * 8.2 + c * 1.9);
                const greenTint = new THREE.Color().setHSL(.26 + .02 * Math.sin(c + r), .25, .71 + .07 * Math.sin(c * 2.3 + r)).getHex();
                if (type === 0) {
                    const h = 2.35 * vary;
                    stalks.push({ x: px, y: .55 + h / 2, z: pz, sx: .046, sy: h, sz: .046 });
                    for (let n = 0; n < 7; n++) {
                        const length = (1.16 + Math.sin(n * .65) * .25) * vary;
                        leaves.push({ x: px, y: .74 + n * .265 * vary, z: pz, sx: length, sy: length, sz: length, ry: n * 2.38 + c * .17, rx: -.1 + (n % 3) * .08, color: greenTint });
                        details.push({ x: px, y: .73 + n * .265 * vary, z: pz, sx: .057, sy: .025, sz: .057 });
                    }
                    produce.push({ x: px + .13, y: 1.57 * vary, z: pz + .11, ry: .4, rz: -.22, sx: vary, sy: vary, sz: vary });
                    husks.push({ x: px + .08, y: 1.52 * vary, z: pz + .08, sx: .62, sy: .72, sz: .62, ry: 2.4, rz: -.25 });
                    extras.push({ x: px, y: .55 + h, z: pz, sx: .9, sy: .9, sz: .9, ry: c * .7 });
                }
                else if (type === 1) {
                    stalks.push({ x: px, y: .54, z: pz, sx: vary, sy: vary, sz: vary, ry: c * .17 });
                    extras.push({ x: px + .16, y: 1.49, z: pz + .04, sx: .025, sy: 1.92, sz: .025 });
                    for (let n = 0; n < 10; n++) {
                        const a = n * 2.4 + c * .17, reach = .2 + (n % 3) * .085;
                        leaves.push({ x: px + Math.sin(a) * reach, y: .82 + n * .105 * vary, z: pz + Math.cos(a) * reach, sx: .63, sy: .57, sz: .63, ry: a, rz: Math.sin(a) * .85, rx: Math.cos(a) * .85, color: greenTint });
                    }
                    for (let n = 0; n < 3; n++) {
                        const a = n * 2.2 + .6, tx = px + Math.sin(a) * .37, ty = .99 + n * .29, tz = pz + Math.cos(a) * .3;
                        produce.push({ x: tx, y: ty, z: tz, sx: .18 + .02 * (n % 2), sy: .18, sz: .18, ry: a });
                        details.push({ x: tx, y: ty + .145, z: tz, sx: .18, sy: .15, sz: .18, ry: a });
                    }
                    ties.push({ x: px + .08, y: 1.2, z: pz + .02, sx: .12, sy: .02, sz: .1 }, { x: px + .08, y: 1.74, z: pz + .02, sx: .12, sy: .02, sz: .1 });
                }
                else if (type === 2) {
                    produce.push({ x: px, y: .61, z: pz, sx: vary, sy: vary, sz: vary, ry: c * .8 });
                    for (let n = 0; n < 7; n++) {
                        const a = n * Math.PI * 2 / 7 + c * .11;
                        leaves.push({ x: px, y: .76, z: pz, sx: vary, sy: vary * (.8 + .2 * Math.sin(n)), sz: vary, ry: a, rz: .23 + Math.sin(a) * .18, rx: Math.cos(a) * .23, color: greenTint });
                    }
                }
                else {
                    stalks.push({ x: px, y: .53, z: pz, sx: vary, sy: vary, sz: vary, ry: c * .43 });
                    for (let n = 0; n < 12; n++) {
                        const a = n * 2.4, reach = .12 + (n % 4) * .09;
                        leaves.push({ x: px + Math.sin(a) * reach, y: .68 + (n % 5) * .1, z: pz + Math.cos(a) * reach, sx: .64, sy: .55, sz: .62, ry: a, rz: Math.sin(a) * .95, rx: Math.cos(a) * .95, color: greenTint });
                    }
                    if ((r + c) % 2 === 0)
                        for (let n = 0; n < 2; n++) {
                            const fx = px + .19 * Math.sin(n * 2.4), fz = pz + .18 * Math.cos(n * 2.4), fy = 1.28 + n * .08;
                            extras.push({ x: fx, y: fy, z: fz, sx: .115, sy: .1, sz: .115, ry: n });
                            details.push({ x: fx, y: fy + .022, z: fz, sx: .028, sy: .022, sz: .028 });
                        }
                }
                plantParts.forEach((list, k) => { for (let n = starts[k]; n < list.length; n++)
                    list[n].plantIndex = r * 10 + c; });
            }
        cropInstances[index] = [];
        function crop(geometry, mat, transforms) { if (transforms.length)
            cropInstances[index].push({ mesh: instanced(geometry, mat, transforms), transforms, late: transforms === produce || transforms === details || transforms === extras || transforms === husks }); }
        crop([cylinderGeometry, tomatoVineGeometry, cylinderGeometry, potatoStemGeometry][type], stemMaterial, stalks);
        crop([cornLeafGeometry, tomatoLeafGeometry, carrotFrondGeometry, potatoLeafGeometry][type], [foliageMaterial, tomatoFoliage, carrotFoliage, potatoFoliage][type], leaves);
        crop([cornCobGeometry, tomatoFruitGeometry, carrotRootGeometry, sphereGeometry][type], [cobMaterial, fruitMaterial, carrotMaterial, m.bed][type], produce);
        crop([tasselGeometry, cylinderGeometry, cylinderGeometry, blossomGeometry][type], [m.corn, m.trunk, stemMaterial, bloomMaterial][type], extras);
        crop([smallStemGeometry, calyxGeometry, smallStemGeometry, sphereGeometry][type], type === 3 ? m.corn : stemMaterial, details);
        crop(cornLeafGeometry, foliageMaterial, husks);
        crop(smallStemGeometry, m.sage, ties);
    }
    fields.forEach((field, index) => {
        const x = field.x, z = field.z;
        const base = box(m.soil, world, x, .24, z, 20, .42, 15);
        base.userData.fieldIndex = index;
        fieldMeshes.push(base);
        box(m.white, world, x, .12, z - 7.62, 20.4, .25, .2);
        box(m.white, world, x, .12, z + 7.62, 20.4, .25, .2);
        box(m.white, world, x - 10.1, .12, z, .2, .25, 15.4);
        box(m.white, world, x + 10.1, .12, z, .2, .25, 15.4);
        const furrows = [];
        for (let r = 0; r < 6; r++)
            furrows.push({ x, y: .49, z: z - 5.75 + r * 2.3, sx: 18.6, sy: .16, sz: .7 });
        instanced(boxGeometry, m.bed, furrows);
        buildCrops(index, index);
        // Each plot has its own physical, landscape-format information display.
        const screen = new THREE.Group();
        screen.position.set(x, 0, z + 8.55);
        world.add(screen);
        box(m.frame, screen, 0, 2.8, 0, 6.3, 2.8, .22);
        box(m.frame, screen, -2, 1.22, 0, .12, 2.4, .16);
        box(m.frame, screen, 2, 1.22, 0, .12, 2.4, .16);
        box(m.white, screen, 0, .14, 0, 6.8, .22, 1.15);
        const canvas = document.createElement('canvas');
        canvas.width = 896;
        canvas.height = 384;
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        const screenPlane = mesh(new THREE.PlaneGeometry(6.05, 2.57), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }), screen, 0, 2.8, .121);
        screenPlane.castShadow = false;
        screenPlane.userData.fieldIndex = index;
        fieldMeshes.push(screenPlane);
        screenEntries.push({ canvas, texture });
        // Raised hand-off pallet: its top is y=.9, beneath a crate anchor at y=1.6.
        const stage = stagePoints[index], staging = new THREE.Group();
        staging.position.set(stage.x, 0, stage.z);
        world.add(staging);
        box(m.road, staging, 0, .13, 0, 3.15, .16, 2.9);
        for (const x of [-.95, .95])
            for (const z of [-.78, .78])
                box(m.steel, staging, x, .48, z, .16, .65, .16);
        box(m.frame, staging, 0, .7, 0, 2.6, .18, 2.4);
        for (let n = 0; n < 7; n++)
            box(m.sage, staging, -1.13 + n * .375, .83, 0, .32, .14, 2.35);
        for (const x of [-1.39, 1.39])
            box(m.yellow, staging, x, .23, 0, .09, .08, 2.58);
        sign('待转运区', `STAGING 0${index + 1}`, 0, .55, 1.22, 2.25, .4, '#244b40', '#e4cf96', staging);
        mergeRigidMeshes(staging);
    });
    function updateScreen(index, field = {}) {
        const entry = screenEntries[index];
        if (!entry)
            return;
        const { canvas, texture } = entry, ctx = canvas.getContext('2d');
        ctx.fillStyle = '#173f35';
        ctx.fillRect(0, 0, 896, 384);
        ctx.fillStyle = '#a6d6b8';
        ctx.font = '18px Arial';
        ctx.fillText(`PLOT 0${index + 1}  /  FIELD OPERATIONS`, 36, 32);
        ctx.beginPath();
        ctx.arc(847, 32, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#a9d9a3';
        ctx.fill();
        ctx.fillStyle = '#f3f7e8';
        ctx.font = '600 43px "Microsoft YaHei",sans-serif';
        ctx.fillText(field.harvestable === 0 ? (field.sowOrder ? '播种任务 · ' + seeding_js_1.CROPS[field.sowOrder.crop].name : '空田 · 待播种') : field.name || seeding_js_1.CROPS[index].name, 36, 88);
        const nutrients = Number.isFinite(field.nutrients) ? field.nutrients : 70;
        const maturity = Number.isFinite(field.maturity) ? Math.max(0, Math.min(100, field.maturity)) : 0;
        const moisture = Number.isFinite(field.moisture) ? Math.max(0, Math.min(100, field.moisture)) : 0;
        const boost = Number.isFinite(field.fertilizerBoost) ? field.fertilizerBoost : 1;
        const picked = Number.isFinite(field.pickedBatches) ? field.pickedBatches : 0;
        const remaining = Number.isFinite(field.harvestable) ? field.harvestable : Math.max(0, (field.totalBatches ?? 12) - picked);
        const staged = Number.isFinite(field.stagedBatches) ? field.stagedBatches : 0;
        const stats = [['作物成熟度', `${field.harvestable === 0 ? "—" : Math.round(maturity) + "%"}`, maturity, '#c4d88a'], ['土壤湿度', `${Math.round(moisture)}%`, moisture, '#93c7c1'], ['土壤养分', `${Math.round(nutrients)}%`, nutrients, '#a9cf99'], ['施肥增益', `${Number(boost.toFixed(1))}×`, null, '#edcf84'], ['未采收', `${Math.max(0, Math.floor(remaining))} 批`, null, '#d4e3d5'], ['待转运', `${Math.max(0, Math.floor(staged))} 批`, null, staged ? '#edcf84' : '#b6c8bd']];
        stats.forEach(([label, value, percent, color], i) => {
            const x = 36 + (i % 3) * 280, y = i < 3 ? 132 : 249;
            ctx.fillStyle = '#98b7a9';
            ctx.font = '21px "Microsoft YaHei",sans-serif';
            ctx.fillText(label, x, y);
            ctx.fillStyle = color;
            ctx.font = '600 37px "Microsoft YaHei",Arial,sans-serif';
            ctx.fillText(value, x, y + 45);
            if (percent !== null) {
                ctx.fillStyle = '#31584c';
                roundedRect(ctx, x, y + 62, 239, 7, 3);
                ctx.fill();
                ctx.fillStyle = color;
                roundedRect(ctx, x, y + 62, Math.max(4, 239 * Math.max(0, Math.min(100, percent)) / 100), 7, 3);
                ctx.fill();
            }
        });
        ctx.fillStyle = '#8eac9f';
        ctx.font = '18px "Microsoft YaHei",sans-serif';
        ctx.fillText(`第 ${field.season || 1} 季  ·  累计已采 ${picked} 批  ·  ${field.robotState || '采收机器人待命'}  ·  传感器在线`, 36, 354);
        texture.needsUpdate = true;
    }
    fields.forEach((f, i) => updateScreen(i, f));
    // Hide harvested plants by instance matrix while keeping all crop batches shared.
    function syncCrop(index, field) {
        const type = field.cropIndex ?? index, hidden = Math.min(60, Math.max(0, (4 - field.harvestable) * 15));
        const stage = field.season > 1 ? Math.min(1, .09 + Math.floor(field.maturity / 4) * .04) : 1;
        const key = [type, hidden, stage].join('/');
        if (cropKeys[index] === key)
            return;
        cropKeys[index] = key;
        if (renderedCrop[index] !== type)
            buildCrops(index, type);
        for (const batch of cropInstances[index] || []) {
            batch.mesh.visible = hidden < 60 && (!batch.late || stage >= .55);
            if (!batch.mesh.visible)
                continue;
            batch.transforms.forEach((t, i) => {
                const plant = t.plantIndex, px = field.x - 8.1 + (plant % 10) * 1.8, pz = field.z - 5.75 + Math.floor(plant / 10) * 2.3;
                dummy.position.set(px + (t.x - px) * stage, .55 + (t.y - .55) * stage, pz + (t.z - pz) * stage);
                dummy.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0);
                const k = harvestRank[plant] >= hidden ? stage : 0;
                dummy.scale.set((t.sx ?? 1) * k, (t.sy ?? 1) * k, (t.sz ?? 1) * k);
                dummy.updateMatrix();
                batch.mesh.setMatrixAt(i, dummy.matrix);
            });
            batch.mesh.instanceMatrix.needsUpdate = true;
            batch.mesh.computeBoundingSphere();
        }
    }
    // A porous canopy of individual curved leaves, visible forks and fine twigs.
    const branches = [], boughs = [], shrubs = [], beacons = [];
    const leafBatches = [[], [], []];
    const treePoints = ground_nav_js_1.trees;
    let seed = 4619;
    function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), euler = new THREE.Euler();
    function branchTransform(a, b, radius) {
        const delta = new THREE.Vector3().subVectors(b, a), length = delta.length();
        q.setFromUnitVectors(up, delta.normalize());
        euler.setFromQuaternion(q);
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2, sx: radius, sy: length, sz: radius, rx: euler.x, ry: euler.y, rz: euler.z };
    }
    treePoints.forEach(([x, z], treeIndex) => {
        const height = 4.9 + random() * 1.7, lean = (random() - .5) * .45;
        const base = new THREE.Vector3(x, .12, z), bend = new THREE.Vector3(x - lean * .3, height * .24, z - .07), fork = new THREE.Vector3(x + lean, height * .49, z + .1);
        branches.push(branchTransform(base, bend, .24 + random() * .035), branchTransform(bend, fork, .17 + random() * .035));
        for (let root = 0; root < 4; root++) {
            const a = root * Math.PI / 2 + treeIndex;
            boughs.push(branchTransform(new THREE.Vector3(x + Math.sin(a) * .44, .15, z + Math.cos(a) * .44), new THREE.Vector3(x, .78, z), .075));
        }
        shrubs.push({ x, y: .22, z, sx: 1.1, sy: .22, sz: 1.1 });
        for (let b = 0; b < 5; b++) {
            const angle = b * Math.PI * 2 / 5 + treeIndex * .83, reach = 1.05 + random() * .7;
            const joint = new THREE.Vector3(x + Math.sin(angle) * reach * .55, height * (.61 + random() * .08), z + Math.cos(angle) * reach * .55);
            const tip = new THREE.Vector3(x + Math.sin(angle) * reach, height * (.75 + random() * .15), z + Math.cos(angle) * reach);
            branches.push(branchTransform(fork, joint, .105));
            boughs.push(branchTransform(joint, tip, .06));
            for (let c = 0; c < 3; c++) {
                const ca = angle + c * 1.7, cluster = new THREE.Vector3(tip.x + Math.sin(ca) * .45, tip.y + (c === 1 ? .65 : -.18) + random() * .22, tip.z + Math.cos(ca) * .45);
                const color = (treeIndex + b + c) % 3;
                boughs.push(branchTransform(tip, cluster, .022));
                for (let twig = 0; twig < 3; twig++) {
                    const angle = ca + twig * 2.1;
                    boughs.push(branchTransform(cluster, new THREE.Vector3(cluster.x + Math.sin(angle) * .48, cluster.y + .18, cluster.z + Math.cos(angle) * .48), .012));
                }
                for (let l = 0; l < 65; l++) {
                    const a = random() * Math.PI * 2, v = random() * 2 - 1, r = Math.sqrt(1 - v * v), shell = .57 + random() * .45;
                    leafBatches[(color + l) % 3].push({ x: cluster.x + Math.sin(a) * r * shell, y: cluster.y + v * shell * .95, z: cluster.z + Math.cos(a) * r * shell, sx: .5 + random() * .3, sy: .3 + random() * .22, sz: .7, rx: random() * Math.PI, ry: random() * Math.PI * 2, rz: random() * Math.PI, color: new THREE.Color().setHSL(.27 + random() * .025, .22, .78 + random() * .12).getHex() });
                }
            }
        }
    });
    const barkCanvas = document.createElement('canvas');
    barkCanvas.width = 128;
    barkCanvas.height = 256;
    const barkContext = barkCanvas.getContext('2d');
    barkContext.fillStyle = '#85817a';
    barkContext.fillRect(0, 0, 128, 256);
    for (let x = 0; x < 128; x += 3) {
        barkContext.strokeStyle = `hsl(32 7% ${35 + (x * 13) % 45}%)`;
        barkContext.lineWidth = 1 + (x % 3) * .4;
        barkContext.beginPath();
        for (let y = 0; y <= 256; y += 16) {
            const xx = x + Math.sin(y * .045 + x) * 1.4;
            if (!y)
                barkContext.moveTo(xx, y);
            else
                barkContext.lineTo(xx, y);
        }
        barkContext.stroke();
    }
    const barkTexture = new THREE.CanvasTexture(barkCanvas);
    barkTexture.wrapS = barkTexture.wrapT = THREE.RepeatWrapping;
    barkTexture.repeat.set(3, 3);
    m.bark.bumpMap = barkTexture;
    m.bark.bumpScale = .025;
    const branchGeometry = new THREE.CylinderGeometry(.65, 1, 1, 12, 3, true);
    const twigGeometry = new THREE.CylinderGeometry(.62, 1, 1, 4, 1, true);
    instanced(branchGeometry, m.bark, branches);
    instanced(twigGeometry, m.bark, boughs);
    instanced(sphereGeometry, m.grass, shrubs);
    const leafletGeometry = leafGeometry({ width: .29, segments: 2, bend: .17, lobes: .07 });
    const canopyMaterials = [material('#3d6e38'), material('#4a7b3d'), material('#648644')];
    canopyMaterials.forEach((mat, i) => {
        instanced(leafletGeometry, new THREE.MeshStandardMaterial({ color: mat.color, roughness: .83, side: THREE.DoubleSide }), leafBatches[i]);
    });
    for (const [x, z] of ground_nav_js_1.lamps)
        beacons.push({ x, y: .7, z, sx: .13, sy: 1.4, sz: .13 });
    instanced(cylinderGeometry, m.frame, beacons);
    instanced(sphereGeometry, m.white, beacons.map(t => ({ ...t, y: 1.45, sx: .24, sy: .15, sz: .24 })));
    const roadLines = [];
    for (let z = -23; z <= 23; z += 3)
        roadLines.push({ x: -25, y: .151, z, sx: .05, sy: .014, sz: 1.1 });
    instanced(boxGeometry, m.white, roadLines);
    // Fresh produce warehouse and a physical, three-segment receiving conveyor.
    const warehousePosition = { x: 42, y: 0, z: -10 };
    const warehouseGroup = new THREE.Group();
    warehouseGroup.position.set(42, 0, -10);
    world.add(warehouseGroup);
    const warehouseWall = material('#e9ede4', { roughness: .66 }), roofMaterial = material('#7b9286', { metalness: .33, roughness: .53 });
    box(m.cream, warehouseGroup, 0, .21, 0, 17, .38, 17);
    box(warehouseWall, warehouseGroup, -7.85, 3.55, 0, .3, 6.6, 16);
    box(warehouseWall, warehouseGroup, 7.85, 3.55, 0, .3, 6.6, 16);
    box(warehouseWall, warehouseGroup, 0, 3.55, -7.85, 16, 6.6, .3);
    box(warehouseWall, warehouseGroup, -5.8, 3.55, 7.86, 4.4, 6.6, .3);
    box(warehouseWall, warehouseGroup, 5.8, 3.55, 7.86, 4.4, 6.6, .3);
    box(warehouseWall, warehouseGroup, 0, 6.1, 7.86, 7.2, 1.5, .3);
    const gableGeometry = new THREE.BufferGeometry();
    gableGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-8, 6.85, 0, 8, 6.85, 0, 0, 8.2, 0], 3));
    gableGeometry.computeVertexNormals();
    mesh(gableGeometry, warehouseWall, warehouseGroup, 0, 0, 7.87);
    const roofL = box(roofMaterial, warehouseGroup, -4.2, 7.51, 0, 8.65, .2, 17.3);
    roofL.rotation.z = .16;
    const roofR = box(roofMaterial, warehouseGroup, 4.2, 7.51, 0, 8.65, .2, 17.3);
    roofR.rotation.z = -.16;
    box(m.green, warehouseGroup, 0, 8.23, 0, .22, .19, 17.5);
    const cladding = [], roofSeams = [], rackParts = [], crateBoxes = [];
    for (let z = -7.4; z <= 7.4; z += .72) {
        cladding.push({ x: -8.02, y: 3.5, z, sx: .06, sy: 6.2, sz: .055 }, { x: 8.02, y: 3.5, z, sx: .06, sy: 6.2, sz: .055 });
    }
    for (let z = -8.1; z <= 8.1; z += 1.1) {
        roofSeams.push({ x: -4.2, y: 7.66, z, sx: 8.65, sy: .045, sz: .045, rz: .16 }, { x: 4.2, y: 7.66, z, sx: 8.65, sy: .045, sz: .045, rz: -.16 });
    }
    instanced(boxGeometry, m.cream, cladding, warehouseGroup);
    instanced(boxGeometry, m.sage, roofSeams, warehouseGroup);
    // Open roller door, protection pillars, wall lights and two clean storage racks.
    for (const x of [-3.75, 3.75]) {
        box(m.frame, warehouseGroup, x, 2.9, 8.04, .18, 5.35, .2);
        cylinder(m.yellow, warehouseGroup, x, .95, 8.65, .12, 1.7);
    }
    box(m.steel, warehouseGroup, 0, 5.15, 8.04, 7.6, .8, .22);
    const shutter = [];
    for (let y = 4.82; y <= 5.5; y += .12)
        shutter.push({ x: 0, y, z: 8.19, sx: 7.4, sy: .025, sz: .04 });
    instanced(boxGeometry, m.cream, shutter, warehouseGroup);
    sign('农产品智能仓储', 'AGRI-PRODUCE LOGISTICS', 0, 6.16, 8.04, 11.8, .96, '#e9ede4', '#315f4d', warehouseGroup);
    for (const side of [-1, 1]) {
        box(m.mint, warehouseGroup, side * 6.6, 4.6, 8.08, .58, .22, .18);
        for (const x of [side * 5.4 - .95, side * 5.4 + .95])
            for (const z of [-5.4, -1])
                rackParts.push({ x, y: 2.2, z, sx: .12, sy: 3.9, sz: .12 });
        for (const y of [1, 2.5, 4])
            rackParts.push({ x: side * 5.4, y, z: -3.2, sx: 2.3, sy: .12, sz: 4.7 });
        for (const y of [1.45, 2.95])
            for (const z of [-4.8, -3.2, -1.6])
                crateBoxes.push({ x: side * 5.4, y, z, sx: 1.5, sy: .75, sz: 1.1 });
    }
    instanced(boxGeometry, m.steel, rackParts, warehouseGroup);
    instanced(boxGeometry, material('#bbad86', { roughness: .83 }), crateBoxes, warehouseGroup);
    const logisticsPad = new THREE.Vector3(-42, 1.5, 15);
    cylinder(m.white, world, -42, .17, 15, 3.5, .3);
    cylinder(m.dark, world, -42, .36, 15, 3.14, .07);
    const cargoPadRing = mesh(new THREE.TorusGeometry(2.72, .055, 6, 56), m.gold, world, -42, .42, 15);
    cargoPadRing.rotation.x = -Math.PI / 2;
    const cargoMark = sign('H  05', 'CARGO UAV', -42, .43, 15, 3.8, 2, '#244b40', '#e4cf96');
    cargoMark.rotation.x = -Math.PI / 2;
    const intake = { x: 35, y: 1.5, z: 15 };
    const conveyorPath = [{ x: 35, y: 1.5, z: 15 }, { x: 42, y: 1.5, z: 15 }, { x: 42, y: 1.5, z: 0 }, { x: 42, y: 1.5, z: -6 }];
    const conveyor = (0, conveyor_js_1.createConveyor)(THREE, world, conveyorPath, m);
    const movingBelts = conveyor.movingBelts;
    box(m.yellow, world, 35, .2, 15, 4, .3, 3.7);
    for (const x of [33.25, 36.75])
        for (const z of [13.65, 16.35])
            box(m.frame, world, x, .56, z, .12, .7, .12);
    const intakeMarker = sign('采收投放口', 'HARVEST INTAKE', 35, 2.53, 16.3, 4.4, 1.16, '#e8cf84', '#324c3d');
    box(m.frame, world, 35, 1.72, 16.25, .12, 1.2, .12);
    function rod(mat, parent, a, b, radius = .06) {
        const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
        const object = cylinder(mat, parent, 0, 0, 0, radius, start.distanceTo(end));
        object.position.copy(start).add(end).multiplyScalar(.5);
        object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
        return object;
    }
    // Shared sculpted three-blade propeller geometry rather than rectangular sticks.
    const propellerGeometry = new THREE.BufferGeometry(), propPositions = [];
    const outline = [[.1, -.045], [.45, -.1], [.69, -.075], [.74, -.005], [.62, .07], [.14, .045]];
    function propVertex(a, p, y) { return [Math.cos(a) * p[0] - Math.sin(a) * p[1], y, Math.sin(a) * p[0] + Math.cos(a) * p[1]]; }
    for (let b = 0; b < 3; b++) {
        const a = b * Math.PI * 2 / 3;
        for (let p = 1; p < outline.length - 1; p++) {
            propPositions.push(...propVertex(a, outline[0], .018), ...propVertex(a, outline[p + 1], .018), ...propVertex(a, outline[p], .018));
            propPositions.push(...propVertex(a, outline[0], -.018), ...propVertex(a, outline[p], -.018), ...propVertex(a, outline[p + 1], -.018));
        }
        for (let p = 0; p < outline.length; p++) {
            const n = (p + 1) % outline.length;
            propPositions.push(...propVertex(a, outline[p], .018), ...propVertex(a, outline[n], .018), ...propVertex(a, outline[n], -.018));
            propPositions.push(...propVertex(a, outline[p], .018), ...propVertex(a, outline[n], -.018), ...propVertex(a, outline[p], -.018));
        }
    }
    propellerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(propPositions, 3));
    propellerGeometry.computeVertexNormals();
    const smoothShell = new THREE.SphereGeometry(1, 16, 10), motorGeometry = new THREE.CylinderGeometry(1, 1, 1, 18);
    const casingGeometry = new THREE.BufferGeometry(), casingPositions = [], casingIndices = [];
    const casingProfile = [[-1, .34, .48], [-.9, .64, .76], [-.68, .9, .95], [-.25, 1, 1], [.3, .96, .96], [.7, .76, .78], [.94, .4, .5], [1, .12, .2]];
    for (let z = 0; z < casingProfile.length; z++)
        for (let a = 0; a < 20; a++) {
            const [depth, width, height] = casingProfile[z], angle = a * Math.PI / 10;
            casingPositions.push(Math.sin(angle) * width, Math.cos(angle) * height, depth);
            if (z < casingProfile.length - 1) {
                const p = z * 20 + a, n = z * 20 + (a + 1) % 20;
                casingIndices.push(p, p + 20, n, n, p + 20, n + 20);
            }
        }
    const frontCap = casingPositions.length / 3;
    casingPositions.push(0, 0, -1, 0, 0, 1);
    for (let a = 0; a < 20; a++) {
        const next = (a + 1) % 20, last = (casingProfile.length - 1) * 20;
        casingIndices.push(frontCap, a, next, frontCap + 1, last + next, last + a);
    }
    casingGeometry.setAttribute('position', new THREE.Float32BufferAttribute(casingPositions, 3));
    casingGeometry.setIndex(casingIndices);
    casingGeometry.computeVertexNormals();
    const shellSeamGeometry = new THREE.TorusGeometry(1, .012, 5, 64);
    shellSeamGeometry.rotateX(Math.PI / 2);
    const carbonCanvas = document.createElement('canvas');
    carbonCanvas.width = carbonCanvas.height = 64;
    const carbonContext = carbonCanvas.getContext('2d');
    carbonContext.fillStyle = '#59635e';
    carbonContext.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y += 8)
        for (let x = 0; x < 64; x += 8) {
            carbonContext.fillStyle = (x + y) % 16 ? '#6b736d' : '#454f49';
            carbonContext.fillRect(x, y, 7, 4);
            carbonContext.fillRect(x + 3, y + 4, 4, 4);
        }
    const carbonTexture = new THREE.CanvasTexture(carbonCanvas);
    carbonTexture.wrapS = carbonTexture.wrapT = THREE.RepeatWrapping;
    carbonTexture.repeat.set(3, 4);
    const carbonMaterial = material('#52645a', { bumpMap: carbonTexture, bumpScale: .006, roughness: .48, metalness: .22 });
    const cableMaterial = material('#8f493e', { roughness: .52 }), chromeMaterial = material('#c5d1cf', { metalness: .78, roughness: .24 });
    const boltGeometry = new THREE.CylinderGeometry(1, 1, 1, 6);
    const rotorRingGeometry = new THREE.TorusGeometry(.72, .025, 5, 36);
    const lensMaterial = material('#193b41', { metalness: .45, roughness: .12 });
    const ledMaterial = new THREE.MeshBasicMaterial({ color: '#a8f0bf', toneMapped: false });
    function mergeRigidMeshes(parent, movable = []) {
        const excluded = new Set(movable), batches = new Map();
        for (const child of parent.children) {
            if (!child.isMesh || excluded.has(child) || Array.isArray(child.material))
                continue;
            const key = child.material.uuid;
            if (!batches.has(key))
                batches.set(key, []);
            batches.get(key).push(child);
        }
        for (const children of batches.values()) {
            if (children.length < 2)
                continue;
            const positions = [], normals = [], uvs = [];
            for (const child of children) {
                child.updateMatrix();
                const geometry = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
                geometry.applyMatrix4(child.matrix);
                positions.push(...geometry.attributes.position.array);
                normals.push(...geometry.attributes.normal.array);
                if (geometry.attributes.uv)
                    uvs.push(...geometry.attributes.uv.array);
                else
                    uvs.push(...new Array(geometry.attributes.position.count * 2).fill(0));
                geometry.dispose();
                parent.remove(child);
            }
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            const combined = new THREE.Mesh(geometry, children[0].material);
            combined.castShadow = combined.receiveShadow = true;
            parent.add(combined);
        }
    }
    function createDrone(index, pad, options = {}) {
        const fertilizerMode = options.fertilizer === true, seedMode = options.seed === true;
        const group = new THREE.Group();
        world.add(group);
        group.position.copy(pad);
        mesh(casingGeometry, m.white, group, 0, .22, 0, .63, .3, .9);
        mesh(casingGeometry, m.dark, group, 0, .04, .02, .56, .2, .79);
        mesh(shellSeamGeometry, m.rubber, group, 0, .15, 0, .605, 1, .85);
        const accent = material(seedMode ? '#538e86' : fertilizerMode ? '#d9ac49' : ['#70a98b', '#7da5c1', '#c3a456', '#b59bc3'][index], { roughness: .52 });
        mesh(smoothShell, accent, group, 0, .42, .04, .43, .13, .62);
        box(m.frame, group, 0, .53, .06, .35, .045, .55);
        for (let z = -.1; z < .4; z += .1)
            box(m.rubber, group, 0, .56, z, .25, .016, .025);
        for (const x of [-.16, .16])
            box(m.rubber, group, x, .55, -.34, .06, .07, .12);
        box(cableMaterial, group, .16, .58, -.34, .035, .03, .07);
        for (let b = 0; b < 8; b++) {
            const a = b * Math.PI / 4;
            mesh(boltGeometry, chromeMaterial, group, Math.sin(a) * .44, .45, Math.cos(a) * .56, .023, .028, .023);
        }
        for (const x of (fertilizerMode || seedMode) ? [] : [-.31, .31]) {
            const tank = mesh(motorGeometry, m.mint, group, x, -.23, .14, .245, .67, .245);
            cylinder(m.frame, group, x, .04, .14, .255, .055);
            cylinder(m.white, group, x, -.52, .14, .255, .06);
            mesh(shellSeamGeometry, m.steel, group, x, -.28, .14, .245, 1, .245);
        }
        let spreader = null;
        if (seedMode) {
            const bin = new THREE.LatheGeometry([[0, -.4], [.12, -.4], [.36, -.16], [.4, .1], [.33, .18], [0, .18]].map(([r, y]) => new THREE.Vector2(r, y)), 16);
            for (const x of [-.34, .34]) {
                mesh(bin, accent, group, x, -.07, .02);
                cylinder(m.white, group, x, .13, .02, .33, .055);
                rod(m.steel, group, [x, -.43, .02], [x * 1.8, -.61, .13], .063);
                cylinder(m.dark, group, x * 1.8, -.62, .13, .1, .12);
            }
            box(m.frame, group, 0, -.47, .04, 1.35, .09, .11);
        }
        if (fertilizerMode) {
            const hopperGeometry = new THREE.LatheGeometry([[0, -.57], [.12, -.57], [.18, -.34], [.45, -.08], [.46, .18], [.34, .27], [0, .27]].map(([r, y]) => new THREE.Vector2(r, y)), 20);
            mesh(hopperGeometry, accent, group, 0, -.02, .08);
            cylinder(m.frame, group, 0, .23, .08, .35, .07);
            cylinder(m.white, group, 0, .29, .08, .14, .06);
            for (const x of [-.38, .38])
                box(m.steel, group, x, -.17, .08, .045, .47, .7);
            spreader = cylinder(m.steel, group, 0, -.65, .08, .36, .055);
            for (let blade = 0; blade < 6; blade++) {
                const a = blade * Math.PI / 3;
                const fin = box(m.gold, group, Math.sin(a) * .21, -.61, .08 + Math.cos(a) * .21, .05, .06, .22);
                fin.rotation.y = a;
            }
        }
        box(m.dark, group, 0, .03, -.83, .43, .23, .21);
        mesh(smoothShell, lensMaterial, group, 0, .015, -.96, .105, .105, .07);
        for (const x of [-.4, .4])
            mesh(smoothShell, ledMaterial, group, x, .29, -.62, .065, .035, .04);
        const rotors = [];
        for (const [x, z] of [[-1.25, -1.25], [1.25, -1.25], [-1.25, 1.25], [1.25, 1.25]]) {
            rod(carbonMaterial, group, [x * .28, .12, z * .28], [x, .2, z], .075);
            rod(m.steel, group, [x * .3, -.08, z * .3], [x, .13, z], .032);
            const wire = tubes([[[x * .33, .2, z * .33], [x * .62, .27, z * .62], [x * .93, .27, z * .93]]], .012, 5, 4);
            mesh(wire, x < 0 ? cableMaterial : m.rubber, group);
            mesh(motorGeometry, m.frame, group, x, .26, z, .19, .3, .19);
            mesh(motorGeometry, m.steel, group, x, .43, z, .19, .045, .19);
            for (const y of [.19, .25, .31])
                mesh(motorGeometry, chromeMaterial, group, x, y, z, .195, .016, .195);
            for (let b = 0; b < 3; b++) {
                const a = b * Math.PI * 2 / 3;
                mesh(boltGeometry, m.rubber, group, x + Math.sin(a) * .13, .457, z + Math.cos(a) * .13, .02, .022, .02);
            }
            const hoop = mesh(rotorRingGeometry, m.steel, group, x, .46, z);
            hoop.rotation.x = Math.PI / 2;
            const rotor = mesh(propellerGeometry, m.prop, group, x, .48, z);
            rotor.rotation.y = index * .8 + x;
            rotors.push(rotor);
            mesh(smoothShell, accent, group, x, .5, z, .1, .055, .1);
        }
        for (const x of [-.68, .68]) {
            for (const z of [-.48, .58])
                rod(m.steel, group, [x * .64, -.12, z], [x, -.74, z * 1.2], .042);
            rod(m.frame, group, [x, -.74, -.89], [x, -.74, 1.02], .055);
            for (const z of [-.65, .72])
                box(m.rubber, group, x, -.76, z, .15, .07, .25);
        }
        // Two nozzles and an inexpensive animated point cloud for irrigation.
        if (!fertilizerMode && !seedMode) {
            box(m.frame, group, 0, -.43, .12, 1.65, .055, .055);
            for (const x of [-.76, .76])
                cylinder(m.steel, group, x, -.49, .12, .07, .09);
            for (const side of [-1, 1])
                mesh(tubes([[[side * .31, -.5, .14], [side * .52, -.57, .17], [side * .76, -.47, .12]]], .014, 5, 4), m.rubber, group);
        }
        const spray = new THREE.Group();
        group.add(spray);
        spray.visible = false;
        const points = [];
        for (let i = 0; i < 100; i++) {
            const a = i * 2.39996, t = (i % 25) / 25;
            if (seedMode)
                points.push((i % 2 ? 1 : -1) * .61 + Math.cos(a) * t * .25, -.68 - t * 3.35, .13 + Math.sin(a) * t * .24);
            else
                points.push(Math.cos(a) * t * (fertilizerMode ? 2.6 : 1.6), -.7 - t * 3.8, Math.sin(a) * t * (fertilizerMode ? 2.6 : 1.6));
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        const pointMaterial = new THREE.PointsMaterial({ color: seedMode ? '#f5d38e' : fertilizerMode ? '#e6c06b' : '#8fc7dc', size: fertilizerMode ? .09 : .11, transparent: true, opacity: .8, depthWrite: false });
        spray.add(new THREE.Points(geometry, pointMaterial));
        mergeRigidMeshes(group, spreader ? [...rotors, spreader] : rotors);
        return { group, rotors, spray, spreader };
    }
    function createCargoDrone(pad) {
        const group = new THREE.Group();
        group.position.copy(pad);
        world.add(group);
        mesh(casingGeometry, m.white, group, 0, .17, 0, 1.02, .35, 1.15);
        mesh(casingGeometry, m.dark, group, 0, -.04, 0, .89, .22, 1.03);
        mesh(shellSeamGeometry, m.rubber, group, 0, .09, 0, .94, 1, 1.08);
        box(m.green, group, 0, .43, -.05, .65, .13, 1.12);
        box(m.frame, group, 0, .52, -.05, .42, .06, .77);
        for (let z = -.33; z < .35; z += .115)
            box(m.rubber, group, 0, .557, z, .31, .018, .035);
        for (const x of [-.8, .8])
            for (const z of [-.5, .5])
                mesh(boltGeometry, chromeMaterial, group, x, .35, z, .03, .035, .03);
        for (const x of [-.63, .63]) {
            mesh(motorGeometry, m.mint, group, x, -.26, .15, .23, .7, .23);
            cylinder(m.frame, group, x, -.02, .15, .245, .07);
            cylinder(m.frame, group, x, -.49, .15, .245, .07);
            mesh(shellSeamGeometry, m.steel, group, x, -.27, .15, .235, 1, .235);
            box(m.rubber, group, x, -.2, .39, .1, .46, .045);
        }
        box(m.dark, group, 0, -.13, -1.04, .6, .3, .22);
        mesh(smoothShell, lensMaterial, group, 0, -.15, -1.19, .14, .14, .08);
        for (const x of [-.49, .49])
            mesh(smoothShell, ledMaterial, group, x, .23, -.94, .08, .045, .06);
        const rotors = [];
        const cargoRingGeometry = new THREE.TorusGeometry(.8, .032, 6, 40);
        for (let i = 0; i < 6; i++) {
            const a = i * Math.PI / 3 + Math.PI / 6, x = Math.cos(a) * 2.42, z = Math.sin(a) * 2.42;
            const ix = Math.cos(a) * .7, iz = Math.sin(a) * .7;
            rod(carbonMaterial, group, [ix, .13, iz], [x, .22, z], .095);
            rod(m.steel, group, [ix, -.08, iz], [x, .13, z], .045);
            mesh(tubes([[[ix, .25, iz], [x * .64, .33, z * .64], [x * .94, .29, z * .94]]], .016, 6, 4), i % 2 ? m.rubber : cableMaterial, group);
            mesh(motorGeometry, m.dark, group, x, .28, z, .23, .34, .23);
            mesh(motorGeometry, m.steel, group, x, .45, z, .205, .07, .205);
            for (const y of [.16, .24, .32])
                mesh(motorGeometry, chromeMaterial, group, x, y, z, .238, .018, .238);
            for (let b = 0; b < 4; b++) {
                const a = b * Math.PI / 2;
                mesh(boltGeometry, m.rubber, group, x + Math.sin(a) * .16, .495, z + Math.cos(a) * .16, .023, .025, .023);
            }
            const hoop = mesh(cargoRingGeometry, m.steel, group, x, .48, z);
            hoop.rotation.x = Math.PI / 2;
            const rotor = mesh(propellerGeometry, m.prop, group, x, .51, z, 1.04, 1, 1.04);
            rotors.push(rotor);
            mesh(smoothShell, m.gold, group, x, .54, z, .11, .05, .11);
        }
        for (const x of [-1.03, 1.03]) {
            for (const z of [-.78, .78])
                rod(m.steel, group, [x * .65, -.18, z * .65], [x, -1.06, z], .065);
            rod(m.frame, group, [x, -1.06, -1.1], [x, -1.06, 1.1], .075);
            for (const z of [-.75, .75])
                box(m.rubber, group, x, -1.09, z, .18, .08, .32);
        }
        // Gold / slate two-link hydraulic manipulator with a separately jointed wrist.
        cylinder(m.steel, group, 0, -.42, .12, .32, .2);
        const shoulder = new THREE.Group();
        shoulder.position.set(0, -.52, .12);
        shoulder.rotation.z = 1.35;
        group.add(shoulder);
        const elbow = new THREE.Group();
        elbow.position.set(0, -.9, 0);
        elbow.rotation.z = -2.7;
        shoulder.add(elbow);
        const wrist = new THREE.Group();
        wrist.position.set(0, -.95, 0);
        wrist.rotation.z = 2.92;
        elbow.add(wrist);
        for (const [joint, length] of [[shoulder, .9], [elbow, .95]]) {
            const pivot = cylinder(m.gold, joint, 0, 0, 0, .205, .34);
            pivot.rotation.x = Math.PI / 2;
            const flange = mesh(new THREE.TorusGeometry(.165, .022, 5, 24), chromeMaterial, joint, 0, 0, .185);
            const axle = mesh(boltGeometry, m.steel, joint, 0, 0, .195, .075, .045, .075);
            axle.rotation.x = Math.PI / 2;
            for (let bolt = 0; bolt < 4; bolt++) {
                const a = bolt * Math.PI / 2;
                const cap = mesh(boltGeometry, m.rubber, joint, Math.sin(a) * .145, Math.cos(a) * .145, .205, .022, .035, .022);
                cap.rotation.x = Math.PI / 2;
            }
            for (const x of [-.14, .14])
                box(m.gold, joint, x, -length * .5, 0, .11, length - .1, .2);
            box(m.steel, joint, 0, -length * .5, 0, .18, length * .6, .25);
            rod(m.steel, joint, [-.25, -.1, .08], [-.25, -length + .13, .08], .045);
            rod(chromeMaterial, joint, [-.25, -.12, .08], [-.25, -length * .55, .08], .025);
            mesh(tubes([[[.25, -.04, -.08], [.34, -length * .43, -.09], [.24, -length + .05, -.08]]], .02, 7, 5), m.rubber, joint);
            for (const y of [-length * .28, -length * .72])
                box(m.steel, joint, .15, y, 0, .15, .055, .24);
        }
        const wristPivot = cylinder(m.gold, wrist, 0, 0, 0, .16, .3);
        wristPivot.rotation.x = Math.PI / 2;
        box(m.steel, wrist, 0, -.14, 0, .19, .28, .2);
        const gripperGroup = new THREE.Group();
        gripperGroup.position.set(0, -.28, 0);
        wrist.add(gripperGroup);
        box(m.frame, gripperGroup, 0, 0, 0, .58, .18, .34);
        const fingers = [], fingerGeometry = new THREE.BoxGeometry(.1, .36, .16);
        for (const side of [-1, 1]) {
            const finger = mesh(fingerGeometry, m.gold, gripperGroup, side * .25, -.18, 0);
            finger.rotation.z = side * -.12;
            finger.userData.side = side;
            finger.userData.openX = side * .25;
            box(m.steel, finger, side * -.065, -.16, 0, .18, .065, .18);
            fingers.push(finger);
            box(m.rubber, finger, side * -.075, -.11, .005, .055, .18, .18);
        }
        const cargoSocket = new THREE.Group();
        cargoSocket.position.set(0, -.25, 0);
        gripperGroup.add(cargoSocket);
        mergeRigidMeshes(group, rotors);
        mergeRigidMeshes(shoulder);
        mergeRigidMeshes(elbow);
        mergeRigidMeshes(wrist);
        return { group, rotors, armJoints: [shoulder, elbow, wrist], gripper: { group: gripperGroup, fingers }, cargoSocket };
    }
    function createGroundRobot(pad) {
        const group = new THREE.Group();
        group.position.copy(pad);
        world.add(group);
        const paint = material('#e7eee1', { roughness: .43 }), robotGreen = material('#4a7c5e', { roughness: .47 }), amber = material('#d7ac4c', { roughness: .48, metalness: .15 });
        box(m.frame, group, 0, -.08, 0, 1.58, .3, 2.4);
        box(paint, group, 0, .09, .54, 1.48, .22, 1.12);
        mesh(casingGeometry, paint, group, 0, .38, .59, .61, .31, .58);
        box(robotGreen, group, 0, .33, 1.05, 1.13, .27, .16);
        box(m.rubber, group, 0, .27, 1.15, .75, .15, .07);
        mesh(smoothShell, lensMaterial, group, 0, .31, 1.2, .14, .105, .075);
        for (const x of [-.5, .5])
            box(ledMaterial, group, x, .32, 1.155, .18, .07, .035);
        for (const x of [-.74, .74]) {
            box(m.rubber, group, x, -.02, 0, .08, .23, 2.52);
            box(paint, group, x, .22, -.45, .09, .14, 1.35);
            for (let z = -.86; z < .2; z += .2)
                box(m.frame, group, x * 1.015, .21, z, .025, .085, .1);
        }
        // Rear bed keeps the produce crate visible beneath the cargo UAV's pickup.
        box(m.steel, group, 0, .13, -.43, 1.35, .09, 1.25);
        for (let z = -.96; z <= .1; z += .19)
            box(m.sage, group, 0, .1875, z, 1.27, .025, .13);
        for (const x of [-.69, .69]) {
            box(robotGreen, group, x, .36, -.43, .07, .5, 1.34);
            box(chromeMaterial, group, x, .63, -.43, .055, .055, 1.38);
            for (const z of [-1.04, .17])
                rod(m.steel, group, [x, .12, z], [x, .64, z], .025);
        }
        box(robotGreen, group, 0, .36, -1.09, 1.4, .5, .065);
        const wheels = [], tireGeometry = new THREE.TorusGeometry(.255, .095, 9, 28);
        tireGeometry.rotateY(Math.PI / 2);
        const wheelPositions = [[-.94, -.21, -.85], [.94, -.21, -.85], [-.94, -.21, 0], [.94, -.21, 0], [-.94, -.21, .85], [.94, -.21, .85]];
        wheelPositions.forEach(([x, y, z]) => {
            const wheel = new THREE.Group();
            wheel.position.set(x, y, z);
            group.add(wheel);
            mesh(tireGeometry, m.rubber, wheel);
            const hub = mesh(motorGeometry, m.steel, wheel, 0, 0, 0, .22, .19, .22);
            hub.rotation.z = Math.PI / 2;
            const cap = mesh(motorGeometry, robotGreen, wheel, Math.sign(x) * .105, 0, 0, .15, .025, .15);
            cap.rotation.z = Math.PI / 2;
            for (let n = 0; n < 20; n++) {
                const a = n * Math.PI / 10, tread = box(m.rubber, wheel, 0, Math.cos(a) * .335, Math.sin(a) * .335, .2, .045, .09);
                tread.rotation.x = a;
            }
            for (let n = 0; n < 5; n++) {
                const a = n * Math.PI * 2 / 5, bolt = mesh(boltGeometry, chromeMaterial, wheel, Math.sign(x) * .129, Math.cos(a) * .105, Math.sin(a) * .105, .022, .025, .022);
                bolt.rotation.z = Math.PI / 2;
            }
            mergeRigidMeshes(wheel);
            wheels.push({ mesh: wheel, axis: 'x', radius: .35 });
            rod(m.steel, group, [x * .7, -.06, z], [x, -.21, z], .055);
        });
        // Sensor mast and amber beacon, both physically separate from the cargo bed.
        cylinder(m.steel, group, -.5, .89, .52, .035, .65);
        box(m.frame, group, -.5, 1.19, .52, .32, .16, .23);
        const beaconMaterial = new THREE.MeshBasicMaterial({ color: '#e4ba57', toneMapped: false });
        cylinder(beaconMaterial, group, -.5, 1.36, .52, .095, .17);
        cylinder(m.steel, group, -.5, 1.28, .52, .12, .045);
        cylinder(m.frame, group, .51, .85, .54, .027, .71);
        const lidar = cylinder(lensMaterial, group, .51, 1.23, .54, .12, .12);
        cylinder(m.white, group, .51, 1.31, .54, .13, .035);
        // The articulated harvesting head reaches forward (+Z) at about y=1.4.
        const shoulder = new THREE.Group();
        shoulder.position.set(0, .35, .82);
        group.add(shoulder);
        const elbow = new THREE.Group();
        elbow.position.set(0, .35, .65);
        shoulder.add(elbow);
        const wrist = new THREE.Group();
        wrist.position.set(0, -.08, .5);
        elbow.add(wrist);
        for (const [joint, end] of [[shoulder, [0, .35, .65]], [elbow, [0, -.08, .5]]]) {
            const pivot = cylinder(m.steel, joint, 0, 0, 0, .155, .46);
            pivot.rotation.z = Math.PI / 2;
            for (const side of [-1, 1]) {
                rod(amber, joint, [side * .15, 0, 0], [side * .15, end[1], end[2]], .064);
                const cap = mesh(boltGeometry, chromeMaterial, joint, side * .245, 0, 0, .07, .045, .07);
                cap.rotation.z = Math.PI / 2;
            }
            rod(m.steel, joint, [-.24, -.03, .05], [-.24, end[1] * .66, end[2] * .66], .042);
            rod(chromeMaterial, joint, [-.24, end[1] * .48, end[2] * .48], [-.24, end[1] * .94, end[2] * .94], .022);
            mesh(tubes([[[.22, .02, 0], [.3, end[1] + .1, end[2] * .45], [.2, end[1], end[2]]]], .018, 7, 4), m.rubber, joint);
        }
        const slide = new THREE.Group();
        wrist.add(slide);
        const rail = box(chromeMaterial, slide, 0, .02, .1, .11, .1, 1);
        rail.position.z = .12;
        rail.scale.z = .10;
        const gripperGroup = new THREE.Group();
        gripperGroup.position.set(0, .05, .12);
        wrist.add(gripperGroup);
        box(m.frame, gripperGroup, 0, 0, 0, .52, .16, .3);
        const fingers = [];
        for (const side of [-1, 1]) {
            const finger = box(amber, gripperGroup, side * .22, -.01, .18, .08, .12, .38);
            finger.userData.side = side;
            finger.userData.openX = side * .22;
            box(m.rubber, finger, side * -.048, 0, .06, .04, .1, .22);
            fingers.push(finger);
        }
        box(m.white, gripperGroup, 0, .13, .02, .2, .13, .19);
        mesh(smoothShell, lensMaterial, gripperGroup, 0, .13, .13, .06, .045, .04);
        const cargoSocket = new THREE.Group();
        cargoSocket.position.set(0, .9, -.35);
        group.add(cargoSocket);
        mergeRigidMeshes(group);
        mergeRigidMeshes(shoulder);
        mergeRigidMeshes(elbow);
        mergeRigidMeshes(wrist);
        mergeRigidMeshes(gripperGroup, fingers);
        return { group, wheels, rail, armJoints: [shoulder, elbow, wrist], gripper: { group: gripperGroup, fingers }, cargoSocket, pad: { x: pad.x, y: pad.y, z: pad.z } };
    }
    const drones = pads.map((pad, i) => createDrone(i, pad));
    const fertilizerPad = new THREE.Vector3(-43, 1.15, -9), robotPad = new THREE.Vector3(-40, .7, 21);
    const fertilizerZone = new THREE.Group();
    fertilizerZone.position.set(fertilizerPad.x, 0, fertilizerPad.z);
    world.add(fertilizerZone);
    cylinder(m.white, fertilizerZone, 0, .18, 0, 2.6, .3);
    cylinder(m.dark, fertilizerZone, 0, .35, 0, 2.25, .055);
    const fertilizerRing = mesh(new THREE.TorusGeometry(1.88, .045, 6, 48), m.gold, fertilizerZone, 0, .4, 0);
    fertilizerRing.rotation.x = -Math.PI / 2;
    const fertilizerMark = sign('H  06', 'FERTILIZER', 0, .416, 0, 3, 1.3, '#244b40', '#e5c375', fertilizerZone);
    fertilizerMark.rotation.x = -Math.PI / 2;
    box(m.white, fertilizerZone, -2.4, .83, -1.6, .5, 1.6, .6);
    box(m.yellow, fertilizerZone, -2.4, 1.3, -1.28, .31, .38, .04);
    mergeRigidMeshes(fertilizerZone);
    const fertilizer = { ...createDrone(4, fertilizerPad, { fertilizer: true }), pad: { x: fertilizerPad.x, y: fertilizerPad.y, z: fertilizerPad.z } };
    const seedPad = new THREE.Vector3(-30, 1.15, 16), seedZone = new THREE.Group();
    world.add(seedZone);
    seedZone.position.set(seedPad.x, 0, seedPad.z);
    cylinder(m.white, seedZone, 0, .18, 0, 2.4, .30);
    cylinder(m.frame, seedZone, 0, .35, 0, 2.1, .055);
    const seedRing = mesh(new THREE.TorusGeometry(1.8, .045, 6, 44), m.mint, seedZone, 0, .4, 0);
    seedRing.rotation.x = -Math.PI / 2;
    const seedSign = sign('H  07', 'SEED STATION', 0, .42, 0, 2.8, 1.3, '#355b52', '#bde3ce', seedZone);
    seedSign.rotation.x = -Math.PI / 2;
    box(m.white, seedZone, -2.28, .82, -1.5, .48, 1.55, .58);
    box(m.mint, seedZone, -2.28, 1.24, -1.18, .3, .32, .045);
    mergeRigidMeshes(seedZone);
    const seeder = { ...createDrone(5, seedPad, { seed: true }), pad: seedPad };
    const bayMarks = [];
    function markBay(p) {
        for (const side of [-1, 1])
            for (const end of [-1, 1]) {
                bayMarks.push({ x: p.x + side * 1.22, y: .158, z: p.z + end * 1.32, sx: .07, sy: .012, sz: .39 }, { x: p.x + side * 1.07, y: .158, z: p.z + end * 1.49, sx: .34, sy: .012, sz: .07 });
            }
    }
    fields.forEach((f, i) => { markBay((0, ground_nav_js_1.pickDock)(f, 0)); markBay((0, ground_nav_js_1.stageDock)(stagePoints[i], 0)); });
    markBay((0, ground_nav_js_1.beltDock)(intake, 0));
    instanced(boxGeometry, m.sage, bayMarks);
    const robot = createGroundRobot(robotPad);
    const robotBay = new THREE.Group();
    robotBay.position.set(robotPad.x, 0, robotPad.z);
    world.add(robotBay);
    box(m.road, robotBay, 0, .145, 0, 3.3, .01, 3.4);
    for (const x of [-1.5, 1.5])
        for (const z of [-1.55, 1.55]) {
            box(m.yellow, robotBay, x, .157, z, .08, .014, .5);
            box(m.yellow, robotBay, x - Math.sign(x) * .2, .157, z + Math.sign(z) * .2, .48, .014, .08);
        }
    const roverMark = sign('采收机器人', 'HARVEST ROVER', 0, .16, 2, 3.2, .65, '#e9e9dd', '#648271', robotBay);
    roverMark.rotation.x = -Math.PI / 2;
    mergeRigidMeshes(robotBay);
    const logistics = { harvester: createCargoDrone(logisticsPad), pad: logisticsPad, pickupHeight: 1.4, intake, conveyorPath, warehouse: warehousePosition, movingBelts, stagePoints, robotPad, fertilizerPad };
    function animate(time) {
        [...drones, fertilizer].forEach((drone, i) => {
            if (drone.spray.visible) {
                drone.spray.rotation.y = time * .45;
                drone.spray.children[0].material.opacity = .55 + .2 * Math.sin(time * 6 + i);
            }
        });
        if (seeder.spray.visible) {
            const attr = seeder.spray.children[0].geometry.attributes.position;
            for (let i = 0; i < attr.count; i++)
                attr.setY(i, -.68 - 3.35 * ((i / 25 + time * 1.7) % 1));
            attr.needsUpdate = true;
        }
        conveyor.animate(time);
        river.animate(time);
    }
    (0, detail_js_1.enhanceArchitecture)(THREE, world);
    return { drones, pads, fieldMeshes, updateScreen, syncCrop, logistics, fertilizer, robot, seeder, animate };
}

});

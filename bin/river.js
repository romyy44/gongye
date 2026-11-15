/* river.js */
QingheModules.define("./river.js", function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRiver = createRiver;
// Procedural shallow stream. The flat farm connector is separate from the banks.
function createRiver(THREE, parent) {
    const group = new THREE.Group();
    group.name = 'farm-river';
    parent.add(group);
    const X0 = -53, X1 = 61, SEGMENTS = 112, WATER_Y = -.45;
    const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .91, metalness: 0, ...extra });
    let seed = 35791;
    function random() { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }
    function section(t) {
        return {
            x: X0 + (X1 - X0) * t,
            z: 38 + 1.12 * Math.sin(t * Math.PI * 2.6 - .3) + .32 * Math.sin(t * Math.PI * 6 + .7),
            half: 2.85 + .22 * Math.sin(t * Math.PI * 4 + .2),
        };
    }
    function stripGeometry(rows, steps, vertex) {
        const positions = [], colors = [], uv = [], indices = [];
        for (let i = 0; i <= steps; i++)
            for (let j = 0; j < rows; j++) {
                const p = vertex(i / steps, j);
                positions.push(p.x, p.y, p.z);
                uv.push((p.x - X0) / 8, p.v ?? j / (rows - 1));
                const c = new THREE.Color(p.color);
                colors.push(c.r, c.g, c.b);
                if (i < steps && j < rows - 1) {
                    const a = i * rows + j, b = a + rows;
                    indices.push(a, a + 1, b, b, a + 1, b + 1);
                }
            }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }
    // z28.6..30.5 stays level at -.03; the first actual slope starts beyond30.5.
    const bankRows = 13;
    const groundGeometry = stripGeometry(bankRows, SEGMENTS, (t, j) => {
        const s = section(t), n = s.z - s.half, f = s.z + s.half;
        const z = [28.6, 30.5, n - 1.8, n - .7, n, n + .35, s.z, f - .35, f, f + .7, f + 1.8, 47.5, 49];
        const y = [-.03, -.03, -.03, -.2, -.54, -.84, -.95, -.84, -.54, -.2, -.03, -.03, -1.32];
        const colors = ['#dce4cc', '#cbd8b7', '#aec39a', '#a8bb91', '#abb39a', '#8faaa0', '#789b91', '#8faaa0', '#abb39a', '#a8bb91', '#aec39a', '#c2cfae', '#d8ded6'];
        const color = new THREE.Color(colors[j]);
        color.multiplyScalar(.985 + .018 * Math.sin(t * 38 + j * .7));
        return { x: s.x, y: y[j], z: z[j], color };
    });
    const ground = new THREE.Mesh(groundGeometry, material('#ffffff', { vertexColors: true }));
    ground.name = 'river-banks-and-flat-connector';
    ground.receiveShadow = true;
    group.add(ground);
    // End faces expose the same clean earth profile as the farm's raised plinth.
    const endPositions = [], endIndices = [];
    for (const t of [0, 1]) {
        const start = endPositions.length / 3, s = section(t), n = s.z - s.half, f = s.z + s.half;
        const zz = [28.6, 30.5, n - 1.8, n - .7, n, n + .35, s.z, f - .35, f, f + .7, f + 1.8, 47.5, 49];
        const yy = [-.03, -.03, -.03, -.2, -.54, -.84, -.95, -.84, -.54, -.2, -.03, -.03, -1.32];
        for (let j = 0; j < zz.length; j++)
            endPositions.push(s.x, yy[j], zz[j], s.x, -1.32, zz[j]);
        for (let j = 0; j < zz.length - 1; j++) {
            const a = start + j * 2;
            if (t === 0)
                endIndices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
            else
                endIndices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
    }
    const endGeometry = new THREE.BufferGeometry();
    endGeometry.setAttribute('position', new THREE.Float32BufferAttribute(endPositions, 3));
    endGeometry.setIndex(endIndices);
    endGeometry.computeVertexNormals();
    const ends = new THREE.Mesh(endGeometry, material('#b4c1a6'));
    ends.receiveShadow = true;
    group.add(ends);
    // A smooth normal map: it never contributes visible black/white color stripes.
    const size = 128, pixels = new Uint8Array(size * size * 4), heights = new Float32Array(size * size);
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
            const u = x / size * Math.PI * 2, v = y / size * Math.PI * 2;
            heights[y * size + x] = .36 * Math.sin(u * 3 + v * 2 + .45 * Math.sin(v * 3)) + .2 * Math.sin(u * 7 - v * 4) + .12 * Math.sin(u * 11 + v * 9);
        }
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
            const dx = heights[y * size + (x + 1) % size] - heights[y * size + (x + size - 1) % size];
            const dy = heights[((y + 1) % size) * size + x] - heights[((y + size - 1) % size) * size + x];
            const normal = new THREE.Vector3(-dx * .65, -dy * .65, 1).normalize(), k = (y * size + x) * 4;
            pixels[k] = Math.round((normal.x * .5 + .5) * 255);
            pixels[k + 1] = Math.round((normal.y * .5 + .5) * 255);
            pixels[k + 2] = Math.round((normal.z * .5 + .5) * 255);
            pixels[k + 3] = 255;
        }
    const normalMap = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.magFilter = THREE.LinearFilter;
    normalMap.minFilter = THREE.LinearMipmapLinearFilter;
    normalMap.generateMipmaps = true;
    normalMap.needsUpdate = true;
    let minWaterZ = Infinity, maxWaterZ = -Infinity, minBankZ = Infinity;
    const waterGeometry = stripGeometry(9, SEGMENTS, (t, j) => {
        const s = section(t), v = j / 8, z = s.z + (v * 2 - 1) * s.half;
        minWaterZ = Math.min(minWaterZ, z);
        maxWaterZ = Math.max(maxWaterZ, z);
        minBankZ = Math.min(minBankZ, s.z - s.half - 1.8);
        const color = new THREE.Color('#78b7aa').lerp(new THREE.Color('#4e968c'), Math.sin(v * Math.PI) * .5);
        return { x: s.x, y: WATER_Y, z, color, v: v * 1.5 };
    });
    const waterMaterial = new THREE.MeshPhysicalMaterial({
        color: '#ffffff', vertexColors: true, normalMap, normalScale: new THREE.Vector2(.33, .25),
        roughness: .24, metalness: .08, clearcoat: .7, clearcoatRoughness: .2,
        transparent: true, opacity: .84, depthWrite: false, envMapIntensity: 1.35,
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.name = 'shallow-flowing-water';
    water.receiveShadow = true;
    water.renderOrder = 1;
    group.add(water);
    function instances(geometry, mat, transforms, name) {
        const object = new THREE.InstancedMesh(geometry, mat, transforms.length), dummy = new THREE.Object3D();
        transforms.forEach((t, i) => { dummy.position.set(t.x, t.y, t.z); dummy.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0); dummy.scale.set(t.sx ?? 1, t.sy ?? 1, t.sz ?? 1); dummy.updateMatrix(); object.setMatrixAt(i, dummy.matrix); });
        object.name = name;
        object.instanceMatrix.needsUpdate = true;
        object.castShadow = true;
        object.receiveShadow = true;
        group.add(object);
        return object;
    }
    function bankHeight(distance) { return distance < .7 ? -.54 + distance / .7 * .34 : -.2 + Math.min(1, (distance - .7) / 1.1) * .17; }
    const stoneBatches = [[], [], []], stems = [], leaves = [], heads = [];
    // Pebbles sit in small irregular groups; they never form a continuous curb.
    for (let cluster = 0; cluster < 13; cluster++) {
        const t = .035 + cluster * .074, side = cluster % 2 ? 1 : -1;
        for (let p = 0; p < 5; p++) {
            const s = section(Math.max(.01, Math.min(.99, t + (random() - .5) * .018))), d = .12 + random() * .9;
            const sx = .12 + random() * .21, sy = .065 + random() * .1;
            stoneBatches[cluster % 3].push({ x: s.x, y: bankHeight(d) + sy * .62, z: s.z + side * (s.half + d), sx, sy, sz: sx * (.7 + random() * .65), ry: random() * Math.PI, rx: random() * .2 });
        }
    }
    const pebbleGeometry = new THREE.IcosahedronGeometry(1, 1);
    ['#b9bbaa', '#b5b19b', '#a8b3a5'].forEach((color, i) => instances(pebbleGeometry, material(color, { roughness: .8 }), stoneBatches[i], 'river-pebbles'));
    for (let clump = 0; clump < 18; clump++) {
        const s = section(.025 + clump * .055), side = clump % 3 ? 1 : -1, d = .45 + random() * .65;
        const cx = s.x, cz = s.z + side * (s.half + d), groundY = bankHeight(d);
        for (let shoot = 0; shoot < 4; shoot++) {
            const x = cx + (random() - .5) * .32, z = cz + (random() - .5) * .3, h = .48 + random() * .55, lean = (random() - .5) * .17;
            stems.push({ x, y: groundY + h * .5, z, sx: .012, sy: h, sz: .012, rz: lean });
            if (shoot % 3 === 0)
                heads.push({ x: x - lean * h * .47, y: groundY + h * .98, z, sx: .027, sy: .16, sz: .027, rz: lean });
            for (let blade = 0; blade < 3; blade++)
                leaves.push({ x, y: groundY + .1 + blade * .12, z, sx: .6 + random() * .3, sy: h * .7, sz: .65, ry: random() * Math.PI * 2, rz: lean });
        }
    }
    const reedGeometry = new THREE.BufferGeometry();
    reedGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -.034, .28, .12, 0, .3, .15, .034, .28, .12, 0, .73, .35], 3));
    reedGeometry.setIndex([0, 1, 2, 0, 2, 3, 1, 4, 2, 2, 4, 3]);
    reedGeometry.computeVertexNormals();
    instances(new THREE.CylinderGeometry(.65, 1, 1, 5, 1, true), material('#6e8c56'), stems, 'reed-stems');
    instances(reedGeometry, material('#839d65', { side: THREE.DoubleSide }), leaves, 'reed-leaves');
    instances(new THREE.CylinderGeometry(.75, 1, 1, 6), material('#978460'), heads, 'reed-seed-heads');
    const bounds = {
        channel: { x0: X0, x1: X1, z0: minWaterZ, z1: maxWaterZ, surfaceY: WATER_Y, bedY: -.95 },
        terrain: { x0: X0, x1: X1, z0: 28.6, z1: 49 },
        flatConnector: { z0: 28.6, z1: 30.5, y: -.03 }, bankSlopeMinZ: minBankZ,
    };
    function animate(time) {
        const seconds = Number.isFinite(time) ? Math.max(0, time) : 0;
        normalMap.offset.set(-seconds * .025, Math.sin(seconds * .04) * .025);
    }
    return { group, water, bounds, animate };
}

});

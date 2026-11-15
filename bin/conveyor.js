/* conveyor.js */
QingheModules.define("./conveyor.js", function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conveyorRollerAngle = exports.conveyorTextureOffset = exports.sampleConveyorPath = exports.conveyorSpeed = exports.conveyorPathLength = exports.CONVEYOR_TEXTURE_REPEAT_METERS = exports.CONVEYOR_BELT_WIDTH = exports.CONVEYOR_DURATION_SECONDS = void 0;
exports.conveyorSegmentDirection = conveyorSegmentDirection;
exports.createConveyorPathSampler = createConveyorPathSampler;
exports.createConveyor = createConveyor;
// One physical distance clock drives parcels, belt texture, cleats and drive rollers.
exports.CONVEYOR_DURATION_SECONDS = 12;
exports.CONVEYOR_BELT_WIDTH = 2.1;
exports.CONVEYOR_TEXTURE_REPEAT_METERS = 4;
const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const point = (p) => ({ x: p.x, y: p.y, z: p.z });
const modulo = (value, length) => ((value % length) + length) % length;
function conveyorSegmentDirection(start, end) {
    const length = Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z);
    if (!(length > 0))
        return { x: 0, y: 0, z: 0 };
    return { x: (end.x - start.x) / length, y: (end.y - start.y) / length, z: (end.z - start.z) / length };
}
function createConveyorPathSampler(path) {
    if (!Array.isArray(path) || path.length < 2 || !path.every((p) => p && [p.x, p.y, p.z].every(Number.isFinite))) {
        throw new TypeError('输送带需要至少两个有效路径点。');
    }
    const points = path.map(point);
    const segments = [];
    let length = 0;
    points.slice(1).forEach((end, index) => {
        const start = points[index];
        const segmentLength = Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z);
        if (segmentLength > 0) {
            segments.push({ index, start, end, length: segmentLength, offset: length, direction: conveyorSegmentDirection(start, end) });
            length += segmentLength;
        }
    });
    if (!(length > 0))
        throw new TypeError('输送带路径必须具有实际长度。');
    function segmentAtDistance(distance) {
        return segments.find((part) => distance < part.offset + part.length - 1e-9) || segments.at(-1);
    }
    function sampleDistance(distance) {
        const bounded = clamp(distance, 0, length);
        const part = segmentAtDistance(bounded);
        const fraction = clamp((bounded - part.offset) / part.length);
        return {
            x: part.start.x + (part.end.x - part.start.x) * fraction,
            y: part.start.y + (part.end.y - part.start.y) * fraction,
            z: part.start.z + (part.end.z - part.start.z) * fraction,
        };
    }
    return {
        points, segments, length,
        sampleDistance,
        sample: (fraction) => sampleDistance(clamp(fraction) * length),
        direction: (fraction) => point(segmentAtDistance(clamp(fraction) * length).direction),
        segmentAtDistance,
    };
}
const conveyorPathLength = (path) => createConveyorPathSampler(path).length;
exports.conveyorPathLength = conveyorPathLength;
const conveyorSpeed = (path) => (0, exports.conveyorPathLength)(path) / exports.CONVEYOR_DURATION_SECONDS;
exports.conveyorSpeed = conveyorSpeed;
const sampleConveyorPath = (path, fraction) => createConveyorPathSampler(path).sample(fraction);
exports.sampleConveyorPath = sampleConveyorPath;
const conveyorTextureOffset = (segmentOffset, time, speed, repeatMeters = exports.CONVEYOR_TEXTURE_REPEAT_METERS) => (segmentOffset - time * speed) / repeatMeters;
exports.conveyorTextureOffset = conveyorTextureOffset;
const conveyorRollerAngle = (time, speed, radius) => time * speed / radius;
exports.conveyorRollerAngle = conveyorRollerAngle;
function createBeltCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    context.fillStyle = '#2e443a';
    context.fillRect(0, 0, 256, 512);
    context.fillStyle = '#3b5146';
    context.fillRect(0, 462, 256, 5);
    context.fillRect(9, 0, 3, 512);
    context.fillRect(244, 0, 3, 512);
    // CanvasTexture.flipY=true: an upward canvas arrow points toward increasing V.
    context.fillStyle = '#a9c5a5';
    context.beginPath();
    context.moveTo(128, 126);
    context.lineTo(190, 207);
    context.lineTo(150, 207);
    context.lineTo(150, 355);
    context.lineTo(106, 355);
    context.lineTo(106, 207);
    context.lineTo(66, 207);
    context.closePath();
    context.fill();
    return canvas;
}
function createTopGeometry(THREE, width, length) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
        -width / 2, 0, -length / 2, width / 2, 0, -length / 2,
        width / 2, 0, length / 2, -width / 2, 0, length / 2,
    ], 3));
    // Crucial: V=0 at the incoming end (-Z), V=1 at the outgoing end (+Z).
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    geometry.setIndex([0, 2, 1, 0, 3, 2]);
    geometry.computeVertexNormals();
    return geometry;
}
function createConveyor(THREE, parent, path, materials = {}) {
    const sampler = createConveyorPathSampler(path);
    const speed = sampler.length / exports.CONVEYOR_DURATION_SECONDS;
    const width = exports.CONVEYOR_BELT_WIDTH;
    const repeatMeters = exports.CONVEYOR_TEXTURE_REPEAT_METERS;
    const group = new THREE.Group();
    group.name = 'produce-conveyor';
    parent.add(group);
    const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.52, metalness: 0.35, ...extra });
    const steel = materials.steel || material('#718079', { metalness: 0.65 });
    const frame = materials.frame || material('#405d50');
    const mint = materials.mint || material('#acc9b1');
    const rubber = materials.rubber || material('#283c32', { roughness: 0.94, metalness: 0 });
    const lightMetal = material('#c8d1c8', { metalness: 0.72, roughness: 0.35 });
    const gold = materials.gold || material('#d6b675', { metalness: 0.3 });
    const red = material('#bd5545', { roughness: 0.48 });
    const dark = material('#263a32', { roughness: 0.7 });
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 12);
    const rollerGeometry = new THREE.CylinderGeometry(1, 1, 1, 14).rotateZ(-Math.PI / 2);
    const canvas = createBeltCanvas();
    const movingBelts = [], segmentModels = [], rollerEntries = [];
    const batches = new Map();
    const dummy = new THREE.Object3D();
    const identity = new THREE.Matrix4();
    const animatedMatrix = new THREE.Matrix4();
    function queue(geometry, mat, segment, position, scale, rotation = [0, 0, 0]) {
        const key = `${geometry.uuid}:${mat.uuid}`;
        if (!batches.has(key))
            batches.set(key, { geometry, material: mat, matrices: [] });
        dummy.position.set(...position);
        dummy.rotation.set(...rotation);
        dummy.scale.set(...scale);
        dummy.updateMatrix();
        batches.get(key).matrices.push(new THREE.Matrix4().multiplyMatrices(segment?.matrix || identity, dummy.matrix));
    }
    const box = (mat, segment, x, y, z, sx, sy, sz, rotation) => queue(boxGeometry, mat, segment, [x, y, z], [sx, sy, sz], rotation);
    const cylinder = (mat, segment, x, y, z, radius, height, rotation) => queue(cylinderGeometry, mat, segment, [x, y, z], [radius, height, radius], rotation);
    function brace(segment, from, to) {
        const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to);
        const direction = end.clone().sub(start);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
        dummy.position.copy(start.add(end).multiplyScalar(0.5));
        dummy.quaternion.copy(quaternion);
        dummy.scale.set(0.065, direction.length(), 0.065);
        dummy.updateMatrix();
        const key = `${boxGeometry.uuid}:${frame.uuid}`;
        if (!batches.has(key))
            batches.set(key, { geometry: boxGeometry, material: frame, matrices: [] });
        batches.get(key).matrices.push(new THREE.Matrix4().multiplyMatrices(segment.matrix, dummy.matrix));
    }
    sampler.segments.forEach((part) => {
        const segment = new THREE.Group();
        segment.name = `conveyor-segment-${part.index}`;
        segment.position.set((part.start.x + part.end.x) / 2, (part.start.y + part.end.y) / 2, (part.start.z + part.end.z) / 2);
        segment.rotation.y = Math.atan2(part.direction.x, part.direction.z);
        // Current path is level; this also supports gently inclined straight runs.
        segment.rotateX(-Math.atan2(part.end.y - part.start.y, Math.hypot(part.end.x - part.start.x, part.end.z - part.start.z)));
        segment.updateMatrix();
        group.add(segment);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, part.length / repeatMeters);
        texture.offset.y = (0, exports.conveyorTextureOffset)(part.offset, 0, speed, repeatMeters);
        texture.anisotropy = 4;
        const topMaterial = new THREE.MeshStandardMaterial({ map: texture, color: '#ffffff', roughness: 0.92, metalness: 0.02, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
        const belt = new THREE.Mesh(createTopGeometry(THREE, width, part.length), topMaterial);
        belt.name = `belt-top-${part.index}`;
        belt.receiveShadow = true;
        segment.add(belt);
        movingBelts.push(belt);
        belt.userData = { segmentIndex: part.index, forwardLocal: { x: 0, y: 0, z: 1 }, surfaceY: 0, metersPerSecond: speed, repeatMeters, pathOffset: part.offset };
        segmentModels.push({ ...part, group: segment, belt, texture, angle: Math.atan2(part.direction.x, part.direction.z) });
        box(rubber, segment, 0, -0.125, 0, width, 0.23, part.length);
        box(rubber, segment, 0, -0.5, 0, width - 0.12, 0.08, part.length);
        for (const side of [-1, 1]) {
            box(mint, segment, side * 1.17, -0.015, 0, 0.13, 0.22, part.length + 0.08);
            box(frame, segment, side * 1.14, -0.32, 0, 0.13, 0.16, part.length);
            box(lightMetal, segment, side * 1.18, 0.105, 0, 0.16, 0.045, part.length + 0.08);
            for (let z = -part.length / 2 + 0.35; z < part.length / 2; z += 1.8) {
                cylinder(lightMetal, segment, side * 1.247, -0.015, z, 0.033, 0.026, [0, 0, -Math.PI / 2]);
            }
        }
        const supportCount = Math.max(2, Math.ceil(part.length / 3.8) + 1);
        const supportZ = Array.from({ length: supportCount }, (_, index) => -part.length / 2 + 0.4 + (part.length - 0.8) * index / (supportCount - 1));
        supportZ.forEach((z, supportIndex) => {
            box(steel, segment, 0, -0.38, z, 2.05, 0.13, 0.13);
            for (const side of [-1, 1]) {
                box(steel, segment, side * 0.96, -0.78, z, 0.13, 1.2, 0.13);
                box(lightMetal, segment, side * 0.96, -1.405, z, 0.38, 0.07, 0.4);
                box(mint, segment, side * 0.96, -0.3, z, 0.28, 0.31, 0.22);
                for (const dx of [-0.12, 0.12])
                    for (const dz of [-0.13, 0.13])
                        cylinder(steel, segment, side * 0.96 + dx, -1.353, z + dz, 0.023, 0.032);
                if (supportIndex < supportZ.length - 1)
                    brace(segment, [side * 0.96, -1.2, z], [side * 0.96, -0.43, supportZ[supportIndex + 1]]);
            }
        });
        const rollerCount = Math.max(3, Math.ceil(part.length / 1.7) + 1);
        for (let index = 0; index < rollerCount; index += 1) {
            const z = -part.length / 2 + 0.18 + (part.length - 0.36) * index / (rollerCount - 1);
            const radius = index === 0 || index === rollerCount - 1 ? 0.19 : 0.13;
            rollerEntries.push({ segment, center: new THREE.Vector3(0, -radius - 0.008, z), radius, width: 2.28, direction: point(part.direction) });
            for (const side of [-1, 1]) {
                box(frame, segment, side * 1.24, -radius - 0.008, z, 0.13, 0.28, 0.3);
                cylinder(lightMetal, segment, side * 1.32, -radius - 0.008, z, 0.072, 0.11, [0, 0, -Math.PI / 2]);
                cylinder(lightMetal, segment, side * 1.39, -radius - 0.008, z, radius * 0.73, 0.045, [0, 0, -Math.PI / 2]);
            }
        }
        // Clean external drive motor, guarded gearbox, cooling fins and emergency stop.
        const driveZ = part.length / 2 - 0.38;
        box(mint, segment, -1.52, -0.22, driveZ, 0.54, 0.55, 0.64);
        box(frame, segment, -1.58, -0.22, driveZ + 0.345, 0.6, 0.6, 0.07);
        cylinder(steel, segment, -1.99, -0.22, driveZ, 0.225, 0.52, [0, 0, -Math.PI / 2]);
        cylinder(dark, segment, -2.28, -0.22, driveZ, 0.2, 0.06, [0, 0, -Math.PI / 2]);
        for (let fin = 0; fin < 4; fin += 1)
            box(lightMetal, segment, -1.82 - fin * 0.11, -0.22, driveZ, 0.035, 0.48, 0.48);
        for (const x of [-1.72, -1.38])
            for (const y of [-0.4, -0.04])
                cylinder(lightMetal, segment, x, y, driveZ + 0.39, 0.027, 0.025, [Math.PI / 2, 0, 0]);
        box(frame, segment, 1.43, -0.05, driveZ - 0.9, 0.12, 0.47, 0.12);
        box(gold, segment, 1.43, 0.21, driveZ - 0.9, 0.36, 0.13, 0.31);
        cylinder(red, segment, 1.43, 0.31, driveZ - 0.9, 0.095, 0.085);
    });
    // Broad transfer plates support the outer quadrant of the L turn with no open gap.
    const transferPlates = [];
    for (let index = 1; index < sampler.points.length - 1; index += 1) {
        const at = sampler.points[index];
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.055, 2.32), lightMetal);
        mesh.position.set(at.x, at.y - 0.0315, at.z);
        mesh.name = `corner-transfer-${index}`;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        transferPlates.push(mesh);
    }
    for (const batch of batches.values()) {
        const mesh = new THREE.InstancedMesh(batch.geometry, batch.material, batch.matrices.length);
        batch.matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
        mesh.instanceMatrix.needsUpdate = true;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
    }
    const rollers = new THREE.InstancedMesh(rollerGeometry, lightMetal, rollerEntries.length);
    const rollerMarks = new THREE.InstancedMesh(boxGeometry, dark, rollerEntries.length * 2);
    rollers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    rollerMarks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    rollers.castShadow = rollerMarks.castShadow = true;
    rollers.receiveShadow = true;
    group.add(rollers, rollerMarks);
    const cleatCount = Math.max(1, Math.floor(sampler.length / 3.5));
    const cleatSpacing = sampler.length / cleatCount;
    const cleats = new THREE.InstancedMesh(boxGeometry, mint, cleatCount);
    cleats.name = 'forward-moving-belt-cleats';
    cleats.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    cleats.castShadow = true;
    cleats.receiveShadow = true;
    group.add(cleats);
    // An absolute simulation clock keeps pause, 1x, 2x and 4x perfectly synchronized.
    function animate(time) {
        const seconds = Number.isFinite(time) ? Math.max(0, time) : 0;
        segmentModels.forEach((segment) => {
            segment.texture.offset.y = (0, exports.conveyorTextureOffset)(segment.offset, seconds, speed, repeatMeters);
        });
        for (let index = 0; index < cleatCount; index += 1) {
            const distance = modulo(index * cleatSpacing + seconds * speed, sampler.length);
            const position = sampler.sampleDistance(distance), direction = sampler.segmentAtDistance(distance).direction;
            dummy.position.set(position.x, position.y + 0.025, position.z);
            dummy.rotation.set(0, Math.atan2(direction.x, direction.z), 0);
            dummy.scale.set(width - 0.21, 0.045, 0.12);
            dummy.updateMatrix();
            cleats.setMatrixAt(index, dummy.matrix);
        }
        cleats.instanceMatrix.needsUpdate = true;
        rollerEntries.forEach((roller, index) => {
            const angle = (0, exports.conveyorRollerAngle)(seconds, speed, roller.radius);
            dummy.position.copy(roller.center);
            dummy.rotation.set(angle, 0, 0);
            dummy.scale.set(roller.width, roller.radius, roller.radius);
            dummy.updateMatrix();
            rollers.setMatrixAt(index, animatedMatrix.multiplyMatrices(roller.segment.matrix, dummy.matrix));
            for (const side of [-1, 1]) {
                // Painted end-cap marks sit outside the stationary rails and bearing guards.
                dummy.position.copy(roller.center);
                dummy.position.x += side * (roller.width / 2 + 0.285);
                dummy.rotation.set(angle, 0, 0);
                dummy.scale.set(0.024, roller.radius * 1.18, 0.035);
                dummy.updateMatrix();
                rollerMarks.setMatrixAt(index * 2 + (side === 1 ? 1 : 0), animatedMatrix.multiplyMatrices(roller.segment.matrix, dummy.matrix));
            }
        });
        rollers.instanceMatrix.needsUpdate = rollerMarks.instanceMatrix.needsUpdate = true;
    }
    animate(0);
    // Matrices move only within the known installation; disable stale automatic instance bounds.
    cleats.frustumCulled = rollers.frustumCulled = rollerMarks.frustumCulled = false;
    return {
        group, movingBelts, animate,
        diagnostics: {
            duration: exports.CONVEYOR_DURATION_SECONDS, pathLength: sampler.length, speed, width, repeatMeters,
            segments: segmentModels, transferPlates, cleats, cleatCount, cleatSpacing,
            rollers, rollerMarks, rollerEntries, sampler,
            arrowLocalDirection: { x: 0, y: 0, z: 1 },
            cleatDistance: (index, time) => modulo(index * cleatSpacing + time * speed, sampler.length),
        },
    };
}

});

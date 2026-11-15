/* detail.js */
QingheModules.define("./detail.js", function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhanceArchitecture = enhanceArchitecture;
// Architectural detail is procedural and clean: seams, fittings and micro-surface PBR,
// without dirt / damage maps or downloaded assets. Fixed parts are merged by material.
function enhanceArchitecture(THREE, world) {
    const root = new THREE.Group();
    root.name = 'architectural-refinement';
    world.add(root);
    const standard = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .62, metalness: .04, ...extra });
    const m = {
        ivory: standard('#e9ede7', { roughness: .44, metalness: .08 }),
        white: standard('#f4f5ee', { roughness: .42, metalness: .06 }),
        aluminum: standard('#a4b0b0', { metalness: .82, roughness: .28 }),
        steel: standard('#596b67', { metalness: .7, roughness: .34 }),
        dark: standard('#344741', { roughness: .72, metalness: .12 }),
        rubber: standard('#293833', { roughness: .88, metalness: .01 }),
        green: standard('#3b7059', { roughness: .46, metalness: .16 }),
        concreteJoint: standard('#c8cec3', { roughness: .96 }),
        wood: standard('#bba783', { roughness: .7 }),
        warning: standard('#d8bb67', { roughness: .49, metalness: .14 }),
        silicon: new THREE.MeshPhysicalMaterial({ color: '#193b51', roughness: .22, metalness: .5, clearcoat: .9, clearcoatRoughness: .16 }),
        skylight: new THREE.MeshPhysicalMaterial({ color: '#9db7b7', roughness: .12, metalness: .38, clearcoat: 1, clearcoatRoughness: .08 }),
        illumination: standard('#fff6de', { roughness: .3, emissive: '#ffeac1', emissiveIntensity: 1.35 }),
        led: standard('#b7e6b8', { roughness: .28, emissive: '#83d59a', emissiveIntensity: 1.8 }),
        red: standard('#b75543', { roughness: .38, emissive: '#66291e', emissiveIntensity: .2 }),
    };
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 12);
    const sphereGeometry = new THREE.SphereGeometry(1, 10, 6);
    const meshes = [];
    function mesh(geometry, material, parent, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
        const object = new THREE.Mesh(geometry, material);
        object.position.set(x, y, z);
        object.scale.set(sx, sy, sz);
        object.castShadow = true;
        object.receiveShadow = true;
        (parent || root).add(object);
        meshes.push(object);
        return object;
    }
    const box = (mat, p, x, y, z, w, h, d) => mesh(boxGeometry, mat, p, x, y, z, w, h, d);
    const cylinder = (mat, p, x, y, z, r, h) => mesh(cylinderGeometry, mat, p, x, y, z, r, h, r);
    const sphere = (mat, p, x, y, z, rx, ry = rx, rz = rx) => mesh(sphereGeometry, mat, p, x, y, z, rx, ry, rz);
    function group(x, y, z) { const object = new THREE.Group(); object.position.set(x, y, z); root.add(object); return object; }
    function roundedBox(mat, p, x, y, z, w, h, d, r = .07) {
        const radius = Math.min(r, w * .24, h * .24, d * .24), shape = new THREE.Shape();
        const lx = -w / 2, ly = -h / 2;
        shape.moveTo(lx + radius, ly);
        shape.lineTo(lx + w - radius, ly);
        shape.quadraticCurveTo(lx + w, ly, lx + w, ly + radius);
        shape.lineTo(lx + w, ly + h - radius);
        shape.quadraticCurveTo(lx + w, ly + h, lx + w - radius, ly + h);
        shape.lineTo(lx + radius, ly + h);
        shape.quadraticCurveTo(lx, ly + h, lx, ly + h - radius);
        shape.lineTo(lx, ly + radius);
        shape.quadraticCurveTo(lx, ly, lx + radius, ly);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: d - radius * 2, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: radius, bevelThickness: radius, curveSegments: 3 });
        geometry.translate(0, 0, -d / 2 + radius);
        return mesh(geometry, mat, p, x, y, z);
    }
    function pipe(mat, p, points, r = .035, segments = 14) {
        const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
        return mesh(new THREE.TubeGeometry(curve, segments, r, 7, false), mat, p);
    }
    function rod(mat, p, start, end, r = .025) {
        const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end), object = cylinder(mat, p, 0, 0, 0, r, a.distanceTo(b));
        object.position.copy(a).add(b).multiplyScalar(.5);
        object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
        return object;
    }
    // Neutral micro-height maps produce grazing-light detail, not weathering or stains.
    function surfaceMaps(kind, repeat) {
        const n = 128, height = new Float32Array(n * n), normals = new Uint8Array(n * n * 4), roughness = new Uint8Array(n * n * 4);
        let seed = kind === 'soil' ? 8631 : 2189;
        const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
        for (let y = 0; y < n; y++)
            for (let x = 0; x < n; x++) {
                const fine = rand(), wave = Math.sin(x * .39) * Math.sin(y * .33);
                height[y * n + x] = kind === 'soil' ? fine * .75 + wave * .08 : fine * .2 + wave * .04;
                const value = Math.round((kind === 'soil' ? .87 : .73) * 255 + (fine - .5) * (kind === 'soil' ? 16 : 10));
                const k = (y * n + x) * 4;
                roughness[k] = roughness[k + 1] = roughness[k + 2] = value;
                roughness[k + 3] = 255;
            }
        for (let y = 0; y < n; y++)
            for (let x = 0; x < n; x++) {
                const dx = height[y * n + (x + 1) % n] - height[y * n + (x + n - 1) % n], dy = height[((y + 1) % n) * n + x] - height[((y + n - 1) % n) * n + x];
                const v = new THREE.Vector3(-dx * 2, -dy * 2, 1).normalize(), k = (y * n + x) * 4;
                normals[k] = Math.round((v.x * .5 + .5) * 255);
                normals[k + 1] = Math.round((v.y * .5 + .5) * 255);
                normals[k + 2] = Math.round((v.z * .5 + .5) * 255);
                normals[k + 3] = 255;
            }
        const normalMap = new THREE.DataTexture(normals, n, n), roughnessMap = new THREE.DataTexture(roughness, n, n);
        for (const texture of [normalMap, roughnessMap]) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(repeat, repeat);
            texture.magFilter = THREE.LinearFilter;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.generateMipmaps = true;
            texture.needsUpdate = true;
        }
        return { normalMap, roughnessMap };
    }
    const concreteMaps = surfaceMaps('concrete', 12), soilMaps = surfaceMaps('soil', 9);
    const touched = new Set();
    world.traverse(object => {
        if (!object.isMesh)
            return;
        for (const mat of Array.isArray(object.material) ? object.material : [object.material]) {
            if (touched.has(mat) || !mat.color)
                continue;
            touched.add(mat);
            const hex = mat.color.getHexString();
            if (hex === 'e9e9dd' || hex === 'e7eadc') {
                mat.normalMap = concreteMaps.normalMap;
                mat.roughnessMap = concreteMaps.roughnessMap;
                mat.normalScale = new THREE.Vector2(.13, .13);
                mat.roughness = .86;
                mat.needsUpdate = true;
            }
            else if (hex === 'a18a68' || hex === 'b69b72') {
                mat.normalMap = soilMaps.normalMap;
                mat.roughnessMap = soilMaps.roughnessMap;
                mat.normalScale = new THREE.Vector2(.32, .32);
                mat.roughness = .98;
                mat.needsUpdate = true;
            }
            else if (hex === 'f6f7ec') {
                mat.roughness = .42;
                mat.metalness = .08;
                mat.needsUpdate = true;
            }
            else if (hex === 'a7d2d0') {
                mat.roughness = .11;
                mat.metalness = .28;
                mat.opacity = .43;
                mat.envMapIntensity = 1.25;
                mat.needsUpdate = true;
            }
        }
    });
    const station = group(-36, 0, -18.8);
    station.name = 'command-centre-fittings';
    // Slim perimeter caps and stepped sills visibly catch the sun around the white shell.
    for (const z of [-4.73, 3.76])
        roundedBox(m.aluminum, station, 0, 4.78, z, 17.5, .075, .095, .02);
    for (const x of [-8.7, 8.7])
        roundedBox(m.aluminum, station, x, 4.78, -.49, .095, .075, 8.55, .02);
    for (const x of [-7.1, -3.6, 0, 3.6, 7.1]) {
        box(m.rubber, station, x, 2.3, 2.79, .19, 2.8, .08);
        box(m.aluminum, station, x, 2.3, 2.97, .055, 2.67, .05);
    }
    for (const y of [.92, 3.62])
        box(m.aluminum, station, 0, y, 2.98, 14.8, .055, .075);
    roundedBox(m.ivory, station, 0, .72, 3.04, 15.6, .14, .4, .035);
    // Facade panel joint lines sit behind the existing signage.
    for (const x of [-7.8, -5.3, -2.65, 2.65, 5.3, 7.8])
        box(m.concreteJoint, station, x, 4.05, 2.742, .022, .95, .015);
    for (const x of [-.58, .58]) {
        box(m.aluminum, station, x, 1.9, 3.044, .045, 1.87, .04);
        rod(m.aluminum, station, [x * .72, 1.55, 3.09], [x * .72, 1.97, 3.09], .018);
    }
    roundedBox(m.dark, station, 0, .69, 3.15, 1.9, .055, .45, .035);
    // Window openings get a restrained reflection band while retaining transparency.
    const glassHighlight = new THREE.MeshPhysicalMaterial({ color: '#d9e9e8', roughness: .07, metalness: .3, transparent: true, opacity: .16, depthWrite: false, clearcoat: 1, clearcoatRoughness: .05 });
    for (const x of [-5.35, -1.8, 1.8, 5.35]) {
        const band = box(glassHighlight, station, x, 3.03, 2.95, 3.25, .15, .018);
        band.castShadow = false;
    }
    // Clearly modelled workstations, task chairs, keyboards and ceiling light diffusers.
    for (const x of [-4.3, 4.3]) {
        roundedBox(m.dark, station, x, 1.363, .62, .85, .045, .29, .025);
        for (let r = 0; r < 3; r++)
            for (let c = 0; c < 10; c++)
                box(m.aluminum, station, x - .34 + c * .075, 1.389, .53 + r * .07, .048, .011, .04);
        roundedBox(m.dark, station, x, 1.366, 1.02, .35, .023, .26, .035);
        const chair = group(-36 + x, 0, -18.8 + 1.7);
        roundedBox(m.dark, chair, 0, .99, 0, .76, .14, .67, .08);
        roundedBox(m.green, chair, 0, 1.4, .3, .76, .73, .12, .065);
        cylinder(m.aluminum, chair, 0, .64, 0, .055, .6);
        for (let i = 0; i < 5; i++) {
            const a = i * Math.PI * 2 / 5, px = Math.sin(a) * .42, pz = Math.cos(a) * .42;
            rod(m.steel, chair, [0, .4, 0], [px, .31, pz], .027);
            sphere(m.rubber, chair, px, .29, pz, .07, .055, .07);
        }
        for (const side of [-1, 1]) {
            rod(m.aluminum, chair, [side * .31, 1.0, .14], [side * .43, 1.28, .14], .019);
            roundedBox(m.dark, chair, side * .42, 1.3, -.03, .085, .05, .43, .02);
        }
        roundedBox(m.aluminum, station, x, 4.36, -.3, 2.15, .06, .73, .025);
        box(m.illumination, station, x, 4.321, -.3, 2, .018, .6).castShadow = false;
    }
    // Individually separated PV cells, silver busbars, rails and edge gaskets.
    for (let px = -5.5; px <= 5.6; px += 2.2)
        for (let pz = -2.6; pz <= .1; pz += 1.35) {
            for (let c = 0; c < 6; c++)
                for (let r = 0; r < 4; r++) {
                    const cx = px - .78 + c * .312, cz = pz - .405 + r * .27, cy = 5.174 + (cz - pz) * .08;
                    const cell = box(m.silicon, station, cx, cy, cz, .296, .014, .25);
                    cell.rotation.x = -.08;
                    for (const bx of [-.058, .058]) {
                        const bus = box(m.aluminum, station, cx + bx, cy + .011, cz, .006, .006, .225);
                        bus.rotation.x = -.08;
                    }
                }
            for (const side of [-1, 1]) {
                box(m.aluminum, station, px + side * .99, 5.17, pz, .035, .035, 1.17).rotation.x = -.08;
                box(m.aluminum, station, px, 5.17 + side * .044, pz + side * .58, 2.02, .035, .025);
            }
        }
    // HVAC louvers and fan grille are fresh, unweathered industrial fittings.
    for (const hx of [4.5, 6.4]) {
        roundedBox(m.ivory, station, hx, 5.2, 2.3, 1.48, .51, 1.4, .06);
        cylinder(m.steel, station, hx, 5.48, 2.3, .43, .035);
        for (let i = -4; i <= 4; i++) {
            const length = Math.sqrt(Math.max(0, .43 * .43 - (i * .085) ** 2)) * 2;
            box(m.aluminum, station, hx + i * .085, 5.505, 2.3, .014, .012, length);
            box(m.aluminum, station, hx, 5.51, 2.3 + i * .085, length, .012, .014);
            box(m.dark, station, hx + i * .12, 5.2, 3.012, .055, .28, .012);
        }
        pipe(m.aluminum, station, [[hx, 5.1, 1.6], [hx, 5.03, 1.2], [7.38, 5.03, 1.2], [7.38, 4.65, 1.2]], .035, 12);
    }
    const warehouse = group(42, 0, -10);
    warehouse.name = 'warehouse-fittings';
    // Continuous gutters, downspouts and metal eave caps define the roof edges.
    for (const side of [-1, 1]) {
        roundedBox(m.aluminum, warehouse, side * 8.47, 6.94, 0, .2, .16, 17.45, .045);
        for (const z of [-7.85, 7.85]) {
            pipe(m.aluminum, warehouse, [[side * 8.47, 6.94, z], [side * 8.54, 6.68, z + .18], [side * 8.54, 1.0, z + .18], [side * 8.75, .52, z + .43]], .075, 18);
            for (const y of [1.2, 3.2, 5.5])
                box(m.steel, warehouse, side * 8.43, y, z + .18, .2, .04, .19);
        }
        for (const y of [1.2, 3.3, 5.4])
            box(m.concreteJoint, warehouse, side * 8.045, y, 0, .025, .025, 15.6);
        for (let z = -7.4; z <= 7.4; z += 1.1)
            for (const roofX of [side * 1.4, side * 7.9]) {
                const roofY = 8.25 - Math.abs(roofX) * .16;
                sphere(m.aluminum, warehouse, roofX, roofY, z, .034, .027, .034);
            }
        // Clean flush roof glazing sits in a proper metal rebate.
        const frame = roundedBox(m.aluminum, warehouse, side * 4.2, 7.69, -4.7, 3.9, .075, 2.62, .025);
        frame.rotation.z = -side * .16;
        const glazing = box(m.skylight, warehouse, side * 4.2, 7.744, -4.7, 3.7, .035, 2.44);
        glazing.rotation.z = -side * .16;
        for (const z of [-5.4, -4.7, -4])
            box(m.aluminum, warehouse, side * 4.2, 7.77, z, 3.85, .025, .035).rotation.z = -side * .16;
    }
    // A rolled shutter drum and profiled tracks make the open receiving portal legible.
    const drum = cylinder(m.aluminum, warehouse, 0, 5.22, 8.08, .39, 7.5);
    drum.rotation.z = Math.PI / 2;
    for (const x of [-3.87, 3.87]) {
        roundedBox(m.aluminum, warehouse, x, 2.88, 8.2, .15, 5.55, .17, .035);
        box(m.dark, warehouse, x, 2.88, 8.302, .045, 5.35, .02);
        for (const y of [.65, 2.0, 3.5, 4.9])
            sphere(m.aluminum, warehouse, x, y, 8.325, .035, .035, .018);
    }
    for (const x of [-3.75, 3.75]) {
        for (const y of [.51, .83, 1.15, 1.47])
            cylinder(y === .83 || y === 1.47 ? m.dark : m.warning, warehouse, x, y, 8.65, .127, .17);
        sphere(m.aluminum, warehouse, x, 1.825, 8.65, .13, .035, .13);
    }
    // Portal lighting uses real housing/diffuser geometry; no fake dirty glow decals.
    for (const x of [-6.6, 6.6]) {
        roundedBox(m.aluminum, warehouse, x, 4.61, 8.23, .72, .3, .24, .04);
        box(m.illumination, warehouse, x, 4.57, 8.36, .57, .13, .025).castShadow = false;
        box(m.dark, warehouse, x, 4.47, 8.35, .74, .045, .12);
    }
    for (const x of [-5.4, 5.4])
        for (const z of [-5.4, -1]) {
            for (const y of [1, 2.5, 4])
                box(m.warning, warehouse, x, y, z, .27, .08, .12);
            rod(m.aluminum, warehouse, [x - .94, .35, z], [x + .94, 4.18, z], .026);
        }
    for (const x of [-5.4, 5.4])
        for (const y of [1.08, 2.58, 4.08]) {
            box(m.wood, warehouse, x, y, -3.2, 2.12, .045, 4.5);
            for (const z of [-4.8, -3.2, -1.6]) {
                for (const side of [-1, 1])
                    box(m.ivory, warehouse, x + side * .61, y + .4, z, .045, .62, 1.06);
                box(m.ivory, warehouse, x, y + .4, z + .56, 1.22, .08, .03);
            }
        }
    for (const x of [-4.8, 4.8]) {
        roundedBox(m.aluminum, warehouse, x, 6.42, -1, 2.3, .08, .75, .02);
        box(m.illumination, warehouse, x, 6.36, -1, 2.08, .018, .59).castShadow = false;
    }
    // Emergency and door-control station beside the opening.
    roundedBox(m.ivory, warehouse, 4.5, 1.7, 8.08, .4, .65, .16, .035);
    for (const [y, mat] of [[1.92, m.led], [1.68, m.green], [1.44, m.red]]) {
        const button = cylinder(mat, warehouse, 4.5, y, 8.202, .065, .036);
        button.rotation.x = Math.PI / 2;
    }
    // Charging pedestals, docking contacts, coiled service leads and readable indicators.
    const pads = [[-36, -7], [-30, -7], [-36, 7], [-30, 7]];
    for (const [x, z] of pads) {
        const charger = group(x + 2.3, 0, z - 1.55);
        roundedBox(m.ivory, charger, 0, .8, 0, .55, 1.63, .63, .055);
        roundedBox(m.dark, charger, 0, 1.3, .331, .34, .38, .025, .018);
        box(m.led, charger, 0, 1.35, .348, .2, .038, .012).castShadow = false;
        for (let n = 0; n < 3; n++)
            box(m.aluminum, charger, -.07 + n * .07, 1.22, .348, .04, .075, .01);
        for (let n = 0; n < 7; n++)
            box(m.dark, charger, 0, .4 + n * .065, .335, .31, .018, .012);
        for (const side of [-1, 1]) {
            box(m.aluminum, charger, side * .18, .115, 0, .07, .045, .51);
            pipe(m.rubber, charger, [[side * .28, .98, .05], [side * .48, .82, .07], [side * .5, .41, .07], [side * .33, .3, .15], [side * .28, .72, .27]], .025, 17);
        }
        for (const dx of [-.46, .46])
            for (const dz of [-.5, .5]) {
                box(m.aluminum, root, x + dx, .42, z + dz, .16, .045, .31);
                box(m.warning, root, x + dx, .448, z + dz, .09, .012, .16);
            }
    }
    const cabinet = group(-44, 0, 1.3);
    roundedBox(m.ivory, cabinet, 0, 1.5, 0, 2.29, 3.04, 3.27, .08);
    // Leave the existing green face uncovered; new front door and side vent details frame it.
    for (const x of [-1.04, 1.04])
        box(m.aluminum, cabinet, x, 1.5, 1.664, .035, 2.66, .035);
    for (const y of [.25, 2.78])
        box(m.aluminum, cabinet, 0, y, 1.664, 2.1, .035, .035);
    rod(m.aluminum, cabinet, [.84, 1.15, 1.71], [.84, 1.62, 1.71], .024);
    for (let i = 0; i < 12; i++)
        box(m.dark, cabinet, 1.16, .45 + i * .07, .1, .022, .025, 2.05);
    // Add the green fascia and a slim emissive status strip atop the bevelled replacement shell.
    roundedBox(m.green, cabinet, 0, 2, 1.66, 1.55, 1.05, .025, .02);
    box(m.led, cabinet, 0, 2.7, 1.697, .65, .055, .016).castShadow = false;
    // Concrete joints and machined drain slots, all flush with the service road surface.
    for (let z = -22; z <= 22; z += 4.4)
        box(m.concreteJoint, root, -36, .151, z, 20.2, .009, .024);
    for (let x = -44; x <= -28; x += 4)
        box(m.concreteJoint, root, x, .151, 0, .024, .009, 45);
    for (let z = -21; z <= 22; z += 4.4)
        box(m.concreteJoint, root, 40, .151, z, 23, .009, .024);
    for (let x = 30; x <= 52; x += 4.4)
        box(m.concreteJoint, root, x, .151, 1, .024, .009, 46);
    for (const z of [-19, -5, 10, 21])
        for (const x of [-25, 25]) {
            roundedBox(m.steel, root, x, .165, z, .73, .045, 1.12, .04);
            for (let i = 0; i < 8; i++)
                box(m.dark, root, x, .191, z - .45 + i * .13, .56, .008, .055);
        }
    // Low-profile drip mains and lateral lines make the agronomy infrastructure credible.
    for (const [cx, cz] of [[-12, -10], [12, -10], [-12, 12], [12, 12]]) {
        rod(m.rubber, root, [cx - 9.15, .65, cz - 6.35], [cx - 9.15, .65, cz + 6.35], .025);
        for (let row = 0; row < 6; row++) {
            const z = cz - 5.75 + row * 2.3;
            rod(m.rubber, root, [cx - 9.2, .61, z], [cx + 9.15, .61, z], .017);
            for (const x of [cx - 8, cx - 4, cx, cx + 4, cx + 8])
                sphere(m.dark, root, x, .633, z, .032, .025, .032);
        }
        cylinder(m.steel, root, cx - 9.2, .68, cz - 6.25, .085, .16);
        const valve = cylinder(m.green, root, cx - 9.2, .8, cz - 6.25, .11, .035);
        valve.rotation.z = Math.PI / 2;
    }
    // Compact pump/filter skid and a tidy on-site weather mast.
    const pump = group(-25, 0, 21.2);
    roundedBox(m.ivory, pump, 0, .43, 0, 1.8, .54, 1.2, .08);
    const pumpBody = cylinder(m.green, pump, 0, .84, 0, .27, 1.08);
    pumpBody.rotation.z = Math.PI / 2;
    for (const x of [-.58, .58])
        cylinder(m.aluminum, pump, x, .82, 0, .32, .11).rotation.z = Math.PI / 2;
    pipe(m.steel, pump, [[-.62, .8, 0], [-.9, .8, 0], [-1.05, .6, 0], [-1.05, .3, -.7]], .075, 12);
    pipe(m.steel, pump, [[.62, .8, 0], [1, .8, 0], [1.05, .6, 0], [1.05, .25, .8]], .075, 12);
    cylinder(m.ivory, pump, .6, 1.26, .16, .16, .5);
    const gauge = cylinder(m.aluminum, pump, .06, 1.19, .32, .14, .06);
    gauge.rotation.x = Math.PI / 2;
    const gaugeFace = cylinder(m.white, pump, .06, 1.19, .359, .112, .012);
    gaugeFace.rotation.x = Math.PI / 2;
    rod(m.dark, pump, [.06, 1.19, .37], [.107, 1.246, .37], .009);
    const weather = group(-24.7, 0, -23);
    cylinder(m.aluminum, weather, 0, 2.25, 0, .065, 4.2);
    roundedBox(m.ivory, weather, 0, .16, 0, .75, .2, .75, .06);
    rod(m.aluminum, weather, [-.68, 3.5, 0], [.7, 3.5, 0], .035);
    for (const x of [-.53, .53]) {
        for (let y = 3.33; y <= 3.68; y += .07)
            cylinder(m.white, weather, x, y, 0, .15, .025);
        cylinder(m.aluminum, weather, x, 3.74, 0, .05, .16);
    }
    rod(m.aluminum, weather, [-.54, 4.2, 0], [.54, 4.2, 0], .025);
    for (let i = 0; i < 3; i++) {
        const a = i * Math.PI * 2 / 3;
        rod(m.steel, weather, [0, 4.38, 0], [Math.sin(a) * .43, 4.38, Math.cos(a) * .43], .018);
        sphere(m.aluminum, weather, Math.sin(a) * .43, 4.38, Math.cos(a) * .43, .13, .075, .13);
    }
    // Merge all static fittings by material, including UVs for the PBR micro-maps.
    root.updateWorldMatrix(true, true);
    const inverseRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const batches = new Map();
    for (const object of meshes) {
        const key = `${object.material.uuid}:${object.castShadow}`;
        if (!batches.has(key))
            batches.set(key, { material: object.material, castShadow: object.castShadow, positions: [], normals: [], uvs: [] });
        const batch = batches.get(key), geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
        geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverseRoot, object.matrixWorld));
        const positions = geometry.attributes.position, normals = geometry.attributes.normal, uvs = geometry.attributes.uv;
        for (let i = 0; i < positions.count; i++) {
            batch.positions.push(positions.getX(i), positions.getY(i), positions.getZ(i));
            batch.normals.push(normals.getX(i), normals.getY(i), normals.getZ(i));
            batch.uvs.push(uvs ? uvs.getX(i) : 0, uvs ? uvs.getY(i) : 0);
        }
        geometry.dispose();
        object.parent.remove(object);
    }
    let triangles = 0;
    for (const batch of batches.values()) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(batch.positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(batch.normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(batch.uvs, 2));
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        const combined = new THREE.Mesh(geometry, batch.material);
        combined.castShadow = batch.castShadow;
        combined.receiveShadow = true;
        combined.name = 'merged-building-detail';
        root.add(combined);
        triangles += batch.positions.length / 9;
    }
    for (const child of [...root.children])
        if (child.isGroup && !child.children.length)
            root.remove(child);
    return { group: root, drawCalls: batches.size, triangles: Math.round(triangles) };
}

});

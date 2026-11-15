/* lighting.js */
QingheModules.define("./lighting.js", function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLighting = createLighting;
// Procedural high-dynamic-range daylight: no downloaded HDR files or textures.
function createLighting(THREE, scene, renderer) {
    const hemisphere = new THREE.HemisphereLight('#c6dbef', '#797968', .6);
    const sun = new THREE.DirectionalLight('#fff1d8', 3.3);
    sun.castShadow = true;
    const resolution = renderer.capabilities.maxTextureSize >= 4096 && window.innerWidth >= 900 ? 3072 : 2048;
    sun.shadow.mapSize.set(resolution, resolution);
    Object.assign(sun.shadow.camera, { left: -77, right: 77, top: 67, bottom: -67, near: 1, far: 220 });
    sun.shadow.normalBias = .025;
    sun.shadow.bias = -.000035;
    sun.shadow.radius = 2.5;
    sun.target.position.set(2, 0, 0);
    const fill = new THREE.DirectionalLight('#b6d1f0', .28);
    fill.position.set(50, 32, -42);
    scene.add(hemisphere, sun, sun.target, fill);
    const pmrem = new THREE.PMREMGenerator(renderer);
    let environmentTarget;
    function skyEnvironment(direction, warm) {
        const width = 256, height = 128, pixels = new Float32Array(width * height * 4);
        for (let y = 0; y < height; y++) {
            const latitude = ((y + .5) / height - .5) * Math.PI, vertical = Math.sin(latitude), horizontal = Math.cos(latitude);
            for (let x = 0; x < width; x++) {
                const longitude = ((x + .5) / width - .5) * Math.PI * 2;
                const dx = Math.cos(longitude) * horizontal, dz = Math.sin(longitude) * horizontal;
                const dot = dx * direction.x + vertical * direction.y + dz * direction.z;
                const glow = 4 * Math.exp((dot - 1) * 75) + 70 * Math.exp((dot - 1) * 1800);
                const sky = Math.pow(Math.max(vertical, 0), .55), earth = Math.max(-vertical, 0);
                const horizon = warm ? [1.1, .91, .68] : [.93, 1.05, 1.13];
                const zenith = warm ? [.32, .44, .62] : [.24, .46, .76];
                const base = vertical >= 0 ? horizon.map((v, i) => v * (1 - sky) + zenith[i] * sky) : [.4 - .24 * earth, .42 - .26 * earth, .35 - .24 * earth];
                const offset = (y * width + x) * 4;
                pixels[offset] = base[0] + glow;
                pixels[offset + 1] = base[1] + glow * (warm ? .69 : .9);
                pixels[offset + 2] = base[2] + glow * (warm ? .37 : .72);
                pixels[offset + 3] = 1;
            }
        }
        const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.FloatType);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.LinearSRGBColorSpace;
        texture.needsUpdate = true;
        const target = pmrem.fromEquirectangular(texture);
        texture.dispose();
        if (environmentTarget)
            environmentTarget.dispose();
        environmentTarget = target;
        scene.environment = target.texture;
        scene.environmentIntensity = .48;
    }
    function setPreset(preset = 'daylight') {
        const warm = preset === 'golden';
        sun.position.set(warm ? -40 : -35, warm ? 43 : 73, warm ? 48 : 36);
        sun.color.set(warm ? '#ffd49b' : '#fff0db');
        sun.intensity = warm ? 3.05 : 3.3;
        hemisphere.intensity = warm ? .49 : .6;
        fill.intensity = warm ? .19 : .28;
        renderer.toneMappingExposure = warm ? 1.02 : .98;
        skyEnvironment(sun.position.clone().sub(sun.target.position).normalize(), warm);
        sun.shadow.needsUpdate = true;
    }
    setPreset();
    return { sun, hemisphere, setPreset, dispose() { environmentTarget?.dispose(); pmrem.dispose(); } };
}

});

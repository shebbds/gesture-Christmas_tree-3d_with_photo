/**
 * 祝寿花篮装饰物系统：2000 个可辨认装饰物通过 InstancedMesh 绘制，
 * 保留呼吸、旋转和炸裂成满天星的交互效果。
 */
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { mainGroup, camera, clock } from './scene.js';
import { Particle, particleSystem, registerInstancedMesh } from './particle.js';

let centralShou = null;
let centralPeach = null;

export function createTree() {
    const geometries = createGeometries();
    const materials = createMaterials();
    const kinds = [
        { type: 'ROSE', geo: geometries.rose, mat: materials.rose, weight: 0.22, scale: [0.62, 1.05] },
        { type: 'CARNATION', geo: geometries.carnation, mat: materials.carnation, weight: 0.20, scale: [0.55, 0.9] },
        { type: 'HEART', geo: geometries.heart, mat: materials.heart, weight: 0.10, scale: [0.34, 0.64] },
        { type: 'PEACH', geo: geometries.peach, mat: materials.peach, weight: 0.10, scale: [0.48, 0.82] },
        { type: 'SHOU', geo: geometries.shou, mat: materials.shou, weight: 0.08, scale: [0.42, 0.72] },
        { type: 'LEAF', geo: geometries.leaf, mat: materials.leaf, weight: 0.12, scale: [0.48, 0.9] },
        { type: 'PETAL', geo: geometries.petal, mat: materials.petal, weight: 0.10, scale: [0.38, 0.78] },
        { type: 'LILY', geo: geometries.lily, mat: materials.lily, weight: 0.08, scale: [0.45, 0.9] },
    ];

    const assignments = rollKinds(kinds, CONFIG.particles.count);
    kinds.forEach((kind, kindIndex) => {
        const total = assignments[kindIndex];
        const instanced = makeInstancedMesh(kind.geo, kind.mat, total);
        for (let i = 0; i < total; i++) {
            const holder = new THREE.Object3D();
            holder.scale.setScalar(THREE.MathUtils.randFloat(kind.scale[0], kind.scale[1]));
            holder.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI * 2, Math.random() * Math.PI);
            particleSystem.push(new Particle(holder, kind.type, false, { mesh: instanced, index: i }));
        }
    });

    createBasketAndHandle();
    createRibbons();
    createCentralPeach();
    createCentralShou();
}

function createGeometries() {
    const rose = new THREE.TorusKnotGeometry(0.38, 0.16, 32, 7, 2, 3);
    const carnation = new THREE.DodecahedronGeometry(0.58, 1);

    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, -0.42);
    heartShape.bezierCurveTo(-0.92, -1.0, -1.25, 0.22, -0.62, 0.62);
    heartShape.bezierCurveTo(-0.2, 0.9, 0, 0.52, 0, 0.3);
    heartShape.bezierCurveTo(0, 0.52, 0.2, 0.9, 0.62, 0.62);
    heartShape.bezierCurveTo(1.25, 0.22, 0.92, -1.0, 0, -0.42);
    const heart = new THREE.ExtrudeGeometry(heartShape, {
        depth: 0.2, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 2,
    });
    heart.center();

    const peach = new THREE.SphereGeometry(0.58, 18, 14);
    peach.scale(0.86, 1.12, 0.78);

    const leaf = new THREE.SphereGeometry(0.5, 12, 8);
    leaf.scale(0.42, 1.2, 0.14);

    const petal = new THREE.SphereGeometry(0.5, 12, 8);
    petal.scale(0.48, 1.0, 0.12);

    const lily = new THREE.CapsuleGeometry(0.1, 0.9, 4, 8);

    return {
        rose,
        carnation,
        heart,
        peach,
        leaf,
        petal,
        lily,
        shou: new THREE.PlaneGeometry(1.1, 1.1),
    };
}

function createMaterials() {
    return {
        rose: new THREE.MeshPhysicalMaterial({ color: 0xb9002c, roughness: 0.35, clearcoat: 0.45, emissive: 0x350008 }),
        carnation: new THREE.MeshStandardMaterial({ color: 0xe42b45, roughness: 0.62, emissive: 0x390006 }),
        heart: new THREE.MeshPhysicalMaterial({ color: 0xf2173d, roughness: 0.22, clearcoat: 1, emissive: 0x4a0009 }),
        peach: new THREE.MeshPhysicalMaterial({ color: 0xff8b87, roughness: 0.4, clearcoat: 0.55, emissive: 0x4b1514 }),
        leaf: new THREE.MeshStandardMaterial({ color: 0x123d20, roughness: 0.75, emissive: 0x031408 }),
        petal: new THREE.MeshPhysicalMaterial({ color: 0xff7297, roughness: 0.42, clearcoat: 0.35, emissive: 0x491020 }),
        lily: new THREE.MeshStandardMaterial({ color: 0xffd45f, roughness: 0.28, metalness: 0.18, emissive: 0x573300 }),
        shou: new THREE.MeshBasicMaterial({
            map: makeCharacterTexture('寿'), transparent: true, alphaTest: 0.08,
            side: THREE.DoubleSide, depthWrite: false,
        }),
    };
}

function rollKinds(kinds, total) {
    const counts = new Array(kinds.length).fill(0);
    for (let i = 0; i < total; i++) {
        let random = Math.random();
        let index = 0;
        while (index < kinds.length - 1 && (random -= kinds[index].weight) >= 0) index++;
        counts[index]++;
    }
    return counts;
}

function makeInstancedMesh(geometry, material, count) {
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mainGroup.add(mesh);
    return registerInstancedMesh(mesh);
}

function createBasketAndHandle() {
    const wicker = new THREE.MeshStandardMaterial({
        color: 0xa63816, map: makeWickerTexture(), roughness: 0.52, metalness: 0.08,
    });
    const gold = new THREE.MeshStandardMaterial({ color: 0xffc84d, roughness: 0.25, metalness: 0.85, emissive: 0x3c2100 });

    const basket = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 3.65, 5.8, 36, 8, true), wicker);
    basket.position.y = -7.4;
    basket.scale.z = 0.62;
    mainGroup.add(basket);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(5.25, 0.24, 10, 64), gold);
    rim.position.y = -4.45;
    rim.rotation.x = Math.PI / 2;
    rim.scale.z = 0.62;
    mainGroup.add(rim);

    for (let i = 0; i < 8; i++) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(4.0 + i * 0.14, 0.045, 5, 48), i % 2 ? gold : wicker);
        band.position.y = -9.7 + i * 0.66;
        band.rotation.x = Math.PI / 2;
        band.scale.z = 0.62;
        mainGroup.add(band);
    }

    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.65, 4.1, 0.65, 36), gold);
    base.position.y = -10.55;
    base.scale.z = 0.62;
    mainGroup.add(base);

    const plaque = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 1.55),
        new THREE.MeshBasicMaterial({ map: makeHorizontalTextTexture('福寿安康'), transparent: true })
    );
    plaque.position.set(0, -7.5, 3.28);
    mainGroup.add(plaque);

    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-5.2, -4.5, -0.6),
        new THREE.Vector3(-4.6, 4.2, -1.0),
        new THREE.Vector3(0, 9.6, -1.2),
        new THREE.Vector3(4.6, 4.2, -1.0),
        new THREE.Vector3(5.2, -4.5, -0.6),
    ]);
    const handle = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.18, 8, false), gold);
    mainGroup.add(handle);
}

function createCentralPeach() {
    centralPeach = new THREE.Group();
    const textures = makePeachTextures();
    const geometry = makePeachGeometry();
    const material = new THREE.MeshPhysicalMaterial({
        map: textures.color,
        bumpMap: textures.bump,
        bumpScale: 0.075,
        color: 0xffc9ba,
        roughness: 0.48,
        clearcoat: 0.34,
        clearcoatRoughness: 0.32,
        sheen: 0.45,
        sheenColor: new THREE.Color(0xff8f9f),
        emissive: 0x50140f,
        emissiveIntensity: 0.08,
    });

    const peach = new THREE.Mesh(geometry, material);
    peach.scale.set(3.05, 3.55, 2.25);
    centralPeach.add(peach);
    addPeachSeam(centralPeach);

    const leafMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x245d2d, roughness: 0.62, clearcoat: 0.2, emissive: 0x06170a,
    });
    [
        { x: 1.6, y: 3.05, z: 0.2, rz: -0.9, sx: 0.78, sy: 2.0 },
        { x: -1.25, y: 3.18, z: 0.05, rz: 0.85, sx: 0.58, sy: 1.45 },
    ].forEach((spec) => {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 18), leafMaterial);
        leaf.position.set(spec.x, spec.y, spec.z);
        leaf.rotation.z = spec.rz;
        leaf.scale.set(spec.sx, spec.sy, 0.2);
        centralPeach.add(leaf);
    });

    const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.17, 1.0, 18),
        new THREE.MeshStandardMaterial({ color: 0x6f3518, roughness: 0.8 })
    );
    stem.position.set(0.12, 3.25, 0);
    stem.rotation.z = -0.18;
    centralPeach.add(stem);

    addPeachSparkles(centralPeach);
    addCloudOrnaments(centralPeach);

    centralPeach.position.set(0, 2.8, 3.1);
    mainGroup.add(centralPeach);

    const warmLight = new THREE.PointLight(0xffc46b, 8, 14, 2);
    warmLight.position.set(0, 4.5, 8.5);
    mainGroup.add(warmLight);
}

function addPeachSeam(group) {
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 2.95, 1.28),
        new THREE.Vector3(-0.08, 2.25, 1.78),
        new THREE.Vector3(0.03, 1.25, 2.16),
        new THREE.Vector3(-0.03, 0.1, 2.27),
        new THREE.Vector3(0.04, -1.2, 2.12),
        new THREE.Vector3(0, -2.45, 1.63),
    ]);
    const seam = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 48, 0.028, 7, false),
        new THREE.MeshStandardMaterial({ color: 0xb94e66, roughness: 0.9, transparent: true, opacity: 0.72 })
    );
    group.add(seam);
}

function makePeachGeometry() {
    const geometry = new THREE.SphereGeometry(1, 96, 64);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        let x = positions.getX(i);
        let y = positions.getY(i);
        let z = positions.getZ(i);

        const body = 1 + 0.07 * (1 - y * y);
        x *= body;
        z *= body;

        // 顶部凹口与正面桃沟，让单体轮廓更接近真实寿桃而不是圆球。
        const center = Math.exp(-(x * x) / 0.055);
        y -= center * Math.max(0, y) ** 3 * 0.19;
        if (z > 0) z -= center * z * (0.035 + 0.085 * (1 - Math.abs(y)));

        // 底端略收尖，保留圆润体量。
        y -= Math.max(0, -y) ** 4 * 0.09;
        positions.setXYZ(i, x, y, z);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
}

function makePeachTextures() {
    const size = 2048;
    const colorCanvas = document.createElement('canvas');
    const bumpCanvas = document.createElement('canvas');
    colorCanvas.width = colorCanvas.height = size;
    bumpCanvas.width = bumpCanvas.height = size;
    const ctx = colorCanvas.getContext('2d');
    const bump = bumpCanvas.getContext('2d');

    const gradient = ctx.createRadialGradient(size * 0.42, size * 0.32, 30, size * 0.5, size * 0.5, size * 0.72);
    gradient.addColorStop(0, '#fff1d8');
    gradient.addColorStop(0.28, '#ffc4b2');
    gradient.addColorStop(0.66, '#ef8283');
    gradient.addColorStop(1, '#b93f57');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    bump.fillStyle = '#858585';
    bump.fillRect(0, 0, size, size);

    // 天然桃皮纹理：方向略弯的细纹和轻微茸毛颗粒。
    for (let i = 0; i < 720; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const length = 18 + Math.random() * 95;
        ctx.strokeStyle = `rgba(150,42,62,${0.018 + Math.random() * 0.05})`;
        ctx.lineWidth = 0.6 + Math.random() * 2.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + length * 0.35, y - 14, x + length, y + 6);
        ctx.stroke();

        bump.strokeStyle = `rgba(255,255,255,${0.025 + Math.random() * 0.07})`;
        bump.lineWidth = 1 + Math.random() * 2;
        bump.beginPath();
        bump.moveTo(x, y);
        bump.lineTo(x + length, y + 6);
        bump.stroke();
    }

    for (let i = 0; i < 6500; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 0.35 + Math.random() * 1.8;
        ctx.fillStyle = `rgba(255,235,205,${0.025 + Math.random() * 0.12})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        bump.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.12})`;
        bump.fillRect(x, y, r, r);
    }

    const color = new THREE.CanvasTexture(colorCanvas);
    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    color.colorSpace = THREE.SRGBColorSpace;
    color.anisotropy = 8;
    bumpTexture.anisotropy = 8;
    return { color, bump: bumpTexture };
}

function addPeachSparkles(group) {
    const count = 180;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const y = THREE.MathUtils.randFloat(-0.9, 0.95);
        const phi = Math.acos(y);
        const angle = Math.random() * Math.PI;
        const radius = Math.sin(phi);
        positions[i * 3] = radius * Math.cos(angle) * 3.12;
        positions[i * 3 + 1] = y * 3.63;
        positions[i * 3 + 2] = radius * Math.sin(angle) * 2.32 + 0.05;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0xffe49a, size: 0.075, transparent: true, opacity: 0.92,
        blending: THREE.AdditiveBlending, depthWrite: false,
    });
    group.add(new THREE.Points(geometry, material));
}

function addCloudOrnaments(group) {
    const texture = makeCloudTexture();
    [-1, 1].forEach((side) => {
        const cloud = new THREE.Mesh(
            new THREE.PlaneGeometry(1.8, 2.5),
            new THREE.MeshBasicMaterial({
                map: texture, transparent: true, color: 0xffdb68,
                side: THREE.DoubleSide, depthWrite: false,
            })
        );
        cloud.position.set(side * 2.28, 0.15, 2.05);
        cloud.scale.x = side;
        group.add(cloud);
    });
}

function makeCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#fff2a3';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#ff9f1f';
    ctx.shadowBlur = 24;
    [175, 390, 610].forEach((y, index) => {
        const width = index === 1 ? 190 : 150;
        ctx.beginPath();
        ctx.moveTo(65, y + 28);
        ctx.bezierCurveTo(90, y - 45, 160, y - 48, 183, y + 2);
        ctx.bezierCurveTo(215, y - 72, 310, y - 62, 322, y + 4);
        ctx.bezierCurveTo(360, y - 30, 420, y - 8, 430, y + 35);
        ctx.lineTo(430 - width, y + 35);
        ctx.stroke();
    });
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function createRibbons() {
    const ribbonTextureLeft = makeVerticalTextTexture('福如东海长流水');
    const ribbonTextureRight = makeVerticalTextTexture('寿比南山不老松');
    [
        { x: -7.1, texture: ribbonTextureLeft, rotation: 0.08 },
        { x: 7.1, texture: ribbonTextureRight, rotation: -0.08 },
    ].forEach(({ x, texture, rotation }) => {
        const ribbon = new THREE.Mesh(
            new THREE.PlaneGeometry(2.15, 12.2, 1, 12),
            new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
        );
        ribbon.position.set(x, -3.8, 4.1);
        ribbon.rotation.z = rotation;
        mainGroup.add(ribbon);
    });
}

function createCentralShou() {
    centralShou = new THREE.Group();
    const texture = makeCharacterTexture('寿');
    const geometry = new THREE.PlaneGeometry(4.0, 4.0);
    for (let i = 9; i >= 0; i--) {
        const depth = i / 9;
        const layer = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                color: i === 0 ? 0xfff3ad : new THREE.Color().setHSL(0.105, 0.9, 0.28 + depth * 0.16),
                side: THREE.DoubleSide,
                depthWrite: false,
            })
        );
        layer.position.z = -i * 0.022;
        centralShou.add(layer);
    }
    centralShou.position.set(0, 3.0, 5.55);
    mainGroup.add(centralShou);
}

function makeCharacterTexture(character) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1024, 1024);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff8b19';
    ctx.shadowBlur = 54;
    ctx.fillStyle = '#ffe891';
    ctx.font = '900 760px "Kaiti SC", "STKaiti", serif';
    ctx.fillText(character, 512, 532);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function makeVerticalTextTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'rgba(105,0,17,.82)');
    gradient.addColorStop(0.5, 'rgba(210,13,40,.96)');
    gradient.addColorStop(1, 'rgba(105,0,17,.82)');
    ctx.fillStyle = gradient;
    ctx.roundRect(14, 0, canvas.width - 28, canvas.height, 54);
    ctx.fill();
    ctx.strokeStyle = '#ffd36a';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.fillStyle = '#ffe28a';
    ctx.font = '900 72px "Kaiti SC", "STKaiti", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const step = 118;
    const start = canvas.height / 2 - ((text.length - 1) * step) / 2;
    [...text].forEach((character, index) => ctx.fillText(character, canvas.width / 2, start + index * step));
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function makeWickerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8e260e';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#d15b28';
    ctx.lineWidth = 10;
    for (let y = -32; y < 288; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y + 64);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, y + 64);
        ctx.lineTo(256, y);
        ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
}

function makeHorizontalTextTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 220;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8c001b';
    ctx.roundRect(10, 10, 492, 200, 34);
    ctx.fill();
    ctx.strokeStyle = '#ffd36a';
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.fillStyle = '#ffe28a';
    ctx.font = '900 78px "Kaiti SC", "STKaiti", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 116);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export function updateStar() {
    if (!centralShou) return;
    centralShou.lookAt(camera.position);
    const pulse = 1 + Math.sin(clock.elapsedTime * 1.5) * 0.045;
    centralShou.scale.setScalar(pulse);
    if (centralPeach) centralPeach.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.1) * 0.018);
}

/** 2000 粒金尘在炸裂与照片聚焦状态下浮现。 */
export function createDust() {
    const count = CONFIG.particles.dustCount;
    const geometry = new THREE.TetrahedronGeometry(0.085, 0);
    const material = new THREE.MeshBasicMaterial({ color: 0xffd873, transparent: true, opacity: 0.84 });
    const instanced = makeInstancedMesh(geometry, material, count);
    for (let i = 0; i < count; i++) {
        const holder = new THREE.Object3D();
        holder.scale.setScalar(0.45 + Math.random() * 1.1);
        particleSystem.push(new Particle(holder, 'DUST', true, { mesh: instanced, index: i }));
    }
}

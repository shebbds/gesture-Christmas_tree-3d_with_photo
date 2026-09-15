/**
 * 树身：装饰物（方块 / 球 / 拐杖糖）、顶端的星星、悬浮金尘。
 *
 * 装饰物和金尘全部走 InstancedMesh：同一种「几何体 + 材质」的组合只提交一次
 * draw call。合起来 3500 个粒子从 3500 次 draw call 降到 6 次，
 * 这是中低端设备能跑满帧的关键。
 */
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { mainGroup, camera, clock } from './scene.js';
import { Particle, particleSystem, registerInstancedMesh } from './particle.js';
import { createCaneTexture } from './utils.js';

let star = null;

export function createTree() {
    const caneCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.5, 0),
        new THREE.Vector3(0, 0.3, 0),
        new THREE.Vector3(0.1, 0.5, 0),
        new THREE.Vector3(0.3, 0.4, 0),
    ]);

    const geo = {
        sphere: new THREE.SphereGeometry(0.5, 32, 32),
        box: new THREE.BoxGeometry(0.55, 0.55, 0.55),
        cane: new THREE.TubeGeometry(caneCurve, 16, 0.08, 8, false),
    };

    const mat = {
        gold: new THREE.MeshStandardMaterial({
            color: CONFIG.colors.champagneGold,
            metalness: 1.0, roughness: 0.1,
            envMapIntensity: 2.0,
            emissive: 0x443300, emissiveIntensity: 0.3,
        }),
        green: new THREE.MeshStandardMaterial({
            color: CONFIG.colors.deepGreen,
            metalness: 0.2, roughness: 0.8,
            emissive: 0x002200, emissiveIntensity: 0.2,
        }),
        red: new THREE.MeshPhysicalMaterial({
            color: CONFIG.colors.accentRed,
            metalness: 0.3, roughness: 0.2, clearcoat: 1.0,
            emissive: 0x330000,
        }),
        cane: new THREE.MeshStandardMaterial({ map: createCaneTexture(), roughness: 0.4 }),
    };

    // 每种装饰物的出现权重，加起来是 1
    const kinds = [
        { type: 'BOX',          geo: geo.box,    mat: mat.green, weight: 0.40 },
        { type: 'GOLD_BOX',     geo: geo.box,    mat: mat.gold,  weight: 0.30 },
        { type: 'GOLD_SPHERE',  geo: geo.sphere, mat: mat.gold,  weight: 0.22 },
        { type: 'RED',          geo: geo.sphere, mat: mat.red,   weight: 0.05 },
        { type: 'CANE',         geo: geo.cane,   mat: mat.cane,  weight: 0.03 },
    ];

    // InstancedMesh 的容量必须提前确定，所以先掷骰子决定每种各有几个
    const assignments = rollKinds(kinds, CONFIG.particles.count);

    kinds.forEach((kind, k) => {
        const total = assignments[k];
        if (!total) return;

        const instanced = makeInstancedMesh(kind.geo, kind.mat, total);

        for (let i = 0; i < total; i++) {
            const holder = new THREE.Object3D();
            holder.scale.setScalar(0.4 + Math.random() * 0.5);
            holder.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
            particleSystem.push(new Particle(holder, kind.type, false, { mesh: instanced, index: i }));
        }
    });

    star = createStar();
    mainGroup.add(star);
}

/** 按权重把 total 个名额分配给各种装饰物。 */
function rollKinds(kinds, total) {
    const counts = new Array(kinds.length).fill(0);

    for (let i = 0; i < total; i++) {
        let r = Math.random();
        let k = 0;
        while (k < kinds.length - 1 && (r -= kinds[k].weight) >= 0) k++;
        counts[k]++;
    }

    return counts;
}

function makeInstancedMesh(geometry, material, count) {
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // 粒子散开后会远超初始包围球，交给 GPU 画就好，不值得每帧重算
    mesh.frustumCulled = false;
    mainGroup.add(mesh);
    return registerInstancedMesh(mesh);
}

/**
 * 让星星始终正对镜头。
 *
 * 星星是一个沿 Z 轴挤出的扁平五角星，而整棵树是持续自转的 —— 每转过 90°
 * 就会看到它的侧面，变成一块没有形状的金片。做成 billboard 之后，
 * 无论树怎么转、用户怎么拖动视角，星星都保持完整的五角形。
 */
export function updateStar() {
    if (!star) return;

    star.lookAt(camera.position);

    // 轻微的明暗呼吸，让树顶不至于死板
    star.material.emissiveIntensity = 1.0 + 0.35 * Math.sin(clock.elapsedTime * 1.6);
}

function createStar() {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1.5;
    const innerRadius = 0.7;

    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points + Math.PI / 2;
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
    }
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.4,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 2,
    });
    geometry.center();

    const material = new THREE.MeshStandardMaterial({
        color: 0xffdd88,
        emissive: 0xffaa00, emissiveIntensity: 1.0,
        metalness: 1.0, roughness: 0,
    });

    const star = new THREE.Mesh(geometry, material);
    star.position.set(0, CONFIG.particles.treeHeight / 2 + 1.2, 0);
    return star;
}

/** 悬浮的金色尘埃，只在「散开」状态下可见。 */
export function createDust() {
    const count = CONFIG.particles.dustCount;
    if (!count) return;

    const geometry = new THREE.TetrahedronGeometry(0.08, 0);
    const material = new THREE.MeshBasicMaterial({ color: 0xffeebb, transparent: true, opacity: 0.8 });
    const instanced = makeInstancedMesh(geometry, material, count);

    for (let i = 0; i < count; i++) {
        const holder = new THREE.Object3D();
        holder.scale.setScalar(0.5 + Math.random());
        particleSystem.push(new Particle(holder, 'DUST', true, { mesh: instanced, index: i }));
    }
}

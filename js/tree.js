/**
 * 树身：装饰物（方块 / 球 / 拐杖糖）、顶端的星星、悬浮金尘。
 */
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { mainGroup } from './scene.js';
import { Particle, particleSystem } from './particle.js';
import { createCaneTexture } from './utils.js';

/** 各类装饰物的出现概率（累计值）与对应几何体、材质。 */
function buildOrnamentTable(geo, mat) {
    return [
        { upTo: 0.40, type: 'BOX',         geo: geo.box,    mat: mat.green },
        { upTo: 0.70, type: 'GOLD_BOX',    geo: geo.box,    mat: mat.gold },
        { upTo: 0.92, type: 'GOLD_SPHERE', geo: geo.sphere, mat: mat.gold },
        { upTo: 0.97, type: 'RED',         geo: geo.sphere, mat: mat.red },
        { upTo: 1.00, type: 'CANE',        geo: geo.cane,   mat: mat.cane },
    ];
}

export function createTree() {
    const caneCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.5, 0),
        new THREE.Vector3(0, 0.3, 0),
        new THREE.Vector3(0.1, 0.5, 0),
        new THREE.Vector3(0.3, 0.4, 0),
    ]);

    // 几何体与材质全部共享，1500 个装饰物只占 3 份几何 + 4 份材质
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

    const table = buildOrnamentTable(geo, mat);

    for (let i = 0; i < CONFIG.particles.count; i++) {
        const rand = Math.random();
        const kind = table.find((k) => rand < k.upTo);

        const mesh = new THREE.Mesh(kind.geo, kind.mat);
        const s = 0.4 + Math.random() * 0.5;
        mesh.scale.setScalar(s);
        mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);

        mainGroup.add(mesh);
        particleSystem.push(new Particle(mesh, kind.type));
    }

    mainGroup.add(createStar());
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
    const geometry = new THREE.TetrahedronGeometry(0.08, 0);
    const material = new THREE.MeshBasicMaterial({ color: 0xffeebb, transparent: true, opacity: 0.8 });

    for (let i = 0; i < CONFIG.particles.dustCount; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.setScalar(0.5 + Math.random());
        mainGroup.add(mesh);
        particleSystem.push(new Particle(mesh, 'DUST', true));
    }
}

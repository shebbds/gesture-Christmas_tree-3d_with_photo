/**
 * 飘雪。挂在 scene 而非 mainGroup 上，所以树旋转时雪不会跟着转。
 */
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { scene, clock } from './scene.js';
import { createSnowflakeTexture } from './utils.js';

const AREA = { x: 100, y: 60, z: 60 };
const RESET_BELOW = -30;
const RESET_TO = 30;

let snowSystem = null;
/**
 * 每片雪花的下落速度与摆动幅度。
 * 原来这些值被塞进了名为 `userData` 的 BufferAttribute —— 着色器根本用不到，
 * 却每帧都占着显存。放在普通数组里就好。
 */
let fallSpeeds = null;
let swayAmounts = null;

export function createSnow() {
    const count = CONFIG.particles.snowCount;
    const positions = new Float32Array(count * 3);
    fallSpeeds = new Float32Array(count);
    swayAmounts = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = THREE.MathUtils.randFloatSpread(AREA.x);
        positions[i * 3 + 1] = THREE.MathUtils.randFloatSpread(AREA.y);
        positions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(AREA.z);

        fallSpeeds[i] = 6 + Math.random() * 12;   // 单位/秒
        swayAmounts[i] = 0.1 + Math.random() * 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.4,
        map: createSnowflakeTexture(),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    snowSystem = new THREE.Points(geometry, material);
    snowSystem.frustumCulled = false;
    scene.add(snowSystem);
}

export function updateSnow(dt) {
    if (!snowSystem) return;

    const positions = snowSystem.geometry.attributes.position.array;
    const t = clock.elapsedTime;

    for (let i = 0; i < CONFIG.particles.snowCount; i++) {
        // 乘 dt：原实现每帧固定位移，144Hz 屏幕上雪会下得比 60Hz 快一倍多
        positions[i * 3 + 1] -= fallSpeeds[i] * dt;
        positions[i * 3] += Math.sin(t * 2 + i) * swayAmounts[i] * dt;

        if (positions[i * 3 + 1] < RESET_BELOW) {
            positions[i * 3] = THREE.MathUtils.randFloatSpread(AREA.x);
            positions[i * 3 + 1] = RESET_TO;
            positions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(AREA.z);
        }
    }

    snowSystem.geometry.attributes.position.needsUpdate = true;
}

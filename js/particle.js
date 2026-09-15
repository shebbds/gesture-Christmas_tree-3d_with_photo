/**
 * 单个粒子的行为：在「树形」「散开」「聚焦」三种目标位置之间插值。
 */
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { camera, mainGroup, clock } from './scene.js';
import { damp } from './utils.js';

/**
 * 复用的临时对象。
 * 原来的实现每个粒子每帧都 `new THREE.Vector3(s,s,s)`，FOCUS 模式下还要再
 * `new THREE.Matrix4().invert()` —— 3500 个粒子 × 60fps 就是每秒二十多万个
 * 一次性对象，GC 压力全浪费在这上面了。
 */
const _tmpScale = new THREE.Vector3();
const _tmpTarget = new THREE.Vector3();
const _invMatrix = new THREE.Matrix4();

/** FOCUS 模式下被选中照片飞到的位置（世界坐标）。 */
const FOCUS_WORLD_POS = new THREE.Vector3(0, 2, 35);

export const particleSystem = [];

export class Particle {
    constructor(mesh, type, isDust = false) {
        this.mesh = mesh;
        this.type = type;
        this.isDust = isDust;

        this.posTree = new THREE.Vector3();
        this.posScatter = new THREE.Vector3();
        this.baseScale = mesh.scale.x;

        const speedMult = type === 'PHOTO' ? 0.3 : 2.0;
        this.spinSpeed = new THREE.Vector3(
            (Math.random() - 0.5) * speedMult,
            (Math.random() - 0.5) * speedMult,
            (Math.random() - 0.5) * speedMult
        );

        this.calculatePositions();
    }

    calculatePositions() {
        this.randomizeScatterPosition(this.isDust ? 12 : 8, this.isDust ? 20 : 12);

        if (this.type === 'PHOTO') {
            // 照片的树形位置由 photos.js 的 updatePhotoLayout() 统一排布
            this.posTree.set(0, 0, 0);
            return;
        }

        const h = CONFIG.particles.treeHeight;
        let t = Math.pow(Math.random(), 0.8);
        const y = t * h - h / 2;

        const rMax = Math.max(CONFIG.particles.treeRadius * (1.0 - t), 0.5);
        const angle = t * 50 * Math.PI + Math.random() * Math.PI;
        const r = rMax * (0.8 + Math.random() * 0.4);

        this.posTree.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    }

    /** 在一个球壳里均匀取点，作为散开时的位置。 */
    randomizeScatterPosition(minR, spread) {
        const r = minR + Math.random() * spread;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        this.posScatter.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
    }

    update(dt, mode, focusTargetMesh) {
        const isFocused = mode === 'FOCUS' && this.mesh === focusTargetMesh;

        let target;
        if (isFocused) {
            // 把世界坐标换算回 mainGroup 的局部坐标，这样树怎么转照片都停在镜头前
            _invMatrix.copy(mainGroup.matrixWorld).invert();
            target = _tmpTarget.copy(FOCUS_WORLD_POS).applyMatrix4(_invMatrix);
        } else if (mode === 'SCATTER' || mode === 'FOCUS') {
            target = this.posScatter;
        } else {
            target = this.posTree;
        }

        this.mesh.position.lerp(target, damp(isFocused ? 5.0 : 2.0, dt));

        if (mode === 'SCATTER') {
            this.mesh.rotation.x += this.spinSpeed.x * dt;
            this.mesh.rotation.y += this.spinSpeed.y * dt;
            this.mesh.rotation.z += this.spinSpeed.z * dt;
        } else if (mode === 'TREE') {
            if (this.type === 'PHOTO') {
                this.mesh.lookAt(0, this.mesh.position.y, 0);
                this.mesh.rotateY(Math.PI);
            } else {
                const k = damp(1.0, dt);
                this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0, k);
                this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, 0, k);
                this.mesh.rotation.y += 0.5 * dt;
            }
        }

        if (isFocused) this.mesh.lookAt(camera.position);

        this.mesh.scale.lerp(_tmpScale.setScalar(this.targetScale(mode, isFocused)), damp(4, dt));
    }

    targetScale(mode, isFocused) {
        if (this.isDust) {
            // 金尘只在散开时出现，聚成树时缩到 0 藏起来
            if (mode === 'TREE') return 0;
            return this.baseScale * (0.8 + 0.4 * Math.sin(clock.elapsedTime * 4 + this.mesh.id));
        }
        if (mode === 'SCATTER' && this.type === 'PHOTO') return this.baseScale * 2.5;
        if (mode === 'FOCUS') return isFocused ? 4.5 : this.baseScale * 0.8;
        return this.baseScale;
    }
}

/** 每帧更新全部粒子。 */
export function updateParticles(dt, mode, focusTarget) {
    for (const p of particleSystem) p.update(dt, mode, focusTarget);
}

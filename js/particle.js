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
const _tmpForward = new THREE.Vector3();
const _invMatrix = new THREE.Matrix4();

export const particleSystem = [];

/** 所有 InstancedMesh，每帧统一置一次 needsUpdate。 */
export const instancedMeshes = [];

export function registerInstancedMesh(mesh) {
    instancedMeshes.push(mesh);
    return mesh;
}

export class Particle {
    /**
     * @param {THREE.Object3D} mesh
     *   照片是真正在场景图里的 Group；装饰物和金尘则是**游离的 Object3D**
     *   —— 它不进场景图，只当一个持久的变换容器（位置 / 旋转 / 缩放），
     *   每帧把合成好的矩阵写进对应 InstancedMesh 的第 index 个实例。
     *   这样 3500 个粒子从 3500 次 draw call 压缩到 6 次。
     * @param {{mesh: THREE.InstancedMesh, index: number} | null} instanced
     */
    constructor(mesh, type, isDust = false, instanced = null) {
        this.mesh = mesh;
        this.type = type;
        this.isDust = isDust;
        this.instanced = instanced;

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

        // 花篮是横向舒展的椭圆花冠，而不是圣诞树的锥体。
        const isLeaf = this.type === 'LEAF';
        const isBerry = this.type === 'BERRY';
        const y = -4.4 + Math.pow(Math.random(), 0.82) * 11.2;
        const ny = (y - 0.6) / 6.4;
        const silhouette = Math.sqrt(Math.max(0.18, 1 - ny * ny));
        const edgeBoost = isLeaf ? 1.16 : 1;
        const radiusX = (2.1 + CONFIG.particles.treeRadius * 1.16 * silhouette) * edgeBoost;
        const angle = Math.random() * Math.PI * 2;
        const fill = Math.sqrt(Math.random());
        let x = Math.cos(angle) * radiusX * fill;
        const z = Math.sin(angle) * (3.2 + silhouette * 1.7) * fill - 0.4;

        // 给中央大寿桃留出清晰展示区；花材、心形和叶片向两侧环抱。
        const keepsCenter = this.type === 'PEACH' || this.type === 'SHOU';
        if (!keepsCenter && y > -0.8 && y < 6.8 && Math.abs(x) < 3.7) {
            const side = x === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(x);
            x = side * (3.7 + Math.random() * 1.5);
        }

        this.posTree.set(x, y, z);
        if (isBerry) {
            this.posTree.x *= 0.9;
            this.posTree.z += 0.8;
        }
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
            // 始终放在当前镜头正前方 6 个单位。不能写死世界坐标：相机距离调整后，
            // 写死的位置可能跑到镜头后面，表现为“捏合了但没有照片”。
            camera.getWorldDirection(_tmpForward);
            _tmpTarget.copy(camera.position).addScaledVector(_tmpForward, 6);
            _invMatrix.copy(mainGroup.matrixWorld).invert();
            target = _tmpTarget.applyMatrix4(_invMatrix);
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

        if (this.instanced) {
            this.mesh.updateMatrix();
            this.instanced.mesh.setMatrixAt(this.instanced.index, this.mesh.matrix);
        }
    }

    targetScale(mode, isFocused) {
        if (this.isDust) {
            // 金尘只在散开时出现，聚成树时缩到 0 藏起来
            if (mode === 'TREE') return 0;
            return this.baseScale * (0.8 + 0.4 * Math.sin(clock.elapsedTime * 4 + this.mesh.id));
        }
        if (mode === 'SCATTER' && this.type === 'PHOTO') return this.baseScale * 2.5;
        if (mode === 'FOCUS') return isFocused ? 6.6 : this.baseScale * 0.8;
        return this.baseScale;
    }
}

/** 每帧更新全部粒子，最后统一提交实例矩阵。 */
export function updateParticles(dt, mode, focusTarget) {
    for (const p of particleSystem) p.update(dt, mode, focusTarget);
    for (const m of instancedMeshes) m.instanceMatrix.needsUpdate = true;
}

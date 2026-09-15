/**
 * 照片：加载、做成金框拍立得、沿树身螺旋排布。
 */
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { mainGroup } from './scene.js';
import { Particle, particleSystem } from './particle.js';
import { createPlaceholderTexture } from './utils.js';

/**
 * 黄金角。照片沿螺旋排布时只按高度算角度会退化：
 * 当照片数正好是 loops 的倍数（例如 3 张 / 3 圈），每张相差整圈，
 * 结果所有照片叠在同一条竖线上。叠加黄金角可以保证任意数量都均匀散开。
 */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const photoMeshGroup = new THREE.Group();
const textureLoader = new THREE.TextureLoader();

// 框体几何/材质共享，每张照片只新建一个平面
const FRAME_GEO = new THREE.BoxGeometry(1.4, 1.4, 0.05);
const FRAME_MAT = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.champagneGold,
    metalness: 1.0,
    roughness: 0.1,
});

let layoutQueued = false;

export function initPhotos() {
    mainGroup.add(photoMeshGroup);
}

export function photoCount() {
    return photoMeshGroup.children.length;
}

/**
 * 启动时加载照片。
 *
 * 旧版本会盲扫 `./images/(1..200).jpg`，失败再试 `.png` —— 每次打开页面最多
 * 400 个 404，控制台和 Network 面板直接被刷满。现在改成读一个可选的
 * manifest.json：文件不存在就静默回退到示例图。
 */
export async function loadInitialPhotos() {
    const local = await readManifest();

    if (local.length) {
        await Promise.all(local.map((name) => loadPhoto(`./images/${name}`)));
    } else {
        await Promise.all(CONFIG.preload.fallbackImages.map((url) => loadPhoto(url)));
    }

    // 一张都没加载成功（离线、或者外链图床挂了）就用本地生成的占位图兜底
    if (photoCount() === 0) {
        console.info('[tree] 未加载到任何照片，已挂上占位图。把照片放进 ./images/ 并列进 manifest.json 即可替换。');
        for (let i = 0; i < CONFIG.photos.placeholderCount; i++) {
            addPhotoToScene(createPlaceholderTexture(i));
        }
    }
}

async function readManifest() {
    try {
        const res = await fetch(CONFIG.preload.manifest, { cache: 'no-cache' });
        if (!res.ok) return [];
        const list = await res.json();
        return Array.isArray(list) ? list.filter((n) => typeof n === 'string') : [];
    } catch {
        // 没有 manifest 是完全正常的情况，不值得打扰用户
        return [];
    }
}

/** 加载一张图；无论成功失败都 resolve，这样调用方可以等「全部尝试完毕」。 */
function loadPhoto(url) {
    return new Promise((resolve) => {
        textureLoader.load(
            url,
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                addPhotoToScene(texture);
                resolve(true);
            },
            undefined,
            () => {
                console.warn(`[tree] 照片加载失败：${url}`);
                resolve(false);
            }
        );
    });
}

export function addPhotoToScene(texture) {
    if (photoCount() >= CONFIG.photos.maxCount) {
        texture.dispose();
        return false;
    }

    // 按原图比例缩放，长边固定 1.2，避免照片被拉变形
    let width = 1.2;
    let height = 1.2;
    if (texture.image) {
        const aspect = texture.image.width / texture.image.height;
        if (aspect > 1) height = width / aspect;
        else width = height * aspect;
    }

    const frame = new THREE.Mesh(FRAME_GEO, FRAME_MAT);
    frame.scale.set(width / 1.2, height / 1.2, 1);

    const photo = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
    );
    photo.position.z = 0.04;

    const group = new THREE.Group();
    group.add(frame, photo);
    group.scale.setScalar(0.8);

    photoMeshGroup.add(group);
    particleSystem.push(new Particle(group, 'PHOTO'));

    queueLayout();
    return true;
}

/**
 * 沿树的锥面把照片排成螺旋。
 * 每加一张就重排一次是 O(n²)，所以合并到下一个微任务里只跑一次。
 */
function queueLayout() {
    if (layoutQueued) return;
    layoutQueued = true;
    queueMicrotask(() => {
        layoutQueued = false;
        updatePhotoLayout();
    });
}

export function updatePhotoLayout() {
    const photos = particleSystem.filter((p) => p.type === 'PHOTO');
    if (!photos.length) return;

    const fullH = CONFIG.particles.treeHeight;
    const h = fullH * 0.9;
    const stepY = h / photos.length;

    photos.forEach((p, i) => {
        const y = -h / 2 + stepY * i + stepY / 2;
        const normalizedH = (y + fullH / 2) / fullH;

        // 比树身半径再外扩 3，让照片浮在装饰物外面
        const r = Math.max(CONFIG.particles.treeRadius * (1.0 - normalizedH), 1.0) + 3.0;
        const angle = normalizedH * Math.PI * 2 * CONFIG.photos.loops + i * GOLDEN_ANGLE;

        p.posTree.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    });
}

export function handleImageUpload(event) {
    const files = Array.from(event.target.files || []).filter((f) => f.type.startsWith('image/'));

    // 必须在任何早退之前清空：否则用户选了一个筛完为空的文件夹（比如里面都是
    // 浏览器报不出 MIME 的 .heic），再选同一个文件夹时 change 事件根本不会触发，
    // 按钮看起来就像坏了。
    event.target.value = '';

    if (!files.length) return;

    const room = CONFIG.photos.maxCount - photoCount();
    if (room <= 0) {
        console.warn(`[tree] 已达到 ${CONFIG.photos.maxCount} 张上限，忽略本次选择`);
        return;
    }
    if (files.length > room) {
        console.warn(`[tree] 选中 ${files.length} 张，只加载前 ${room} 张（上限 ${CONFIG.photos.maxCount}）`);
    }

    files.slice(0, room).forEach((file) => {
        // 用 object URL 而不是 FileReader 的 base64：后者会把整张图以字符串
        // 形式多留一份在内存里，选文件夹时很容易把内存吃满。
        const url = URL.createObjectURL(file);
        textureLoader.load(
            url,
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                addPhotoToScene(texture);
                URL.revokeObjectURL(url);
            },
            undefined,
            () => {
                console.warn(`[tree] 无法读取 ${file.name}`);
                URL.revokeObjectURL(url);
            }
        );
    });
}

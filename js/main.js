/**
 * 入口：按顺序搭好场景，先跑起渲染循环，再去后台加载手势模型。
 */
import { CONFIG, STATE, applyQuality } from './config.js';
import { initScene, composer, controls, mainGroup, clock } from './scene.js';
import { createTree, createDust, updateStar } from './tree.js';
import { createSnow, updateSnow } from './snow.js';
import { initPhotos, loadInitialPhotos } from './photos.js';
import { updateParticles } from './particle.js';
import { initGestures } from './gestures.js';
import { initUI, hideLoader, setStatus } from './ui.js';
import { initDemo, isDemoMode, updateDemo } from './demo.js';
import { particleSystem } from './particle.js';
import { initMusic } from './music.js';

let gestureStarting = false;

function boot() {
    const tier = applyQuality();
    console.info(
        `[flower-basket] 画质档位：${tier}（装饰物 ${CONFIG.particles.count} / 金尘 ${CONFIG.particles.dustCount} / 雪花 ${CONFIG.particles.snowCount}）` +
        ' · 可用 ?quality=high|medium|low 强制指定'
    );

    // 要在 initUI 之前确定，否则首次引导会盖在演示画面上
    initDemo(pickRandomPhoto);

    initScene();
    createTree();
    createDust();
    createSnow();
    initPhotos();
    initUI();
    initMusic();

    // 关键：先让画面动起来再做别的。
    // 旧版本要 await 完 MediaPipe 才调 animate()，模型下载失败就是一片永久黑屏。
    animate();
    hideLoader();

    loadInitialPhotos();

    if (isDemoMode()) return;
    document.getElementById('camera-btn')?.addEventListener('click', startGestures);
    if (new URLSearchParams(location.search).get('camera') === 'off') {
        setStatus('摄像头未开启 · 点击按钮启用手势交互');
        return;
    }

    startGestures();
}

async function startGestures() {
    if (gestureStarting) return;
    gestureStarting = true;
    const button = document.getElementById('camera-btn');
    if (button) {
        button.disabled = true;
        button.textContent = '📷 正在开启…';
    }
    setStatus('正在请求摄像头权限…');
    const ok = await initGestures();
    gestureStarting = false;
    if (button) {
        button.disabled = ok;
        button.textContent = ok ? '📷 摄像头已开启' : '📷 重试摄像头';
    }
    if (!ok) {
        console.info('[flower-basket] 手势不可用，可点击摄像头按钮重试，鼠标与键盘仍可操作');
    }
}

/** 随机挑一张照片作为 FOCUS 目标。 */
function pickRandomPhoto() {
    const photos = particleSystem.filter((p) => p.type === 'PHOTO');
    return photos.length ? photos[Math.floor(Math.random() * photos.length)].mesh : null;
}

function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.1); // 切回标签页时 dt 会很大，钳一下防止粒子瞬移

    updateDemo(dt, pickRandomPhoto);
    updateRotation(dt);

    // 必须在 updateParticles 之前刷新：FOCUS 模式要把世界坐标换算回 mainGroup
    // 的局部坐标，而 matrixWorld 默认要等到 render() 才更新 —— 那样用的就是上一帧
    // 的朝向，被选中的照片在树旋转时会跟着飘而不是钉在镜头前。
    mainGroup.updateMatrixWorld(true);

    updateParticles(dt, STATE.mode, STATE.focusTarget);
    updateSnow(dt);
    updateStar();

    controls.update();
    composer.render();
}

/** 手势散开时由手的位置驱动旋转，否则缓慢自转。 */
function updateRotation(dt) {
    if (STATE.mode === 'SCATTER' && STATE.hand.detected) {
        const targetY = STATE.hand.x * Math.PI * 0.9;
        const targetX = STATE.hand.y * Math.PI * 0.25;
        STATE.rotation.y += (targetY - STATE.rotation.y) * 3.0 * dt;
        STATE.rotation.x += (targetX - STATE.rotation.x) * 3.0 * dt;
    } else if (!STATE.userControllingCamera) {
        if (STATE.mode === 'TREE') {
            // 花篮只做很轻的左右摆动，避免中央寿桃随整篮持续自转后跑到侧后方。
            // 花朵本身的旋转、呼吸和散开动画仍由粒子系统负责。
            const targetY = Math.sin(clock.elapsedTime * 0.22) * 0.09;
            STATE.rotation.y += (targetY - STATE.rotation.y) * 1.5 * dt;
            STATE.rotation.x += (0 - STATE.rotation.x) * 2.0 * dt;
        } else {
            STATE.rotation.y += 0.08 * dt;
        }
    }

    mainGroup.rotation.y = STATE.rotation.y;
    mainGroup.rotation.x = STATE.rotation.x;
}

boot();

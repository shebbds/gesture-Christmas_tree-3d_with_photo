/**
 * MediaPipe 手势识别。
 *
 * 设计前提：这一整块都是「锦上添花」。没有摄像头、用户拒绝授权、CDN 连不上，
 * 都只会让手势失效，绝不能影响 3D 场景的渲染 —— 旧版本把 `await initMediaPipe()`
 * 放在 init() 里且没有兜底，模型下载一失败就永远停在 loading 界面。
 */
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { CONFIG, STATE } from './config.js';
import { particleSystem } from './particle.js';
import { setStatus, setDebug } from './ui.js';

const WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm';
const MODEL_PATH =
    'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const MODE_LABEL = {
    TREE: '握拳 · 聚成树',
    SCATTER: '张开 · 星云',
    FOCUS: '捏合 · 看照片',
};

let handLandmarker = null;
let video = null;
let lastVideoTime = -1;

/** @returns {Promise<boolean>} 手势是否成功启用 */
export async function initGestures() {
    video = document.getElementById('webcam');

    try {
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numHands: 1,
        });
    } catch (err) {
        console.warn('[tree] 手势模型加载失败，仅鼠标模式可用', err);
        disableWebcamUI('手势模型加载失败 · 鼠标仍可操作');
        return false;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        disableWebcamUI('此浏览器不支持摄像头 · 鼠标仍可操作');
        return false;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
        });
        video.srcObject = stream;
        video.addEventListener('loadeddata', predictWebcam, { once: true });
        setStatus('摄像头已开启，伸手试试');
        return true;
    } catch (err) {
        console.warn('[tree] 摄像头不可用', err);
        disableWebcamUI('摄像头不可用 · 鼠标仍可操作');
        return false;
    }
}

function disableWebcamUI(message) {
    const wrapper = document.getElementById('webcam-wrapper');
    if (wrapper) wrapper.style.display = 'none';
    setStatus(message);
}

function predictWebcam() {
    if (handLandmarker && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        processGestures(handLandmarker.detectForVideo(video, performance.now()));
    }
    requestAnimationFrame(predictWebcam);
}

/**
 * 用「相对比例」而非绝对像素距离判定手势，
 * 这样手离摄像头远近不同也能稳定识别。
 */
function processGestures(result) {
    if (!result.landmarks?.length) {
        STATE.hand.detected = false;
        setStatus('未检测到手');
        setDebug('—');
        return;
    }

    STATE.hand.detected = true;
    const lm = result.landmarks[0];
    const wrist = lm[0];
    const middleMCP = lm[9];   // 中指指根

    STATE.hand.x = (middleMCP.x - 0.5) * 2;
    STATE.hand.y = (middleMCP.y - 0.5) * 2;

    // 以「手腕→中指指根」为基准长度，抵消远近带来的尺度差异
    const handSize = Math.hypot(middleMCP.x - wrist.x, middleMCP.y - wrist.y);
    if (handSize < CONFIG.gestures.minHandSize) return;

    const tips = [lm[8], lm[12], lm[16], lm[20]];
    const avgTipDist =
        tips.reduce((sum, t) => sum + Math.hypot(t.x - wrist.x, t.y - wrist.y), 0) / tips.length;

    const extensionRatio = avgTipDist / handSize;
    const pinchRatio = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y) / handSize;

    setDebug(
        `size ${handSize.toFixed(3)} · ext ${extensionRatio.toFixed(2)} · pinch ${pinchRatio.toFixed(2)}`
    );

    const g = CONFIG.gestures;

    // 先判握拳：否则大拇指贴近食指时会被误判成「捏合」
    if (extensionRatio < g.fistExtensionRatio) {
        STATE.mode = 'TREE';
        STATE.focusTarget = null;
    } else if (pinchRatio < g.pinchRatio) {
        if (STATE.mode !== 'FOCUS') {
            STATE.mode = 'FOCUS';
            const photos = particleSystem.filter((p) => p.type === 'PHOTO');
            STATE.focusTarget = photos.length
                ? photos[Math.floor(Math.random() * photos.length)].mesh
                : null;
        }
    } else if (extensionRatio > g.openExtensionRatio) {
        STATE.mode = 'SCATTER';
        STATE.focusTarget = null;
    }

    setStatus(MODE_LABEL[STATE.mode] ?? STATE.mode);
}

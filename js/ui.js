/**
 * 界面：加载遮罩、上传按钮、快捷键、状态条。
 */
import { STATE } from './config.js';
import { handleImageUpload } from './photos.js';

let statusEl = null;
let debugEl = null;

export function initUI() {
    statusEl = document.getElementById('status-info');
    debugEl = document.getElementById('debug-info');

    document.getElementById('file-input').addEventListener('change', handleImageUpload);
    document.getElementById('folder-input').addEventListener('change', handleImageUpload);

    window.addEventListener('keydown', onKeyDown);
}

function onKeyDown(e) {
    // 在输入框里打字时不触发快捷键
    if (e.target instanceof HTMLInputElement) return;

    switch (e.key.toLowerCase()) {
        case 'h':
            // 隐藏全部 UI，方便截图 / 录屏当壁纸
            document.body.classList.toggle('ui-hidden-all');
            break;
        case 'd':
            // 手势调试数值默认藏起来，需要调阈值时按 D 打开
            document.body.classList.toggle('debug-visible');
            break;
        case 't':
            STATE.mode = 'TREE';
            STATE.focusTarget = null;
            break;
        case 's':
            STATE.mode = 'SCATTER';
            STATE.focusTarget = null;
            break;
    }
}

/** 面向用户的一行提示。 */
export function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
}

/** 手势原始数值，只有按过 D 才可见。 */
export function setDebug(text) {
    if (debugEl) debugEl.textContent = text;
}

export function hideLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 800);
}

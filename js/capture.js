/**
 * 把当前画面导出成一张可以直接发出去的图片。
 *
 * 用户把自己的照片挂上树之后，最自然的下一步就是截图分享 —— 与其让他们
 * 用系统截图拍到一堆按钮，不如直接给一张干净的、带标题的成品图。
 */
import { composer, renderer } from './scene.js';

const TITLE = '寿桃献瑞 · 福寿安康';
const WATERMARK = '岁岁常欢愉 · 年年皆胜意';

/**
 * @returns {Promise<boolean>} 是否成功触发保存
 */
export async function saveImage() {
    const gl = renderer.domElement;

    // WebGL 默认会在合成后清空绘制缓冲，所以必须在同一个任务里先重绘再取像素
    composer.render();

    const canvas = document.createElement('canvas');
    canvas.width = gl.width;
    canvas.height = gl.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(gl, 0, 0);
    drawTitle(ctx, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return false;

    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = `birthday-flower-basket-${stamp}.png`;

    // 不能用 `'download' in link` 做特性检测 —— 这个属性在所有浏览器上都存在，
    // 包括那些会直接忽略它的 iOS Safari，所以分支永远走不到 else。
    // 只能认平台：iOS 上直接开新标签，让用户长按保存。
    const opened = isIOS() ? window.open(url, '_blank') : clickDownload(url, filename);

    // 给浏览器一点时间读完 blob 再释放
    setTimeout(() => URL.revokeObjectURL(url), 10000);

    // 弹窗被拦截时如实返回 false，不然界面会显示「已保存」但其实什么也没发生
    return Boolean(opened);
}

function clickDownload(url, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    return true;
}

function isIOS() {
    // iPadOS 13 起 userAgent 伪装成 Mac，得靠触摸点数量再确认一次
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function drawTitle(ctx, width, height) {
    const scale = width / 1600;

    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(252, 238, 167, 0.5)';
    ctx.shadowBlur = 40 * scale;

    const size = Math.round(52 * scale);
    ctx.font = `700 ${size}px "Songti SC", "STSong", serif`;
    ctx.letterSpacing = `${Math.round(6 * scale)}px`;

    const gradient = ctx.createLinearGradient(0, 60 * scale, 0, 60 * scale + size);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#eebb66');
    ctx.fillStyle = gradient;
    ctx.fillText(TITLE, width / 2, (60 + 52) * scale);

    ctx.shadowBlur = 0;
    ctx.letterSpacing = '0px';
    ctx.font = `400 ${Math.round(14 * scale)}px ui-monospace, Menlo, monospace`;
    ctx.fillStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.textAlign = 'right';
    ctx.fillText(WATERMARK, width - 28 * scale, height - 24 * scale);
}

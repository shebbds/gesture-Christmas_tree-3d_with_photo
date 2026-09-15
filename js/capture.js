/**
 * 把当前画面导出成一张可以直接发出去的图片。
 *
 * 用户把自己的照片挂上树之后，最自然的下一步就是截图分享 —— 与其让他们
 * 用系统截图拍到一堆按钮，不如直接给一张干净的、带标题的成品图。
 */
import { composer, renderer } from './scene.js';

const TITLE = 'Merry Christmas';
const WATERMARK = 'github.com/Timo8848/gesture-Christmas_tree-3d_with_photo';

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
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    link.download = `christmas-tree-${stamp}.png`;
    link.href = url;

    if ('download' in link) {
        link.click();
    } else {
        // iOS Safari 不支持 download 属性，退而求其次在新标签里打开让用户长按保存
        window.open(url, '_blank');
    }

    // 给浏览器一点时间读完 blob 再释放
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
}

function drawTitle(ctx, width, height) {
    const scale = width / 1600;

    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(252, 238, 167, 0.5)';
    ctx.shadowBlur = 40 * scale;

    const size = Math.round(52 * scale);
    ctx.font = `400 ${size}px Cinzel, "Times New Roman", serif`;
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

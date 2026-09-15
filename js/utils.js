import * as THREE from 'three';

/**
 * 帧率无关的阻尼系数。
 *
 * 原来到处写的 `lerp(a, b, k * dt)` 在高刷屏上会明显更快/更慢，
 * 用 1 - e^(-k·dt) 才能保证 60Hz 和 144Hz 下的手感一致。
 */
export function damp(k, dt) {
    return 1 - Math.exp(-k * dt);
}

/** 生成拐杖糖的红白斜条纹贴图。 */
export function createCaneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#880000';
    ctx.beginPath();
    for (let i = -128; i < 256; i += 32) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 32, 128);
        ctx.lineTo(i + 16, 128);
        ctx.lineTo(i - 16, 0);
    }
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
}

/** 生成一个软边圆点，用作雪花贴图。 */
export function createSnowflakeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    return new THREE.CanvasTexture(canvas);
}

/**
 * 生成一张占位「照片」。
 *
 * 当本地没有照片、外链示例图又加载不出来（网络不通，或者图床链接过期）时兜底，
 * 保证这棵树上永远挂得住东西 —— 项目 clone 下来离线也能完整看到效果。
 */
export function createPlaceholderTexture(index) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const hue = (index * 47) % 360;
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, `hsl(${hue}, 45%, 24%)`);
    gradient.addColorStop(1, `hsl(${(hue + 40) % 360}, 50%, 12%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // 一颗简单的六角雪花
    ctx.strokeStyle = 'rgba(255, 228, 160, 0.75)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.translate(size / 2, size / 2);
    for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -70);
        ctx.moveTo(0, -45);
        ctx.lineTo(-20, -62);
        ctx.moveTo(0, -45);
        ctx.lineTo(20, -62);
        ctx.stroke();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle = 'rgba(255, 228, 160, 0.85)';
    ctx.font = '500 20px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOUR PHOTO HERE', size / 2, size - 28);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

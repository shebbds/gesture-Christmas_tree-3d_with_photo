/**
 * 全局配置与运行时状态。
 * 想调效果基本只改这一个文件就够了。
 */

export const CONFIG = {
    colors: {
        bg: 0x050d1a,            // 深邃午夜蓝
        fog: 0x050d1a,
        champagneGold: 0xffd966,
        deepGreen: 0x03180a,
        accentRed: 0x990000,
    },

    /**
     * 粒子数量按设备能力分档。
     * 全部装饰物 + 金尘都走 InstancedMesh，所以数量再大也只有个位数 draw call，
     * 真正的瓶颈是每帧要在 JS 里合成多少个矩阵 —— 手机上降档就是降这个。
     */
    quality: {
        high:   { count: 1500, dustCount: 2000, snowCount: 1000, pixelRatio: 2 },
        medium: { count: 1000, dustCount: 1200, snowCount: 600,  pixelRatio: 1.5 },
        low:    { count: 700,  dustCount: 700,  snowCount: 400,  pixelRatio: 1 },
    },

    particles: {
        // count / dustCount / snowCount 由 applyQuality() 在启动时按设备填入
        treeHeight: 24,
        treeRadius: 8,
    },

    render: {
        // pixelRatio 同样由 applyQuality() 填入
    },

    camera: {
        z: 50,
        minDistance: 15,
        maxDistance: 120,
    },

    photos: {
        maxCount: 120,           // 上限，防止选中一个上千张的文件夹后显存爆掉
        loops: 3,                // 照片沿树身螺旋绕几圈
        placeholderCount: 5,     // 一张照片都加载不到时挂几张占位图
    },

    preload: {
        /**
         * 把照片放进 ./images/，再建一个 images/manifest.json 列出文件名即可自动加载。
         * 参考 images/manifest.example.json。没有这个文件就静默跳过 —— 不会产生 404 刷屏。
         */
        manifest: './images/manifest.json',

        // 没有任何本地照片时的兜底示例图（来自 Unsplash）
        fallbackImages: [
            'https://images.unsplash.com/photo-1543589077-47d81606c1bf?q=80&w=600',
            'https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?q=80&w=600',
            'https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=600',
        ],
    },

    gestures: {
        fistExtensionRatio: 1.5,   // 低于此值判定为握拳
        openExtensionRatio: 1.7,   // 高于此值判定为张开
        pinchRatio: 0.35,          // 低于此值判定为捏合
        minHandSize: 0.02,         // 手太小（太远）时忽略，避免抖动
    },
};

/** 运行时状态，模块之间共享读写。 */
export const STATE = {
    mode: 'TREE',                  // TREE | SCATTER | FOCUS
    focusTarget: null,
    hand: { detected: false, x: 0, y: 0 },
    rotation: { x: 0, y: 0 },
    userControllingCamera: false,  // 鼠标拖拽期间暂停自转
};

/**
 * 按设备能力挑一档画质，并把结果写回 CONFIG.particles。
 *
 * 判断依据有意保守：手机上跑满 1500 个装饰物 + 2000 粒金尘 + Bloom 会直接掉到
 * 十几帧，宁可少一点也要保证顺滑 —— 卡顿比粒子少更劝退。
 * 想强制某一档可以加 URL 参数：?quality=high|medium|low
 */
export function applyQuality() {
    const forced = new URLSearchParams(location.search).get('quality');
    // 必须用 hasOwnProperty：CONFIG.quality 是普通对象字面量，?quality=toString
    // 之类会顺着原型链取到函数，通过真值判断后解构出一堆 undefined，
    // 最终 setPixelRatio(NaN) 把画布尺寸变成 0，用户看到的是一片空白。
    const valid = forced !== null && Object.prototype.hasOwnProperty.call(CONFIG.quality, forced);
    const tier = valid ? forced : detectTier();

    const { count, dustCount, snowCount, pixelRatio } = CONFIG.quality[tier];
    Object.assign(CONFIG.particles, { count, dustCount, snowCount });
    Object.assign(CONFIG.render, { pixelRatio });
    CONFIG.activeQuality = tier;

    return tier;
}

function detectTier() {
    // 粗略指针 = 触摸屏，基本等同于手机 / 平板
    const isTouch = window.matchMedia?.('(pointer: coarse)').matches;
    const cores = navigator.hardwareConcurrency || 4;
    const narrow = Math.min(window.innerWidth, window.innerHeight) < 500;

    if (isTouch && (narrow || cores <= 4)) return 'low';
    if (isTouch || cores <= 4) return 'medium';
    return 'high';
}

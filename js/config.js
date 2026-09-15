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

    particles: {
        count: 1500,             // 树身装饰物
        dustCount: 2000,         // 悬浮金尘
        snowCount: 1000,         // 雪花
        treeHeight: 24,
        treeRadius: 8,
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

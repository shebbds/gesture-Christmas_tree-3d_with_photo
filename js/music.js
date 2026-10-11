/**
 * 用户提供的《喜洋洋》音频。浏览器和微信会阻止未经交互的有声自动播放，
 * 所以页面先尝试播放；若被拦截，就在用户第一次点击/触摸/按键时立即解锁。
 */
const AUDIO_URL = './assets/audio/xiyangyang.mp3';

let audio;
let wanted = true;

export function initMusic() {
    const button = document.getElementById('music-btn');
    button?.addEventListener('click', toggleMusic);

    audio = new Audio(AUDIO_URL);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.38;
    audio.playsInline = true;

    audio.addEventListener('play', updateButton);
    audio.addEventListener('pause', updateButton);
    audio.addEventListener('error', () => {
        wanted = false;
        console.warn('[flower-basket] 《喜洋洋》音频加载失败');
        updateButton();
    });

    tryPlay();

    const unlock = (event) => {
        if (event.target?.closest?.('#music-btn')) return;
        if (wanted && audio?.paused) tryPlay();
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    updateButton();
}

async function tryPlay() {
    if (!audio || !wanted) return;
    try {
        await audio.play();
    } catch {
        // 自动播放被拦截是移动浏览器的正常策略，首次用户交互会再次尝试。
    }
    updateButton();
}

async function toggleMusic(event) {
    event.stopPropagation();
    if (!audio) return;

    if (wanted && audio.paused) {
        await tryPlay();
        return;
    }

    wanted = !wanted;
    if (wanted) await tryPlay();
    else audio.pause();
    updateButton();
}

function updateButton() {
    const button = document.getElementById('music-btn');
    if (!button) return;
    const playing = wanted && audio && !audio.paused;
    button.textContent = playing ? '♫ 喜洋洋：开' : wanted ? '♫ 播放喜洋洋' : '♫ 喜洋洋：关';
    button.setAttribute('aria-pressed', String(wanted));
    button.classList.toggle('music-paused', !playing);
}

window.addEventListener('pagehide', () => audio?.pause(), { once: true });

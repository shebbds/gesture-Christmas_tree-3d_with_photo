/**
 * Three.js 场景搭建：渲染器、相机、灯光、环境贴图、Bloom 后期、鼠标轨道控制。
 *
 * 这里导出的 scene / camera / mainGroup 等是 ES Module 的 live binding，
 * 其他模块 import 后拿到的始终是 initScene() 赋值之后的实例。
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { CONFIG, STATE } from './config.js';

export let scene;
export let camera;
export let renderer;
export let composer;
export let controls;
/** 整棵树（装饰物 + 金尘 + 照片）都挂在这个 group 上，方便整体旋转。 */
export let mainGroup;

export const clock = new THREE.Clock();

export function initScene() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.colors.bg);
    scene.fog = new THREE.FogExp2(CONFIG.colors.fog, 0.015);

    camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, CONFIG.camera.z);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2.2;
    container.appendChild(renderer.domElement);

    mainGroup = new THREE.Group();
    scene.add(mainGroup);

    setupEnvironment();
    setupLights();
    setupControls();
    setupPostProcessing();

    window.addEventListener('resize', onResize);
}

function setupEnvironment() {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
}

function setupLights() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const innerLight = new THREE.PointLight(0xffaa00, 2, 20);
    innerLight.position.set(0, 5, 0);
    mainGroup.add(innerLight);

    const spotGold = new THREE.SpotLight(0xffcc66, 1200);
    spotGold.position.set(30, 40, 40);
    spotGold.angle = 0.5;
    spotGold.penumbra = 0.5;
    scene.add(spotGold);

    // 蓝色背光，营造月光感
    const spotBlue = new THREE.SpotLight(0x6688ff, 800);
    spotBlue.position.set(-30, 20, -30);
    scene.add(spotBlue);

    const fill = new THREE.DirectionalLight(0xffeebb, 0.8);
    fill.position.set(0, 0, 50);
    scene.add(fill);
}

/**
 * 鼠标 / 触摸控制。
 * 之前的版本 import 了 OrbitControls 却从未实例化，所以没有摄像头时整个项目是不能交互的。
 */
function setupControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = CONFIG.camera.minDistance;
    controls.maxDistance = CONFIG.camera.maxDistance;
    controls.target.set(0, 2, 0);

    // 用户拖拽时暂停树的自转，松手后恢复，避免两种旋转叠加导致晕眩。
    controls.addEventListener('start', () => { STATE.userControllingCamera = true; });
    controls.addEventListener('end', () => { STATE.userControllingCamera = false; });

    controls.update();
}

function setupPostProcessing() {
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, 0.4, 0.85
    );
    bloomPass.threshold = 0.65;
    bloomPass.strength = 0.5;
    bloomPass.radius = 0.4;

    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bloomPass);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

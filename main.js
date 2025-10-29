// main.js  — three.js ESM 版（esm.sh）
import * as THREE from 'https://esm.sh/three@0.160.0';
import { GLTFLoader }   from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// DOM
const hero   = document.getElementById('hero');
const canvas = document.getElementById('hero-canvas');
const hint   = document.getElementById('drag-hint');

// GLBパス（HTMLの data-glb 優先）
const glbRaw = hero?.dataset.glb || './assets/antenna_car_model_v1.glb';
const glbURL = new URL(glbRaw, window.location.href).href;

// three.js 基本
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearAlpha(0); // 背景はセクション色を見せる
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35; // 1.2〜1.6 あたりで微調整可

// カメラ
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 1.2, 6);
scene.add(camera);

// ライト（明るめ設定）
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const hemi = new THREE.HemisphereLight(0xffffff, 0x6677aa, 0.6);
hemi.position.set(0, 1, 0);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set( 3, 5,  4); scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 0.7); rim.position.set(-4, 3, -3); scene.add(rim);

// 操作
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 10;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;

// ヒント・Canvas の重なり順を明示
if (canvas) canvas.style.zIndex = '10';
if (hint)   hint.style.zIndex   = '30';

// 画面サイズにフィット
function resize() {
  const rect = hero.getBoundingClientRect();
  const w = Math.max(1, rect.width);
  const h = Math.max(1, rect.height);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
requestAnimationFrame(resize);

// モデルにカメラを合わせる（小さい問題を解消）
function fitCameraToObject(obj, offset = 1.35) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  controls.target.copy(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = (maxDim / (2 * Math.tan(fov / 2))) * offset;

  camera.position.set(center.x + cameraZ * 0.15, center.y + cameraZ * 0.25, center.z + cameraZ);
  camera.near = cameraZ / 50;
  camera.far  = cameraZ * 50;
  camera.updateProjectionMatrix();
}

// GLB 読み込み
const loader = new GLTFLoader();
loader.load(
  glbURL,
  (gltf) => {
    const model = gltf.scene;

    // マテリアルが暗い場合の軽い補正
    model.traverse((o) => {
      if (o.isMesh && o.material && 'metalness' in o.material) {
        o.material.metalness = Math.min(0.6, o.material.metalness ?? 0.6);
        o.material.roughness = o.material.roughness ?? 0.6;
      }
    });

    scene.add(model);
    fitCameraToObject(model, 1.4); // 距離感のツマミ

    console.log('GLB loaded', glbURL);
  },
  (e) => console.log('loading...', (e.loaded||0)+'/'+(e.total||'?')),
  (err) => console.error('GLB load error:', err)
);

// 初回操作でヒントをフェードアウト
let hinted = false;
['pointerdown','touchstart','wheel','keydown'].forEach(ev=>{
  addEventListener(ev, () => {
    if (!hinted) {
      hinted = true;
      controls.autoRotate = false;
      hint?.classList.add('opacity-0','transition','duration-700');
    }
  }, { passive: true });
});

// ループ
const clock = new THREE.Clock();
(function tick(){
  controls.update(clock.getDelta());
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
})();
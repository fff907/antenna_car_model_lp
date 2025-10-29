// main.js (ESM)
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// DOM 取得
const hero      = document.getElementById('hero');
const canvas    = document.getElementById('hero-canvas');
const dragHint  = document.getElementById('drag-hint');
// ★ HTMLの data-glb からパスを読む（未指定ならデフォルト）
const glbPath   = hero?.dataset.glb || './assets/antenna_car_model_v1.glb';

// three.js 基本セットアップ
const scene    = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 1.2, 6);
scene.add(camera);

// ライティング
scene.add(new THREE.AmbientLight(0xffffff, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 1.0);
key.position.set(3, 5, 4);
scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 0.6);
rim.position.set(-4, 3, -3);
scene.add(rim);

// 操作（ドラッグ回転）
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.zoomSpeed = 0.6;
controls.minDistance = 4;
controls.maxDistance = 10;

// GLB 読み込み
const loader = new GLTFLoader();
let model = null;

loader.load(
  glbPath,
  (gltf) => {
    model = gltf.scene;
    scene.add(model);

    model.position.set(0, -0.6, 0);
    model.scale.set(1.2, 1.2, 1.2);

    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
  },
  undefined,
  (err) => console.error('GLB load error:', err)
);

// リサイズ対応
function resize() {
  const rect = canvas.getBoundingClientRect();
  const width  = rect.width  || canvas.clientWidth  || hero.clientWidth;
  const height = rect.height || canvas.clientHeight || hero.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
requestAnimationFrame(resize);

// 操作開始でヒントをフェードアウト
let hinted = false;
['pointerdown','touchstart','wheel','keydown'].forEach(ev=>{
  window.addEventListener(ev, () => {
    if (!hinted) {
      hinted = true;
      controls.autoRotate = false;
      dragHint?.classList.add('opacity-0','transition','duration-700');
    }
  }, { passive: true });
});

// レンダーループ
const clock = new THREE.Clock();
(function tick(){
  controls.update(clock.getDelta());
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
})();

// （将来用）ホットスポット座標サンプル
const hotspot1 = new THREE.Vector3( 0.2,  0.8, 0.0);
const hotspot2 = new THREE.Vector3(-0.8,  0.2, 0.3);
// 画面投影→DOM配置は必要になったら実装
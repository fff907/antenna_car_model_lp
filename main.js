// main.js (ESM)
import * as THREE from 'https://esm.sh/three@0.160.0';
import { GLTFLoader }   from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const hero   = document.getElementById('hero');
const canvas = document.getElementById('hero-canvas');
const hint   = document.getElementById('drag-hint');

// 設定
const MODEL_SCALE = 1.1;           // モデル全体の拡大率
const FIT_OFFSET  = 1.12;           // カメラの余白係数（小さいほど寄る）
const TARGET_YRATIO = 0.52;         // 視点の高さ（モデル高さに対する比）
const AUTOROTATE_SPEED = 0.8;       // 自動回転速度
const IDLE_MS_TO_RESUME = 2500;     // 何ms操作が無ければ自動回転を再開するか
let MODEL_LIFT = 0.5;               // モデルを持ち上げる量

const glbRaw = hero?.dataset.glb || './assets/antenna_car_model_v1.glb';
const glbURL = new URL(glbRaw, window.location.href).href;
const initialYawDeg = Number(hero?.dataset.yaw ?? -35); // デフォルト角度

// three.js基本
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearAlpha(0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.20; // 少しだけ明るく

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
scene.add(camera);

// ライト
scene.add(new THREE.AmbientLight(0xffffff, 1.0)); // 1.4 → 1.0 にして指向性で立体感
const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, 0.6);
scene.add(hemi); // 実際にシーンへ追加

const key = new THREE.DirectionalLight(0xffffff, 1.6); // 1.35 → 1.6
key.position.set(3, 5, 4);
scene.add(key);

const rim = new THREE.DirectionalLight(0xffffff, 1.1); // 0.9 → 1.1
rim.position.set(-4, 3, -3);
scene.add(rim);

// コントロール
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 3.0;
controls.maxDistance = 12.0;
controls.minPolarAngle = Math.PI * 0.30;
controls.maxPolarAngle = Math.PI * 0.70;
controls.autoRotate = true;
controls.autoRotateSpeed = AUTOROTATE_SPEED;
controls.enableZoom = false; // 通常はズーム無効（ページスクロール優先）

// GLB読み込み
const loader = new GLTFLoader();
let model;

loader.load(
  glbURL,
  (gltf) => {
    model = gltf.scene;

    // 1) センタリング
    const box = new THREE.Box3().setFromObject(model);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.position.y += size.y * MODEL_LIFT;

    // 2) モデル拡大
    model.scale.setScalar(MODEL_SCALE);

    // 3) 初期回転角度
    if (!Number.isNaN(initialYawDeg) && initialYawDeg !== 0) {
      model.rotation.y = THREE.MathUtils.degToRad(initialYawDeg);
    }
    scene.add(model);

    // 4) カメラを合わせる
    fitCameraToObject(size.clone().multiplyScalar(MODEL_SCALE));

    // 5) 自動回転ON（手を離すとまた回る）
    controls.autoRotate = true;
    controls.autoRotateSpeed = AUTOROTATE_SPEED;

    console.log('GLB loaded:', glbURL);
  },
  (e) => console.log('loading...', (e.loaded||0)+'/'+(e.total||'?')),
  (err) => console.error('GLB load error:', err)
);

// モデルサイズに合わせてカメラ距離を算出して正面に配置
function fitCameraToObject(size) {
  const maxSize = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);

  const distance = (maxSize / 2) / Math.tan(fov / 2) * FIT_OFFSET;

  const targetY = size.y * TARGET_YRATIO;
  controls.target.set(0, targetY, 0);

  camera.position.set(0, targetY, distance);
  camera.lookAt(controls.target);
  controls.update();
}

// リサイズ
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

// 操作
let hinted = false;
let idleTimer = null;
let hoverTimer = null;  // ホバータイマー
let zoomEnableTimer = null; // 一時的ズーム許可のタイマー

function showAndPause() {
  controls.autoRotate = false;
  if (!hinted) {
    hinted = true;
    hint?.classList.add('opacity-0','transition','duration-700');
  }
  clearTimeout(idleTimer);
  clearTimeout(hoverTimer); // ホバータイマークリア
}

function resumeLater() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    controls.autoRotate = true;   // 一定時間操作が無ければ再開
  }, IDLE_MS_TO_RESUME);
}

// キャンバス内ホバー判定でヒント表示を管理
canvas.addEventListener('mouseenter', () => {
  // ホバー開始で常に消える（統一）
  hint?.classList.add('opacity-0','transition','duration-700');
});
canvas.addEventListener('mouseleave', () => {
  // キャンバス外へ出たら再表示（次のユーザーにも親切）
  hint?.classList.remove('opacity-0');
});

// 1) ドラッグ開始で一時停止
controls.addEventListener('start', () => {
  showAndPause();
});

// 2) ドラッグ終了でスケジュール再開
controls.addEventListener('end', () => {
  resumeLater();
});

// 3) ホイールでズームしたときも一時停止 → 少し待って再開
canvas.addEventListener('wheel', (event) => {
  // Ctrl/Alt 押下時のみズーム扱い（それ以外はページスクロール）
  const wantZoom = event.ctrlKey || event.altKey;
  controls.enableZoom = wantZoom;

  if (wantZoom) {
    event.preventDefault(); // ズーム中はページスクロールを止める
    showAndPause();
    resumeLater();
    clearTimeout(zoomEnableTimer);
    zoomEnableTimer = setTimeout(() => { controls.enableZoom = false; }, 600);
  }
}, { passive: false });

// タブ復帰時のバグ対策
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    clock.getDelta();
  }
});

// ループ
const clock = new THREE.Clock();
(function tick(){
  const dt = Math.min(clock.getDelta(), 0.033);
  controls.update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
})();
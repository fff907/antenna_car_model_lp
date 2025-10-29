import * as THREE from 'https://esm.sh/three@0.160.0';
import { GLTFLoader }   from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const hero   = document.getElementById('hero');
const canvas = document.getElementById('hero-canvas');
const hint   = document.getElementById('drag-hint');

// GLB
const glbRaw = hero?.dataset.glb || './assets/antenna_car_model_v1.glb';
const glbURL = new URL(glbRaw, window.location.href).href;

// three.js
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearAlpha(0); // 背景を透過（セクションの色を見せる）

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 1.2, 6);
scene.add(camera);

// ライト
scene.add(new THREE.AmbientLight(0xffffff, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(3,5,4); scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 0.6); rim.position.set(-4,3,-3); scene.add(rim);

// 操作
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 10;

// GLB読込
const loader = new GLTFLoader();
loader.load(
  glbURL,
  (gltf) => {
    const model = gltf.scene;
    model.position.set(0, -0.6, 0);
    model.scale.set(1.2, 1.2, 1.2);
    scene.add(model);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    console.log('GLB loaded', glbURL);
  },
  (e) => console.log('loading...', (e.loaded||0)+'/'+(e.total||'?')),
  (err) => console.error('GLB load error:', err)
);

// リサイズ（計測が0にならないようにrect優先）
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

// ヒントは初回操作でフェードアウト
let hinted = false;
['pointerdown','touchstart','wheel','keydown'].forEach(ev=>{
  addEventListener(ev, () => {
    if (!hinted) {
      hinted = true;
      controls.autoRotate = false;
      hint?.classList.add('opacity-0');
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
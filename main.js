// main.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// DOM
const hero   = document.getElementById('hero');
const canvas = document.getElementById('hero-canvas');

// GLBパス（絶対URL化して404や相対ずれを防止）
const glbRaw = hero?.dataset.glb || './assets/antenna_car_model_v1.glb';
const glbURL = new URL(glbRaw, window.location.href).href;

// three.js
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 1.2, 6);
scene.add(camera);

// light
scene.add(new THREE.AmbientLight(0xffffff, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(3,5,4); scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 0.6); rim.position.set(-4,3,-3); scene.add(rim);

// controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 10;

// load glb
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
  },
  (e) => console.log('loading...', (e.loaded||0)+'/'+(e.total||'?')),
  (err) => console.error('GLB load error:', err)
);

// resize
function resize() {
  const w = hero.clientWidth, h = hero.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

// loop
const clock = new THREE.Clock();
(function tick(){
  controls.update(clock.getDelta());
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
})();

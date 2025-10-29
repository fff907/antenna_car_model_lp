import * as THREE from 'three';

const hero   = document.getElementById('hero');
const canvas = document.getElementById('hero-canvas');

const glbRaw = hero?.dataset.glb || './assets/antenna_car_model_v1.glb';
const glbURL = new URL(glbRaw, window.location.href).href;

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 1.2, 6);
scene.add(camera);

scene.add(new THREE.AmbientLight(0xffffff, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(3,5,4); scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 0.6); rim.position.set(-4,3,-3); scene.add(rim);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 4; controls.maxDistance = 10;

const loader = new THREE.GLTFLoader();
loader.load(glbURL, (gltf) => {
  const model = gltf.scene;
  model.position.set(0, -0.6, 0);
  model.scale.set(1.2, 1.2, 1.2);
  scene.add(model);
  controls.autoRotate = true; controls.autoRotateSpeed = 0.6;
}, undefined, (e) => console.error(e));

function resize() {
  const w = canvas.getBoundingClientRect().width || hero?.clientWidth || window.innerWidth;
  const h = canvas.getBoundingClientRect().height || hero?.clientHeight || Math.max(400, window.innerHeight*0.7);
  renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();

const clock = new THREE.Clock();
(function animate(){ controls.update(clock.getDelta()); renderer.render(scene, camera); requestAnimationFrame(animate); })();

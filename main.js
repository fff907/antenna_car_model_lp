const hero     = document.getElementById('hero');
const canvas   = document.getElementById('hero-canvas');
const dragHint = document.getElementById('drag-hint');

// GLBパス
const glbRaw = hero?.dataset.glb || './assets/antenna_car_model_v1.glb';
const glbURL = new URL(glbRaw, window.location.href).href;

// Three基本セットアップ
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 1.2, 6);
scene.add(camera);

// ライト
scene.add(new THREE.AmbientLight(0xffffff, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 1.0);
key.position.set(3, 5, 4);
scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 0.6);
rim.position.set(-4, 3, -3);
scene.add(rim);

// 操作
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.zoomSpeed = 0.6;
controls.minDistance = 4;
controls.maxDistance = 10;

// GLB読み込み
const loader = new GLTFLoader();
let model = null;

loader.load(
  glbURL,
  (gltf) => {
    model = gltf.scene;
    scene.add(model);

    model.position.set(0, -0.6, 0);
    model.scale.set(1.2, 1.2, 1.2);

    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
  },
  undefined,
  (err) => {
    console.error('GLB load error:', err);
  }
);

// リサイズ
function resize() {
  const w =
    canvas.getBoundingClientRect().width ||
    hero?.clientWidth ||
    window.innerWidth;

  const h =
    canvas.getBoundingClientRect().height ||
    hero?.clientHeight ||
    Math.max(400, window.innerHeight * 0.7);

  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
// 初回に即実行
resize();

// ヒント消去（初回操作時）
let hinted = false;
['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach((ev) => {
  window.addEventListener(
    ev,
    () => {
      if (!hinted) {
        hinted = true;
        controls.autoRotate = false;
        dragHint?.classList.add('opacity-0', 'transition', 'duration-700');
      }
    },
    { passive: true }
  );
});

// ループ
const clock = new THREE.Clock();
(function tick() {
  controls.update(clock.getDelta());
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
})();

// （将来用）ホットスポットサンプル
const hotspot1 = new THREE.Vector3(0.2, 0.8, 0.0);
const hotspot2 = new THREE.Vector3(-0.8, 0.2, 0.3);
// 画面投影→DOM配置は必要になったら実装
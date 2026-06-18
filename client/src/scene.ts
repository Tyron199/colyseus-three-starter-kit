import * as THREE from "three";

const WORLD_SIZE = 50;
const WORLD_HALF_SIZE = WORLD_SIZE / 2;

/**
 * Sets up the renderer, camera, lights and a simple ground plane. Keep this as
 * your baseline and dress it up however your game needs.
 */
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08111f);
  scene.fog = new THREE.Fog(0x08111f, 36, 88);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 9, 12);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  const hemisphere = new THREE.HemisphereLight(0x9ec8ff, 0x172033, 1.6);
  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(15, 25, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -WORLD_HALF_SIZE;
  sun.shadow.camera.right = WORLD_HALF_SIZE;
  sun.shadow.camera.top = WORLD_HALF_SIZE;
  sun.shadow.camera.bottom = -WORLD_HALF_SIZE;
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE),
    new THREE.MeshStandardMaterial({
      color: 0x172033,
      roughness: 0.72,
      metalness: 0.08,
      emissive: 0x031525,
      emissiveIntensity: 0.25,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(WORLD_SIZE, WORLD_SIZE, 0x38bdf8, 0x1d4ed8);
  grid.position.y = 0.012;
  const gridMaterial = grid.material as THREE.Material | THREE.Material[];
  for (const material of Array.isArray(gridMaterial) ? gridMaterial : [gridMaterial]) {
    material.transparent = true;
    material.opacity = 0.16;
  }
  scene.add(grid);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}

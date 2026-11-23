import {
  ACESFilmicToneMapping, Box3, BoxGeometry, BufferGeometry, Color, DirectionalLight,
  Group, HemisphereLight, LineBasicMaterial, LineSegments, MathUtils, Mesh,
  MeshBasicMaterial, OrthographicCamera, PMREMGenerator, Scene, Vector3, WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { applyGrainReveal } from './lionsGrainReveal';

const MODEL_URL = '/sharon/projects/lions-robot.glb';
const GRID_HALF_SIZE = 1.52;
const INITIAL_YAW = 1.56;
const AZIMUTH = -2.37;
const ELEVATION = 0.61;

// The Lions site studio floor uses 21 lines in each direction. Use the same
// geometry and ink, scaled to the smaller project card.
function createStudioGrid(floor) {
  const points = [];
  for (let i = -10; i <= 10; i += 1) {
    const offset = i * GRID_HALF_SIZE / 10;
    points.push(
      new Vector3(offset, floor, -GRID_HALF_SIZE),
      new Vector3(offset, floor, GRID_HALF_SIZE),
      new Vector3(-GRID_HALF_SIZE, floor, offset),
      new Vector3(GRID_HALF_SIZE, floor, offset),
    );
  }
  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({
    color: 0x8ad1ca,
    transparent: true,
    opacity: 0.47,
    depthWrite: false,
  });
  return new LineSegments(geometry, material);
}

// The original site lights its metalwork with three studio reflection cards.
function createStudioEnvironment(renderer) {
  const pmrem = new PMREMGenerator(renderer);
  const studio = new Scene();
  studio.background = new Color(0x10171d);
  const geometry = new BoxGeometry(1, 1, 1);
  const materials = [];
  const cards = [
    { color: 0xffdcba, power: 5.5, size: [4.2, 0.12, 7], position: [-4, 6, 2], tilt: -0.30 },
    { color: 0xb3d9ff, power: 4.2, size: [0.12, 6, 3], position: [5, 2, -3], tilt: 0 },
    { color: 0xe1f0e7, power: 3.8, size: [6, 0.09, 1.1], position: [0, 4, -5], tilt: 0.18 },
  ];
  try {
    for (const { color, power, size, position, tilt } of cards) {
      const material = new MeshBasicMaterial({ color: new Color(color).multiplyScalar(power) });
      materials.push(material);
      const panel = new Mesh(geometry, material);
      panel.scale.fromArray(size);
      panel.position.fromArray(position);
      panel.rotation.z = tilt;
      studio.add(panel);
    }
    return pmrem.fromScene(studio, 0.04);
  } finally {
    geometry.dispose();
    materials.forEach((material) => material.dispose());
    pmrem.dispose();
  }
}

function fitStage(camera, bounds, floor) {
  const center = bounds.getCenter(new Vector3());
  const size = bounds.getSize(new Vector3());
  const orbitRadius = Math.hypot(size.x, size.z) / 2;
  const target = new Vector3(0, floor + size.y * 0.4, 0);
  const eye = new Vector3(
    Math.sin(AZIMUTH) * Math.cos(ELEVATION),
    Math.sin(ELEVATION),
    Math.cos(AZIMUTH) * Math.cos(ELEVATION),
  );
  camera.position.copy(target).addScaledVector(eye, 12);
  camera.lookAt(target);
  camera.updateMatrixWorld();

  let halfWidth = 0;
  let halfHeight = 0;
  const corner = new Vector3();
  for (const { radius, heights } of [
    { radius: GRID_HALF_SIZE, heights: [floor] },
    { radius: orbitRadius, heights: [bounds.min.y, bounds.max.y] },
  ]) {
    for (const x of [-radius, radius]) {
      for (const z of [-radius, radius]) {
        for (const y of heights) {
          camera.worldToLocal(corner.set(x, y, z));
          halfWidth = Math.max(halfWidth, Math.abs(corner.x));
          halfHeight = Math.max(halfHeight, Math.abs(corner.y));
        }
      }
    }
  }
  return { center, halfWidth: halfWidth / 0.90, halfHeight: halfHeight / 0.92 };
}

export async function createLionsRobotScene(canvas) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));

  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  let environment;
  function dispose() {
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    environment?.dispose();
    renderer.dispose();
  }

  try {
    const { scene: model } = await new GLTFLoader().loadAsync(MODEL_URL);
    const modelReveal = { value: 0 };
    const gridReveal = { value: 0 };
    model.traverse((node) => {
      if (!node.isMesh) return;
      geometries.add(node.geometry);
      for (const material of [].concat(node.material)) {
        if (materials.has(material)) continue;
        materials.add(material);
        for (const value of Object.values(material)) {
          if (value?.isTexture) textures.add(value);
        }
        if (material.transparent) material.depthWrite = false;
        applyGrainReveal(material, modelReveal);
      }
    });

    const scene = new Scene();
    environment = createStudioEnvironment(renderer);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.69;
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 30);
    const bounds = new Box3().setFromObject(model);
    const floor = bounds.min.y - 0.017;
    const { center, halfWidth, halfHeight } = fitStage(camera, bounds, floor);
    model.position.x -= center.x;
    model.position.z -= center.z;
    const pivot = new Group();
    pivot.add(model);
    scene.add(pivot);

    const grid = createStudioGrid(floor);
    geometries.add(grid.geometry);
    materials.add(grid.material);
    applyGrainReveal(grid.material, gridReveal);
    scene.add(grid);

    const key = new DirectionalLight(0xffd5aa, 3.35);
    const fill = new DirectionalLight(0x83b5e4, 1.45);
    const rim = new DirectionalLight(0xa2e0e0, 2.05);
    key.position.set(-5, 7.5, 4);
    fill.position.set(6, 5, -3);
    rim.position.set(-4, 3, -7);
    scene.add(new HemisphereLight(0xd3e1ec, 0x192426, 0.92), key, fill, rim);

    let previousWidth = 0;
    let previousHeight = 0;
    return {
      draw(progress, width, height) {
        if (width !== previousWidth || height !== previousHeight) {
          previousWidth = width;
          previousHeight = height;
          const aspect = width / height;
          camera.top = Math.max(halfHeight, halfWidth / aspect);
          camera.bottom = -camera.top;
          camera.right = camera.top * aspect;
          camera.left = -camera.right;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        }
        gridReveal.value = MathUtils.smoothstep(progress, 0.035, 0.34);
        modelReveal.value = MathUtils.smoothstep(progress, 0.10, 0.76);
        pivot.rotation.y = INITIAL_YAW + 2.45 * MathUtils.smoothstep(progress, 0.23, 1);
        renderer.render(scene, camera);
        return modelReveal.value;
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

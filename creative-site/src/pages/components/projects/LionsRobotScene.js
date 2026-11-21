import {
  AmbientLight, Box3, BufferGeometry, Color, DirectionalLight, DoubleSide, Group,
  LineBasicMaterial, LineLoop, MeshStandardMaterial, OrthographicCamera,
  Scene, Vector3, WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const INITIAL_ANGLE = 0.48;
const FIELD_FRAME = [
  new Vector3(-1.14, -0.79, -1.14),
  new Vector3(-1.14, -0.79, 1.14),
  new Vector3(1.14, -0.79, 1.14),
  new Vector3(1.14, -0.79, -1.14),
];

export async function createLionsRobotScene(canvas) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));

  let model;
  try {
    ({ scene: model } = await new GLTFLoader().loadAsync('/sharon/projects/lions-robot-model.glb'));
  } catch (error) {
    renderer.dispose();
    throw error;
  }

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 24);
  camera.position.set(3.35, 2.4, 4.1);
  camera.lookAt(0, 0, 0);

  const paint = new MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.16,
    roughness: 0.62,
    side: DoubleSide,
  });
  const pivot = new Group();
  const center = new Box3().setFromObject(model).getCenter(new Vector3());
  model.position.sub(center);
  model.traverse((node) => {
    if (!node.isMesh) return;
    node.material.dispose();
    node.material = paint;
  });
  pivot.add(model);
  scene.add(pivot);

  const square = new LineLoop(
    new BufferGeometry().setFromPoints(FIELD_FRAME),
    new LineBasicMaterial({ color: new Color('#999ef4'), opacity: 0.58, transparent: true })
  );
  scene.add(square);

  const key = new DirectionalLight(0xf4f7ff, 2.4);
  key.position.set(-2.8, 5.5, 4.5);
  const rim = new DirectionalLight(0xb6bdff, 1.2);
  rim.position.set(2.5, 2.1, -4.0);
  scene.add(new AmbientLight(0xdce4ff, 0.9), key, rim);

  let previousWidth = 0;
  let previousHeight = 0;
  return {
    draw(progress, width, height) {
      if (width !== previousWidth || height !== previousHeight) {
        previousWidth = width;
        previousHeight = height;
        const zoom = Math.min(width / 3.75, height / 3);
        camera.left = -width / (zoom * 2);
        camera.right = -camera.left;
        camera.top = height / (zoom * 2);
        camera.bottom = -camera.top;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      }
      const eased = progress * progress * (3 - 2 * progress);
      pivot.rotation.y = INITIAL_ANGLE - eased * 2.82;
      square.rotation.y = -0.11 + eased * 0.45;
      renderer.render(scene, camera);
    },
    dispose() {
      model.traverse((node) => {
        if (node.isMesh) node.geometry.dispose();
      });
      paint.dispose();
      square.geometry.dispose();
      square.material.dispose();
      renderer.dispose();
    },
  };
}

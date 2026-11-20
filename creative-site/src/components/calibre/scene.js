import * as Three from 'three';
import buildMovement from './model';

// Center-of-chapter views. The case is turned under a fixed studio, so the
// reflections change with the angle of the metal. Subject points are local.
const shots = [
  { at: 0, angle: [-0.26, -0.51, -0.29], point: [0.04, 0.02, 0.18], center: [0.703, 0.5], span: 5.78, open: 0, lamp: [0.72, 0.19] },
  { at: 0.44, angle: [-0.56, -0.29, -0.18], point: [-0.3, 0.12, 0.3], center: [0.8, 0.48], span: 4.26, open: 0.19, lamp: [0.78, 0.1] },
  { at: 1, angle: [-0.26, -0.16, 0.1], point: [-0.46, 0.21, 0.45], center: [0.81, 0.53], span: 3.48, open: 0.47, lamp: [0.74, 0.28] },
  { at: 1.6, angle: [-0.87, -0.36, 0.18], point: [0, 0, 0.53], center: [0.54, 0.53], span: 5.78, open: 0.94, lamp: [0.44, 0.24] },
  { at: 2, angle: [-0.99, 0.49, -0.37], point: [0, -0.02, 0.76], center: [0.285, 0.51], span: 5.67, open: 1.12, lamp: [0.32, 0.42] },
  { at: 2.55, angle: [-0.25, 0.38, 0.5], point: [0.02, -0.3, 0.65], center: [0.55, 0.58], span: 5.03, open: 0.49, lamp: [0.57, 0.3] },
  { at: 3, angle: [-0.4, 0.15, 0.14], point: [0.03, -0.54, 0.28], center: [0.76, 0.5], span: 3.43, open: 0.42, lamp: [0.76, 0.28] },
  { at: 3.63, angle: [0.27, -0.85, 0.12], point: [0, -0.25, 0.57], center: [0.47, 0.49], span: 4.87, open: 0.57, lamp: [0.46, 0.22] },
  { at: 4, angle: [0.24, -0.36, 0.46], point: [0.03, -0.63, 0.13], center: [0.27, 0.54], span: 4.3, open: 0.16, lamp: [0.33, 0.32] },
  { at: 4.58, angle: [0.03, -0.56, 0.32], point: [0.05, -0.12, 0.25], center: [0.59, 0.49], span: 5.0, open: 0.06, lamp: [0.58, 0.32] },
  { at: 5, angle: [-0.12, 0.3, 0.16], point: [0.01, -0.01, 0.15], center: [0.73, 0.52], span: 5.66, open: 0, lamp: [0.75, 0.36] },
];
const offsets = [
  [0, 0, -0.27],
  [-0.14, -0.09, 0.01],
  [0.06, 0.08, 0.5],
  [0.1, 0.13, 1.29],
  [0.15, 0.17, 1.79],
];

function viewsAt(progress) {
  const index = shots.findIndex((view) => view.at > progress);
  if (index === -1) return [shots[shots.length - 1], shots[shots.length - 1], 0];
  const next = shots[index];
  const previous = shots[Math.max(0, index - 1)];
  const ratio = (progress - previous.at) / (next.at - previous.at || 1);
  return [previous, next, Three.MathUtils.smootherstep(ratio, 0, 1)];
}

function reflectionStudio() {
  const studio = new Three.Scene();
  studio.background = new Three.Color(0x343231);
  const softboxes = [
    { position: [-3, 4, 3.8], size: [5, 2.5], energy: [3.7, 3.1, 2.35] },
    { position: [3.6, -0.22, 2.4], size: [0.9, 6.7], energy: [5.6, 5.1, 4.8] },
    { position: [-4.2, -0.4, 1.3], size: [0.65, 5], energy: [2.0, 2.55, 3.2] },
    { position: [0.2, -4.1, 1.8], size: [3.3, 1.7], energy: [1.4, 0.92, 0.56] },
    { position: [0, 2, -4.7], size: [5, 1.9], energy: [2.1, 2.12, 2.15] },
    { position: [-0.7, 0.1, 6.5], size: [2.6, 6.4], energy: [0.08, 0.075, 0.07] },
  ];
  softboxes.forEach(({ position, size, energy }) => {
    const panel = new Three.Mesh(new Three.PlaneGeometry(size[0], size[1]), new Three.MeshBasicMaterial({ color: new Three.Color(energy[0], energy[1], energy[2]) }));
    panel.position.fromArray(position);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
  });
  return studio;
}

function disposeObjects(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  root.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) [object.material].flat().forEach((material) => materials.add(material));
  });
  materials.forEach((material) =>
    Object.values(material).forEach((value) => {
      if (value?.isTexture) textures.add(value);
    }),
  );
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}

export default function mountScene(canvas, host, input, callbacks) {
  const renderer = new Three.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x0f0e0d, 0);
  renderer.outputColorSpace = Three.SRGBColorSpace;
  renderer.toneMapping = Three.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.09;
  const scene = new Three.Scene();
  const studio = reflectionStudio();
  const pmrem = new Three.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0.025);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.05;
  pmrem.dispose();
  disposeObjects(studio);

  const key = new Three.DirectionalLight(0xffe5c7, 1.7);
  key.position.set(-3.5, 4, 4.7);
  const fill = new Three.DirectionalLight(0xabc1df, 0.6);
  fill.position.set(3.5, -2.1, 2.3);
  const movement = buildMovement();
  scene.add(movement.root, key, fill);
  const camera = new Three.PerspectiveCamera(32, 1, 0.1, 40);
  const target = new Three.Vector3();
  const viewAnchor = new Three.Vector3();
  const framedAnchor = new Three.Vector3();
  const lens = Math.tan(Three.MathUtils.degToRad(camera.fov / 2));
  const { lerp } = Three.MathUtils;
  let width = 1;
  let height = 1;
  let frame = 0;
  let previous = 0;
  let gearTime = 0;
  let crownPhase = 0;
  let swingX = 0;
  let swingY = 0;
  let separation = 0;
  let macro = 0;
  let stopped = false;
  let first = true;

  function render(now) {
    frame = 0;
    const state = input.current;
    if (stopped || document.hidden || state.suspended) return;
    const elapsed = Math.min((now - (previous || now)) / 1000, 0.048);
    previous = now;
    const [from, to, ratio] = viewsAt(state.progress);
    const interpolate = (keyName, index) => lerp(from[keyName][index], to[keyName][index], ratio);
    const alpha = 1 - Math.exp(-12 * elapsed);
    swingX = lerp(swingX, state.yaw + state.cursorX, alpha);
    swingY = lerp(swingY, state.pitch + state.cursorY, alpha);
    separation = lerp(separation, state.inspect ? 1 : 0, alpha);
    const detail = state.inspect && movement.anchors[state.detail];
    const macroTarget = detail ? 1 : 0;
    macro = lerp(macro, macroTarget, alpha * 0.7);
    const lift = lerp(lerp(from.open, to.open, ratio), 1.12, separation);
    if (!state.paused) {
      gearTime += elapsed * (1 + state.wind);
      crownPhase += elapsed * state.wind * 2.5;
      state.wind *= Math.exp(-2.15 * elapsed);
    }
    const compact = width <= 780;
    const aspect = width / height;
    const x = compact ? 0.5 : lerp(interpolate('center', 0), interpolate('center', 0) < 0.5 ? 0.28 : 0.73, separation);
    const y = compact ? 0.5 : interpolate('center', 1);
    const base = lerp(from.span, to.span, ratio);
    const standardSpan = compact ? lerp(Math.max(5.3 / Math.min(1, aspect), base * 1.04), 6.7 / Math.min(1, aspect), separation) : lerp(base + Math.max(0, 1.45 - aspect), 6.35, separation);
    const span = lerp(standardSpan, compact ? 3.7 / Math.min(1, aspect) : 3.15, macro);
    const rotationX = lerp(interpolate('angle', 0), -0.97, separation);
    movement.root.rotation.set(rotationX + swingY, interpolate('angle', 1) + swingX, interpolate('angle', 2), 'YXZ');
    movement.layers.forEach((layer, index) => {
      const offset = offsets[index];
      layer.position.set(offset[0] * lift, offset[1] * lift, offset[2] * lift);
    });
    movement.train.forEach(({ unit, speed }) => {
      unit.rotation.z = gearTime * speed;
    });
    const beat = Math.sin(gearTime * 6.8);
    movement.balance.rotation.z = beat * 0.44;
    if (movement.pallet) movement.pallet.rotation.z = beat * -0.17;
    movement.second.rotation.z = -2.14 - (gearTime * Math.PI) / 30;
    movement.crown.rotation.z = -crownPhase;
    movement.hands[1].rotation.z = -1.02 - (gearTime * Math.PI) / 1800;

    const aimX = interpolate('point', 0) * (compact ? 0.32 : 1);
    const aimY = interpolate('point', 1) * (compact ? 0.32 : 1);
    target.set(aimX * (1 - separation), aimY * (1 - separation), interpolate('point', 2) + separation * 0.45);
    target.applyQuaternion(movement.root.quaternion);
    if (detail) {
      detail.getWorldPosition(viewAnchor);
      framedAnchor.lerp(viewAnchor, Math.min(1, alpha * 1.4));
    } else if (macro < 0.005) {
      framedAnchor.copy(target);
    }
    target.lerp(framedAnchor, macro);
    camera.position.set(target.x + (0.5 - x) * aspect * span, target.y + (y - 0.5) * span, target.z + span / (2 * lens));
    renderer.toneMappingExposure = lerp(0.94, 1.09, Math.min(1, state.progress * 1.6 + separation * 0.8));
    renderer.render(scene, camera);
    if (first) {
      first = false;
      callbacks.ready();
    }
    if (state.changedLighting) {
      host.style.setProperty('--spot-x', `${(compact ? 50 : 100 * interpolate('lamp', 0)).toFixed(1)}%`);
      host.style.setProperty('--spot-y', `${(100 * interpolate('lamp', 1)).toFixed(1)}%`);
      state.changedLighting = false;
    }
    const moving = Math.abs(swingX - state.yaw - state.cursorX) + Math.abs(swingY - state.pitch - state.cursorY) + Math.abs(separation - Number(state.inspect)) + Math.abs(macro - macroTarget) > 0.002;
    if (!state.paused || moving) frame = window.requestAnimationFrame(render);
  }

  function invalidate() {
    if (!frame && !stopped && !document.hidden && !input.current.suspended) frame = window.requestAnimationFrame(render);
  }
  function resize() {
    width = host.clientWidth || 1;
    height = host.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5, Math.sqrt(2300000 / (width * height))));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    input.current.changedLighting = true;
    invalidate();
  }
  function onLost(event) {
    event.preventDefault();
    stopped = true;
    window.cancelAnimationFrame(frame);
    frame = 0;
    callbacks.lost();
  }
  function onRestored() {
    stopped = false;
    first = true;
    invalidate();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  document.addEventListener('visibilitychange', invalidate);
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  resize();
  return {
    invalidate,
    dispose() {
      stopped = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', invalidate);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      disposeObjects(scene);
      environment.dispose();
      renderer.dispose();
    },
  };
}

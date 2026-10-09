import * as THREE from "../vendor/three/three.module.js";
import { RoomEnvironment } from "../vendor/three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "../vendor/three/addons/geometries/RoundedBoxGeometry.js";

// The site owns the ticker and scroll timeline. This module only renders the current state.
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (start, end, value) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

export function createWorld(canvas, { compact = false } = {}) {
  if (!canvas) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !compact,
      powerPreference: "high-performance",
    });
  } catch (error) {
    console.warn("The interactive scene could not start.", error);
    return null;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, compact ? 1 : 1.5));
  renderer.autoClear = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(compact ? 43 : 36, 1, 0.1, 100);
  camera.position.set(0, 0, compact ? 13.7 : 12.5);
  camera.lookAt(0, 0, 0);

  const resources = { geometries: new Set(), materials: new Set() };
  const geometry = (value) => (resources.geometries.add(value), value);
  const material = (value) => (resources.materials.add(value), value);
  const physical = (color, metalness, roughness, options = {}) =>
    material(
      new THREE.MeshPhysicalMaterial({
        color,
        metalness,
        roughness,
        clearcoat: 0.7,
        clearcoatRoughness: 0.13,
        transparent: false,
        ...options,
      }),
    );
  const basic = (color, opacity = 1) =>
    material(
      new THREE.MeshBasicMaterial({
        color,
        opacity,
        transparent: true,
        depthWrite: false,
      }),
    );
  const rounded = (width, height, depth, radius = 0.09) =>
    geometry(new RoundedBoxGeometry(width, height, depth, 4, radius));
  const box = (width, height, depth) =>
    geometry(new THREE.BoxGeometry(width, height, depth));
  const torus = (radius, tube = 0.05) =>
    geometry(new THREE.TorusGeometry(radius, tube, 10, 80));
  const sphere = (radius, detail = 2) =>
    geometry(new THREE.IcosahedronGeometry(radius, detail));
  const addMesh = (parent, shape, surface, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(shape, surface);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  let environment;
  try {
    const generator = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environment = generator.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();
    generator.dispose();
  } catch (error) {
    console.warn("Using direct lighting for the interactive scene.", error);
  }

  scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x0c1426, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(-4, 6, 8);
  scene.add(key);
  const blueRim = new THREE.PointLight(0x4081ff, 32, 30);
  blueRim.position.set(4, 0, 3);
  scene.add(blueRim);
  const paleRim = new THREE.PointLight(0xdbedff, 28, 30);
  paleRim.position.set(-5, -4, -1);
  scene.add(paleRim);

  const world = new THREE.Group();
  scene.add(world);

  const makePalette = () => {
    const cobalt = physical(0x315fdf, 0.67, 0.17, {
      clearcoat: 1,
      clearcoatRoughness: 0.07,
    });
    const deepBlue = physical(0x092a76, 0.79, 0.24);
    const chrome = physical(0xc5d5e7, 1, 0.13, { clearcoat: 0.9 });
    const dark = physical(0x121a2c, 0.7, 0.26);
    const ivory = physical(0xf4f3ee, 0.23, 0.22, { clearcoat: 0.9 });
    const electric = physical(0x7bc5ff, 0.35, 0.15, {
      emissive: 0x2575ff,
      emissiveIntensity: 0.32,
      clearcoat: 1,
    });
    return { cobalt, deepBlue, chrome, dark, ivory, electric };
  };

  // A watch movement crossed with a robot joint: a dense, asymmetric object that
  // reads as machinery from afar and rewards a closer look with real construction.
  const assembly = new THREE.Group();
  world.add(assembly);
  const a = makePalette();
  const assemblySurfaces = Object.values(a);
  const pieces = [];
  const piece = (object, x, y, z, dx, dy, dz) => {
    object.position.set(x, y, z);
    assembly.add(object);
    pieces.push({
      object,
      base: new THREE.Vector3(x, y, z),
      apart: new THREE.Vector3(dx, dy, dz),
      current: new THREE.Vector3(x, y, z),
      target: new THREE.Vector3(),
    });
    return object;
  };

  const backplate = addMesh(
    new THREE.Group(),
    rounded(2.66, 2.88, 0.38, 0.34),
    a.dark,
  );
  backplate.rotation.z = -0.23;
  piece(backplate.parent, 0.03, -0.03, -0.46, -0.42, -0.1, -1.02);

  const movement = new THREE.Group();
  const gearShape = new THREE.Shape();
  const teeth = 18;
  for (let index = 0; index < teeth * 4; index++) {
    const angle = (index / (teeth * 4)) * Math.PI * 2;
    const radius = index % 4 === 0 || index % 4 === 3 ? 1.18 : 1.04;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) gearShape.moveTo(x, y);
    else gearShape.lineTo(x, y);
  }
  gearShape.closePath();
  const gearHole = new THREE.Path();
  gearHole.absarc(0, 0, 0.69, 0, Math.PI * 2, true);
  gearShape.holes.push(gearHole);
  const gearGeometry = geometry(
    new THREE.ExtrudeGeometry(gearShape, {
      depth: 0.19,
      bevelEnabled: true,
      bevelThickness: 0.055,
      bevelSize: 0.04,
      bevelSegments: 2,
      curveSegments: 24,
    }),
  );
  gearGeometry.translate(0, 0, -0.095);
  addMesh(movement, gearGeometry, a.chrome, 0, 0, 0);
  addMesh(movement, torus(0.7, 0.035), a.deepBlue, 0, 0, 0.18);
  const dial = addMesh(
    movement,
    geometry(new THREE.CylinderGeometry(0.57, 0.57, 0.08, 48)),
    a.deepBlue,
    0,
    0,
    0.22,
  );
  dial.rotation.x = Math.PI / 2;
  addMesh(movement, torus(0.48, 0.023), a.electric, 0, 0, 0.29);
  const tickGeometry = box(0.028, 0.11, 0.027);
  const ticks = new THREE.InstancedMesh(tickGeometry, a.ivory, 32);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < 32; index++) {
    const angle = (index / 32) * Math.PI * 2;
    dummy.position.set(Math.sin(angle) * 0.37, Math.cos(angle) * 0.37, 0.32);
    dummy.rotation.set(0, 0, -angle);
    dummy.scale.set(1, index % 4 === 0 ? 1.55 : 0.78, 1);
    dummy.updateMatrix();
    ticks.setMatrixAt(index, dummy.matrix);
  }
  ticks.instanceMatrix.needsUpdate = true;
  movement.add(ticks);
  piece(movement, 0.25, 0.14, 0.12, 0.92, 0.68, 0.72);

  const orbit = new THREE.Group();
  const outerRing = addMesh(orbit, torus(1.62, 0.11), a.chrome);
  outerRing.rotation.y = 0.4;
  outerRing.rotation.x = 0.53;
  const innerRing = addMesh(orbit, torus(1.33, 0.05), a.cobalt, 0, 0, 0.07);
  innerRing.rotation.y = -0.35;
  innerRing.rotation.x = -0.28;
  piece(orbit, 0.16, 0.08, -0.04, 0.18, 0.27, -0.76);

  const mainArm = new THREE.Group();
  const cobaltBar = addMesh(mainArm, rounded(2.75, 0.55, 0.69, 0.21), a.cobalt);
  cobaltBar.rotation.z = -0.38;
  const topBevel = addMesh(
    mainArm,
    rounded(1.8, 0.1, 0.15, 0.05),
    a.ivory,
    0.12,
    0.16,
    0.43,
  );
  topBevel.rotation.z = -0.38;
  const axle = addMesh(
    mainArm,
    geometry(new THREE.CylinderGeometry(0.26, 0.26, 0.56, 32)),
    a.chrome,
    0.82,
    -0.35,
    0.23,
  );
  axle.rotation.x = Math.PI / 2;
  addMesh(mainArm, sphere(0.18, 2), a.dark, 0.82, -0.35, 0.56);
  piece(mainArm, -0.45, -0.51, 0.56, -1.46, -0.76, 1.13);

  const counterweight = new THREE.Group();
  const ivoryBlock = addMesh(
    counterweight,
    rounded(0.98, 0.66, 0.92, 0.19),
    a.ivory,
  );
  ivoryBlock.rotation.z = 0.22;
  addMesh(
    counterweight,
    rounded(0.91, 0.11, 0.47, 0.05),
    a.chrome,
    0,
    -0.28,
    0.15,
  );
  piece(counterweight, -1.35, 0.8, 0.73, -1.08, 0.9, 0.8);

  const rightBlock = new THREE.Group();
  const blade = addMesh(
    rightBlock,
    rounded(0.72, 1.52, 0.75, 0.23),
    a.deepBlue,
  );
  blade.rotation.z = 0.31;
  const stripe = addMesh(
    rightBlock,
    rounded(0.09, 1.07, 0.14, 0.04),
    a.electric,
    -0.11,
    0.05,
    0.43,
  );
  stripe.rotation.z = 0.31;
  piece(rightBlock, 1.38, 0.2, 0.82, 1.29, 0.69, 1.04);

  const lowerBlock = new THREE.Group();
  const lowerShell = addMesh(
    lowerBlock,
    rounded(1.16, 0.68, 0.73, 0.2),
    a.dark,
  );
  lowerShell.rotation.z = 0.25;
  const lowerInset = addMesh(
    lowerBlock,
    rounded(0.78, 0.38, 0.1, 0.08),
    a.cobalt,
    0,
    0,
    0.41,
  );
  lowerInset.rotation.z = 0.25;
  piece(lowerBlock, 0.7, -1.27, 0.4, 0.43, -1.19, 0.87);

  const floatingModule = new THREE.Group();
  addMesh(floatingModule, rounded(0.64, 0.4, 0.62, 0.14), a.chrome);
  addMesh(
    floatingModule,
    rounded(0.42, 0.22, 0.1, 0.06),
    a.deepBlue,
    0,
    0,
    0.36,
  );
  piece(floatingModule, -1.75, -0.92, 0.18, -1.39, -1.12, 0.7);

  // Instanced pins carry the machining rhythm without a draw call per fastener.
  const pinGeometry = geometry(
    new THREE.CylinderGeometry(0.075, 0.075, 0.1, 12),
  );
  const pins = new THREE.InstancedMesh(pinGeometry, a.chrome, 10);
  for (let index = 0; index < 10; index++) {
    const angle = (index / 10) * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * 1.2, Math.sin(angle) * 1.16, 0.49);
    dummy.rotation.set(Math.PI / 2, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    pins.setMatrixAt(index, dummy.matrix);
  }
  pins.instanceMatrix.needsUpdate = true;
  piece(pins, 0.25, 0.14, 0, 0.8, 0.6, 0.65);

  // Panoramic companions give the wide hero stage a silhouette beyond the
  // central movement. These are machined forms, not decorative particle fog.
  const satellites = new THREE.Group();
  world.add(satellites);
  const satellitePalette = makePalette();
  const satelliteSurfaces = Object.values(satellitePalette);
  const satelliteBody = rounded(1.62, 0.89, 0.64, 0.23);
  const satelliteHousing = rounded(1.84, 1.13, 0.4, 0.28);
  const satelliteInset = rounded(1.17, 0.22, 0.13, 0.065);
  const satelliteRing = torus(1.12, 0.115);

  const leftSatellite = new THREE.Group();
  satellites.add(leftSatellite);
  const leftRing = addMesh(
    leftSatellite,
    satelliteRing,
    satellitePalette.chrome,
    -0.19,
    0.04,
    -0.77,
  );
  leftRing.rotation.set(0.43, 0.52, -0.21);
  const leftBody = addMesh(
    leftSatellite,
    satelliteBody,
    satellitePalette.cobalt,
    0.19,
    -0.04,
    0.37,
  );
  leftBody.rotation.z = -0.43;
  const leftInset = addMesh(
    leftSatellite,
    satelliteInset,
    satellitePalette.ivory,
    0.2,
    -0.02,
    0.79,
  );
  leftInset.rotation.z = -0.43;
  addMesh(
    leftSatellite,
    sphere(0.3, 2),
    satellitePalette.dark,
    0.75,
    -0.43,
    0.69,
  );

  const rightSatellite = new THREE.Group();
  satellites.add(rightSatellite);
  const rightRing = addMesh(
    rightSatellite,
    satelliteRing,
    satellitePalette.deepBlue,
    0.18,
    -0.03,
    -0.82,
  );
  rightRing.rotation.set(-0.5, -0.63, 0.26);
  const rightHousing = addMesh(
    rightSatellite,
    satelliteHousing,
    satellitePalette.dark,
    -0.14,
    0.02,
    -0.24,
  );
  rightHousing.rotation.z = 0.28;
  const rightBody = addMesh(
    rightSatellite,
    satelliteBody,
    satellitePalette.ivory,
    -0.21,
    0.02,
    0.43,
  );
  rightBody.rotation.z = 0.35;
  const rightInset = addMesh(
    rightSatellite,
    satelliteInset,
    satellitePalette.cobalt,
    -0.19,
    0.03,
    0.84,
  );
  rightInset.rotation.z = 0.35;

  // Three concrete engineering scenes replace abstract particles in the work chapter.
  const projects = [];
  const makeProject = () => {
    const group = new THREE.Group();
    const palette = makePalette();
    world.add(group);
    const project = { group, palette, surfaces: Object.values(palette) };
    projects.push(project);
    return project;
  };

  const robot = makeProject();
  const board = addMesh(
    robot.group,
    rounded(2.43, 2.43, 0.18, 0.13),
    robot.palette.ivory,
    -0.52,
    0,
    0,
  );
  board.rotation.z = -0.08;
  for (const offset of [-0.37, 0.37]) {
    addMesh(
      robot.group,
      rounded(0.028, 2.23, 0.025, 0.01),
      robot.palette.deepBlue,
      -0.52 + offset,
      0,
      0.13,
    );
    addMesh(
      robot.group,
      rounded(2.23, 0.028, 0.025, 0.01),
      robot.palette.deepBlue,
      -0.52,
      offset,
      0.13,
    );
  }
  const mark = (x, y, isCircle) => {
    if (isCircle)
      addMesh(
        robot.group,
        torus(0.22, 0.045),
        robot.palette.cobalt,
        x,
        y,
        0.17,
      );
    else {
      const first = addMesh(
        robot.group,
        box(0.06, 0.53, 0.035),
        robot.palette.cobalt,
        x,
        y,
        0.17,
      );
      const second = addMesh(
        robot.group,
        box(0.06, 0.53, 0.035),
        robot.palette.cobalt,
        x,
        y,
        0.17,
      );
      first.rotation.z = Math.PI / 4;
      second.rotation.z = -Math.PI / 4;
    }
  };
  mark(-1.28, 0.77, true);
  mark(-0.53, 0.77, false);
  mark(0.22, 0.03, true);
  mark(-0.53, -0.72, false);
  const armBase = new THREE.Group();
  armBase.position.set(0.88, -1.26, 0.48);
  robot.group.add(armBase);
  addMesh(armBase, sphere(0.3, 2), robot.palette.chrome);
  addMesh(
    armBase,
    rounded(0.33, 1.19, 0.37, 0.14),
    robot.palette.cobalt,
    0,
    0.57,
    0,
  );
  const elbow = new THREE.Group();
  elbow.position.set(0, 1.13, 0);
  armBase.add(elbow);
  addMesh(elbow, sphere(0.19, 2), robot.palette.chrome);
  addMesh(
    elbow,
    rounded(0.24, 0.98, 0.28, 0.11),
    robot.palette.dark,
    0,
    0.47,
    0,
  );
  addMesh(
    elbow,
    geometry(new THREE.ConeGeometry(0.095, 0.39, 16)),
    robot.palette.chrome,
    0,
    1.09,
    0,
  );
  robot.group.rotation.set(-0.08, 0.17, 0.02);

  const balloon = makeProject();
  const envelope = addMesh(
    balloon.group,
    sphere(1.25, compact ? 2 : 3),
    balloon.palette.cobalt,
    0,
    0.6,
    0,
  );
  envelope.scale.set(0.85, 1.12, 0.77);
  addMesh(
    balloon.group,
    torus(1.05, 0.025),
    balloon.palette.electric,
    0,
    0.6,
    0.11,
  ).rotation.y = 0.55;
  const throat = addMesh(
    balloon.group,
    geometry(new THREE.ConeGeometry(0.31, 0.46, 24)),
    balloon.palette.ivory,
    0,
    -0.72,
    0,
  );
  throat.rotation.z = Math.PI;
  const basket = addMesh(
    balloon.group,
    rounded(0.67, 0.48, 0.57, 0.09),
    balloon.palette.dark,
    0,
    -1.54,
    0,
  );
  addMesh(
    balloon.group,
    rounded(0.67, 0.08, 0.57, 0.025),
    balloon.palette.chrome,
    0,
    -1.3,
    0,
  );
  for (const side of [-1, 1]) {
    const rope = addMesh(
      balloon.group,
      geometry(new THREE.CylinderGeometry(0.015, 0.015, 0.55, 8)),
      balloon.palette.chrome,
      side * 0.23,
      -1.07,
      0.17,
    );
    rope.rotation.z = side * 0.2;
  }
  const radioRings = new THREE.Group();
  for (const radius of [1.55, 1.92, 2.3]) {
    const radio = addMesh(
      radioRings,
      torus(radius, 0.018),
      balloon.palette.electric,
      0,
      -0.6,
      -0.4,
    );
    radio.rotation.set(0.3, -0.47, 0.16);
  }
  balloon.group.add(radioRings);
  balloon.group.rotation.set(0.03, -0.18, -0.09);

  const relationships = makeProject();
  const points = [
    [-1.55, 0.91, 0.2],
    [-0.85, 1.12, -0.3],
    [0.05, 1.33, 0.4],
    [1.14, 0.99, -0.1],
    [1.78, 0.51, 0.6],
    [-1.8, -0.12, -0.3],
    [-1.04, 0.02, 0.8],
    [0, 0.16, 0.15],
    [0.96, 0.08, 0.88],
    [1.61, -0.47, -0.2],
    [-1.32, -1.09, 0.45],
    [-0.42, -1.15, -0.32],
    [0.53, -0.91, 0.46],
    [1.41, -1.3, 0.27],
    [-0.54, 0.61, -0.65],
    [0.53, 0.72, -0.5],
  ];
  const graphNode = new THREE.InstancedMesh(
    sphere(0.12, 1),
    relationships.palette.cobalt,
    points.length,
  );
  points.forEach((point, index) => {
    dummy.position.set(...point);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(index === 7 ? 2.25 : index % 5 === 0 ? 1.55 : 1);
    dummy.updateMatrix();
    graphNode.setMatrixAt(index, dummy.matrix);
  });
  graphNode.instanceMatrix.needsUpdate = true;
  relationships.group.add(graphNode);
  const edges = [
    [0, 1],
    [0, 5],
    [1, 2],
    [1, 6],
    [1, 14],
    [2, 3],
    [2, 7],
    [2, 15],
    [3, 4],
    [3, 8],
    [4, 9],
    [5, 6],
    [5, 10],
    [6, 7],
    [6, 11],
    [7, 8],
    [7, 11],
    [7, 12],
    [7, 14],
    [7, 15],
    [8, 9],
    [8, 12],
    [9, 13],
    [10, 11],
    [11, 12],
    [12, 13],
    [14, 15],
  ];
  const lineVertices = new Float32Array(edges.length * 6);
  edges.forEach(([from, to], index) => {
    lineVertices.set(points[from], index * 6);
    lineVertices.set(points[to], index * 6 + 3);
  });
  const graphLines = geometry(new THREE.BufferGeometry());
  graphLines.setAttribute(
    "position",
    new THREE.BufferAttribute(lineVertices, 3),
  );
  const wire = material(
    new THREE.LineBasicMaterial({
      color: 0x91bcff,
      opacity: 0.72,
      transparent: true,
    }),
  );
  relationships.surfaces.push(wire);
  relationships.group.add(new THREE.LineSegments(graphLines, wire));
  const graphCore = addMesh(
    relationships.group,
    rounded(0.44, 0.44, 0.44, 0.1),
    relationships.palette.ivory,
    0,
    0.16,
    0.15,
  );
  graphCore.rotation.set(0.3, 0.4, 0.2);

  // A restrained iris closes the visual story while leaving the contact copy clear.
  const finale = new THREE.Group();
  world.add(finale);
  const f = makePalette();
  const finaleSurfaces = Object.values(f);
  const finaleOuter = addMesh(finale, torus(1.76, 0.16), f.chrome);
  finaleOuter.rotation.set(0.22, 0.46, -0.17);
  const finaleInner = addMesh(
    finale,
    torus(1.3, 0.045),
    f.electric,
    0,
    0,
    0.11,
  );
  finaleInner.rotation.set(-0.32, -0.25, 0.12);
  const center = addMesh(
    finale,
    rounded(0.84, 0.84, 0.53, 0.25),
    f.cobalt,
    0,
    0,
    0.52,
  );
  center.rotation.z = Math.PI / 4;
  for (let index = 0; index < 6; index++) {
    const angle = (index / 6) * Math.PI * 2;
    const blade = addMesh(
      finale,
      rounded(0.35, 1.07, 0.28, 0.14),
      index % 2 ? f.dark : f.deepBlue,
    );
    blade.position.set(Math.sin(angle) * 0.88, Math.cos(angle) * 0.88, 0.34);
    blade.rotation.z = -angle - 0.35;
  }

  const state = {
    chapter: 0,
    explode: 0,
    project: 0,
    reveal: 1,
    rotation: 0,
    zoom: 0,
    velocity: 0,
    motion: true,
  };
  let disposed = false;
  let screenWidth = 1;
  let screenHeight = 1;
  let legacyFrame = null;
  let pointerPresent = false;
  const pointerPosition = new THREE.Vector2(-10000, -10000);
  const poses = new Map();
  let burstAge = 10;
  let scrollDrift = 0;

  // Semi-implicit springs keep cursor response quick, with a slight physical
  // settle. Substeps make the damping consistent on 30 Hz and 60 Hz screens.
  function spring(value, velocity, target, dt, stiffness = 210, damping = 25) {
    if (dt === 0) {
      value.copy(target);
      velocity.setScalar(0);
      return;
    }
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let index = 0; index < steps; index++) {
      velocity.x +=
        ((target.x - value.x) * stiffness - velocity.x * damping) * h;
      velocity.y +=
        ((target.y - value.y) * stiffness - velocity.y * damping) * h;
      value.x += velocity.x * h;
      value.y += velocity.y * h;
      if (value.isVector3) {
        velocity.z +=
          ((target.z - value.z) * stiffness - velocity.z * damping) * h;
        value.z += velocity.z * h;
      }
    }
  }

  const onPointerMove = (event) => {
    pointerPresent = event.pointerType !== "touch";
    pointerPosition.set(event.clientX, event.clientY);
  };
  const onPointerLeave = () => {
    pointerPresent = false;
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("blur", onPointerLeave);

  // Five-tap texture accumulation follows the mechanism in Lusion's MIT
  // WebGL-Scroll-Sync/src/shaders/img.frag. The offsets here are continuous and
  // velocity-driven, rather than the original example's randomized glitch.
  // Source: https://github.com/lusionltd/WebGL-Scroll-Sync
  // Copyright (c) 2025 Lusion Ltd
  // Permission is hereby granted, free of charge, to any person obtaining a copy
  // of this software and associated documentation files (the "Software"), to deal
  // in the Software without restriction, including without limitation the rights
  // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  // copies of the Software, and to permit persons to whom the Software is
  // furnished to do so, subject to the following conditions:
  // The above copyright notice and this permission notice shall be included in all
  // copies or substantial portions of the Software.
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  // SOFTWARE.
  const outputScene = new THREE.Scene();
  const outputCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
    stencilBuffer: false,
    samples: compact ? 0 : 2,
  });
  const outputMaterial = material(
    new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: true,
      uniforms: {
        uTexture: { value: renderTarget.texture },
        uFrame: { value: new THREE.Vector4() },
        uSize: { value: new THREE.Vector2() },
        uRadius: { value: 28 },
        uVelocity: { value: 0 },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uHover: { value: 0 },
        uEffect: { value: compact ? 0 : 1 },
      },
      vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
      fragmentShader: `
      uniform sampler2D uTexture;
      uniform vec4 uFrame;
      uniform vec2 uSize;
      uniform float uRadius;
      uniform float uVelocity;
      uniform vec2 uPointer;
      uniform float uHover;
      uniform float uEffect;
      varying vec2 vUv;

      float roundedMask(vec2 uv) {
        vec2 halfSize = uSize * 0.5;
        float radius = min(uRadius, min(halfSize.x, halfSize.y));
        vec2 p = abs((uv - 0.5) * uSize) - halfSize + radius;
        float distance = length(max(p, 0.0)) + min(max(p.x, p.y), 0.0) - radius;
        return 1.0 - smoothstep(-0.75, 0.75, distance);
      }

      vec3 background(vec2 uv) {
        // A studio backdrop is part of WebGL rather than a flat DOM gradient.
        vec3 color = mix(vec3(0.008, 0.011, 0.020), vec3(0.021, 0.032, 0.059), uv.x);
        float glow = exp(-length((uv - vec2(0.72, 0.68)) * vec2(1.5, 1.0)) * 3.0);
        color += vec3(0.008, 0.014, 0.031) * glow;
        return color;
      }

      void main() {
        float mask = roundedMask(vUv);
        if (mask < 0.001) discard;
        float velocity = clamp(uVelocity, -1.0, 1.0) * uEffect;
        float envelope = sin(vUv.y * 3.14159265) * sin(vUv.x * 3.14159265);
        vec2 bend = vec2(sin(vUv.y * 3.14159265) * velocity * 0.006,
                         (vUv.x - 0.5) * velocity * 0.028 * envelope);
        vec2 uv = vUv + bend;
        vec2 cursorDelta = uv - uPointer;
        float lens = exp(-dot(cursorDelta, cursorDelta) * 40.0) * uHover * uEffect;
        uv += cursorDelta * lens * 0.014;
        vec2 offset = vec2(velocity * 0.0005, velocity * 0.0045);
        vec3 color = vec3(0.0);
        if (uEffect > 0.5 && abs(velocity) > 0.012) {
          for (int sampleIndex = 0; sampleIndex < 5; sampleIndex++) {
            float distance = float(sampleIndex) - 2.0;
            vec2 sampleUv = clamp(uv + offset * distance, vec2(0.001), vec2(0.999));
            vec4 texel = texture2D(uTexture, uFrame.xy + sampleUv * uFrame.zw);
            color += texel.rgb + background(sampleUv) * (1.0 - texel.a);
          }
          color *= 0.2;
        } else {
          vec2 sampleUv = clamp(uv, vec2(0.001), vec2(0.999));
          vec4 texel = texture2D(uTexture, uFrame.xy + sampleUv * uFrame.zw);
          color = texel.rgb + background(sampleUv) * (1.0 - texel.a);
        }
        gl_FragColor = vec4(color, mask);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    }),
  );
  outputScene.add(
    new THREE.Mesh(geometry(new THREE.PlaneGeometry(2, 2)), outputMaterial),
  );

  function resize() {
    if (disposed) return;
    screenWidth = Math.max(1, innerWidth);
    screenHeight = Math.max(1, innerHeight);
    const ratio = Math.min(
      devicePixelRatio || 1,
      compact ? 1 : 1.5,
      (compact ? 1440 : 2560) / Math.max(screenWidth, screenHeight),
    );
    renderer.setPixelRatio(ratio);
    renderer.setSize(screenWidth, screenHeight, false);
    const drawingSize = renderer.getDrawingBufferSize(new THREE.Vector2());
    renderTarget.setSize(drawingSize.x, drawingSize.y);
  }

  function setFrame(rect) {
    legacyFrame = rect;
  }

  function getPose(item) {
    const id = item.id || `${item.chapter}:${item.project || 0}`;
    if (!poses.has(id)) {
      poses.set(id, {
        pointer: new THREE.Vector2(),
        pointerVelocity: new THREE.Vector2(),
        pointerTarget: new THREE.Vector2(),
        camera: new THREE.Vector3(),
        cameraVelocity: new THREE.Vector3(),
        cameraTarget: new THREE.Vector3(),
        hover: 0,
        initialized: false,
        parts: pieces.map((part) => ({
          current: part.base.clone(),
          velocity: new THREE.Vector3(),
          target: new THREE.Vector3(),
        })),
      });
    }
    return poses.get(id);
  }

  function applyPose(item, pose, time, dt) {
    const rect = item.rect;
    const chapter = Math.round(clamp(item.chapter, 0, 3));
    const project = Math.round(clamp(item.project || 0, 0, 2));
    const progress = clamp(item.progress || 0);
    const motion = state.motion !== false;
    const appearance = clamp(state.reveal);
    const rotation = (item.rotation || 0) + state.rotation;
    const zoom = clamp(item.zoom || 0, -1, 1);
    const inside =
      motion &&
      pointerPresent &&
      pointerPosition.x >= rect.left &&
      pointerPosition.x <= rect.left + rect.width &&
      pointerPosition.y >= rect.top &&
      pointerPosition.y <= rect.top + rect.height;
    // The same pixel under the cursor now controls the object in that frame.
    pose.pointerTarget.set(
      inside ? ((pointerPosition.x - rect.left) / rect.width) * 2 - 1 : 0,
      inside ? 1 - ((pointerPosition.y - rect.top) / rect.height) * 2 : 0,
    );
    spring(
      pose.pointer,
      pose.pointerVelocity,
      pose.pointerTarget,
      motion ? dt : 0,
    );
    pose.hover +=
      ((inside ? 1 : 0) - pose.hover) * (dt ? 1 - Math.exp(-dt * 14) : 1);
    const px = pose.pointer.x;
    const py = pose.pointer.y;
    const torqueX = motion ? clamp(pose.pointerVelocity.x, -2, 2) * 0.028 : 0;
    const torqueY = motion ? clamp(pose.pointerVelocity.y, -2, 2) * 0.022 : 0;
    const drift = motion ? scrollDrift : 0;
    const ambientTime = motion ? time : 0;

    assembly.visible = chapter < 2 && appearance > 0.001;
    satellites.visible =
      chapter === 0 && rect.width / rect.height > 1.65 && appearance > 0.001;
    finale.visible = chapter === 3 && appearance > 0.001;
    projects.forEach(({ group }, index) => {
      group.visible = chapter === 2 && index === project;
    });
    // PBR surfaces stay opaque. Scenes are changed by their registered frame,
    // so two visible windows never share a half-transparent in-between pose.
    world.position.set(px * 0.08, py * 0.07, 0);
    world.scale.setScalar(0.82 + appearance * 0.18);

    if (assembly.visible) {
      const burstEnvelope =
        chapter === 0 && motion
          ? (burstAge / 0.18) * Math.exp(1 - burstAge / 0.18)
          : 0;
      const separation = clamp(
        (item.explode ?? (chapter === 1 ? 0.78 : progress * 0.5)) +
          burstEnvelope * 1.05,
        0,
        1.55,
      );
      pieces.forEach((part, index) => {
        const local = pose.parts[index];
        local.target.copy(part.base).addScaledVector(part.apart, separation);
        const dx = part.base.x - px * 2.1;
        const dy = part.base.y - py * 1.65;
        const distance = Math.hypot(dx, dy);
        if (pose.hover > 0.001 && distance < 1.8 && distance > 0.01) {
          const strength = (1 - distance / 1.8) * 0.42 * pose.hover;
          local.target.x += (dx / distance) * strength;
          local.target.y += (dy / distance) * strength;
          local.target.z += strength * 0.62;
        }
        spring(
          local.current,
          local.velocity,
          local.target,
          pose.initialized && motion ? dt : 0,
          155,
          24,
        );
        part.object.position.copy(local.current);
      });
      assembly.position.set(0, Math.sin(ambientTime * 0.42) * 0.04, 0);
      assembly.rotation.set(
        -0.17 + progress * 0.12 + py * 0.16 + torqueY,
        -0.23 + rotation * 0.42 + progress * 0.2 + px * 0.26 + torqueX,
        -0.12 + rotation * 0.065 - drift * 0.065,
      );
      assembly.scale.setScalar(1);
      outerRing.rotation.z = ambientTime * 0.038 + progress * 0.7;
      innerRing.rotation.z = -ambientTime * 0.03 - progress * 0.38;
    }

    if (satellites.visible) {
      const spread = 2.85 + 0.7 * smooth(1.65, 2.5, rect.width / rect.height);
      leftSatellite.position.set(
        -spread - progress * 0.8,
        0.13 + Math.sin(ambientTime * 0.36) * 0.04,
        -0.32,
      );
      rightSatellite.position.set(
        spread + progress * 0.8,
        -0.1 + Math.sin(ambientTime * 0.34 + 1.7) * 0.04,
        -0.45,
      );
      leftSatellite.rotation.y = -0.18 - progress * 0.22 + px * 0.07;
      rightSatellite.rotation.y = 0.15 + progress * 0.22 + px * 0.07;
      satellites.scale.setScalar(1);
    }

    if (chapter === 2) {
      const group = projects[project].group;
      group.position.set(0, pose.hover * 0.05, 0);
      group.scale.setScalar(1);
      group.rotation.set(
        -py * 0.085 + torqueY,
        px * 0.16 + rotation * 0.35 + torqueX,
        -drift * 0.028,
      );
      if (project === 0) {
        armBase.rotation.z =
          0.04 + Math.sin(ambientTime * 0.72) * 0.085 + py * 0.09;
        elbow.rotation.z = -0.62 + Math.sin(ambientTime * 0.72 + 0.8) * 0.1;
      } else if (project === 1) {
        radioRings.rotation.z =
          Math.sin(ambientTime * 0.4) * 0.07 + drift * 0.08;
        basket.rotation.z = Math.sin(ambientTime * 0.65) * 0.025;
      } else {
        graphCore.rotation.y =
          0.4 + Math.sin(ambientTime * 0.4) * 0.2 + px * 0.15;
      }
    }

    if (finale.visible) {
      finale.position.set(0, pose.hover * 0.055, 0);
      finale.rotation.set(
        py * 0.12 + torqueY,
        px * 0.19 + rotation * 0.3 + torqueX,
        -drift * 0.05,
      );
      finale.scale.setScalar(1);
      finaleInner.rotation.z = -ambientTime * 0.048 + progress * 0.7;
    }

    camera.fov = compact ? 31 : 29;
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    const panoramic = satellites.visible;
    const heightToFit = chapter === 1 ? 5.7 : chapter === 2 ? 4.75 : 4.25;
    const widthToFit = panoramic
      ? 8.7
      : chapter === 1
        ? 6.1
        : chapter === 2
          ? 4.25
          : 4.45;
    const tangent = Math.tan((camera.fov * Math.PI) / 360) * 2;
    const distance =
      Math.max(heightToFit / tangent, widthToFit / (camera.aspect * tangent)) *
      (1 - zoom * 0.11);
    pose.cameraTarget.set(
      Math.sin(rotation * 0.28) * distance * 0.085 + drift * 0.07,
      progress * distance * 0.015,
      distance,
    );
    spring(
      pose.camera,
      pose.cameraVelocity,
      pose.cameraTarget,
      pose.initialized && motion ? dt : 0,
      120,
      23,
    );
    camera.position.copy(pose.camera);
    camera.lookAt(0, 0, 0);
    pose.initialized = true;
  }

  function frameViewport(rect) {
    const left = Math.max(0, rect.left);
    const top = Math.max(0, rect.top);
    const right = Math.min(screenWidth, rect.left + rect.width);
    const bottom = Math.min(screenHeight, rect.top + rect.height);
    renderer.setViewport(
      rect.left,
      screenHeight - rect.top - rect.height,
      rect.width,
      rect.height,
    );
    renderer.setScissor(
      left,
      screenHeight - bottom,
      right - left,
      bottom - top,
    );
    renderer.setScissorTest(true);
  }

  function renderFrames(time = 0, delta = 1 / 60, frames = []) {
    if (disposed) return;
    const dt =
      state.motion === false
        ? 0
        : clamp(Number.isFinite(delta) ? delta : 1 / 60, 0, 0.05);
    const seconds = Number.isFinite(time) ? time : 0;
    burstAge = Math.min(10, burstAge + dt);
    scrollDrift = dt
      ? scrollDrift +
        (clamp(state.velocity || 0, -1, 1) - scrollDrift) *
          (1 - Math.exp(-dt * 9))
      : 0;
    const visibleFrames = frames.filter(
      ({ rect }) =>
        rect &&
        [rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) &&
        rect.width > 1 &&
        rect.height > 1 &&
        rect.left < screenWidth &&
        rect.top < screenHeight &&
        rect.left + rect.width > 0 &&
        rect.top + rect.height > 0,
    );

    renderer.setRenderTarget(renderTarget);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, screenWidth, screenHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, true, true);
    // Both scenes can coexist while a section crosses the viewport. Render the
    // actual geometry where its DOM window is, with independent pose histories.
    for (const item of visibleFrames) {
      const pose = getPose(item);
      applyPose(item, pose, seconds, dt);
      frameViewport(item.rect);
      renderer.clear(false, true, false);
      renderer.render(scene, camera);
    }

    renderer.setRenderTarget(null);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, screenWidth, screenHeight);
    renderer.clear(true, true, true);
    for (const item of visibleFrames) {
      const rect = item.rect;
      const pose = getPose(item);
      const uniforms = outputMaterial.uniforms;
      uniforms.uFrame.value.set(
        rect.left / screenWidth,
        (screenHeight - rect.top - rect.height) / screenHeight,
        rect.width / screenWidth,
        rect.height / screenHeight,
      );
      uniforms.uSize.value.set(rect.width, rect.height);
      uniforms.uRadius.value = Math.max(0, item.radius ?? 28);
      uniforms.uVelocity.value = scrollDrift;
      uniforms.uPointer.value.set(
        pose.pointer.x * 0.5 + 0.5,
        pose.pointer.y * 0.5 + 0.5,
      );
      uniforms.uHover.value = pose.hover;
      uniforms.uEffect.value = compact || state.motion === false ? 0 : 1;
      frameViewport(rect);
      renderer.render(outputScene, outputCamera);
    }
    renderer.setScissorTest(false);
  }

  function render(time = 0, delta = 1 / 60) {
    renderFrames(time, delta, [
      {
        rect: legacyFrame || {
          left: 0,
          top: 0,
          width: screenWidth,
          height: screenHeight,
        },
        chapter: Math.round(state.chapter),
        project: Math.round(state.project),
        explode: state.explode,
        rotation: 0,
        zoom: state.zoom,
        radius: legacyFrame ? 28 : 0,
      },
    ]);
  }

  function burst() {
    if (state.motion !== false) burstAge = 0;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    window.removeEventListener("pointermove", onPointerMove);
    document.documentElement.removeEventListener(
      "pointerleave",
      onPointerLeave,
    );
    window.removeEventListener("blur", onPointerLeave);
    for (const shape of resources.geometries) shape.dispose();
    for (const surface of resources.materials) surface.dispose();
    poses.clear();
    renderTarget.dispose();
    environment?.dispose();
    renderer.dispose();
  }

  resize();
  return { state, render, renderFrames, resize, setFrame, dispose, burst };
}

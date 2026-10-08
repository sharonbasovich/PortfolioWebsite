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
  renderer.toneMappingExposure = 1.38;
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(
    Math.min(devicePixelRatio || 1, compact ? 1.25 : 1.65),
  );
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
        transparent: true,
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

  scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x15223e, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 3.3);
  key.position.set(-4, 6, 8);
  scene.add(key);
  const blueRim = new THREE.PointLight(0x4081ff, 54, 30);
  blueRim.position.set(4, 0, 3);
  scene.add(blueRim);
  const paleRim = new THREE.PointLight(0xdbedff, 39, 30);
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
  };
  const pointerTarget = new THREE.Vector2();
  const pointer = new THREE.Vector2();
  let burstStrength = 0;
  let internalTime = 0;
  let disposed = false;
  let frame = null;
  let screenWidth = 1;
  let screenHeight = 1;

  const onPointerMove = (event) => {
    pointerTarget.x = clamp((event.clientX / innerWidth - 0.5) * 2, -1, 1);
    pointerTarget.y = clamp((0.5 - event.clientY / innerHeight) * 2, -1, 1);
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  function resize() {
    if (disposed) return;
    screenWidth = Math.max(1, innerWidth);
    screenHeight = Math.max(1, innerHeight);
    camera.aspect = frame
      ? frame.width / frame.height
      : screenWidth / screenHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(screenWidth, screenHeight, false);
  }

  // Coordinates are CSS pixels from getBoundingClientRect(), not device pixels.
  // A null frame restores the original full-viewport composition.
  function setFrame(rect) {
    if (disposed) return;
    const previousFov = camera.fov;
    const previousAspect = camera.aspect;
    if (
      !rect ||
      ![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) ||
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      frame = null;
      camera.fov = compact ? 43 : 36;
      camera.aspect = screenWidth / screenHeight;
    } else {
      frame = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
      camera.fov = compact ? 27 : 29;
      camera.aspect = frame.width / frame.height;
    }
    if (
      Math.abs(camera.fov - previousFov) > 0.001 ||
      Math.abs(camera.aspect - previousAspect) > 0.001
    ) {
      camera.updateProjectionMatrix();
    }
  }

  const opacity = (surfaces, weight) => {
    for (const surface of surfaces) {
      surface.opacity = weight;
      if (surface.isMeshPhysicalMaterial) surface.depthWrite = weight > 0.99;
    }
  };

  function render(time, delta = 1 / 60) {
    if (disposed) return;
    const dt = clamp(Number.isFinite(delta) ? delta : 1 / 60, 0, 0.05);
    internalTime = Number.isFinite(time)
      ? time > 10000
        ? time / 1000
        : time
      : internalTime + dt;
    pointer.lerp(pointerTarget, 1 - Math.exp(-dt * 4.2));
    burstStrength *= Math.exp(-dt * 3.9);

    const chapter = clamp(state.chapter, 0, 3);
    const inspection = smooth(0.33, 1.16, chapter);
    const projectsIn = smooth(1.46, 2, chapter);
    const finaleIn = smooth(2.58, 2.98, chapter);
    const appearance = clamp(state.reveal);
    const heroWeight = (1 - projectsIn) * appearance;
    const projectWeight = projectsIn * (1 - finaleIn) * appearance;
    const finaleWeight = finaleIn * appearance;
    const separation = clamp(
      state.explode + inspection * 0.78 + burstStrength * 1.2,
      0,
      1.55,
    );
    const settle = 1 - Math.exp(-dt * 8.5);

    assembly.visible = heroWeight > 0.008;
    if (assembly.visible) {
      const px = pointer.x * 1.95;
      const py = pointer.y * 1.15;
      for (const part of pieces) {
        part.target.copy(part.base).addScaledVector(part.apart, separation);
        // Only nearby pieces yield to the cursor; the rest maintain their mass.
        const dx = part.base.x - px;
        const dy = part.base.y - py;
        const distance = Math.hypot(dx, dy);
        if (distance < 1.55 && distance > 0.01) {
          const strength = (1 - distance / 1.55) * 0.32;
          part.target.x += (dx / distance) * strength;
          part.target.y += (dy / distance) * strength;
          part.target.z += strength * 0.22;
        }
        if (dt === 0) part.current.copy(part.target);
        else part.current.lerp(part.target, settle);
        part.object.position.copy(part.current);
      }
      assembly.position.set(
        frame ? 0 : (compact ? 0 : 1.64 * inspection) * (1 - projectsIn),
        (frame ? 0 : compact ? -0.33 : -0.58 + inspection * 0.52) +
          Math.sin(internalTime * 0.48) * 0.055,
        0,
      );
      assembly.rotation.set(
        -0.14 + pointer.y * 0.12,
        -0.2 + pointer.x * 0.18 + state.rotation * 0.22,
        -0.13 + Math.sin(internalTime * 0.24) * 0.035,
      );
      assembly.scale.setScalar(
        (frame ? 1.06 : compact ? 0.73 : 1) * (0.68 + 0.32 * heroWeight),
      );
      opacity(assemblySurfaces, heroWeight);
      outerRing.rotation.z = internalTime * 0.045;
      innerRing.rotation.z = -internalTime * 0.033;
    }

    // Side pieces belong only to the wide opening. They retreat as the watch
    // separates, leaving the smaller inspection window free of edge clutter.
    const panoramic = frame ? smooth(1.43, 1.92, camera.aspect) : 0;
    const satelliteWeight =
      heroWeight * (1 - smooth(0.14, 0.88, chapter)) * panoramic;
    satellites.visible = satelliteWeight > 0.008;
    if (satellites.visible) {
      const spread = 2.85 + 0.9 * smooth(1.5, 2.4, camera.aspect);
      leftSatellite.position.set(
        -spread - burstStrength * 0.45 + pointer.x * -0.08,
        0.13 + Math.sin(internalTime * 0.39) * 0.05,
        -0.32,
      );
      rightSatellite.position.set(
        spread + burstStrength * 0.45 + pointer.x * 0.08,
        -0.1 + Math.sin(internalTime * 0.34 + 1.7) * 0.06,
        -0.45,
      );
      leftSatellite.rotation.y = -0.18 + pointer.x * 0.055;
      rightSatellite.rotation.y = 0.15 + pointer.x * 0.05;
      satellites.scale.setScalar(0.78 + 0.22 * satelliteWeight);
      opacity(satelliteSurfaces, satelliteWeight);
    }

    const selectedProject = clamp(state.project, 0, 2);
    projects.forEach(({ group, surfaces }, index) => {
      const selectionWeight = clamp(1 - Math.abs(selectedProject - index));
      const weight = selectionWeight * projectWeight;
      group.visible = weight > 0.008;
      if (!group.visible) return;
      group.position.set(
        frame ? 0 : compact ? 0 : -2.33,
        frame ? 0 : compact ? -0.43 : -0.12,
        0,
      );
      group.scale.setScalar(
        (frame ? (compact ? 0.88 : 1.04) : compact ? 0.71 : 0.91) *
          (0.69 + 0.31 * weight),
      );
      group.rotation.y =
        pointer.x * 0.095 + Math.sin(internalTime * 0.35) * 0.035;
      group.rotation.x = -pointer.y * 0.055;
      opacity(surfaces, weight);
    });
    if (projects[0].group.visible) {
      armBase.rotation.z = 0.06 + Math.sin(internalTime * 0.72) * 0.095;
      elbow.rotation.z = -0.62 + Math.sin(internalTime * 0.72 + 0.8) * 0.11;
    }
    if (projects[1].group.visible)
      radioRings.rotation.z = Math.sin(internalTime * 0.4) * 0.075;
    if (projects[2].group.visible)
      graphCore.rotation.y = 0.4 + Math.sin(internalTime * 0.4) * 0.22;

    finale.visible = finaleWeight > 0.008;
    if (finale.visible) {
      finale.position.set(
        frame ? 0 : compact ? 0 : 2.23,
        frame ? 0 : compact ? -0.34 : 0.06,
        0,
      );
      finale.rotation.set(
        pointer.y * 0.08,
        pointer.x * 0.14,
        state.rotation * 0.18,
      );
      finale.scale.setScalar(
        (frame ? (compact ? 0.96 : 1.07) : compact ? 0.75 : 1) *
          (0.65 + 0.35 * finaleWeight),
      );
      finaleInner.rotation.z = -internalTime * 0.055;
      opacity(finaleSurfaces, finaleWeight);
    }

    const baseDistance = frame ? (compact ? 9.5 : 8.6) : compact ? 13.7 : 12.5;
    const minimumFitDistance = frame
      ? (compact ? 4.6 : 5.1) /
        (Math.max(0.15, camera.aspect) *
          2 *
          Math.tan((camera.fov * Math.PI) / 360))
      : 0;
    camera.position.z = Math.max(
      baseDistance - clamp(state.zoom, -1, 1) * 1.5,
      minimumFitDistance,
    );
    world.position.x = pointer.x * (compact ? 0.08 : 0.16);
    world.position.y = pointer.y * 0.1;

    // Clear the *whole* canvas before changing the viewport. Otherwise a moving
    // scroll window leaves the previous frame painted behind it.
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, screenWidth, screenHeight);
    renderer.clear(true, true, true);
    if (frame) {
      const left = Math.max(0, frame.left);
      const top = Math.max(0, frame.top);
      const right = Math.min(screenWidth, frame.left + frame.width);
      const bottom = Math.min(screenHeight, frame.top + frame.height);
      if (right > left && bottom > top) {
        renderer.setViewport(
          frame.left,
          screenHeight - frame.top - frame.height,
          frame.width,
          frame.height,
        );
        renderer.setScissor(
          left,
          screenHeight - bottom,
          right - left,
          bottom - top,
        );
        renderer.setScissorTest(true);
        renderer.render(scene, camera);
        renderer.setScissorTest(false);
      }
    } else {
      renderer.render(scene, camera);
    }
  }

  function burst() {
    burstStrength = Math.max(burstStrength, 1.25);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    window.removeEventListener("pointermove", onPointerMove);
    for (const shape of resources.geometries) shape.dispose();
    for (const surface of resources.materials) surface.dispose();
    environment?.dispose();
    renderer.dispose();
  }

  resize();
  render(0);
  return { state, render, resize, setFrame, dispose, burst };
}

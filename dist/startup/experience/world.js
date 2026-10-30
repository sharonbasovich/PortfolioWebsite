import * as THREE from "../vendor/three/three.module.js";
import { RoomEnvironment } from "../vendor/three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "../vendor/three/addons/geometries/RoundedBoxGeometry.js";
import { createDockSparks } from "./dock-sparks.js?v=20261023-polish";

// The site owns the ticker and scroll timeline. This module only renders the current state.
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (start, end, value) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

export function createWorld(
  canvas,
  { compact = false, initialBurst = 0, contained = false } = {},
) {
  if (!canvas) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      // The scene target owns antialiasing; avoid resolving the same frame twice.
      antialias: false,
      powerPreference: "high-performance",
    });
  } catch (error) {
    console.warn("The interactive scene could not start.", error);
    return null;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.14;
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);
  const context = renderer.getContext();
  const rendererExtension = context.getExtension("WEBGL_debug_renderer_info");
  const rendererName = rendererExtension
    ? String(context.getParameter(rendererExtension.UNMASKED_RENDERER_WEBGL))
    : "WebGL 2";
  const softwareRenderer = /swiftshader|llvmpipe|software/i.test(rendererName);
  renderer.setPixelRatio(
    Math.min(devicePixelRatio || 1, compact || softwareRenderer ? 1 : 1.25),
  );
  renderer.info.autoReset = false;

  const scene = new THREE.Scene();
  const dockSparks = createDockSparks({ compact });
  scene.add(dockSparks.object);
  let dockArmed = false;
  let previousDockProgress = null;
  const camera = new THREE.PerspectiveCamera(compact ? 43 : 36, 1, 0.1, 100);
  camera.position.set(0, 0, compact ? 13.7 : 12.5);
  camera.lookAt(0, 0, 0);

  const resources = { geometries: new Set(), materials: new Set() };
  const shapeCache = new Map();
  const geometry = (value) => (resources.geometries.add(value), value);
  const material = (value) => (resources.materials.add(value), value);
  const physical = (color, metalness, roughness, options = {}) => {
    const { clearcoat = 0, clearcoatRoughness = 0.13, ...rest } = options;
    const Surface = clearcoat
      ? THREE.MeshPhysicalMaterial
      : THREE.MeshStandardMaterial;
    return material(
      new Surface({
        color,
        metalness,
        roughness,
        transparent: false,
        envMapIntensity: 1.08,
        ...(clearcoat ? { clearcoat, clearcoatRoughness } : {}),
        ...rest,
      }),
    );
  };
  const basic = (color, opacity = 1) =>
    material(
      new THREE.MeshBasicMaterial({
        color,
        opacity,
        transparent: true,
        depthWrite: false,
      }),
    );
  const cachedShape = (key, create) => {
    if (!shapeCache.has(key)) shapeCache.set(key, geometry(create()));
    return shapeCache.get(key);
  };
  const rounded = (width, height, depth, radius = 0.09) =>
    cachedShape(
      `round:${width}:${height}:${depth}:${radius}`,
      () =>
        new RoundedBoxGeometry(width, height, depth, compact ? 2 : 3, radius),
    );
  const box = (width, height, depth) =>
    cachedShape(
      `box:${width}:${height}:${depth}`,
      () => new THREE.BoxGeometry(width, height, depth),
    );
  const torus = (radius, tube = 0.05) =>
    cachedShape(
      `torus:${radius}:${tube}`,
      () =>
        new THREE.TorusGeometry(
          radius,
          tube,
          compact ? 8 : 10,
          compact ? 56 : 80,
        ),
    );
  const sphere = (radius, detail = 2) =>
    cachedShape(
      `sphere:${radius}:${detail}`,
      () => new THREE.IcosahedronGeometry(radius, detail),
    );
  const addMesh = (parent, shape, surface, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(shape, surface);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  let environment;
  function rebuildEnvironment() {
    // This texture is rendered GPU data, not an uploaded image. Its contents do
    // not survive context loss, so Three's object restoration alone is insufficient.
    let generator;
    let room;
    const previous = environment;
    try {
      generator = new THREE.PMREMGenerator(renderer);
      room = new RoomEnvironment();
      environment = generator.fromScene(room, 0.04);
      scene.environment = environment.texture;
      previous?.dispose();
    } catch (error) {
      scene.environment = null;
      environment = undefined;
      previous?.dispose();
      console.warn("Using direct lighting for the interactive scene.", error);
    } finally {
      room?.dispose();
      generator?.dispose();
    }
  }
  rebuildEnvironment();

  scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x0c1426, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 3.15);
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

  let paletteCache;
  const makePalette = () => {
    if (paletteCache) return paletteCache;
    const cobalt = physical(0x315fdf, 0.67, 0.17, {
      clearcoat: 1,
      clearcoatRoughness: 0.07,
    });
    const deepBlue = physical(0x092a76, 0.79, 0.24);
    // Bare metal has no second lacquer lobe. Keep that cost for the cobalt enamel.
    const chrome = physical(0xd3deeb, 1, 0.115);
    const dark = physical(0x121a2c, 0.7, 0.26);
    const ivory = physical(0xf4f3ee, 0.23, 0.22, { clearcoat: 0.9 });
    const electric = physical(0x7bc5ff, 0.35, 0.15, {
      emissive: 0x2575ff,
      emissiveIntensity: 0.32,
      clearcoat: 0.35,
    });
    paletteCache = { cobalt, deepBlue, chrome, dark, ivory, electric };
    return paletteCache;
  };

  // A watch movement crossed with a robot joint: a dense, asymmetric object that
  // reads as machinery from afar and rewards a closer look with real construction.
  const assembly = new THREE.Group();
  world.add(assembly);
  const a = makePalette();
  const assemblySurfaces = Object.values(a);
  const pieces = [];
  const pieceIndices = new WeakMap();
  const piece = (object, x, y, z, dx, dy, dz) => {
    object.position.set(x, y, z);
    assembly.add(object);
    const index = pieces.length;
    object.traverse((child) => {
      if (child.isMesh) pieceIndices.set(child, index);
    });
    pieces.push({
      object,
      base: new THREE.Vector3(x, y, z),
      apart: new THREE.Vector3(dx, dy, dz),
      current: new THREE.Vector3(x, y, z),
      target: new THREE.Vector3(),
      restRotation: object.rotation.clone(),
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
  counterweight.name = "ivory-counterweight";
  counterweight.rotation.z = 0.22;
  const ivoryBlock = addMesh(
    counterweight,
    rounded(0.98, 0.66, 0.92, 0.19),
    a.ivory,
  );
  ivoryBlock.name = "ivory-counterweight-shell";
  // A flush face insert belongs to the same local frame as the shell. The old
  // unrotated shoe sat below the tilted shell and looked like metal clipping
  // through its underside.
  addMesh(
    counterweight,
    rounded(0.62, 0.075, 0.1, 0.035),
    a.chrome,
    0,
    -0.1,
    0.45,
  );
  // The ring and counterweight have separate depth envelopes, including the
  // assembled pose. Opening the movement increases their clearance further.
  piece(counterweight, -1.58, 1.28, 1.48, -1.08, 0.9, 0.8);
  const counterweightFitMatrix = new THREE.Matrix4();
  const counterweightFitPoint = new THREE.Vector3();
  const counterweightFitCorners = [];
  for (const x of [-0.49, 0.49])
    for (const y of [-0.33, 0.33])
      for (const z of [-0.46, 0.5])
        counterweightFitCorners.push(new THREE.Vector3(x, y, z));

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

  // A rigid bone per mechanical part lets six material batches carry the whole
  // movement. Every vertex belongs to exactly one part: no shape deformation or
  // blended joints. Keep the original meshes as precise, invisible pick proxies.
  // This removes the draw call per screw/housing without losing independent kicks.
  scene.updateMatrixWorld(true);
  const rotatingBoneIndices = new Map([
    [outerRing, pieces.length],
    [innerRing, pieces.length + 1],
  ]);
  const skeleton = new THREE.Skeleton([
    ...pieces.map((part) => part.object),
    outerRing,
    innerRing,
  ]);
  const batches = new Map();
  const carrierPartIndex = pieces.findIndex((part) => part.object === floatingModule);
  // One visible module shares the source geometry/materials. The original remains
  // the rigid bone and exact pick proxy, including while the visible module flies.
  const carrier = new THREE.Group();
  carrier.matrixAutoUpdate = false;
  carrier.visible = false;
  for (const source of floatingModule.children) {
    const mesh = source.clone();
    mesh.visible = true;
    carrier.add(mesh);
  }
  scene.add(carrier);
  const toAssembly = new THREE.Matrix4().copy(assembly.matrixWorld).invert();
  const transform = new THREE.Matrix4();
  const instanceTransform = new THREE.Matrix4();
  const appendRigidGeometry = (mesh, partIndex, instanceIndex = null) => {
    const boneIndex = rotatingBoneIndices.get(mesh) ?? partIndex;
    transform.multiplyMatrices(toAssembly, mesh.matrixWorld);
    if (instanceIndex !== null) {
      mesh.getMatrixAt(instanceIndex, instanceTransform);
      transform.multiply(instanceTransform);
    }
    const source = mesh.geometry.index
      ? mesh.geometry.toNonIndexed()
      : mesh.geometry.clone();
    source.applyMatrix4(transform);
    const position = source.getAttribute("position");
    const normal = source.getAttribute("normal");
    const uv = source.getAttribute("uv");
    if (!batches.has(mesh.material)) {
      batches.set(mesh.material, {
        position: [],
        normal: [],
        uv: [],
        skinIndex: [],
        skinWeight: [],
      });
    }
    const batch = batches.get(mesh.material);
    for (let vertex = 0; vertex < position.count; vertex++) {
      batch.position.push(
        position.getX(vertex),
        position.getY(vertex),
        position.getZ(vertex),
      );
      batch.normal.push(
        normal.getX(vertex),
        normal.getY(vertex),
        normal.getZ(vertex),
      );
      batch.uv.push(uv ? uv.getX(vertex) : 0, uv ? uv.getY(vertex) : 0);
      batch.skinIndex.push(boneIndex, 0, 0, 0);
      batch.skinWeight.push(1, 0, 0, 0);
    }
    source.dispose();
  };
  pieces.forEach((part, partIndex) => {
    part.object.traverse((mesh) => {
      if (!mesh.isMesh) return;
      if (partIndex === carrierPartIndex) {
        mesh.visible = false;
        return;
      }
      if (mesh.isInstancedMesh) {
        for (let index = 0; index < mesh.count; index++)
          appendRigidGeometry(mesh, partIndex, index);
      } else appendRigidGeometry(mesh, partIndex);
      mesh.visible = false;
    });
  });
  for (const [surface, batch] of batches) {
    const shape = geometry(new THREE.BufferGeometry());
    shape.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(batch.position, 3),
    );
    shape.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(batch.normal, 3),
    );
    shape.setAttribute("uv", new THREE.Float32BufferAttribute(batch.uv, 2));
    shape.setAttribute(
      "skinIndex",
      new THREE.Uint16BufferAttribute(batch.skinIndex, 4),
    );
    shape.setAttribute(
      "skinWeight",
      new THREE.Float32BufferAttribute(batch.skinWeight, 4),
    );
    const mesh = new THREE.SkinnedMesh(shape, surface);
    mesh.frustumCulled = false;
    assembly.add(mesh);
    mesh.bind(skeleton, new THREE.Matrix4());
  }

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
  const irisBlades = [];
  for (let index = 0; index < 6; index++) {
    const angle = (index / 6) * Math.PI * 2;
    const blade = addMesh(
      finale,
      rounded(0.35, 1.07, 0.28, 0.14),
      index % 2 ? f.dark : f.deepBlue,
    );
    blade.position.set(Math.sin(angle) * 0.88, Math.cos(angle) * 0.88, 0.34);
    blade.rotation.z = -angle - 0.35;
    irisBlades.push({ blade, angle });
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
    // A desired, sustained disassembly state. The engine owns its physical settle.
    burst: clamp(initialBurst),
  };
  let disposed = false;
  let screenWidth = 1;
  let screenHeight = 1;
  let legacyFrame = null;
  let pointerPresent = false;
  const pointerPosition = new THREE.Vector2(-10000, -10000);
  const poses = new Map();
  let burstValue = clamp(initialBurst);
  let burstVelocity = 0;
  let scrollDrift = 0;
  let contextLost = false;
  let renderedFrames = 0;
  let submissionMs = 0;
  let frameIntervalMs = 0;
  let lastTime = null;
  let pixelRatio = 1;
  let qualityScale = 1;
  let nextQualityProbe = 75;
  let lastWallTime = null;
  let lastFrames = [];
  let lastCarrierInput = null;
  let apertureValue = 0;
  let hitCount = 0;
  let kickCount = 0;
  let peakSpringOffset = 0;
  let lastHitPart = null;
  const raycaster = new THREE.Raycaster();
  const hits = [];
  const hitParts = new Set();
  const pickTargets = pieces.map((part) => part.object);
  const sweepPoint = new THREE.Vector2();
  const sweepDelta = new THREE.Vector2();
  const cameraRight = new THREE.Vector3();
  const cameraUp = new THREE.Vector3();
  const kick = new THREE.Vector3();
  const inverseAssembly = new THREE.Matrix4();
  const zero = new THREE.Vector3();

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
  const onContextLost = (event) => {
    event.preventDefault();
    contextLost = true;
    onPointerLeave();
  };
  const onContextRestored = () => {
    contextLost = false;
    const restoreTime = lastTime ?? 0;
    rebuildEnvironment();
    resize();
    // Also restore a paused scene immediately, without restarting its clock.
    if (lastFrames.length || (carrierPose.enabled && carrierPose.owner === "flight")) {
      const wasMoving = state.motion;
      state.motion = false;
      renderFrames(restoreTime, 0, lastFrames, lastCarrierInput);
      state.motion = wasMoving;
    }
    lastWallTime = null;
  };
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

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
    samples: softwareRenderer ? 0 : 2,
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
    // Native scrolling can put the single canvas inside its active DOM frame.
    // Its compositor position then moves with the page instead of waiting for
    // the next WebGL scissor update on a viewport-fixed canvas.
    screenWidth = Math.max(1, contained ? canvas.clientWidth : innerWidth);
    screenHeight = Math.max(1, contained ? canvas.clientHeight : innerHeight);
    const ratio = Math.min(
      devicePixelRatio || 1,
      (softwareRenderer ? (compact ? 0.9 : 1) : compact ? 1.25 : 1.5) *
        qualityScale,
      (compact ? 1440 : 2200) / Math.max(screenWidth, screenHeight),
    );
    pixelRatio = ratio;
    renderer.setPixelRatio(ratio);
    renderer.setSize(screenWidth, screenHeight, false);
    const drawingSize = renderer.getDrawingBufferSize(new THREE.Vector2());
    renderTarget.setSize(drawingSize.x, drawingSize.y);
  }

  function setFrame(rect) {
    legacyFrame = rect;
  }

  const frameKey = (item) => item.id || `${item.chapter}:${item.project || 0}`;

  function getPose(item) {
    const id = frameKey(item);
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
        pointerWasInside: false,
        previousPointer: new THREE.Vector2(),
        layoutPose: null,
        torqueX: 0,
        torqueY: 0,
        drift: 0,
        aspect: 0,
        parts: pieces.map((part) => ({
          current: part.base.clone(),
          velocity: new THREE.Vector3(),
          target: new THREE.Vector3(),
          offset: new THREE.Vector3(),
          offsetVelocity: new THREE.Vector3(),
          rotation: new THREE.Vector3(),
          rotationVelocity: new THREE.Vector3(),
          lastHit: -10,
        })),
      });
    }
    return poses.get(id);
  }

  function applyPose(item, pose, time, dt, advance = true) {
    const rect = item.rect;
    const chapter = Math.round(clamp(item.chapter, 0, 3));
    const project = Math.round(clamp(item.project || 0, 0, 2));
    const motion = state.motion !== false;
    const inputPose = {
      progress: clamp(item.progress || 0),
      appearance: clamp(state.reveal),
      rotation: (item.rotation || 0) + state.rotation,
      zoom: clamp(item.zoom || 0, -1, 1),
    };
    if (motion || !pose.layoutPose) pose.layoutPose = inputPose;
    const { progress, appearance, rotation, zoom } = pose.layoutPose;
    const inside =
      motion &&
      pointerPresent &&
      pointerPosition.x >= rect.left &&
      pointerPosition.x <= rect.left + rect.width &&
      pointerPosition.y >= rect.top &&
      pointerPosition.y <= rect.top + rect.height;
    // The same pixel under the cursor now controls the object in that frame.
    if (motion && advance) {
      pose.pointerTarget.set(
        inside ? ((pointerPosition.x - rect.left) / rect.width) * 2 - 1 : 0,
        inside ? 1 - ((pointerPosition.y - rect.top) / rect.height) * 2 : 0,
      );
      spring(pose.pointer, pose.pointerVelocity, pose.pointerTarget, dt);
      pose.hover +=
        ((inside ? 1 : 0) - pose.hover) * (dt ? 1 - Math.exp(-dt * 14) : 1);
    }
    const px = pose.pointer.x;
    const py = pose.pointer.y;
    if (motion) {
      pose.torqueX = clamp(pose.pointerVelocity.x, -2, 2) * 0.028;
      pose.torqueY = clamp(pose.pointerVelocity.y, -2, 2) * 0.022;
      pose.drift = scrollDrift;
    }
    const { torqueX, torqueY, drift } = pose;
    // Caller freezes the supplied time on pause, preserving the exact displayed pose.
    const ambientTime = time;

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
      const separation = clamp(
        (item.explode ?? (chapter === 1 ? 0.78 : progress * 0.5)) +
          (chapter === 0 ? burstValue * 1.05 : 0),
        0,
        1.55,
      );
      pieces.forEach((part, index) => {
        const local = pose.parts[index];
        local.target.copy(part.base).addScaledVector(part.apart, separation);
        if (!pose.initialized) local.current.copy(local.target);
        else if (motion && dt && advance) {
          spring(local.current, local.velocity, local.target, dt, 110, 21);
          spring(local.offset, local.offsetVelocity, zero, dt, 36, 7.6);
          spring(local.rotation, local.rotationVelocity, zero, dt, 30, 7.2);
          local.offset.clampLength(0, 0.95);
          peakSpringOffset = Math.max(peakSpringOffset, local.offset.length());
          local.offsetVelocity.clampLength(0, 7);
          local.rotation.clampLength(0, 0.58);
          local.rotationVelocity.clampLength(0, 4);
        }
        part.object.position.copy(local.current).add(local.offset);
        part.object.rotation.set(
          part.restRotation.x + local.rotation.x,
          part.restRotation.y + local.rotation.y,
          part.restRotation.z + local.rotation.z,
        );
      });
      // A slow, visible rocking cycle keeps the mechanism alive away from the
      // cursor. It shares the frozen site clock, with a smaller native-phone
      // amplitude and no extra simulation, allocation or rendering pass.
      const idle = chapter === 0 ? (compact ? 0.58 : 1) : 0.4;
      assembly.position.set(
        Math.sin(ambientTime * 0.37) * 0.045 * idle,
        Math.sin(ambientTime * 0.53) * 0.12 * idle,
        0,
      );
      assembly.rotation.set(
        -0.17 + Math.sin(ambientTime * 0.43) * 0.045 * idle +
          progress * 0.12 + py * 0.16 + torqueY,
        -0.23 + Math.sin(ambientTime * 0.36 + 0.65) * 0.09 * idle +
          rotation * 0.42 + progress * 0.2 + px * 0.26 + torqueX,
        -0.12 + Math.sin(ambientTime * 0.31) * 0.027 * idle +
          rotation * 0.065 - drift * 0.065,
      );
      assembly.scale.setScalar(1);
      outerRing.rotation.z = ambientTime * 0.068 + progress * 0.7;
      innerRing.rotation.z = -ambientTime * 0.058 - progress * 0.38;
    }

    if (satellites.visible) {
      const spread = 2.85 + 0.7 * smooth(1.65, 2.5, rect.width / rect.height);
      leftSatellite.position.set(
        -spread - progress * 0.8,
        0.13 + Math.sin(ambientTime * 0.47) * 0.14,
        -0.32,
      );
      rightSatellite.position.set(
        spread + progress * 0.8,
        -0.1 + Math.sin(ambientTime * 0.41 + 1.7) * 0.14,
        -0.45,
      );
      leftSatellite.rotation.y = -0.18 + Math.sin(ambientTime * 0.38) * 0.09 -
        progress * 0.22 + px * 0.07;
      rightSatellite.rotation.y = 0.15 + Math.sin(ambientTime * 0.35 + 1.7) * 0.09 +
        progress * 0.22 + px * 0.07;
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
      // The same mechanical language resolves into an opening at contact.
      // Use the cached layout progress so pause, reverse scroll and context
      // restoration retain the exact same aperture without another clock.
      apertureValue = smooth(0.12, 0.62, progress);
      for (const { blade, angle } of irisBlades) {
        const radius = 0.88 + apertureValue * 0.28;
        blade.position.set(
          Math.sin(angle) * radius,
          Math.cos(angle) * radius,
          0.34 - apertureValue * 0.08,
        );
        blade.rotation.z = -angle - 0.35 - apertureValue * 0.72;
      }
      center.position.z = 0.52 + apertureValue * 0.15;
      center.scale.setScalar(1 - apertureValue * 0.14);
      center.rotation.z = Math.PI / 4 + apertureValue * 0.12;
    }

    camera.fov = compact ? 31 : 29;
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    const panoramic = satellites.visible;
    // Opening the mechanism increases its true envelope, including nearer parts.
    // Fit that envelope continuously; the assembled camera retains its original framing.
    const burstFit = chapter === 0 ? 1 + smooth(0, 1, burstValue) * 0.56 : 1;
    const heightToFit =
      (chapter === 1 ? 5.7 : chapter === 2 ? 4.75 : 4.25) * burstFit;
    const widthToFit =
      (panoramic ? 8.7 : chapter === 1 ? 6.1 : chapter === 2 ? 4.25 : 4.45) *
      burstFit;
    const tangent = Math.tan((camera.fov * Math.PI) / 360) * 2;
    let distance =
      Math.max(heightToFit / tangent, widthToFit / (camera.aspect * tangent)) *
      (1 - zoom * 0.11);
    if (chapter < 2) {
      // The white shell sits ahead of the ring, so its apparent size includes
      // perspective depth. Fit its actual rigid envelope instead of enlarging
      // the nominal scene or allowing its edges to leave either mechanical
      // frame. These eight cached corners cover the flush inset, idle rocking
      // and the narrower portrait window used by the internship scene.
      world.updateMatrix();
      assembly.updateMatrix();
      counterweight.updateMatrix();
      counterweightFitMatrix
        .multiplyMatrices(world.matrix, assembly.matrix)
        .multiply(counterweight.matrix);
      for (const corner of counterweightFitCorners) {
        counterweightFitPoint.copy(corner).applyMatrix4(counterweightFitMatrix);
        const projectedSpan = Math.max(
          Math.abs(counterweightFitPoint.y) / (tangent * 0.5),
          Math.abs(counterweightFitPoint.x) / (tangent * 0.5 * camera.aspect),
        );
        distance = Math.max(distance, counterweightFitPoint.z + projectedSpan * 1.14);
      }
    }
    pose.cameraTarget.set(
      Math.sin(rotation * 0.28) * distance * 0.085 + drift * 0.07,
      progress * distance * 0.015,
      distance,
    );
    if (!pose.initialized || pose.aspect !== camera.aspect) {
      pose.camera.copy(pose.cameraTarget);
      pose.cameraVelocity.setScalar(0);
    } else if (motion && advance)
      spring(pose.camera, pose.cameraVelocity, pose.cameraTarget, dt, 120, 23);
    pose.aspect = camera.aspect;
    camera.position.copy(pose.camera);
    camera.lookAt(0, 0, 0);
    // Raycasts see the real camera, assembly rotation, disassembly and spring offsets.
    // A short sweep catches fast cursor passes whose endpoints miss thin metal parts.
    if (assembly.visible && motion && dt > 0 && advance) {
      world.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      if (inside && pose.pointerWasInside) {
        sweepDelta.subVectors(pose.pointerTarget, pose.previousPointer);
        const movement = sweepDelta.length();
        if (movement > 0.0015) {
          hitParts.clear();
          const steps = Math.min(6, Math.max(1, Math.ceil(movement / 0.08)));
          for (let step = 1; step <= steps; step++) {
            sweepPoint.lerpVectors(
              pose.previousPointer,
              pose.pointerTarget,
              step / steps,
            );
            raycaster.setFromCamera(sweepPoint, camera);
            hits.length = 0;
            raycaster.intersectObjects(pickTargets, true, hits);
            if (hits.length) {
              const index = pieceIndices.get(hits[0].object);
              if (index !== undefined) hitParts.add(index);
            }
          }
          if (hitParts.size) {
            hitCount += hitParts.size;
            cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
            cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);
            inverseAssembly.copy(assembly.matrixWorld).invert();
            const impulse =
              clamp(movement / Math.max(dt, 1 / 120), 0, 5) * 0.88;
            kick
              .copy(cameraRight)
              .multiplyScalar(sweepDelta.x)
              .addScaledVector(cameraUp, sweepDelta.y);
            kick.z -= movement * 0.35;
            kick.transformDirection(inverseAssembly).multiplyScalar(impulse);
            for (const index of hitParts) {
              const local = pose.parts[index];
              if (time - local.lastHit < 0.045) continue;
              local.lastHit = time;
              kickCount++;
              lastHitPart = index;
              local.offsetVelocity.add(kick).clampLength(0, 7);
              local.rotationVelocity.x += kick.y * 0.3;
              local.rotationVelocity.y -= kick.x * 0.3;
              local.rotationVelocity.z += (kick.x - kick.y) * 0.23;
            }
          }
        }
      }
      pose.previousPointer.copy(pose.pointerTarget);
      pose.pointerWasInside = inside;
    } else if (!motion) pose.pointerWasInside = false;
    pose.initialized = true;
  }


  // The carrier is rendered once: in its source/target window at the boundaries,
  // or as a transparent flight after all window composites. No second RAF/target.
  const advancedPoses = new Set();
  const carrierCamera = new THREE.PerspectiveCamera(29, 1, 0.1, 100);
  const makeCarrierEndpoint = () => ({
    center: new THREE.Vector2(),
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    scale: new THREE.Vector3(),
    cameraPosition: new THREE.Vector3(),
    cameraQuaternion: new THREE.Quaternion(),
    projection: new THREE.Matrix4(),
    unitPixels: 1,
    key: "",
  });
  const carrierStart = makeCarrierEndpoint();
  const carrierEnd = makeCarrierEndpoint();
  const carrierPose = {
    initialized: false,
    enabled: false,
    progress: 0,
    owner: "local",
    ownerKey: "",
    point: new THREE.Vector2(),
    basePoint: new THREE.Vector2(),
    anchor: new THREE.Vector2(),
    lastAnchor: new THREE.Vector2(),
    baseProjection: new THREE.Matrix4(),
    growth: 1,
    draws: 0,
    width: 1,
    height: 1,
    matrix: new THREE.Matrix4(),
  };
  const carrierViewport = new THREE.Matrix4();
  const carrierView = new THREE.Matrix4();
  const carrierLocal = new THREE.Matrix4();
  const carrierProjection = new THREE.Matrix4();
  const carrierPosition = new THREE.Vector3();
  const carrierQuaternion = new THREE.Quaternion();
  const carrierScale = new THREE.Vector3();
  const carrierNdc = new THREE.Vector3();
  const carrierTurn = new THREE.Quaternion();
  const carrierAxis = new THREE.Vector3(0, 0, 1);
  const carrierBounds = new THREE.Box3();
  const carrierBox = new THREE.Box3();
  const carrierCorner = new THREE.Vector3();
  const carrierScreenBounds = { left: 0, top: 0, right: 0, bottom: 0 };
  for (const mesh of carrier.children) {
    mesh.updateMatrix();
    mesh.geometry.computeBoundingBox();
    carrierBox.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrix);
    carrierBounds.union(carrierBox);
  }

  function applyFramePose(item, time, dt) {
    const key = frameKey(item);
    const pose = getPose(item);
    const advance = !advancedPoses.has(key);
    applyPose(item, pose, time, dt, advance);
    advancedPoses.add(key);
    return pose;
  }

  function validCarrierFrame(item) {
    const rect = item?.rect;
    return rect &&
      [rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) &&
      rect.width > 1 && rect.height > 1;
  }

  function captureCarrierEndpoint(item, endpoint, time, dt) {
    applyFramePose(item, time, dt);
    world.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    carrierView.multiplyMatrices(camera.matrixWorldInverse, floatingModule.matrixWorld);
    carrierView.decompose(endpoint.position, endpoint.quaternion, endpoint.scale);
    endpoint.cameraPosition.copy(camera.position);
    endpoint.cameraQuaternion.copy(camera.quaternion);
    const rect = item.rect;
    // Map the local window's clip coordinates into the full viewport. This keeps
    // every vertex in exactly the same CSS pixel at the rendering-owner boundary.
    carrierViewport.set(
      rect.width / screenWidth, 0, 0, (rect.left * 2 + rect.width) / screenWidth - 1,
      0, rect.height / screenHeight, 0, 1 - (rect.top * 2 + rect.height) / screenHeight,
      0, 0, 1, 0,
      0, 0, 0, 1,
    );
    endpoint.projection.multiplyMatrices(carrierViewport, camera.projectionMatrix);
    carrierNdc.copy(endpoint.position).applyMatrix4(endpoint.projection);
    endpoint.center.set(
      (carrierNdc.x + 1) * screenWidth * 0.5,
      (1 - carrierNdc.y) * screenHeight * 0.5,
    );
    endpoint.unitPixels = screenHeight * 0.5 * endpoint.projection.elements[5] /
      Math.max(0.01, -endpoint.position.z);
    endpoint.key = frameKey(item);
  }

  function setCarrierBounds(matrix, viewCamera, rect = null) {
    carrierScreenBounds.left = carrierScreenBounds.top = Infinity;
    carrierScreenBounds.right = carrierScreenBounds.bottom = -Infinity;
    for (let index = 0; index < 8; index++) {
      carrierCorner.set(
        index & 1 ? carrierBounds.max.x : carrierBounds.min.x,
        index & 2 ? carrierBounds.max.y : carrierBounds.min.y,
        index & 4 ? carrierBounds.max.z : carrierBounds.min.z,
      ).applyMatrix4(matrix).project(viewCamera);
      const x = (rect?.left || 0) + (carrierCorner.x + 1) * (rect?.width || screenWidth) * 0.5;
      const y = (rect?.top || 0) + (1 - carrierCorner.y) * (rect?.height || screenHeight) * 0.5;
      carrierScreenBounds.left = Math.min(carrierScreenBounds.left, x);
      carrierScreenBounds.top = Math.min(carrierScreenBounds.top, y);
      carrierScreenBounds.right = Math.max(carrierScreenBounds.right, x);
      carrierScreenBounds.bottom = Math.max(carrierScreenBounds.bottom, y);
    }
  }

  function updateCarrier(input, time, dt) {
    // A user pause freezes the already displayed owner, camera and model matrix.
    // An initially reduced-motion/disabled page never enters the transfer.
    if (state.motion === false && carrierPose.initialized) {
      if (carrierPose.enabled && carrierPose.owner === "flight") {
        const anchor = input?.path?.[0];
        if (Number.isFinite(anchor?.x) && Number.isFinite(anchor?.y))
          carrierPose.lastAnchor.set(anchor.x, anchor.y);
        const dx = carrierPose.lastAnchor.x - carrierPose.anchor.x;
        const dy = carrierPose.lastAnchor.y - carrierPose.anchor.y;
        const sx = carrierPose.width / Math.max(1, screenWidth);
        const sy = carrierPose.height / Math.max(1, screenHeight);
        // Freeze physical motion, while its paper/document attachment still
        // follows native scrolling. Mapping frozen clip space preserves CSS
        // size through viewport changes without advancing any spring or clock.
        carrierViewport.set(
          sx, 0, 0, sx - 1 + 2 * dx / Math.max(1, screenWidth),
          0, sy, 0, 1 - sy - 2 * dy / Math.max(1, screenHeight),
          0, 0, 1, 0,
          0, 0, 0, 1,
        );
        carrierCamera.projectionMatrix.multiplyMatrices(
          carrierViewport, carrierPose.baseProjection,
        );
        carrierCamera.projectionMatrixInverse.copy(carrierCamera.projectionMatrix).invert();
        carrierPose.point.copy(carrierPose.basePoint);
        carrierPose.point.x += dx;
        carrierPose.point.y += dy;
        setCarrierBounds(carrierPose.matrix, carrierCamera);
      }
      return;
    }
    carrierPose.initialized = true;
    const path = input?.path;
    carrierPose.enabled = Boolean(
      state.motion !== false && input?.enabled && validCarrierFrame(input.startFrame) &&
      validCarrierFrame(input.endFrame) && Array.isArray(path) && path.length &&
      path.every((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y)),
    );
    if (!carrierPose.enabled) {
      carrierPose.owner = "local";
      return;
    }
    const p = clamp(Number.isFinite(input.progress) ? input.progress : 0);
    carrierPose.progress = p;
    captureCarrierEndpoint(input.startFrame, carrierStart, time, dt);
    captureCarrierEndpoint(input.endFrame, carrierEnd, time, dt);
    carrierPose.owner = p <= 0 ? "hero" : p >= 1 ? "work" : "flight";
    carrierPose.ownerKey = p <= 0 ? carrierStart.key : p >= 1 ? carrierEnd.key : "";
    if (carrierPose.owner !== "flight") {
      carrierPose.point.copy(p <= 0 ? carrierStart.center : carrierEnd.center);
      carrierPose.growth = 1;
      return;
    }

    const interpolation = smooth(0, 1, p);
    carrierCamera.position.lerpVectors(
      carrierStart.cameraPosition, carrierEnd.cameraPosition, interpolation,
    );
    carrierCamera.quaternion.slerpQuaternions(
      carrierStart.cameraQuaternion, carrierEnd.cameraQuaternion, interpolation,
    );
    carrierCamera.updateMatrixWorld(true);
    // Unfold the source window into the viewport, then resolve into the target.
    // These projection matrices share near/far planes, so their interpolation
    // remains a finite perspective projection with a continuous off-axis center.
    carrierCamera.fov = compact ? 31 : 29;
    carrierCamera.aspect = screenWidth / Math.max(1, screenHeight);
    carrierCamera.updateProjectionMatrix();
    carrierProjection.copy(carrierCamera.projectionMatrix);
    const sourceWeight = 1 - smooth(0, 0.2, p);
    const transfer = clamp(input.dockingProgress ?? (p - .8) / .2);
    const targetWeight = transfer * transfer * transfer * (10 + transfer * (-15 + 6 * transfer));
    for (let index = 0; index < 16; index++) {
      carrierCamera.projectionMatrix.elements[index] =
        carrierProjection.elements[index] * (1 - sourceWeight - targetWeight) +
        carrierStart.projection.elements[index] * sourceWeight +
        carrierEnd.projection.elements[index] * targetWeight;
    }
    carrierCamera.projectionMatrixInverse.copy(carrierCamera.projectionMatrix).invert();

    const pathIndex = clamp(input.pathProgress ?? p) * (path.length - 1);
    const lower = Math.floor(pathIndex);
    const upper = Math.min(path.length - 1, lower + 1);
    carrierPose.point.set(
      path[lower].x + (path[upper].x - path[lower].x) * (pathIndex - lower),
      path[lower].y + (path[upper].y - path[lower].y) * (pathIndex - lower),
    );
    if (p < 0.15)
      carrierPose.point.lerp(carrierStart.center, 1 - smooth(0, 0.15, p));
    else if (targetWeight > 0)
      carrierPose.point.lerp(carrierEnd.center, targetWeight);

    const depth = Math.max(0.2,
      -carrierStart.position.z +
      (-carrierEnd.position.z + carrierStart.position.z) * interpolation,
    );
    const projection = carrierCamera.projectionMatrix.elements;
    const clipZ = projection[10] * -depth + projection[14];
    const clipW = projection[11] * -depth + projection[15];
    carrierPosition.set(
      carrierPose.point.x / Math.max(1, screenWidth) * 2 - 1,
      1 - carrierPose.point.y / Math.max(1, screenHeight) * 2,
      clipZ / Math.max(0.0001, clipW),
    ).applyMatrix4(carrierCamera.projectionMatrixInverse);
    carrierQuaternion.slerpQuaternions(
      carrierStart.quaternion, carrierEnd.quaternion, interpolation,
    );
    carrierTurn.setFromAxisAngle(carrierAxis, Math.sin(p * Math.PI) * 0.24);
    carrierQuaternion.multiply(carrierTurn);
    carrierScale.lerpVectors(carrierStart.scale, carrierEnd.scale, interpolation);
    const unitPixels = carrierStart.unitPixels +
      (carrierEnd.unitPixels - carrierStart.unitPixels) * interpolation;
    const currentUnitPixels = screenHeight * 0.5 * projection[5] / depth;
    carrierPose.growth = 1 + Math.sin(p * Math.PI) ** 2 * 0.5;
    carrierScale.multiplyScalar(
      Math.max(0.001, unitPixels) / Math.max(0.001, currentUnitPixels) * carrierPose.growth,
    );
    carrierLocal.compose(carrierPosition, carrierQuaternion, carrierScale);
    carrierPose.matrix.multiplyMatrices(carrierCamera.matrixWorld, carrierLocal);
    carrierPose.width = screenWidth;
    carrierPose.height = screenHeight;
    carrierPose.basePoint.copy(carrierPose.point);
    carrierPose.anchor.set(path[0].x, path[0].y);
    carrierPose.lastAnchor.copy(carrierPose.anchor);
    carrierPose.baseProjection.copy(carrierCamera.projectionMatrix);
    setCarrierBounds(carrierPose.matrix, carrierCamera);
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

  function renderFrames(time = 0, delta = 1 / 60, frames = [], handoff = null) {
    if (disposed || contextLost) return;
    const started = performance.now();
    const dt =
      state.motion === false
        ? 0
        : clamp(Number.isFinite(delta) ? delta : 1 / 60, 0, 0.05);
    const seconds = Number.isFinite(time) ? time : 0;
    // Critically damp the desired disassembly. It stays open until requested closed.
    // Substeps keep this stable when a low-power device supplies a 50ms frame.
    if (dt) {
      const target = clamp(Number.isFinite(state.burst) ? state.burst : 0);
      const steps = Math.max(1, Math.ceil(dt * 120));
      const h = dt / steps;
      for (let step = 0; step < steps; step++) {
        burstVelocity +=
          ((target - burstValue) * 56.25 - burstVelocity * 15) * h;
        burstValue = clamp(burstValue + burstVelocity * h);
      }
    }
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
    lastFrames = visibleFrames;
    lastCarrierInput = handoff;
    advancedPoses.clear();
    carrierPose.draws = 0;
    updateCarrier(handoff, seconds, dt);
    if (state.motion !== false) {
      if (handoff?.enabled && handoff.impactEnabled && !compact) {
        const progress = clamp(handoff.progress);
        if (progress < 0.85) dockArmed = true;
        if (progress >= 0.995) {
          const target = handoff.endFrame?.rect;
          const targetVisible = target && target.top < screenHeight &&
            target.top + target.height > 0 && target.left < screenWidth &&
            target.left + target.width > 0;
          if (dockArmed && previousDockProgress !== null &&
              previousDockProgress < 0.995 && targetVisible) dockSparks.trigger();
          dockArmed = false;
        }
        previousDockProgress = progress;
      } else {
        dockArmed = false;
        previousDockProgress = null;
        dockSparks.reset();
      }
    }
    dockSparks.update(dt, { enabled: state.motion !== false });
    const showDockSparks = dockSparks.object.visible;
    dockSparks.object.visible = false;
    world.visible = true;
    carrier.visible = false;

    renderer.info.reset();
    renderer.setRenderTarget(renderTarget);
    renderer.setScissorTest(false);
    renderedFrames++;
    if (state.motion !== false) {
      const wallInterval = lastWallTime === null ? 0 : started - lastWallTime;
      if (wallInterval > 4 && wallInterval < 1000) {
        frameIntervalMs = frameIntervalMs
          ? frameIntervalMs * 0.94 + wallInterval * 0.06
          : wallInterval;
      }
      lastWallTime = started;
      lastTime = seconds;
      // A bounded downshift is based on observed rendering cadence, not a guessed
      // GPU class. The long probe and no automatic upshift prevent quality oscillation.
      if (renderedFrames >= nextQualityProbe && qualityScale > 0.61) {
        nextQualityProbe = renderedFrames + 150;
        if (frameIntervalMs > (compact ? 46 : 38)) {
          qualityScale = Math.max(0.6, qualityScale - 0.2);
          resize();
        }
      }
    } else lastWallTime = null;
    renderer.setViewport(0, 0, screenWidth, screenHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, true, true);
    // Both scenes can coexist while a section crosses the viewport. Render the
    // actual geometry where its DOM window is, with independent pose histories.
    for (const item of visibleFrames) {
      applyFramePose(item, seconds, dt);
      dockSparks.object.visible = showDockSparks && item.chapter === 1;
      if (dockSparks.object.visible) {
        world.updateMatrixWorld(true);
        dockSparks.object.matrix.copy(floatingModule.matrixWorld);
        dockSparks.object.matrixWorldNeedsUpdate = true;
      }
      carrier.visible = assembly.visible && (!carrierPose.enabled ||
        (carrierPose.owner !== "flight" && frameKey(item) === carrierPose.ownerKey));
      if (carrier.visible) {
        world.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
        carrier.matrix.copy(floatingModule.matrixWorld);
        carrier.matrixWorldNeedsUpdate = true;
        carrier.updateMatrixWorld(true);
        carrierPose.draws += carrier.children.length;
        setCarrierBounds(carrier.matrix, camera, item.rect);
      }
      frameViewport(item.rect);
      renderer.clear(false, true, false);
      renderer.render(scene, camera);
    }
    dockSparks.object.visible = false;

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
    if (carrierPose.enabled && carrierPose.owner === "flight") {
      // Direct PBR output keeps true transparency. The ordinary window compositor
      // intentionally paints a studio backdrop and must not be used for flight.
      world.visible = false;
      carrier.visible = true;
      carrier.matrix.copy(carrierPose.matrix);
      carrier.matrixWorldNeedsUpdate = true;
      carrier.updateMatrixWorld(true);
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, screenWidth, screenHeight);
      renderer.clearDepth();
      renderer.render(scene, carrierCamera);
      carrierPose.draws += carrier.children.length;
      world.visible = true;
    }
    carrier.visible = false;
    renderer.setScissorTest(false);
    submissionMs = performance.now() - started;
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

  function burst(value) {
    if (state.motion !== false) {
      state.burst = Number.isFinite(value)
        ? clamp(value)
        : state.burst >= 0.5
          ? 0
          : 1;
    }
    return state.burst;
  }

  function getStats() {
    let maxSpringOffset = 0;
    for (const pose of poses.values()) {
      for (const part of pose.parts)
        maxSpringOffset = Math.max(maxSpringOffset, part.offset.length());
    }
    return {
      renderer: rendererName,
      softwareRenderer,
      compact,
      contained,
      pixelRatio,
      qualityScale,
      width: canvas.width,
      height: canvas.height,
      frames: renderedFrames,
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      programs: renderer.info.programs?.length || 0,
      mechanicalBatches: batches.size,
      hitCount,
      kickCount,
      lastHitPart,
      maxSpringOffset: Math.round(maxSpringOffset * 10000) / 10000,
      peakSpringOffset: Math.round(peakSpringOffset * 10000) / 10000,
      // Submission is CPU wall time; observed cadence includes the caller/browser.
      cpuSubmissionMs: Math.round(submissionMs * 100) / 100,
      observedIntervalMs: Math.round(frameIntervalMs * 100) / 100,
      burstTarget: state.burst,
      dockSparks: dockSparks.getStats(),
      burstValue: Math.round(burstValue * 1000) / 1000,
      apertureValue: Math.round(apertureValue * 1000) / 1000,
      carrier: {
        enabled: carrierPose.enabled,
        owner: carrierPose.owner,
        progress: Math.round(carrierPose.progress * 10000) / 10000,
        screen: { x: carrierPose.point.x, y: carrierPose.point.y },
        growth: carrierPose.growth,
        draws: carrierPose.draws,
        bounds: carrierPose.draws ? { ...carrierScreenBounds } : null,
        source: { x: carrierStart.center.x, y: carrierStart.center.y },
        destination: { x: carrierEnd.center.x, y: carrierEnd.center.y },
      },
      lastTime,
      contextLost,
      disposed,
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    dockSparks.dispose();
    window.removeEventListener("pointermove", onPointerMove);
    document.documentElement.removeEventListener(
      "pointerleave",
      onPointerLeave,
    );
    window.removeEventListener("blur", onPointerLeave);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    for (const shape of resources.geometries) shape.dispose();
    for (const surface of resources.materials) surface.dispose();
    poses.clear();
    shapeCache.clear();
    renderTarget.dispose();
    skeleton.dispose();
    environment?.dispose();
    renderer.dispose();
  }

  resize();
  return {
    state,
    render,
    renderFrames,
    resize,
    setFrame,
    dispose,
    destroy: dispose,
    burst,
    getStats,
    // Read the existing cached projection without walking poses or allocating.
    getCarrierOccluder: () => carrierPose.enabled && carrierPose.owner === "flight" &&
      carrierPose.draws > 0 ? carrierScreenBounds : null,
  };
}

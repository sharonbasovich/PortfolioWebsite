/* eslint import/extensions: off -- Three.js ESM examples require their published .js suffix. */
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const radial = (r, a) => [Math.cos(a) * r, Math.sin(a) * r];

function metal(color, roughness, finish) {
  return new T.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.94,
    roughnessMap: finish || null,
    bumpMap: finish || null,
    bumpScale: finish ? 0.009 : 0,
  });
}

function disk(radius, depth, segments = 64) {
  return new T.CylinderGeometry(radius, radius, depth, segments).rotateX(Math.PI / 2);
}

function profile(points, segments = 120) {
  return new T.LatheGeometry(
    points.map(([r, h]) => new T.Vector2(r, h)),
    segments,
  ).rotateX(Math.PI / 2);
}

function ring(radius, wire, segments = 104) {
  return new T.TorusGeometry(radius, wire, 7, segments);
}

function mesh(group, geom, material, x = 0, y = 0, z = 0) {
  const result = new T.Mesh(geom, material);
  result.position.set(x, y, z);
  group.add(result);
  return result;
}

function uvFromFace(geometry, scale) {
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i += 1) uv.setXY(i, position.getX(i) * scale + 0.5, position.getY(i) * scale + 0.5);
  return geometry;
}

function finishTexture(turned) {
  const size = 512;
  const pixels = new Uint8Array(size * size * 4);
  let noiseState = 70457;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // Keep the seeded texture generator in the unsigned 32-bit range.
      // eslint-disable-next-line no-bitwise
      noiseState = (Math.imul(noiseState, 1664525) + 1013904223) >>> 0;
      const noise = (noiseState / 4294967296 - 0.5) * 16;
      const u = x / size - 0.5;
      const v = y / size - 0.5;
      const channel = turned ? Math.hypot(u, v) : v + u * 0.015;
      const toolMarks = Math.sin(channel * 1473) * 11 + Math.sin(channel * 722 + Math.sin(channel * 53)) * 8;
      const grain = Math.sin(channel * 187 + u * 2) * 7;
      const shade = Math.round(202 + noise + toolMarks + grain);
      const i = (y * size + x) * 4;
      pixels[i] = shade;
      pixels[i + 1] = shade;
      pixels[i + 2] = shade;
      pixels[i + 3] = 255;
    }
  }
  const texture = new T.DataTexture(pixels, size, size);
  texture.generateMipmaps = true;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.magFilter = T.LinearFilter;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function circleHole(shape, x, y, r) {
  const path = new T.Path();
  path.absarc(x, y, r, 0, TAU, true);
  shape.holes.push(path);
}

function relief(shape, depth, bevel = 0.009) {
  return new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 14,
    steps: 1,
  });
}

function toothedWheel(radius, teeth, spokes, solid = false) {
  const shape = new T.Shape();
  for (let t = 0; t < teeth; t += 1) {
    [
      [0, 0.947],
      [0.16, 0.947],
      [0.32, 1],
      [0.57, 1],
      [0.77, 0.947],
    ].forEach(([offset, size], i) => {
      const xy = radial(radius * size, ((t + offset) / teeth) * TAU);
      if (t === 0 && i === 0) shape.moveTo(...xy);
      else shape.lineTo(...xy);
    });
  }
  shape.closePath();
  if (!solid) {
    for (let s = 0; s < spokes; s += 1) {
      const start = (s * TAU) / spokes + 0.13;
      const end = ((s + 1) * TAU) / spokes - 0.13;
      const hole = new T.Path();
      hole.absarc(0, 0, radius * 0.79, start, end);
      hole.lineTo(...radial(radius * 0.31, end + 0.05));
      hole.absarc(0, 0, radius * 0.31, end + 0.05, start + 0.05, true);
      hole.closePath();
      shape.holes.push(hole);
    }
  }
  circleHole(shape, 0, 0, radius * 0.1);
  return relief(shape, 0.052, radius * 0.006);
}

function canvasTexture(size, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.translate(size / 2, size / 2);
  ctx.scale(size / 1000, size / 1000);
  paint(ctx);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function dialPrint() {
  return canvasTexture(1536, (ctx) => {
    const ringLine = (r, color, width) => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.stroke();
    };
    ringLine(431.7, '#272420', 106);
    ringLine(431.7, '#171512', 103);
    for (let i = 0; i < 135; i += 1) {
      const shine = 26 + Math.round(3 * Math.sin(i * 2.9));
      ringLine(382 + i * 0.735, `rgb(${shine}, ${shine - 3}, ${shine - 7})`, 0.55);
    }
    ringLine(461, '#6f5c4b', 0.8);
    ringLine(477.5, '#94775a', 0.8);
    for (let i = 0; i < 60; i += 1) {
      ctx.save();
      ctx.rotate((TAU * i) / 60);
      ctx.fillStyle = i % 5 === 0 ? '#d09e73' : '#a2866b';
      ctx.fillRect(-0.8, -476, 1.6, i % 5 === 0 ? 14 : 7);
      ctx.restore();
    }
    ctx.font = '500 23px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#b59a7e';
    [1, 2, 3, 4, 5, 7, 8, 9, 10, 11].forEach((i) => {
      const angle = (i * TAU) / 12;
      ctx.save();
      ctx.rotate(angle);
      ctx.translate(0, -438);
      ctx.rotate(-angle);
      ctx.fillText(String(i * 5).padStart(2, '0'), 0, 0);
      ctx.restore();
    });
    ctx.font = '500 33px Georgia, serif';
    ctx.fillStyle = '#e3d3bc';
    ctx.fillText('B A S O V I C H', 0, -421);
    ctx.font = '500 16px sans-serif';
    ctx.fillStyle = '#c2a78c';
    ctx.fillText('C A L I B R E', 0, 422);
    ringLine(384, '#9f7759', 1.8);
    ringLine(484.2, '#ad8665', 1.6);
  });
}

function barrelPrint() {
  return canvasTexture(768, (ctx) => {
    ctx.fillStyle = '#a97649';
    ctx.fillRect(-500, -500, 1000, 1000);
    for (let radius = 125; radius < 471; radius += 2.1) {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.lineWidth = radius % 5 < 2.5 ? 0.7 : 1.1;
      ctx.strokeStyle = radius % 5 < 2.5 ? '#bd8b5b' : '#916b4a';
      ctx.stroke();
    }
    ctx.font = '500 46px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#47362a';
    ctx.fillText('M A I N S P R I N G', 0, -275);
    ctx.fillText('B A R R E L', 0, 275);
  });
}

function flattenStatic(group) {
  const batches = new Map();
  group.children.slice().forEach((part) => {
    if (!part.isMesh || Array.isArray(part.material)) return;
    part.updateMatrix();
    const transformed = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone();
    transformed.clearGroups();
    transformed.applyMatrix4(part.matrix);
    if (!batches.has(part.material)) batches.set(part.material, []);
    batches.get(part.material).push(transformed);
    group.remove(part);
    part.geometry.dispose();
  });
  batches.forEach((geometries, material) => {
    const combined = mergeGeometries(geometries);
    const batch = new T.Mesh(combined, material);
    group.add(batch);
    geometries.forEach((geometry) => geometry.dispose());
  });
}

function addScrew(group, mat, x, y, z, radius, angle = 0) {
  mesh(group, disk(radius * 1.18, 0.019, 24), mat.ink, x, y, z);
  mesh(group, disk(radius * 1.03, 0.021, 24), mat.steel, x, y, z + 0.008);
  // Separate screw-head halves leave a physical recess for the driver slot.
  [-1, 1].forEach((side) => {
    const shape = new T.Shape();
    const edge = 0.15;
    shape.absarc(0, 0, radius, edge, Math.PI - edge);
    shape.closePath();
    const head = mesh(group, relief(shape, 0.021, 0.0035), mat.blue, x, y, z + 0.012);
    head.rotation.z = angle + (side > 0 ? 0 : Math.PI);
  });
}

function jewel(group, mat, x, y, z, r) {
  mesh(group, disk(r * 1.48, 0.043, 36), mat.gold, x, y, z);
  mesh(group, ring(r * 1.14, r * 0.19, 40), mat.pale, x, y, z + 0.027);
  const ruby = mesh(group, new T.SphereGeometry(r, 20, 12), mat.ruby, x, y, z + 0.024);
  ruby.scale.z = 0.49;
  mesh(group, disk(r * 0.27, 0.012, 18), mat.ink, x, y, z + r * 0.48 + 0.021);
}

function engravedPlate(group, shape, z, mat, depth = 0.08) {
  const geometry = uvFromFace(relief(shape, depth, 0.021), 0.26);
  return mesh(group, geometry, [mat.brushed, mat.polishedBridge], 0, 0, z);
}

function makeHand(length, width, tail) {
  const shape = new T.Shape();
  shape.moveTo(0, length);
  shape.lineTo(-width, 0.34);
  shape.lineTo(-width * 0.38, -tail);
  shape.quadraticCurveTo(0, -tail * 1.15, width * 0.38, -tail);
  shape.lineTo(width, 0.34);
  shape.closePath();
  return relief(shape, 0.018, 0.009);
}

function caseLugs(group, materials) {
  const { steel, darkSteel } = materials;
  [-1, 1].forEach((side) => {
    const path = new T.Shape();
    path.moveTo(side * 0.59, 1.91);
    path.lineTo(side * 1.02, 1.77);
    path.bezierCurveTo(side * 1.15, 1.96, side * 1.13, 2.18, side * 1.04, 2.35);
    path.quadraticCurveTo(side * 1.0, 2.43, side * 0.91, 2.435);
    path.lineTo(side * 0.68, 2.405);
    path.quadraticCurveTo(side * 0.62, 2.388, side * 0.64, 2.33);
    path.quadraticCurveTo(side * 0.77, 2.07, side * 0.59, 1.91);
    const lug = uvFromFace(relief(path, 0.205, 0.036), 0.2);
    [-1, 1].forEach((end) => {
      const horn = mesh(group, lug.clone(), [darkSteel, steel], 0, 0, -0.25);
      horn.rotation.z = end < 0 ? Math.PI : 0;
      const bore = mesh(group, disk(0.051, 0.006, 22), darkSteel, end * side * 0.65, end * 2.274, -0.132);
      bore.rotation.y = Math.PI / 2;
    });
    lug.dispose();
  });
}

export default function buildMovement() {
  const root = new T.Group();
  const layers = ['Case and mainplate', 'Train and escapement', 'Jeweled bridges', 'Chapter ring', 'Hands'].map((name) => {
    const group = new T.Group();
    group.name = name;
    return group;
  });
  root.add(...layers);
  const [casework, wheels, bridges, dial, pointers] = layers;
  const turned = finishTexture(true);
  const brushed = finishTexture(false);
  const mat = {
    steel: metal(0xb2b1ae, 0.17),
    darkSteel: metal(0x625b54, 0.42, brushed),
    blackSteel: metal(0x353334, 0.39, turned),
    gold: metal(0xb77946, 0.35, turned),
    pale: metal(0xefc896, 0.22),
    brass: metal(0x97643e, 0.4, turned),
    blue: metal(0x526677, 0.23),
    ink: metal(0x141414, 0.64),
    polishedBridge: metal(0xb1977f, 0.19),
    brushed: metal(0x978070, 0.46, brushed),
    ruby: new T.MeshPhysicalMaterial({
      color: 0x970d2e,
      metalness: 0.2,
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    }),
    vermilion: new T.MeshStandardMaterial({
      color: 0xdb692e,
      metalness: 0.44,
      roughness: 0.24,
    }),
  };
  caseLugs(casework, mat);

  mesh(
    casework,
    profile([
      [1.78, -0.37],
      [1.94, -0.41],
      [2.025, -0.37],
      [2.09, -0.31],
      [2.13, -0.25],
      [2.13, -0.2],
      [2.102, -0.179],
      [2.105, -0.06],
      [2.155, -0.033],
      [2.155, 0.078],
      [2.126, 0.127],
      [2.068, 0.157],
      [1.93, 0.16],
      [1.79, 0.08],
      [1.78, -0.37],
    ]),
    mat.steel,
  );
  mesh(
    casework,
    profile([
      [2.1, -0.18],
      [2.136, -0.169],
      [2.138, -0.065],
      [2.109, -0.044],
    ]),
    mat.darkSteel,
  );
  mesh(casework, ring(2.106, 0.012), mat.pale, 0, 0, -0.276);
  mesh(casework, ring(2.135, 0.008), mat.pale, 0, 0, 0.094);
  mesh(casework, disk(1.91, 0.108, 112), mat.blackSteel, 0, 0, -0.25);
  mesh(casework, ring(1.88, 0.026), mat.darkSteel, 0, 0, -0.151);
  mesh(casework, ring(1.833, 0.009), mat.brass, 0, 0, -0.165);
  // The fluted crown and stem sit on the right edge of the mainplate.
  const crown = new T.Group();
  casework.add(crown);
  crown.position.set(2.04, 0, -0.15);
  crown.rotation.y = Math.PI / 2;
  mesh(crown, disk(0.119, 0.3), mat.steel, 0, 0, 0.07);
  mesh(crown, ring(0.122, 0.014, 40), mat.ink, 0, 0, 0.197);
  mesh(
    crown,
    profile([
      [0.094, 0.203],
      [0.177, 0.222],
      [0.215, 0.244],
      [0.233, 0.282],
      [0.231, 0.381],
      [0.215, 0.42],
      [0.174, 0.447],
      [0.063, 0.461],
    ]),
    mat.darkSteel,
  );
  for (let i = 0; i < 34; i += 1) {
    const a = (i * TAU) / 34;
    const flute = mesh(crown, new T.BoxGeometry(0.025, 0.016, 0.112), mat.steel, ...radial(0.23, a), 0.333);
    flute.rotation.z = a;
  }
  mesh(crown, ring(0.171, 0.008, 44), mat.steel, 0, 0, 0.447);
  mesh(crown, ring(0.105, 0.008, 42), mat.pale, 0, 0, 0.459);
  mesh(crown, disk(0.092, 0.011, 28), mat.ink, 0, 0, 0.456);
  flattenStatic(crown);

  const train = [];
  function wheel({ x, y, radius, teeth, spokes, z, speed, material, barrel = false }) {
    const unit = new T.Group();
    wheels.add(unit);
    unit.position.set(x, y, z);
    mesh(unit, uvFromFace(toothedWheel(radius, teeth, spokes, barrel), 0.44 / radius), material);
    const lip = barrel ? 0.88 : 0.83;
    mesh(unit, ring(radius * lip, radius * 0.022, 72), mat.pale, 0, 0, 0.058);
    mesh(unit, disk(radius * 0.16, 0.13), mat.steel, 0, 0, -0.022);
    if (barrel) {
      const cap = metal(0xe4d4c2, 0.52, turned);
      cap.map = barrelPrint();
      mesh(unit, disk(radius * 0.858, 0.022, 96), cap, 0, 0, 0.067);
      for (let i = 0; i < 3; i += 1) {
        const angle = (i * TAU) / 3 + 0.12;
        addScrew(unit, mat, ...radial(radius * 0.705, angle), 0.086, 0.035, angle);
      }
    }
    mesh(unit, disk(radius * 0.22, 0.074), mat.brass, 0, 0, 0.075);
    mesh(unit, ring(radius * 0.16, 0.009, 47), mat.pale, 0, 0, 0.112);
    mesh(unit, disk(radius * 0.09, 0.09), mat.steel, 0, 0, 0.088);
    flattenStatic(unit);
    train.push({ unit, speed });
    return unit;
  }
  const barrel = wheel({ x: -0.79, y: 0.41, radius: 0.684, teeth: 60, spokes: 6, z: 0, speed: 0.095, material: mat.gold, barrel: true });
  wheel({ x: 0.31, y: 0.15, radius: 0.47, teeth: 41, spokes: 5, z: 0.084, speed: -0.139, material: mat.pale });
  wheel({ x: 1.02, y: -0.15, radius: 0.316, teeth: 30, spokes: 5, z: 0.17, speed: 0.19, material: mat.brass });
  wheel({ x: 0.83, y: 0.78, radius: 0.438, teeth: 39, spokes: 6, z: 0.022, speed: 0.142, material: mat.brass });
  wheel({ x: 0.13, y: 1.14, radius: 0.364, teeth: 30, spokes: 4, z: -0.054, speed: -0.184, material: mat.pale });
  wheel({ x: -0.38, y: -0.42, radius: 0.415, teeth: 36, spokes: 5, z: 0.13, speed: 0.175, material: mat.gold });
  wheel({ x: -0.98, y: -0.78, radius: 0.328, teeth: 27, spokes: 5, z: 0.16, speed: -0.239, material: mat.brass });
  const escapeWheel = wheel({ x: 1.05, y: -0.83, radius: 0.251, teeth: 15, spokes: 4, z: 0.14, speed: -0.391, material: mat.pale });
  // Burnished pivot posts remain visible in the lateral exploded poses.
  [
    [-0.79, 0.41],
    [0.31, 0.15],
    [0.83, 0.78],
    [1.02, -0.15],
    [0.03, -0.99],
  ].forEach(([x, y]) => {
    mesh(casework, disk(0.041, 0.43, 22), mat.steel, x, y, 0.01);
    mesh(casework, disk(0.116, 0.045, 28), mat.brass, x, y, -0.148);
  });

  const bridge = new T.Shape();
  bridge.moveTo(-1.54, 0.71);
  bridge.bezierCurveTo(-1.45, 1.37, -0.78, 1.64, -0.4, 1.58);
  bridge.bezierCurveTo(-0.25, 1.54, -0.3, 1.38, -0.48, 1.3);
  bridge.bezierCurveTo(-1.1, 1.05, -1.13, 0.82, -0.91, 0.63);
  bridge.bezierCurveTo(-0.61, 0.57, -0.55, 0.25, -0.77, 0.2);
  bridge.bezierCurveTo(-1.05, 0.1, -1.12, 0.44, -1.42, 0.44);
  bridge.bezierCurveTo(-1.53, 0.43, -1.56, 0.58, -1.54, 0.71);
  circleHole(bridge, -1.08, 1.2, 0.093);
  engravedPlate(bridges, bridge, 0.22, mat);
  const trainBridge = new T.Shape();
  trainBridge.moveTo(0.19, 0.3);
  trainBridge.bezierCurveTo(0.44, 0.46, 0.66, 0.5, 0.78, 0.79);
  trainBridge.bezierCurveTo(0.89, 1.12, 1.18, 1.15, 1.35, 0.94);
  trainBridge.bezierCurveTo(1.63, 0.64, 1.68, 0.21, 1.52, -0.04);
  trainBridge.bezierCurveTo(1.4, -0.26, 1.23, -0.37, 1.01, -0.3);
  trainBridge.bezierCurveTo(0.81, -0.23, 0.76, 0.02, 0.56, 0.02);
  trainBridge.bezierCurveTo(0.4, -0.04, 0.26, -0.12, 0.17, -0.01);
  trainBridge.bezierCurveTo(0.1, 0.11, 0.09, 0.21, 0.19, 0.3);
  circleHole(trainBridge, 1.22, 0.46, 0.15);
  circleHole(trainBridge, 0.53, 0.24, 0.09);
  engravedPlate(bridges, trainBridge, 0.25, mat);
  [
    [-0.79, 0.41],
    [0.31, 0.15],
    [0.83, 0.78],
    [1.02, -0.15],
  ].forEach(([x, y]) => jewel(bridges, mat, x, y, 0.38, 0.064));
  [
    [-1.33, 0.67],
    [-0.56, 1.45],
    [1.38, 0.19],
    [1.02, 0.98],
  ].forEach(([x, y], i) => addScrew(bridges, mat, x, y, 0.34, 0.082, i));
  for (let i = 0; i < 5; i += 1) {
    const [x, y] = radial(1.67, (TAU * i) / 5 + 0.29);
    addScrew(casework, mat, x, y, -0.124, 0.095, i);
  }

  const pallet = new T.Group();
  pallet.name = 'Jeweled pallet fork';
  pallet.position.set(0.647, -0.83, 0.201);
  wheels.add(pallet);
  const fork = new T.Shape();
  fork.moveTo(-0.24, -0.036);
  fork.lineTo(-0.19, -0.035);
  fork.lineTo(-0.15, -0.009);
  fork.lineTo(0.14, -0.114);
  fork.lineTo(0.23, -0.126);
  fork.lineTo(0.237, -0.077);
  fork.lineTo(0.14, -0.044);
  fork.lineTo(0.045, 0.0);
  fork.lineTo(0.14, 0.041);
  fork.lineTo(0.245, 0.089);
  fork.lineTo(0.227, 0.147);
  fork.lineTo(0.115, 0.107);
  fork.lineTo(-0.15, 0.019);
  fork.lineTo(-0.23, 0.047);
  fork.closePath();
  mesh(pallet, relief(fork, 0.033, 0.006), mat.steel);
  mesh(pallet, disk(0.047, 0.04, 22), mat.brass, 0, 0, 0.024);
  mesh(pallet, disk(0.024, 0.049, 22), mat.steel, 0, 0, 0.045);
  mesh(pallet, new T.BoxGeometry(0.06, 0.042, 0.034), mat.ruby, 0.23, -0.11, 0.036);
  mesh(pallet, new T.BoxGeometry(0.06, 0.042, 0.034), mat.ruby, 0.24, 0.107, 0.036);
  flattenStatic(pallet);

  const balance = new T.Group();
  balance.name = 'Balance assembly';
  wheels.add(balance);
  balance.position.set(0.03, -0.99, 0.235);
  mesh(
    balance,
    profile(
      [
        [0.462, -0.024],
        [0.499, -0.036],
        [0.548, -0.021],
        [0.553, 0.019],
        [0.515, 0.038],
        [0.465, 0.026],
        [0.462, -0.024],
      ],
      100,
    ),
    mat.gold,
  );
  mesh(balance, ring(0.529, 0.011, 96), mat.pale, 0, 0, 0.033);
  mesh(balance, ring(0.477, 0.014, 96), mat.brass, 0, 0, 0.02);
  for (let i = 0; i < 3; i += 1) {
    const a = (i * TAU) / 3 + 0.28;
    const spoke = mesh(balance, new T.BoxGeometry(0.52, 0.044, 0.036), mat.gold, ...radial(0.27, a), 0);
    spoke.rotation.z = a;
  }
  for (let i = 0; i < 8; i += 1) {
    const angle = (i * TAU) / 8;
    const mass = mesh(balance, disk(0.021, 0.102, 18), mat.darkSteel, ...radial(0.535, angle), 0);
    mass.rotation.y = Math.PI / 2;
    mass.rotation.z = angle;
  }
  const coil = [];
  for (let i = 0; i <= 190; i += 1) {
    const u = i / 190;
    const radius = 0.045 + 0.339 * u + 0.062 * u ** 12;
    coil.push(new T.Vector3(...radial(radius, u * TAU * 5.15), 0.062));
  }
  mesh(balance, new T.TubeGeometry(new T.CatmullRomCurve3(coil), 190, 0.007, 4, false), mat.blue);
  jewel(balance, mat, 0, 0, 0.07, 0.055);
  flattenStatic(balance);

  mesh(
    dial,
    profile([
      [1.63, 0.35],
      [2.08, 0.3],
      [2.148, 0.34],
      [2.159, 0.4],
      [2.128, 0.455],
      [2.084, 0.509],
      [2.053, 0.537],
      [1.692, 0.537],
      [1.632, 0.485],
      [1.621, 0.425],
      [1.63, 0.35],
    ]),
    mat.steel,
  );
  mesh(dial, ring(2.143, 0.012), mat.brass, 0, 0, 0.447);
  mesh(dial, ring(1.654, 0.018), mat.pale, 0, 0, 0.522);
  const face = new T.MeshStandardMaterial({
    map: dialPrint(),
    color: 0xffffff,
    transparent: true,
    alphaTest: 0.5,
    metalness: 0.35,
    roughness: 0.42,
  });
  mesh(dial, new T.PlaneGeometry(4.25, 4.25), face, 0, 0, 0.552);
  mesh(dial, ring(2.056, 0.012), mat.pale, 0, 0, 0.544);
  for (let i = 0; i < 12; i += 1) {
    const angle = (i * TAU) / 12 + Math.PI / 2;
    const marker = new T.Shape();
    marker.moveTo(-0.086, 0);
    marker.lineTo(-0.034, -0.024);
    marker.lineTo(0.043, -0.014);
    marker.lineTo(0.043, 0.014);
    marker.lineTo(-0.034, 0.024);
    marker.closePath();
    const index = mesh(dial, relief(marker, 0.021, 0.007), mat.pale, ...radial(1.711, angle), 0.556);
    index.rotation.z = angle;
  }
  const hands = [];
  [
    [1.12, 0.092, 0.15, 0.69, 0.66],
    [1.54, 0.065, 0.23, -1.02, 0.71],
  ].forEach(([l, w, t, a, z]) => {
    const hand = new T.Group();
    pointers.add(hand);
    hand.rotation.z = a;
    hand.position.z = z;
    mesh(hand, makeHand(l, w, t), [mat.steel, mat.pale]);
    const inlay = new T.Shape();
    inlay.moveTo(0, l * 0.89);
    inlay.lineTo(-w * 0.46, 0.35);
    inlay.lineTo(0, 0.28);
    inlay.lineTo(w * 0.46, 0.35);
    inlay.closePath();
    mesh(hand, new T.ShapeGeometry(inlay), mat.ink, 0, 0, 0.029);
    flattenStatic(hand);
    hands.push(hand);
  });
  const second = new T.Group();
  pointers.add(second);
  second.position.z = 0.758;
  mesh(second, new T.BoxGeometry(0.021, 2.22, 0.019), mat.brass, 0, 0.56);
  mesh(second, new T.BoxGeometry(0.029, 0.29, 0.022), mat.vermilion, 0, 1.556);
  mesh(second, ring(0.072, 0.012, 32), mat.vermilion, 0, -0.4);
  mesh(second, disk(0.102, 0.035), mat.pale);
  mesh(second, disk(0.067, 0.036, 32), mat.ink, 0, 0, 0.024);
  flattenStatic(second);
  layers.forEach(flattenStatic);

  function label(parent, x, y, z) {
    const marker = new T.Object3D();
    marker.position.set(x, y, z);
    parent.add(marker);
    return marker;
  }

  const anchors = {
    crown: label(crown, 0, 0, 0.465),
    barrel: label(barrel, 0, 0, 0.14),
    bridge: label(bridges, 0.97, 0.51, 0.37),
    balance: label(balance, 0, 0, 0.104),
    escape: label(escapeWheel, 0, 0, 0.08),
    dial: label(dial, 0, 1.81, 0.552),
  };
  const bounds = new T.Box3().setFromObject(root);
  return { root, layers, train, balance, second, hands, crown, barrel, pallet, escapeWheel, anchors, bounds };
}

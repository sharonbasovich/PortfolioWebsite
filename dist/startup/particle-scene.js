import * as THREE from "./vendor/three/three.module.js";

// The page owns timing. This module only draws the pose represented by state.
// Four fixed particle destinations make each chapter legible without a perpetual spin.
export function createParticleScene(canvas, { mobile = false } = {}) {
  if (!(canvas instanceof HTMLCanvasElement)) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }

  const count = mobile ? 1536 : 4096;
  const sphere = new Float32Array(count * 3);
  const lattice = new Float32Array(count * 3);
  const knot = new Float32Array(count * 3);
  const halo = new Float32Array(count * 3);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const TAU = Math.PI * 2;
  const fract = (value) => value - Math.floor(value);
  const noise = (value) => fract(Math.sin(value * 127.1 + 78.233) * 43758.5453);

  // Reuse the same particle identity in every shape so transitions have clear paths.
  const nx = mobile ? 12 : 16;
  const ny = mobile ? 12 : 16;
  const nz = mobile ? 11 : 16;
  const latticeCells = nx * ny * nz;
  const knotMesh = new THREE.TorusKnotGeometry(1.49, 0.44, 512, 24, 2, 3);
  const knotVertices = knotMesh.getAttribute("position");

  for (let i = 0; i < count; i++) {
    const offset = i * 3;
    const progress = (i + 0.5) / count;
    const y = 1 - progress * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = i * goldenAngle;
    const layer = noise(i + 17) < 0.18 ? 0.7 + noise(i + 91) * 0.2 : 1;
    sphere[offset] = Math.cos(angle) * radius * 2.24 * layer;
    sphere[offset + 1] = y * 2.24 * layer;
    sphere[offset + 2] = Math.sin(angle) * radius * 2.24 * layer;

    const slot = Math.floor(progress * latticeCells);
    const ix = slot % nx;
    const iy = Math.floor(slot / nx) % ny;
    const iz = Math.floor(slot / (nx * ny));
    const jitter = 0.026;
    lattice[offset] =
      (ix / (nx - 1) - 0.5) * 4.55 + (noise(i + 311) - 0.5) * jitter;
    lattice[offset + 1] =
      (iy / (ny - 1) - 0.5) * 4.35 + (noise(i + 577) - 0.5) * jitter;
    lattice[offset + 2] =
      (iz / (nz - 1) - 0.5) * 4.1 + (noise(i + 791) - 0.5) * jitter;

    const vertexIndex = Math.min(
      knotVertices.count - 1,
      Math.floor(progress * knotVertices.count),
    );
    knot[offset] = knotVertices.getX(vertexIndex);
    knot[offset + 1] = knotVertices.getY(vertexIndex);
    knot[offset + 2] = knotVertices.getZ(vertexIndex);

    const band = i % 3;
    const around = Math.floor(i / 3) / Math.ceil(count / 3);
    const haloAngle = around * TAU + band * 0.08;
    const haloRadius =
      [1.64, 2.16, 2.64][band] + (noise(i + 1013) - 0.5) * 0.085;
    halo[offset] = Math.cos(haloAngle) * haloRadius;
    halo[offset + 1] = Math.sin(haloAngle) * haloRadius * 0.88;
    halo[offset + 2] =
      Math.sin(haloAngle * 2 + band * 1.2) * 0.34 + (band - 1) * 0.16;
  }
  knotMesh.dispose();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(sphere, 3));
  geometry.setAttribute("aLattice", new THREE.BufferAttribute(lattice, 3));
  geometry.setAttribute("aKnot", new THREE.BufferAttribute(knot, 3));
  geometry.setAttribute("aHalo", new THREE.BufferAttribute(halo, 3));

  const uniforms = {
    uMorph: { value: 0 },
    uScatter: { value: 0 },
    uOpening: { value: 0 },
    uOpacity: { value: 0.9 },
    uPixelRatio: { value: 1 },
    uPointSize: { value: mobile ? 3.5 : 4.2 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      uniform float uMorph;
      uniform float uScatter;
      uniform float uOpening;
      uniform float uOpacity;
      uniform float uPixelRatio;
      uniform float uPointSize;
      attribute vec3 aLattice;
      attribute vec3 aKnot;
      attribute vec3 aHalo;
      varying vec3 vColor;
      varying float vAlpha;

      float hash(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      }

      void main() {
        float seed = hash(position);
        float seed2 = hash(position.yzx + 17.17);
        float segment = min(floor(clamp(uMorph, 0.0, 3.0)), 2.0);
        float phase = clamp(uMorph - segment, 0.0, 1.0);
        float delayed = clamp((phase - seed * 0.18) / 0.82, 0.0, 1.0);
        float blend = delayed * delayed * (3.0 - 2.0 * delayed);
        vec3 source = segment < 0.5 ? position : (segment < 1.5 ? aLattice : aKnot);
        vec3 destination = segment < 0.5 ? aLattice : (segment < 1.5 ? aKnot : aHalo);
        vec3 shape = mix(source, destination, blend);

        vec3 drift = normalize(vec3(
          cos(seed * 6.2831853),
          sin(seed * 6.2831853),
          seed2 * 1.6 - 0.8
        ));
        float transition = sin(phase * 3.14159265);
        shape += drift * transition * (0.18 + 0.22 * seed);
        shape.y += transition * 0.22;
        shape += drift * clamp(uScatter, 0.0, 2.0) * (1.0 + seed * 0.85);

        // opening: 0 is a faint dispersed prelude; 1 is the complete form.
        float gatherProgress = clamp((uOpening - seed * 0.18) / 0.82, 0.0, 1.0);
        float gather = gatherProgress * gatherProgress * (3.0 - 2.0 * gatherProgress);
        shape = mix(shape * (1.55 + seed * 0.3) + drift * 0.55, shape, gather);

        vec4 view = modelViewMatrix * vec4(shape, 1.0);
        gl_Position = projectionMatrix * view;
        float perspective = clamp(10.0 / max(2.0, -view.z), 0.62, 1.55);
        gl_PointSize = uPointSize * uPixelRatio * perspective * mix(0.85, 1.35, pow(seed2, 5.0));

        vec3 lime = vec3(0.70, 1.0, 0.38);
        vec3 blue = vec3(0.37, 0.69, 1.0);
        vec3 coolWhite = vec3(0.91, 0.96, 1.0);
        vColor = mix(lime, blue, seed * 0.74);
        vColor = mix(vColor, coolWhite, 0.2 + pow(seed2, 7.0) * 0.65);
        float front = clamp((shape.z + 2.8) / 5.6, 0.0, 1.0);
        vAlpha = clamp(uOpacity, 0.0, 1.0) * mix(0.11, 1.0, gather) * mix(0.64, 1.04, front);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float radius = length(p);
        float core = 1.0 - smoothstep(0.06, 0.57, radius);
        float feather = 1.0 - smoothstep(0.24, 1.0, radius);
        float alpha = (core * 0.7 + feather * 0.3) * vAlpha;
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(vColor * (0.9 + core * 0.45), alpha);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });

  const scene = new THREE.Scene();
  const field = new THREE.Group();
  const particles = new THREE.Points(geometry, material);
  particles.frustumCulled = false;
  field.add(particles);
  scene.add(field);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);

  const state = {
    morph: 0,
    x: 3.0,
    y: 0,
    scale: 1,
    rx: 0.12,
    ry: 0,
    rz: -0.18,
    cameraZ: 10,
    opacity: 0.9,
    scatter: 0,
    opening: 0,
  };

  let disposed = false;
  let contextLost = false;
  const pointer = { x: 0, y: 0, currentX: 0, currentY: 0 };
  const onPointerMove = (event) => {
    if (event.pointerType === "touch") return;
    pointer.x = event.clientX / Math.max(1, window.innerWidth) - 0.5;
    pointer.y = event.clientY / Math.max(1, window.innerHeight) - 0.5;
  };
  const onBlur = () => {
    pointer.x = 0;
    pointer.y = 0;
  };
  const onContextLost = (event) => {
    event.preventDefault();
    contextLost = true;
  };
  const onContextRestored = () => {
    contextLost = false;
    resize();
    render(0);
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("blur", onBlur);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

  function resize() {
    if (disposed) return;
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width || window.innerWidth));
    const height = Math.max(1, Math.round(bounds.height || window.innerHeight));
    const pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      mobile ? 1.35 : 1.7,
    );
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    uniforms.uPixelRatio.value = pixelRatio;
  }

  function render(_time = 0) {
    if (disposed || contextLost) return;
    uniforms.uMorph.value = Number.isFinite(state.morph) ? state.morph : 0;
    uniforms.uScatter.value = Number.isFinite(state.scatter)
      ? state.scatter
      : 0;
    uniforms.uOpening.value = Number.isFinite(state.opening)
      ? state.opening
      : 0;
    uniforms.uOpacity.value = Number.isFinite(state.opacity)
      ? state.opacity
      : 0;
    pointer.currentX += (pointer.x - pointer.currentX) * 0.055;
    pointer.currentY += (pointer.y - pointer.currentY) * 0.055;
    field.position.set(
      state.x + pointer.currentX * 0.14,
      state.y - pointer.currentY * 0.11,
      0,
    );
    field.rotation.set(state.rx, state.ry, state.rz);
    field.scale.setScalar(state.scale);
    camera.position.set(0, 0, state.cameraZ);
    renderer.render(scene, camera);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("blur", onBlur);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  }

  resize();
  render(0);
  return { state, render, resize, dispose };
}

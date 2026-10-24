import * as THREE from "three";

// A single short impact, driven by the site's existing ticker. The parent owns
// its placement: copy the docked module's world matrix onto object before drawing.
export function createDockSparks({ compact = false } = {}) {
  const count = compact ? 22 : 160;
  const duration = 0.62;
  const positions = new Float32Array(count * 6);
  const starts = new Float32Array(count * 6);
  const directions = new Float32Array(count * 6);
  const colors = new Float32Array(count * 6);
  const ends = new Float32Array(count * 2);
  const lifetimes = new Float32Array(count * 2);
  const delays = new Float32Array(count * 2);
  const lengths = new Float32Array(count * 2);
  const palette = [
    new THREE.Color(0xedf6ff),
    new THREE.Color(0xc9e1fa),
    new THREE.Color(0x356bff),
    new THREE.Color(0xdcecff),
  ];
  // Deterministic noise keeps remounts and recorded QA frames reproducible.
  const noise = (index, seed) => {
    const value = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };

  for (let index = 0; index < count; index += 1) {
    const fan = index / Math.max(1, count - 1);
    const angle = (-0.175 + fan * 3.49) + (noise(index, 1) - 0.5) * 0.12;
    const distance = 1.05 + noise(index, 2) * 0.75;
    const originX = (noise(index, 3) - 0.5) * 0.22;
    const originY = (noise(index, 4) - 0.5) * 0.12;
    const originZ = 0.34 + noise(index, 5) * 0.05;
    const directionX = Math.cos(angle) * distance;
    const directionY = Math.sin(angle) * distance * 0.84;
    const directionZ = 0.1 + noise(index, 6) * 0.25;
    const lifetime = 0.38 + noise(index, 7) * 0.22;
    const delay = noise(index, 8) * 0.024;
    const length = 0.15 + noise(index, 9) * 0.19;
    const color = palette[index % palette.length];
    for (let endpoint = 0; endpoint < 2; endpoint += 1) {
      const vertex = index * 2 + endpoint;
      const offset = vertex * 3;
      starts[offset] = originX;
      starts[offset + 1] = originY;
      starts[offset + 2] = originZ;
      directions[offset] = directionX;
      directions[offset + 1] = directionY;
      directions[offset + 2] = directionZ;
      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
      ends[vertex] = endpoint;
      lifetimes[vertex] = lifetime;
      delays[vertex] = delay;
      lengths[vertex] = length;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aStart", new THREE.BufferAttribute(starts, 3));
  geometry.setAttribute("aDirection", new THREE.BufferAttribute(directions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aEnd", new THREE.BufferAttribute(ends, 1));
  geometry.setAttribute("aLifetime", new THREE.BufferAttribute(lifetimes, 1));
  geometry.setAttribute("aDelay", new THREE.BufferAttribute(delays, 1));
  geometry.setAttribute("aLength", new THREE.BufferAttribute(lengths, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.05, 0.5), 2.25);
  const uniforms = { uAge: { value: 0 } };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    vertexShader: `
      uniform float uAge;
      attribute vec3 aStart;
      attribute vec3 aDirection;
      attribute vec3 aColor;
      attribute float aEnd;
      attribute float aLifetime;
      attribute float aDelay;
      attribute float aLength;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float elapsed = max(0.0, uAge - aDelay);
        float life = clamp(elapsed / aLifetime, 0.0, 1.0);
        // Metal leaves sharply, loses speed, then drops a little as it cools.
        float travel = (1.0 - exp(-3.5 * life)) / (1.0 - exp(-3.5));
        float sparkLength = aLength * pow(1.0 - life, 1.15);
        vec3 head = aStart + aDirection * travel;
        head.y -= 0.12 * life * life;
        vec3 point = head - normalize(aDirection) * sparkLength * (1.0 - aEnd);
        float visible = step(aDelay, uAge) * (1.0 - step(aLifetime, elapsed));
        float ignition = clamp(elapsed / 0.012, 0.0, 1.0);
        vAlpha = visible * ignition * pow(1.0 - life, 1.15) * mix(0.08, 1.0, aEnd);
        vColor = aColor * mix(0.72, 1.12, aEnd);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(point, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4(vColor, vAlpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const object = new THREE.LineSegments(geometry, material);
  object.name = "internship-dock-sparks";
  object.matrixAutoUpdate = false;
  object.frustumCulled = false;
  object.renderOrder = 8;
  object.visible = false;

  let age = 0;
  let active = false;
  let disposed = false;
  let triggerCount = 0;

  function trigger() {
    if (disposed) return;
    age = 0;
    active = true;
    triggerCount += 1;
    // A tiny shader lead exposes the initial contact immediately, even if the
    // site's next ticker delta is zero during a scroll update.
    uniforms.uAge.value = 0.012;
    object.visible = true;
  }

  function update(delta, { enabled = true } = {}) {
    if (disposed) return;
    // The multi-window renderer hides this object between chapter passes. Restore
    // the current visibility even while its age is frozen by the motion toggle.
    object.visible = active;
    if (!active || !enabled) return;
    if (Number.isFinite(delta) && delta > 0) age += Math.min(delta, duration);
    uniforms.uAge.value = age + 0.012;
    if (age >= duration) {
      active = false;
      object.visible = false;
    }
  }

  function reset() {
    age = 0;
    active = false;
    uniforms.uAge.value = 0;
    object.visible = false;
  }

  return {
    object,
    trigger,
    update,
    reset,
    getStats: () => ({ active, age, duration, count, triggerCount }),
    dispose() {
      if (disposed) return;
      reset();
      disposed = true;
      object.removeFromParent();
      geometry.dispose();
      material.dispose();
    },
  };
}

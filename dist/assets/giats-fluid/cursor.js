import shaders from "./shaders.js";

// The Giats fluid simulation, ported from its React Three Fiber hosts to WebGL2.
// See SOURCE.txt and LICENSE.txt for attribution and the source revision.
const settings = {
  simulationSize: 50,
  densitySize: 256,
  radius: 0.14 / 100,
  curl: 1,
  pressure: 0,
  iterations: 3,
  densityRetention: 0.965,
  velocityRetention: 0.93,
  intensity: 5 * 0.0001,
};

const baseVertex = "attribute vec3 position;\nattribute vec2 uv;\n" + shaders.base;
const outputFragment = `uniform sampler2D inputBuffer;
varying vec2 vUv;
${shaders.post}
void main() {
  mainImage(vec4(0.0), vUv, gl_FragColor);
}`;

function createRenderer(canvas) {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) return null;

  const programs = [];
  const targets = [];
  const geometry = gl.createBuffer();
  const attributes = gl.createVertexArray();
  const dispose = () => {
    programs.forEach(program => gl.deleteProgram(program));
    targets.forEach(({ texture, framebuffer }) => {
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(framebuffer);
    });
    gl.deleteBuffer(geometry);
    gl.deleteVertexArray(attributes);
  };

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message);
  }

  function link(vertex, fragmentSource) {
    const fragment = compile(gl.FRAGMENT_SHADER, "precision highp float;\n" + fragmentSource);
    const handle = gl.createProgram();
    programs.push(handle);
    gl.attachShader(handle, vertex);
    gl.attachShader(handle, fragment);
    gl.bindAttribLocation(handle, 0, "position");
    gl.bindAttribLocation(handle, 1, "uv");
    gl.linkProgram(handle);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(handle, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(handle));

    const uniforms = new Map();
    const count = gl.getProgramParameter(handle, gl.ACTIVE_UNIFORMS);
    for (let index = 0; index < count; index++) {
      const { name } = gl.getActiveUniform(handle, index);
      uniforms.set(name, gl.getUniformLocation(handle, name));
    }
    return { handle, uniforms };
  }

  function target(size, internalFormat, format, filter) {
    const texture = gl.createTexture();
    const framebuffer = gl.createFramebuffer();
    const result = { texture, framebuffer, size };
    targets.push(result);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, size, size, 0, format, gl.HALF_FLOAT, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("The browser cannot render to this fluid simulation texture.");
    }
    return result;
  }

  function pair(size, internalFormat, format, filter) {
    return {
      read: target(size, internalFormat, format, filter),
      write: target(size, internalFormat, format, filter),
    };
  }

  let vertex;
  try {
    vertex = compile(gl.VERTEX_SHADER, baseVertex);
    const { base, post, ...simulationSources } = shaders;
    const materials = Object.fromEntries(
      Object.entries(simulationSources).map(([name, source]) => [name, link(vertex, source)]),
    );
    materials.output = link(vertex, outputFragment);

    gl.bindVertexArray(attributes);
    gl.bindBuffer(gl.ARRAY_BUFFER, geometry);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 0,
      1, -1, 1, 0,
      -1, 1, 0, 1,
      1, 1, 1, 1,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);

    const { simulationSize, densitySize } = settings;
    const density = pair(densitySize, gl.RGBA16F, gl.RGBA, gl.LINEAR);
    const velocity = pair(simulationSize, gl.RG16F, gl.RG, gl.LINEAR);
    const pressure = pair(simulationSize, gl.R16F, gl.RED, gl.NEAREST);
    const divergence = target(simulationSize, gl.R16F, gl.RED, gl.NEAREST);
    const curl = target(simulationSize, gl.R16F, gl.RED, gl.NEAREST);
    // The original post pass composites against an empty, transparent scene.
    const blank = target(1, gl.RGBA16F, gl.RGBA, gl.NEAREST);

    let width = 1;
    let height = 1;
    let texelSize = [1 / simulationSize, 1 / simulationSize];

    function pass(name, output, values) {
      const { handle, uniforms } = materials[name];
      gl.useProgram(handle);
      const texel = uniforms.get("texelSize");
      if (texel) gl.uniform2fv(texel, texelSize);

      let unit = 0;
      for (const [key, value] of Object.entries(values)) {
        const location = uniforms.get(key);
        if (!location) continue;
        if (typeof value === "number") gl.uniform1f(location, value);
        else if (Array.isArray(value)) {
          if (value.length === 2) gl.uniform2fv(location, value);
          else gl.uniform3fv(location, value);
        } else {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, value.texture);
          gl.uniform1i(location, unit++);
        }
      }

      const destination = output?.write ?? output;
      gl.bindFramebuffer(gl.FRAMEBUFFER, destination?.framebuffer ?? null);
      gl.viewport(0, 0, destination?.size ?? canvas.width, destination?.size ?? canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (output?.write) [output.read, output.write] = [output.write, output.read];
    }

    function reset() {
      gl.clearColor(0, 0, 0, 0);
      for (const { framebuffer } of targets) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function resize() {
      width = document.documentElement.clientWidth;
      height = innerHeight;
      canvas.width = Math.max(1, Math.min(1440, Math.ceil(width / 2)));
      canvas.height = Math.max(1, Math.min(900, Math.ceil(height / 2)));
      texelSize = [1 / (simulationSize * width / (height + 400)), 1 / simulationSize];
    }

    function render(dt, splats) {
      for (const { x, y, dx, dy } of splats) {
        const uniforms = {
          aspectRatio: width / height,
          uPointer: [x / width, 1 - y / height],
          uColor: [dx, -dy, 10],
          uRadius: settings.radius,
        };
        pass("splat", velocity, { ...uniforms, uTarget: velocity.read });
        pass("splat", density, { ...uniforms, uTarget: density.read });
      }

      // Keep the original Giats simulation sequence and ping-pong buffers.
      pass("curl", curl, { uVelocity: velocity.read });
      pass("vorticity", velocity, { uVelocity: velocity.read, uCurl: curl, uCurlValue: settings.curl, dt });
      pass("divergence", divergence, { uVelocity: velocity.read });
      pass("clear", pressure, { uTexture: pressure.read, uClearValue: settings.pressure });
      for (let index = 0; index < settings.iterations; index++) {
        pass("pressure", pressure, { uPressure: pressure.read, uDivergence: divergence });
      }
      pass("gradientSubstract", velocity, { uPressure: pressure.read, uVelocity: velocity.read });
      pass("advection", velocity, {
        uVelocity: velocity.read, uSource: velocity.read, dt,
        uDissipation: settings.velocityRetention ** (dt / 0.016),
      });
      pass("advection", density, {
        uVelocity: velocity.read, uSource: density.read, dt,
        uDissipation: settings.densityRetention ** (dt / 0.016),
      });
      pass("output", null, {
        tFluid: density.read, inputBuffer: blank,
        uColor: [215 / 255, 215 / 255, 212 / 255],
        uBackgroundColor: [0, 0, 0], uIntensity: settings.intensity,
      });
    }

    return { dispose, render, reset, resize };
  } catch (error) {
    dispose();
    console.warn("Giats cursor is unavailable:", error.message);
    return null;
  } finally {
    if (vertex) gl.deleteShader(vertex);
  }
}

const canAnimate = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)");
const canvas = document.createElement("canvas");
canvas.className = "giats-fluid-cursor";
canvas.setAttribute("aria-hidden", "true");
canvas.hidden = true;
canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;mix-blend-mode:difference;opacity:.68;";

let renderer;
let unsupported = false;
let contextLost = false;
let previousPointer;
let previousFrame = 0;
let lastInput = 0;
let frame = 0;
const splats = [];

function stop() {
  cancelAnimationFrame(frame);
  frame = 0;
  previousFrame = 0;
  previousPointer = undefined;
  splats.length = 0;
  canvas.hidden = true;
}

function animate(now) {
  if (!canAnimate.matches || document.hidden || now - lastInput > 1700) {
    stop();
    return;
  }
  if (!previousFrame || now - previousFrame >= 14) {
    const dt = previousFrame ? Math.min((now - previousFrame) / 1000, 0.05) : 0.016;
    previousFrame = now;
    renderer.render(dt, splats);
    splats.length = 0;
    canvas.hidden = false;
  }
  frame = requestAnimationFrame(animate);
}

function move(event) {
  if (event.pointerType !== "mouse" || !canAnimate.matches || unsupported || contextLost || document.hidden) return;
  const { clientX: x, clientY: y } = event;
  const previous = previousPointer;
  previousPointer = [x, y];
  if (!previous) return;
  const dx = x - previous[0];
  const dy = y - previous[1];
  if (!dx && !dy) return;

  if (!renderer) {
    renderer = createRenderer(canvas);
    if (!renderer) {
      unsupported = true;
      return;
    }
    document.body.append(canvas);
    renderer.resize();
  }

  const limit = Math.min(1, 80 / Math.hypot(dx, dy));
  splats.push({ x, y, dx: dx * limit, dy: dy * limit });
  if (splats.length > 8) splats.shift();
  lastInput = performance.now();
  if (!frame) {
    renderer.reset();
    frame = requestAnimationFrame(animate);
  }
}

window.addEventListener("pointermove", move, { passive: true });
document.documentElement.addEventListener("pointerleave", () => { previousPointer = undefined; });
window.addEventListener("blur", stop);
window.addEventListener("resize", () => {
  stop();
  renderer?.resize();
});
document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
canAnimate.addEventListener("change", stop);
window.addEventListener("pagehide", event => {
  stop();
  if (!event.persisted) renderer?.dispose();
});
canvas.addEventListener("webglcontextlost", event => {
  event.preventDefault();
  stop();
  contextLost = true;
  renderer = undefined;
});
canvas.addEventListener("webglcontextrestored", () => { contextLost = false; });

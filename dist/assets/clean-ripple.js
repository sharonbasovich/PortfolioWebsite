(() => {
  const enabled = matchMedia("(any-pointer: fine) and (any-hover: hover) and (prefers-reduced-motion: no-preference) and (forced-colors: none)");
  if (!window.PointerEvent) return;

  const surfaceSelector = ".hero, #experience, .project-section, #about, .site-footer";
  const surfaces = [...document.querySelectorAll(surfaceSelector)];
  if (!surfaces.length) return;

  const style = document.createElement("style");
  style.textContent = `
    :where(.hero, #experience, .project-section, #about, .site-footer) {
      position: relative;
      isolation: isolate;
    }
    .clean-ripple-canvas {
      display: block;
      position: absolute;
      left: 0;
      z-index: -1;
      pointer-events: none;
    }
  `;
  document.head.append(style);

  const lifetime = 1180;
  const reach = 142;
  const layers = new Map();
  let waves = [];
  let frame = 0;
  let lastTime = -Infinity;
  let lastX = -Infinity;
  let lastY = -Infinity;

  function reset() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    waves = [];
    layers.forEach(layer => layer.canvas.remove());
    layers.clear();
    lastTime = -Infinity;
    lastX = -Infinity;
    lastY = -Infinity;
  }

  function addLayer(surface, bounds) {
    if (layers.has(surface)) return;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    // Only allocate the visible slice of a long section, including the ring's margin.
    const offset = Math.max(0, -bounds.top - reach);
    const height = Math.min(bounds.height - offset, innerHeight + reach * 2);
    const width = document.documentElement.clientWidth;
    const density = Math.min(devicePixelRatio || 1, 1.25);
    canvas.className = "clean-ripple-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.left = -bounds.left - surface.clientLeft + "px";
    canvas.style.top = offset + "px";
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = Math.ceil(width * density);
    canvas.height = Math.ceil(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);
    surface.prepend(canvas);

    layers.set(surface, {
      canvas,
      context,
      left: 0,
      top: bounds.top + surface.clientTop + offset,
      width,
      height,
      darkSurface: surface.matches(".site-footer")
    });
  }

  function draw(now) {
    frame = 0;
    waves = waves.filter(wave => now - wave.born < lifetime);
    if (!waves.length || !enabled.matches || document.hidden) {
      reset();
      return;
    }

    const dark = document.documentElement.dataset.theme === "dark";
    layers.forEach(layer => {
      const { context, width, height, left, top } = layer;
      const darkLayer = dark || layer.darkSurface;
      const tone = darkLayer ? "202, 211, 243" : "57, 72, 116";
      const highlight = darkLayer ? "235, 239, 255" : "255, 255, 255";
      context.clearRect(0, 0, width, height);

      waves.forEach(wave => {
        const progress = Math.min(1, (now - wave.born) / lifetime);
        const expansion = 1 - (1 - progress) ** 2;
        const radius = 12 + expansion * (reach - 12);
        const opacity = Math.min(1, progress / .13) * (1 - progress) ** 1.5;
        const x = wave.x - left;
        const y = wave.y - top;
        if (x + radius < 0 || x - radius > width || y + radius < 0 || y - radius > height) return;

        // A soft band and an offset light edge read as a shallow ripple in the surface.
        const halo = context.createRadialGradient(x, y, radius * .64, x, y, radius + 10);
        halo.addColorStop(0, "rgba(" + tone + ", 0)");
        halo.addColorStop(.68, "rgba(" + tone + ", " + opacity * .045 + ")");
        halo.addColorStop(.86, "rgba(" + tone + ", " + opacity * .075 + ")");
        halo.addColorStop(1, "rgba(" + tone + ", 0)");
        context.fillStyle = halo;
        context.beginPath();
        context.arc(x, y, radius + 10, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = "rgba(" + tone + ", " + opacity * (darkLayer ? .19 : .15) + ")";
        context.lineWidth = 1.2;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.stroke();

        context.strokeStyle = "rgba(" + highlight + ", " + opacity * (darkLayer ? .065 : .48) + ")";
        context.lineWidth = 1;
        context.beginPath();
        context.arc(x, y - 1, Math.max(1, radius - 2), 0, Math.PI * 2);
        context.stroke();
      });
    });

    frame = requestAnimationFrame(draw);
  }

  window.addEventListener("pointermove", event => {
    if (!enabled.matches || event.pointerType !== "mouse" || document.hidden) return;
    if (event.target.closest(".site-header, input, textarea, select, [contenteditable], iframe")) return;

    const now = performance.now();
    const distance = Math.hypot(event.clientX - lastX, event.clientY - lastY);
    if (now - lastTime < 92 || distance < 44) return;

    let touchesSurface = false;
    surfaces.forEach(surface => {
      const bounds = surface.getBoundingClientRect();
      if (event.clientY + reach < bounds.top || event.clientY - reach > bounds.bottom) return;
      addLayer(surface, bounds);
      touchesSurface = true;
    });
    if (!touchesSurface) return;

    waves.push({ x: event.clientX, y: event.clientY, born: now });
    if (waves.length > 10) waves.shift();
    lastTime = now;
    lastX = event.clientX;
    lastY = event.clientY;
    if (!frame) frame = requestAnimationFrame(draw);
  }, { passive: true });

  // Clear during scrolling so a stationary mouse never creates a scroll-linked wake.
  window.addEventListener("scroll", reset, { passive: true });
  window.addEventListener("resize", reset, { passive: true });
  window.addEventListener("blur", reset);
  window.addEventListener("pagehide", reset);
  enabled.addEventListener("change", reset);
  document.addEventListener("visibilitychange", () => { if (document.hidden) reset(); });
  document.addEventListener("keydown", event => { if (event.key === "Tab") reset(); });
})();

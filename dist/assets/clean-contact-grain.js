/* Seeded text particles adapted from the Giats preview's SandTitle component.
   MIT attribution and upstream formula provenance: CONTACT-GRAIN-NOTICE.txt. */
(() => {
  function mount() {
    const heading = document.getElementById("contact-title");
    const text = heading?.querySelector(":scope > span");
    if (!text || heading.classList.contains("contact-grain-host")) return;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const raster = document.createElement("canvas");
    const mask = raster.getContext("2d", { willReadFrequently: true });
    if (!context || !mask || !window.IntersectionObserver) return;
    canvas.className = "contact-grain-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;pointer-events:none;user-select:none;display:none;";
    const baseline = document.createElement("span");
    baseline.setAttribute("aria-hidden", "true");
    baseline.style.cssText = "display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline;pointer-events:none;";
    text.append(baseline, canvas);
    text.classList.add("contact-grain-text");
    heading.classList.add("contact-grain-host");

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine) and (forced-colors: none)");
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const pointer = { x: 0, y: 0, active: false };
    let grains = [], palette = [];
    let visible = false, disposed = false, fontsReady = false, selected = false;
    let formed = false, seededFormation = false;
    let width = 0, height = 0, pad = 0, radius = 30;
    let frame = 0, resizeTimer = 0, lastPaint = 0, awakeUntil = 0;
    let sizeKey = "";

    function allowed() {
      return !disposed && fontsReady && fine.matches && !reduced.matches && !selected;
    }
    function solid() {
      heading.classList.remove("contact-grain-ready");
      heading.removeAttribute("data-contact-grain-ready");
      canvas.style.display = "none";
    }
    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastPaint = 0;
    }
    function colors() {
      const style = getComputedStyle(heading);
      palette = [
        style.color,
        style.getPropertyValue("--contact-grain-shadow").trim() || style.color,
        style.getPropertyValue("--contact-grain-glint").trim() || "#c5ceff",
      ];
    }
    function randomGenerator() {
      let seed = 7426;
      return () => {
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        return (seed >>> 0) / 4294967296;
      };
    }

    function rebuild() {
      if (!allowed()) return;
      const box = text.getBoundingClientRect();
      const style = getComputedStyle(text);
      const fontSize = parseFloat(style.fontSize);
      const nextKey = [text.clientWidth, text.clientHeight, style.font, style.fontWeight,
        style.fontFamily, style.letterSpacing].join("|");
      if (nextKey === sizeKey && grains.length) { wake(); return; }
      if (!box.width || !box.height || !fontSize) return;
      sizeKey = nextKey;
      stop();
      solid();
      pad = Math.ceil(clamp(fontSize * 0.24, 12, 21));
      width = text.clientWidth + pad * 2;
      height = text.clientHeight + pad * 2;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.left = `${-pad}px`;
      canvas.style.top = `${-pad}px`;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      raster.width = width;
      raster.height = height;
      mask.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      mask.fillStyle = "white";
      mask.textBaseline = "alphabetic";
      if ("fontKerning" in mask) mask.fontKerning = "none";
      const y = baseline.getBoundingClientRect().top - box.top + pad;
      const range = document.createRange();
      const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
      let node;
      // Actual DOM ranges preserve tracking in browsers without Canvas letterSpacing.
      while ((node = walker.nextNode())) {
        if (!node.nodeValue?.trim()) continue;
        let offset = 0;
        for (const character of node.nodeValue) {
          range.setStart(node, offset);
          offset += character.length;
          range.setEnd(node, offset);
          const glyph = range.getBoundingClientRect();
          mask.fillText(character, glyph.left - box.left + pad, y);
        }
      }
      const pixels = mask.getImageData(0, 0, width, height).data;
      const random = randomGenerator();
      const grainWidth = clamp(fontSize / 110, 0.55, 0.95);
      const attempts = Math.min(24000, Math.ceil(width * height / (grainWidth ** 2 * 1.3)));
      radius = clamp(fontSize * 0.45, 18, 38);
      grains = [];
      for (let index = 0; index < attempts && grains.length < 4200; index++) {
        const tx = random() * width, ty = random() * height;
        if (pixels[(Math.floor(ty) * width + Math.floor(tx)) * 4 + 3] < 160) continue;
        const angle = random() * Math.PI * 2;
        const spread = 3 + random() * 7;
        const tone = random();
        grains.push({ tx, ty, x: tx, y: ty, vx: 0, vy: 0,
          dx: Math.cos(angle) * spread, dy: Math.sin(angle) * spread,
          size: grainWidth * (0.65 + random() * 0.65),
          tone: Number(tone > 0.82) + Number(tone > 0.96) });
      }
      grains.sort((a, b) => a.tone - b.tone);
      seededFormation = false;
      colors();
      wake();
    }

    function draw(now) {
      frame = 0;
      if (!allowed() || !visible || document.hidden || !grains.length) return;
      if (lastPaint && now - lastPaint < 1000 / 32) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const dt = clamp((now - (lastPaint || now - 33.33)) / 1000, 0.005, 0.05);
      lastPaint = now;
      if (!formed && !seededFormation) {
        for (const grain of grains) {
          grain.x += grain.dx;
          grain.y += grain.dy;
        }
        seededFormation = true;
      }
      const omega = 18, decay = Math.exp(-omega * dt);
      const reachSquared = radius * radius;
      context.clearRect(0, 0, width, height);
      let tone = -1;
      for (const grain of grains) {
        let tx = grain.tx, ty = grain.ty;
        if (pointer.active) {
          const dx = tx - pointer.x, dy = ty - pointer.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < reachSquared) {
            const distance = Math.sqrt(distanceSquared) || 0.1;
            const force = (1 - distance / radius) ** 2 * radius * 0.4;
            tx += dx / distance * force;
            ty += dy / distance * force;
          }
        }
        // Closed-form critical damping stays calm through slower frame cadences.
        const x = grain.x - tx, y = grain.y - ty;
        const jx = (grain.vx + omega * x) * dt;
        const jy = (grain.vy + omega * y) * dt;
        grain.x = tx + (x + jx) * decay;
        grain.y = ty + (y + jy) * decay;
        grain.vx = (grain.vx - omega * jx) * decay;
        grain.vy = (grain.vy - omega * jy) * decay;
        if (tone !== grain.tone) { tone = grain.tone; context.fillStyle = palette[tone]; }
        context.fillRect(grain.x, grain.y, grain.size, grain.size);
      }
      canvas.style.display = "block";
      heading.classList.add("contact-grain-ready");
      heading.setAttribute("data-contact-grain-ready", "true");
      if (now < awakeUntil) frame = requestAnimationFrame(draw);
      else formed = true;
    }
    function wake() {
      if (!allowed() || !visible || document.hidden || !grains.length) return;
      awakeUntil = performance.now() + 900;
      if (!frame) { lastPaint = 0; frame = requestAnimationFrame(draw); }
    }
    function move(event) {
      if (!allowed() || event.pointerType === "touch" || event.buttons) return;
      const box = text.getBoundingClientRect();
      pointer.x = event.clientX - box.left + pad;
      pointer.y = event.clientY - box.top + pad;
      pointer.active = true;
      wake();
    }
    function leave() { pointer.active = false; wake(); }
    function selection() {
      const value = getSelection();
      const next = Boolean(value && !value.isCollapsed &&
        (value.containsNode(text, true) || heading.contains(value.anchorNode) ||
          heading.contains(value.focusNode)));
      if (next === selected) return;
      selected = next;
      pointer.active = false;
      if (selected) { stop(); solid(); }
      else wake();
    }
    function availability() {
      pointer.active = false;
      if (!allowed()) { stop(); solid(); }
      else rebuild();
    }
    function visibility() {
      pointer.active = false;
      if (document.hidden) stop();
      else wake();
    }
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else stop();
    }, { threshold: 0.15 });
    intersection.observe(heading);
    const size = window.ResizeObserver ? new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuild, 90);
    }) : null;
    size?.observe(text);
    const theme = new MutationObserver(() => { colors(); wake(); });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    text.addEventListener("pointermove", move, { passive: true });
    text.addEventListener("pointerleave", leave);
    text.addEventListener("pointercancel", leave);
    reduced.addEventListener("change", availability);
    fine.addEventListener("change", availability);
    document.addEventListener("selectionchange", selection);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", leave);
    function dispose(event) {
      if (event.persisted || disposed) return;
      disposed = true;
      stop();
      clearTimeout(resizeTimer);
      intersection.disconnect();
      size?.disconnect();
      theme.disconnect();
      text.removeEventListener("pointermove", move);
      text.removeEventListener("pointerleave", leave);
      text.removeEventListener("pointercancel", leave);
      reduced.removeEventListener("change", availability);
      fine.removeEventListener("change", availability);
      document.removeEventListener("selectionchange", selection);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", leave);
      window.removeEventListener("pagehide", dispose);
      solid();
      canvas.remove();
      baseline.remove();
      text.classList.remove("contact-grain-text");
      heading.classList.remove("contact-grain-host");
    }
    window.addEventListener("pagehide", dispose);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (disposed) return;
      fontsReady = true;
      rebuild();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();

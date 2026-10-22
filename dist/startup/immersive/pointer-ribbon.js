const SVG_NS = "http://www.w3.org/2000/svg";
const SAMPLE_COUNT = 15;
let ribbonId = 0;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const pointText = (point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`;

function smoothSide(points, move = true) {
  let path = `${move ? "M" : "L"}${pointText(points[0])}`;
  for (let index = 1; index < points.length - 1; index++) {
    const point = points[index];
    const next = points[index + 1];
    path += `Q${pointText(point)} ${((point.x + next.x) / 2).toFixed(2)},${((point.y + next.y) / 2).toFixed(2)}`;
  }
  return `${path}L${pointText(points[points.length - 1])}`;
}

/**
 * A decorative SVG ribbon driven by the caller's existing animation clock.
 * Coordinates and resize dimensions are local CSS pixels. This takes ownership
 * of the supplied SVG's children until dispose(), without registering listeners.
 */
export function createPointerRibbon(svg) {
  const document = svg?.ownerDocument;
  if (!document?.createElementNS || svg.namespaceURI !== SVG_NS)
    throw new TypeError("createPointerRibbon requires an SVG element.");

  const make = (tag, attributes = {}) => {
    const element = document.createElementNS(SVG_NS, tag);
    for (const [name, value] of Object.entries(attributes))
      element.setAttribute(name, String(value));
    return element;
  };
  const originalChildren = [...svg.childNodes];
  const originalAttributes = new Map(
    ["viewBox", "preserveAspectRatio", "data-pointer-ribbon", "aria-hidden"].map(
      (name) => [name, svg.getAttribute(name)],
    ),
  );
  const originalOpacity = svg.style.opacity;
  const originalVisibility = svg.style.visibility;
  const prefix = `pointer-ribbon-${++ribbonId}`;
  const defs = make("defs");
  const surface = make("linearGradient", {
    id: `${prefix}-surface`,
    gradientUnits: "userSpaceOnUse",
  });
  const glint = make("linearGradient", {
    id: `${prefix}-glint`,
    gradientUnits: "userSpaceOnUse",
  });
  for (const [offset, color] of [
    [0, "#182e6e"],
    [0.13, "#637de0"],
    [0.3, "#d8e8ff"],
    [0.43, "#ffffff"],
    [0.52, "#7796cf"],
    [0.69, "#2d43c9"],
    [0.87, "#92b9ff"],
    [1, "#243f91"],
  ])
    surface.append(make("stop", { offset, "stop-color": color }));
  for (const [offset, opacity] of [
    [0, 0],
    [0.18, 0.95],
    [0.64, 0.68],
    [1, 0],
  ])
    glint.append(
      make("stop", {
        offset,
        "stop-color": "#f4faff",
        "stop-opacity": opacity,
      }),
    );
  defs.append(surface, glint);

  const group = make("g", { class: "pointer-ribbon__material" });
  const layers = [
    { name: "edge", width: 1.17, offset: 0, fill: "#4264cc", opacity: 0.3 },
    {
      name: "surface",
      width: 1,
      offset: 0,
      fill: `url(#${prefix}-surface)`,
      opacity: 0.96,
    },
    { name: "bevel", width: 0.42, offset: -0.18, fill: "#d3e8ff", opacity: 0.16 },
    {
      name: "glint",
      width: 0.075,
      offset: -0.54,
      fill: `url(#${prefix}-glint)`,
      opacity: 0.92,
    },
  ].map((layer) => {
    const path = make("path", {
      class: `pointer-ribbon__layer pointer-ribbon__${layer.name}`,
    });
    // Explicit presentation also overrides the previous uniform-stroke rule.
    path.style.fill = layer.fill;
    path.style.stroke = "none";
    path.style.filter = "none";
    path.style.opacity = String(layer.opacity);
    group.append(path);
    return { ...layer, path };
  });
  svg.replaceChildren(defs, group);
  svg.setAttribute("data-pointer-ribbon", "");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("preserveAspectRatio", "none");

  const samples = Array.from({ length: SAMPLE_COUNT }, () => ({ x: 0, y: 0 }));
  let width = 0;
  let height = 0;
  let seeded = false;
  let disposed = false;
  let previousX = 0;
  let previousY = 0;
  let materialWidth = 7;
  let headNormal = { x: 0, y: 1 };

  function hide() {
    group.style.visibility = "hidden";
    group.style.opacity = "0";
    svg.style.opacity = "0";
    svg.style.visibility = "hidden";
  }

  function reset() {
    if (disposed) return;
    seeded = false;
    materialWidth = 7;
    headNormal = { x: 0, y: 1 };
    hide();
    for (const layer of layers) layer.path.removeAttribute("d");
  }

  function resize(nextWidth, nextHeight) {
    if (disposed) return;
    const w = Number.isFinite(nextWidth) ? Math.max(0, nextWidth) : 0;
    const h = Number.isFinite(nextHeight) ? Math.max(0, nextHeight) : 0;
    if (w !== width || h !== height) reset();
    width = w;
    height = h;
    svg.setAttribute("viewBox", `0 0 ${Math.max(1, w)} ${Math.max(1, h)}`);
  }

  function update(pointer, delta, enabled) {
    if (disposed) return;
    const x = pointer?.x;
    const y = pointer?.y;
    const age = Math.max(0, performance.now() - (pointer?.movedAt || 0));
    if (
      !enabled ||
      !pointer?.active ||
      !width ||
      !height ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 0 ||
      x > width ||
      y < 0 ||
      y > height ||
      age >= 500
    ) {
      reset();
      return;
    }
    if (!seeded) {
      for (const point of samples) {
        point.x = x;
        point.y = y;
      }
      previousX = x;
      previousY = y;
      seeded = true;
      hide();
      return;
    }

    const dt = Number.isFinite(delta) ? clamp(delta, 0, 0.05) : 1 / 60;
    if (!dt) return;
    const speed = Math.hypot(x - previousX, y - previousY) / dt;
    previousX = x;
    previousY = y;
    const widthTarget = clamp(Math.min(width, height) * 0.014, 6, 9) +
      clamp(speed / 2000, 0, 1) * 3.5;
    materialWidth += (widthTarget - materialWidth) * (1 - Math.exp(-dt * 16));

    samples[0].x = x;
    samples[0].y = y;
    // Backward Euler preserves 22ms of lag per cascaded sample even at 20fps;
    // an exponential step collapses this sequential chain on longer frames.
    const follow = dt / (dt + 0.022);
    const spacing = clamp(Math.min(width, height) * 0.4, 90, 210) /
      (SAMPLE_COUNT - 1);
    const distances = [0];
    for (let index = 1; index < samples.length; index++) {
      const point = samples[index];
      const ahead = samples[index - 1];
      point.x += (ahead.x - point.x) * follow;
      point.y += (ahead.y - point.y) * follow;
      const distance = Math.hypot(point.x - ahead.x, point.y - ahead.y);
      if (distance > spacing) {
        const fit = spacing / distance;
        point.x = ahead.x + (point.x - ahead.x) * fit;
        point.y = ahead.y + (point.y - ahead.y) * fit;
      }
      distances.push(distances[index - 1] + Math.min(spacing, distance));
    }
    const length = distances[distances.length - 1];
    if (length < 1.5) {
      hide();
      return;
    }

    const normals = [];
    const radii = [];
    let normal = headNormal;
    let widest = 0;
    for (let index = 0; index < samples.length; index++) {
      const before = samples[Math.max(0, index - 1)];
      const after = samples[Math.min(samples.length - 1, index + 1)];
      const dx = before.x - after.x;
      const dy = before.y - after.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0.01) {
        let nx = -dy / distance;
        let ny = dx / distance;
        // Keep the strip's sides continuous during tight pointer reversals.
        if (nx * normal.x + ny * normal.y < 0) {
          nx = -nx;
          ny = -ny;
        }
        normal = { x: nx, y: ny };
      }
      normals.push(normal);
      const fraction = distances[index] / length;
      const taper = Math.sin(Math.PI * Math.sqrt(fraction));
      radii.push(Math.max(0, taper) * materialWidth * 0.5);
      if (radii[index] > radii[widest]) widest = index;
    }
    headNormal = normals[0];

    for (const layer of layers) {
      const left = [];
      const right = [];
      for (let index = 0; index < samples.length; index++) {
        const point = samples[index];
        const n = normals[index];
        const radius = radii[index];
        const outer = radius * (layer.offset + layer.width);
        const inner = radius * (layer.offset - layer.width);
        left.push({ x: point.x + n.x * outer, y: point.y + n.y * outer });
        right.push({ x: point.x + n.x * inner, y: point.y + n.y * inner });
      }
      layer.path.setAttribute("d", `${smoothSide(left)}${smoothSide(right.reverse(), false)}Z`);
    }
    const center = samples[widest];
    const n = normals[widest];
    const radius = Math.max(1, radii[widest]);
    surface.setAttribute("x1", String(center.x - n.x * radius));
    surface.setAttribute("y1", String(center.y - n.y * radius));
    surface.setAttribute("x2", String(center.x + n.x * radius));
    surface.setAttribute("y2", String(center.y + n.y * radius));
    glint.setAttribute("x1", String(samples[0].x));
    glint.setAttribute("y1", String(samples[0].y));
    glint.setAttribute("x2", String(samples[samples.length - 1].x));
    glint.setAttribute("y2", String(samples[samples.length - 1].y));

    const fade = clamp((age - 180) / 320, 0, 1);
    const opacity = (1 - fade * fade * (3 - 2 * fade)) * clamp(length / 18, 0, 1);
    group.style.opacity = opacity.toFixed(3);
    group.style.visibility = "visible";
    svg.style.opacity = "1";
    svg.style.visibility = "visible";
  }

  function dispose() {
    if (disposed) return;
    reset();
    disposed = true;
    svg.replaceChildren(...originalChildren);
    for (const [name, value] of originalAttributes) {
      if (value === null) svg.removeAttribute(name);
      else svg.setAttribute(name, value);
    }
    svg.style.opacity = originalOpacity;
    svg.style.visibility = originalVisibility;
  }

  reset();
  return { resize, update, reset, dispose };
}

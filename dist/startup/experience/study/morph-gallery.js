const SVG = "http://www.w3.org/2000/svg";
let sequence = 0;

const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const settle = (value) => {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const mix = (a, b, t) => a + (b - a) * t;
const number = (value) => Math.round(value * 1000) / 1000;

function element(tag, attributes = {}) {
  const node = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attributes))
    node.setAttribute(key, String(value));
  return node;
}

function attributes(node, bounds) {
  for (const key of ["x", "y", "width", "height"])
    node.setAttribute(key, String(number(bounds[key])));
}

function rgb(value) {
  const channels = value.match(/[\d.]+/g);
  return channels?.length >= 3 ? channels.slice(0, 3).map(Number) : [12, 18, 30];
}

function fit(width, height, ratio) {
  const w = Math.min(width, height * ratio);
  const h = w / ratio;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}

function remember(node) {
  return {
    node,
    style: node.getAttribute("style"),
    hidden: node.getAttribute("aria-hidden"),
    inert: node.getAttribute("inert"),
  };
}

function restore({ node, style, hidden, inert }) {
  for (const [name, value] of [["style", style], ["aria-hidden", hidden], ["inert", inert]]) {
    if (value === null) node.removeAttribute(name);
    else node.setAttribute(name, value);
  }
}

/**
 * Preview-only gallery. One SVG viewport owns the changing image aperture;
 * semantic project copy stays in the existing DOM and moves only on the right.
 * Geometry reads happen at mount/refresh, never in the scroll-linked paint.
 * The timeline uses the calling page's GSAP clock and its existing stop math.
 */
export function mountMorphGallery({
  gallery,
  track,
  panels,
  clock,
  gsap,
  ScrollTrigger,
  holdDuration = 1.2,
  transferDuration = 0.9,
} = {}) {
  const empty = { dispose() {}, update() {} };
  if (!gallery || !track || !clock || !gsap || !ScrollTrigger) return empty;
  const records = Array.from(panels || []).map((panel) => {
    const original = panel.querySelector(".project-evidence img, .project-window img");
    const host = panel.querySelector(".project-window");
    const copy = panel.querySelector(".project-copy");
    if (!original || !host || !copy) return null;
    const width = Number(original.getAttribute("width")) || original.naturalWidth;
    const height = Number(original.getAttribute("height")) || original.naturalHeight;
    if (!(width > 0 && height > 0)) return null;
    return {
      panel, host, copy,
      source: original.currentSrc || original.src,
      ratio: width / height,
      alt: original.alt,
      logo: Boolean(panel.querySelector(".project-evidence--logo")),
      color: rgb(getComputedStyle(panel.querySelector(".project-evidence-media") || host).backgroundColor),
      remembered: [remember(panel), remember(copy)],
      lastOpacity: null,
      lastX: null,
      lastLayerOpacity: null,
      lastAccessible: null,
    };
  });
  if (!records.length || records.some((record) => !record)) return empty;

  const alreadyStudy = gallery.classList.contains("study-gallery");
  const alreadyEnhanced = gallery.classList.contains("is-horizontal");
  const id = `study-gallery-aperture-${++sequence}`;
  const frame = document.createElement("div");
  frame.className = "study-gallery-frame";
  const visual = element("svg", {
    class: "study-gallery-visual",
    role: "img",
    "aria-label": records[0].alt,
    focusable: "false",
    preserveAspectRatio: "xMinYMin meet",
  });
  const definitions = element("defs");
  const clip = element("clipPath", { id, clipPathUnits: "userSpaceOnUse" });
  const aperture = element("rect", { rx: 24, "data-study-aperture": "" });
  clip.append(aperture);
  definitions.append(clip);
  const background = element("rect", { rx: 24, class: "study-gallery-background" });
  const images = element("g", { "clip-path": `url(#${id})` });
  const edge = element("rect", { rx: 24, class: "study-gallery-edge" });
  visual.append(definitions, background, images, edge);
  for (const record of records) {
    record.layer = element("g", { opacity: 0 });
    record.image = element("image", {
      href: record.source,
      preserveAspectRatio: record.logo ? "xMidYMid meet" : "xMidYMid slice",
      "data-study-project-image": record.panel.dataset.projectKey || "",
    });
    record.layer.append(record.image);
    images.append(record.layer);
  }
  frame.append(visual);
  gallery.classList.add("study-gallery", "is-horizontal");
  gallery.append(frame);

  let disposed = false;
  let slot;
  let fits;
  let lastIndex = NaN;
  let lastSelected = -1;
  let timeline;

  function measure() {
    if (disposed) return false;
    // Read first, then write: the hidden original slot still provides the
    // accepted two-column layout, including short-laptop density rules.
    const host = records[0].host.getBoundingClientRect();
    const container = gallery.getBoundingClientRect();
    const radius = parseFloat(getComputedStyle(records[0].host).borderTopLeftRadius) || 24;
    if (host.width < 2 || host.height < 2) return false;
    slot = {
      left: host.left - container.left,
      top: host.top - container.top,
      width: host.width,
      height: host.height,
      radius,
    };
    fits = records.map((record) => fit(slot.width, slot.height, record.ratio));
    Object.assign(frame.style, {
      left: `${number(slot.left)}px`,
      top: `${number(slot.top)}px`,
      width: `${number(slot.width)}px`,
      height: `${number(slot.height)}px`,
    });
    visual.setAttribute("viewBox", `0 0 ${number(slot.width)} ${number(slot.height)}`);
    lastIndex = NaN;
    update(clock.index);
    return true;
  }

  function copyState(record, index, selected, opacity, x) {
    const visible = opacity > 0.0005;
    if (record.lastOpacity !== opacity) {
      record.copy.style.opacity = String(number(opacity));
      record.copy.style.visibility = visible ? "visible" : "hidden";
      record.lastOpacity = opacity;
    }
    if (record.lastX !== x) {
      record.copy.style.transform = `translate3d(${number(x)}px,0,0)`;
      record.lastX = x;
    }
    const accessible = index === selected && opacity > 0.1;
    if (record.lastAccessible !== accessible) {
      // Selector buttons sit outside these panels, so hidden links never steal
      // keyboard focus; jumping to a stop restores the complete selected card.
      record.panel.inert = !accessible;
      record.copy.inert = !accessible;
      record.panel.setAttribute("aria-hidden", String(!accessible));
      record.copy.setAttribute("aria-hidden", String(!accessible));
      record.copy.style.pointerEvents = accessible ? "auto" : "none";
      record.lastAccessible = accessible;
    }
  }

  function update(value = clock.index) {
    if (disposed || !slot || !fits) return;
    const p = clamp(Number.isFinite(value) ? value : 0, 0, records.length - 1);
    if (Math.abs(p - lastIndex) < 0.000001) return;
    lastIndex = p;
    const lower = Math.floor(p);
    const upper = Math.min(records.length - 1, lower + 1);
    const fraction = p - lower;
    const blend = settle(fraction);
    const selected = Math.round(p);
    const bounds = {};
    for (const key of ["x", "y", "width", "height"])
      bounds[key] = mix(fits[lower][key], fits[upper][key], blend);
    attributes(aperture, bounds);
    attributes(background, bounds);
    attributes(edge, bounds);
    const radius = Math.min(slot.radius, bounds.width / 2, bounds.height / 2);
    for (const rectangle of [aperture, background, edge]) rectangle.setAttribute("rx", String(number(radius)));
    background.setAttribute("fill", `rgb(${records[lower].color.map((channel, index) => Math.round(mix(channel, records[upper].color[index], blend))).join(",")})`);

    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      let layerOpacity = 0;
      if (index === lower) layerOpacity = 1 - blend;
      if (index === upper) layerOpacity = lower === upper ? 1 : blend;
      if (record.lastLayerOpacity !== layerOpacity) {
        record.layer.setAttribute("opacity", String(number(layerOpacity)));
        record.lastLayerOpacity = layerOpacity;
      }
      if (layerOpacity > 0 || (lower === upper && index === lower)) {
        const inset = record.logo ? 0.84 : 1;
        attributes(record.image, {
          x: bounds.x + bounds.width * (1 - inset) / 2,
          y: bounds.y + bounds.height * (1 - inset) / 2,
          width: bounds.width * inset,
          height: bounds.height * inset,
        });
      }
      let opacity = 0;
      let x = 42;
      if (index === lower) {
        const leaving = settle(fraction / 0.48);
        opacity = 1 - leaving;
        x = -36 * leaving;
      } else if (index === upper) {
        const entering = settle((fraction - 0.4) / 0.6);
        opacity = entering;
        x = 42 * (1 - entering);
      }
      copyState(record, index, selected, opacity, x);
    }
    if (selected !== lastSelected) {
      visual.setAttribute("aria-label", records[selected].alt);
      frame.dataset.studyProject = records[selected].panel.dataset.projectKey || String(selected);
      lastSelected = selected;
    }
    frame.dataset.studyIndex = String(number(p));
  }

  function getFirstBounds() {
    if (!slot || !fits) return null;
    // Called by the intro's refresh measurement, not by this gallery's paint.
    const box = frame.getBoundingClientRect();
    const first = fits[0];
    const left = box.left + first.x;
    const top = box.top + first.y;
    return {
      x: left, y: top, left, top,
      width: first.width, height: first.height,
      right: left + first.width, bottom: top + first.height,
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    ScrollTrigger.removeEventListener("refresh", measure);
    timeline?.scrollTrigger?.kill();
    timeline?.kill();
    frame.remove();
    for (const record of records)
      for (const remembered of record.remembered) restore(remembered);
    if (!alreadyStudy) gallery.classList.remove("study-gallery");
    if (!alreadyEnhanced) gallery.classList.remove("is-horizontal");
  }

  // A rebuild can arrive with the shared clock at another project. Reset the
  // timeline's first hold explicitly; the caller restores its saved scroll stop.
  // Otherwise GSAP could capture a nonzero start and animate the first hold.
  gsap.set(clock, { index: 0 });
  if (!measure()) {
    dispose();
    return empty;
  }
  timeline = gsap.timeline({
    onUpdate: () => update(clock.index),
    scrollTrigger: {
      id: "study-morph-gallery",
      trigger: gallery,
      start: "top top",
      end: () => `+=${innerHeight * 3.2 * records.length / 3}`,
      pin: true,
      scrub: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      refreshPriority: 2,
    },
  });
  timeline.to(clock, { index: 0, duration: holdDuration, ease: "none" });
  for (let index = 1; index < records.length; index++) {
    timeline.to(clock, { index, duration: transferDuration, ease: "none" });
    timeline.to({}, { duration: holdDuration });
  }
  ScrollTrigger.addEventListener("refresh", measure);
  measure();

  return {
    timeline,
    trigger: timeline.scrollTrigger,
    update,
    dispose,
    frame,
    getFirstBounds,
    firstImage: records[0].image,
    ratio: records[0].ratio,
  };
}

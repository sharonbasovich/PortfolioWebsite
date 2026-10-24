const SVG = "http://www.w3.org/2000/svg";
const photograph = new URL(
  "./assets/project-evidence/drawing-robot-prototype.webp",
  import.meta.url,
).href;
let sequence = 0;

const clamp = (value) => Math.min(1, Math.max(0, value));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const phase = (progress, from, to) => smooth((progress - from) / (to - from));
const mix = (from, to, progress) => from + (to - from) * progress;

function node(tag, attributes = {}) {
  const element = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attributes))
    element.setAttribute(key, String(value));
  return element;
}

function rectangle(element, bounds, radius = 0) {
  for (const key of ["x", "y", "width", "height"])
    element.setAttribute(key, bounds[key].toFixed(2));
  if (element.tagName.toLowerCase() === "rect")
    element.setAttribute("rx", radius.toFixed(2));
}

function fittedPhoto(bounds) {
  const ratio = 1417 / 667;
  const width = Math.min(bounds.width, bounds.height * ratio);
  const height = width / ratio;
  return {
    x: bounds.x + (bounds.width - width) / 2,
    y: bounds.y + (bounds.height - height) / 2,
    width,
    height,
  };
}

/**
 * Read the title first, then reveal one real photograph through its letterforms
 * and move it into the existing first-project photograph. A CSS sticky stage
 * holds the title through the reveal; one scrubbed timeline, no new render loop.
 * Call inside the page's GSAP context. Revert that context before dispose().
 */
export function mountProjectMotion({
  heading,
  stage,
  firstProject,
  gsap,
  ScrollTrigger,
  enabled,
}) {
  const noop = { dispose() {} };
  if (
    !enabled ||
    !heading ||
    !stage ||
    !firstProject ||
    !gsap ||
    !ScrollTrigger ||
    !matchMedia(
      "(min-width: 1100px) and (min-height: 650px) and (hover: hover) and (pointer: fine)",
    ).matches ||
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    stage.classList.contains("projects-photo-stage")
  )
    return noop;

  const frame = firstProject.matches?.(".project-window")
    ? firstProject
    : firstProject.querySelector(".project-window");
  const panel = frame?.closest(".project-panel") || firstProject;
  const gallery = frame?.closest(".project-gallery");
  const original = frame?.querySelector(".project-evidence img, img");
  // Handoff requires a real destination photograph, rather than inventing a
  // duplicate frame or leaving a decorative photograph over unrelated copy.
  if (!frame || !gallery || !original) return noop;

  const oldOpacity = original.style.getPropertyValue("opacity");
  const oldPriority = original.style.getPropertyPriority("opacity");
  const sourceWasMarked = heading.classList.contains("projects-photo-source");
  const targetWasMarked = original.classList.contains("projects-photo-target");
  const maskId = `projects-photo-mask-${++sequence}`;
  const visual = node("svg", {
    class: "projects-photo-visual",
    "aria-hidden": "true",
    focusable: "false",
    preserveAspectRatio: "xMinYMin meet",
  });
  const definitions = node("defs");
  const mask = node("mask", {
    id: maskId,
    maskUnits: "userSpaceOnUse",
    maskContentUnits: "userSpaceOnUse",
    x: 0,
    y: 0,
  });
  const words = heading.textContent.trim().split(/\s+/);
  const lines = [words.shift() || "My", words.join(" ") || "projects"];
  const maskType = node("g", { fill: "white" });
  const solidType = node("g", { class: "projects-photo-type-solid" });
  const outlineType = node("g", { class: "projects-photo-type-outline" });
  const type = lines.map((line) => {
    const fill = node("text", { class: "projects-photo-letterform" });
    const solid = node("text", { class: "projects-photo-letterform" });
    const outline = node("text", { class: "projects-photo-letterform" });
    fill.textContent = line;
    solid.textContent = line;
    outline.textContent = line;
    maskType.append(fill);
    solidType.append(solid);
    outlineType.append(outline);
    return { fill, solid, outline };
  });
  const opening = node("rect", { fill: "white", x: 0, y: 0, width: 0, height: 0 });
  mask.append(maskType, opening);
  definitions.append(mask);
  const image = node("image", {
    href: photograph,
    mask: `url(#${maskId})`,
    preserveAspectRatio: "xMidYMid slice",
  });
  const edge = node("rect", { class: "projects-photo-frame-edge" });
  visual.append(definitions, image, solidType, outlineType, edge);
  stage.classList.add("projects-photo-stage");
  heading.classList.add("projects-photo-source");
  original.classList.add("projects-photo-target");
  stage.append(visual);

  let disposed = false;
  let layout;
  let timeline;
  const clock = { progress: 0 };

  function measure() {
    if (disposed) return false;
    const stageBox = stage.getBoundingClientRect();
    const box = visual.getBoundingClientRect();
    const photoBox = original.getBoundingClientRect();
    const panelBox = panel.getBoundingClientRect();
    const galleryBox = gallery.getBoundingClientRect();
    if (box.width < 2 || box.height < 2 || photoBox.width < 2 || photoBox.height < 2)
      return false;

    // A refreshed gallery may already be pinned and horizontally translated.
    // Its spacer retains natural document position; local panel measurements
    // cancel the horizontal transform rather than baking it into the dock.
    const anchor = gallery.parentElement?.classList.contains("pin-spacer")
      ? gallery.parentElement
      : gallery;
    const anchorBox = anchor.getBoundingClientRect();
    const contained = fittedPhoto(photoBox);
    const destination = {
      x: galleryBox.x - box.x + panel.offsetLeft + contained.x - panelBox.x,
      // Sticky travel is already reserved in the stage height. The photo docks
      // after that travel, when this viewport resumes moving with the document.
      y: anchorBox.y - stageBox.y - (stageBox.height - box.height) +
        panel.offsetTop + contained.y - panelBox.y,
      width: contained.width,
      height: contained.height,
    };
    const gutter = box.width * 0.045;
    const start = {
      x: gutter,
      y: box.height * 0.1,
      width: box.width - gutter * 2,
      height: box.height * 0.8,
    };
    visual.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    mask.setAttribute("width", String(box.width));
    mask.setAttribute(
      "height",
      String(Math.max(box.height, destination.y + destination.height) + 40),
    );
    const typography = getComputedStyle(heading);
    for (const { fill, solid, outline } of type) {
      for (const text of [fill, solid, outline]) {
        text.style.fontFamily = typography.fontFamily;
        text.style.fontWeight = typography.fontWeight;
        text.setAttribute("font-size", "100");
        text.setAttribute("x", "0");
        text.setAttribute("y", "0");
      }
    }
    const longest = Math.max(...type.map(({ fill }) => fill.getBBox().width), 1);
    // Fit both words within the held viewport, below the fixed site header.
    const size = Math.min((start.width / longest) * 100, box.height * 0.36);
    type.forEach(({ fill, solid, outline }, index) => {
      for (const text of [fill, solid, outline]) {
        text.setAttribute("font-size", String(size));
        text.setAttribute("y", String(index * size * 0.88));
      }
    });
    const bounds = type.map(({ fill }) => fill.getBBox());
    const top = Math.min(...bounds.map((bound) => bound.y));
    const bottom = Math.max(...bounds.map((bound) => bound.y + bound.height));
    const offsetY = (box.height - (bottom - top)) / 2 - top;
    type.forEach(({ fill, solid, outline }, index) => {
      for (const text of [fill, solid, outline]) {
        text.setAttribute("x", String(gutter));
        text.setAttribute("y", String(offsetY + index * size * 0.88));
      }
    });
    const stickyTop = parseFloat(getComputedStyle(visual).top) || 100;
    const scrollRange = stageBox.height + stickyTop - innerHeight * 0.2;
    const holdEnd = clamp((stageBox.height - box.height) / scrollRange);
    layout = { start, destination, holdEnd };
    return true;
  }

  function paint(progress) {
    if (disposed || !layout) return;
    const p = clamp(progress);
    // The effect begins only after both words fit. Keep type and aperture
    // phases inside the CSS sticky interval, then dock during natural scrolling.
    const { holdEnd } = layout;
    const photographReveal = phase(p, holdEnd * 0.22, holdEnd * 0.6);
    const open = phase(p, holdEnd * 0.55, holdEnd * 0.98);
    const dock = phase(p, holdEnd, 0.97);
    const handoff = phase(p, 0.96, 1);
    const bounds = {};
    for (const key of ["x", "y", "width", "height"])
      bounds[key] = mix(layout.start[key], layout.destination[key], dock);
    rectangle(image, bounds);
    const aperture = {
      x: bounds.x + (bounds.width * (1 - open)) / 2,
      y: bounds.y + (bounds.height * (1 - open)) / 2,
      width: bounds.width * open,
      height: bounds.height * open,
    };
    const radius = mix(24, 10, dock);
    rectangle(opening, aperture, radius);
    rectangle(edge, bounds, radius);
    image.style.opacity = photographReveal.toFixed(4);
    solidType.setAttribute("opacity", (1 - photographReveal).toFixed(4));
    maskType.setAttribute("opacity", (1 - phase(p, layout.holdEnd * 0.8, layout.holdEnd)).toFixed(4));
    outlineType.setAttribute("opacity", (1 - phase(p, layout.holdEnd * 0.56, layout.holdEnd * 0.98)).toFixed(4));
    edge.style.opacity = String(open * (1 - handoff));
    visual.style.opacity = (1 - handoff).toFixed(4);
    original.style.opacity = handoff.toFixed(4);
  }

  function refresh() {
    if (measure()) paint(clock.progress);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    ScrollTrigger.removeEventListener("refresh", refresh);
    timeline?.scrollTrigger?.kill();
    timeline?.kill();
    visual.remove();
    stage.classList.remove("projects-photo-stage");
    if (!sourceWasMarked) heading.classList.remove("projects-photo-source");
    if (!targetWasMarked) original.classList.remove("projects-photo-target");
    if (oldOpacity) original.style.setProperty("opacity", oldOpacity, oldPriority);
    else original.style.removeProperty("opacity");
  }

  if (!measure()) {
    dispose();
    return noop;
  }
  paint(0);
  timeline = gsap.timeline({
    scrollTrigger: {
      id: "projects-photo-reveal",
      trigger: stage,
      start: "top 100px",
      // Sticky space is ordinary document flow, so the gallery's existing pin
      // sees the correct position without another ScrollTrigger pin/spacer.
      end: "bottom 20%",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  timeline.to(clock, {
    progress: 1,
    duration: 1,
    ease: "none",
    onUpdate: () => paint(clock.progress),
  });
  // Read the gallery only after all pins have finished refreshing; measuring
  // inside this trigger's onRefresh can see the gallery's temporary revert.
  ScrollTrigger.addEventListener("refresh", refresh);
  refresh();
  paint(timeline.progress());
  return { dispose };
}

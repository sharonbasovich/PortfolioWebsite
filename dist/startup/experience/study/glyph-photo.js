import { glyphTypography } from "./glyph-data.js";

const SVG = "http://www.w3.org/2000/svg";
let sequence = 0;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
const phase = (value, from, to) => smooth((value - from) / Math.max(.0001, to - from));
const mix = (a, b, p) => a + (b - a) * p;
const numeric = value => Number(value.toFixed(3));
const node = (tag, attributes = {}) => {
  const element = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
};
const setRect = (element, bounds, radius) => {
  for (const key of ["x", "y", "width", "height"]) element.setAttribute(key, numeric(bounds[key]));
  if (radius !== undefined) element.setAttribute("rx", numeric(radius));
};

/**
 * Each real letter outline expands into its own part of the image mask.
 * There is no expanding central aperture. The finished image then docks into the
 * shared gallery frame. Geometry reads happen only on refresh, and a paused
 * MorphSVG timeline follows one scroll clock without another RAF or WebGL pass.
 *
 * target: { gallery, image, arrival?, ratio, getBounds() }. getBounds returns the FIRST
 * image's screen rect independent of the gallery's currently selected project.
 * The parent layer may crossfade projects; arrival (or image as a fallback)
 * belongs to this intro. Passing the complete frame hides its background and
 * edge until the photograph arrives, avoiding an empty placeholder underneath.
 */
export function mountGlyphPhoto({ heading, stage, gsap, ScrollTrigger, target } = {}) {
  const noop = { dispose() {}, refresh() {}, getState: () => ({ enabled: false }) };
  const plugin = window.MorphSVGPlugin;
  if (!heading || !stage || !gsap || !ScrollTrigger || !plugin || !target?.image ||
      !target?.gallery || typeof target.getBounds !== "function" ||
      stage.classList.contains("study-glyph-stage") ||
      !matchMedia("(min-width: 1100px) and (min-height: 650px) and (hover: hover) and (pointer: fine)").matches ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      heading.textContent.replace(/\s+/g, " ").trim() !== "My projects") return noop;

  gsap.registerPlugin(plugin);
  const photograph = target.image.getAttribute("href") || target.image.getAttributeNS("http://www.w3.org/1999/xlink", "href") || target.image.currentSrc || target.image.src;
  if (!photograph) return noop;
  const arrival = target.arrival?.style ? target.arrival : target.image;
  const serial = ++sequence;
  const maskId = `study-letter-mask-${serial}`;
  const clipId = `study-letter-clip-${serial}`;
  const visual = node("svg", { class: "study-glyph-visual", "aria-hidden": "true", focusable: "false", preserveAspectRatio: "xMinYMin meet" });
  const defs = node("defs");
  const mask = node("mask", { id: maskId, maskUnits: "userSpaceOnUse", maskContentUnits: "userSpaceOnUse", "mask-type": "alpha" });
  const maskDock = node("g", { fill: "white", "fill-rule": "nonzero" });
  const clip = node("clipPath", { id: clipId, clipPathUnits: "userSpaceOnUse" });
  const clipRect = node("rect");
  clip.append(clipRect); mask.append(maskDock); defs.append(mask, clip);
  const image = node("image", { href: photograph, mask: `url(#${maskId})`, "clip-path": `url(#${clipId})`, preserveAspectRatio: "xMidYMid slice" });
  const solid = node("g", { class: "study-glyph-solid", "fill-rule": "nonzero" });
  const edge = node("rect", { class: "study-glyph-edge" });
  visual.append(defs, image, solid, edge);
  const old = {
    headingOpacity: heading.style.getPropertyValue("opacity"),
    headingPriority: heading.style.getPropertyPriority("opacity"),
    arrivalOpacity: arrival.style.getPropertyValue("opacity"),
    arrivalPriority: arrival.style.getPropertyPriority("opacity"),
    photoStage: stage.classList.contains("projects-photo-stage"),
  };
  stage.classList.add("projects-photo-stage", "study-glyph-stage");
  heading.classList.add("study-glyph-source");
  heading.style.setProperty("opacity", "0");
  arrival.style.opacity = "0";
  stage.append(visual);

  const clock = { progress: 0 };
  let disposed = false, layout, timeline, morph, lastProgress = -1;

  function measure() {
    if (disposed) return false;
    const stageBox = stage.getBoundingClientRect(), box = visual.getBoundingClientRect();
    const galleryBox = target.gallery.getBoundingClientRect(), destinationBox = target.getBounds();
    if (box.width < 2 || box.height < 2 || !destinationBox || destinationBox.width < 2 || destinationBox.height < 2) return false;
    const ratio = Number(target.ratio) > 0 ? Number(target.ratio) : 1.5;
    const gutter = box.width * .045;
    const availableWidth = box.width - 2 * gutter, availableHeight = box.height * .94;
    const width = Math.min(availableWidth, availableHeight * ratio), height = width / ratio;
    // The picture grows from the left-aligned title's footprint rather than
    // introducing a second rectangle at the middle of the viewport.
    const expanded = { x: gutter, y: (box.height - height) / 2, width, height };
    const spacer = target.gallery.parentElement?.classList.contains("pin-spacer") ? target.gallery.parentElement : target.gallery;
    const anchorBox = spacer.getBoundingClientRect();
    const travel = stageBox.height - box.height;
    const destination = {
      x: destinationBox.left - box.left,
      y: anchorBox.top - stageBox.top - travel + destinationBox.top - galleryBox.top,
      width: destinationBox.width,
      height: destinationBox.height,
    };
    visual.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    mask.setAttribute("x", "-32"); mask.setAttribute("y", "-32");
    mask.setAttribute("width", String(box.width + 64));
    mask.setAttribute("height", String(Math.max(box.height, destination.y + destination.height) + 64));

    morph?.kill();
    maskDock.replaceChildren(); solid.replaceChildren();
    maskDock.removeAttribute("transform");
    const spacingEm = -.055;
    const units = glyphTypography.unitsPerEm;
    const words = glyphTypography.words;
    const wordWidths = words.map(word => word.advance / units + spacingEm * (word.glyphs.length - 1));
    const fontSize = Math.min(expanded.width * .98 / Math.max(...wordWidths), box.height * .36);
    const scale = fontSize / units;
    const leading = fontSize * 1.02;
    const extents = words.flatMap((word, row) => word.glyphs.map(glyph => ({
      top: row * leading - glyph.bounds[3] * scale,
      bottom: row * leading - glyph.bounds[1] * scale,
    })));
    const top = Math.min(...extents.map(x => x.top)), bottom = Math.max(...extents.map(x => x.bottom));
    const firstBaseline = (box.height - (bottom - top)) / 2 - top;
    morph = gsap.timeline({ paused: true });
    let pathIndex = 0;
    words.forEach((word, row) => {
      const tileWidth = expanded.width / word.glyphs.length;
      const tileHeight = expanded.height / words.length;
      word.glyphs.forEach((glyph, index) => {
        const x = expanded.x + glyph.x * scale + index * spacingEm * fontSize;
        const baseline = firstBaseline + row * leading;
        const transform = `translate(${numeric(x)} ${numeric(baseline)}) scale(${scale} ${-scale})`;
        const maskGroup = node("g", { transform }), solidGroup = node("g", { transform });
        const path = node("path", { d: glyph.d, "data-glyph": glyph.char });
        maskGroup.append(path); solidGroup.append(node("path", { d: glyph.d }));
        maskDock.append(maskGroup); solid.append(solidGroup);
        // A small overlap removes subpixel seams between the finished tiles.
        // The global rounded clip provides the exact final image boundary.
        const tile = { x: expanded.x + index * tileWidth - .7, y: expanded.y + row * tileHeight - .7, width: tileWidth + 1.4, height: tileHeight + 1.4 };
        const left = (tile.x - x) / scale, right = (tile.x + tile.width - x) / scale;
        const high = (baseline - tile.y) / scale, low = (baseline - tile.y - tile.height) / scale;
        const shape = `M${left},${high}H${right}V${low}H${left}Z`;
        morph.to(path, { morphSVG: { shape, shapeIndex: "auto", map: "position", precision: 2 }, duration: 1, ease: "power2.inOut" }, pathIndex++ * .012);
      });
    });
    const stickyTop = parseFloat(getComputedStyle(visual).top) || 100;
    const scrollRange = stageBox.height + stickyTop - innerHeight * .2;
    const holdEnd = clamp(travel / Math.max(1, scrollRange));
    layout = { expanded, destination, holdEnd, glyphCount: pathIndex };
    lastProgress = -1;
    return true;
  }

  function paint(progress) {
    if (disposed || !layout) return;
    const p = clamp(progress);
    if (Math.abs(p - lastProgress) < .000001) return;
    lastProgress = p;
    const { expanded, destination, holdEnd } = layout;
    const reveal = phase(p, holdEnd * .22, holdEnd * .43);
    const shape = phase(p, holdEnd * .38, holdEnd * .97);
    const dock = phase(p, holdEnd + (1 - holdEnd) * .05, .94);
    // Fill the destination beneath the still-opaque outgoing photo first.
    // Complementary fades expose the page (25% at their midpoint), causing
    // a white flash. Docking finishes at .94, before this overlap begins.
    const arrivalProgress = phase(p, .94, .97);
    const handoff = phase(p, .97, 1);
    morph.progress(shape);
    const bounds = {};
    for (const key of ["x", "y", "width", "height"]) bounds[key] = mix(expanded[key], destination[key], dock);
    const sx = bounds.width / expanded.width, sy = bounds.height / expanded.height;
    const dx = bounds.x - expanded.x * sx, dy = bounds.y - expanded.y * sy;
    maskDock.setAttribute("transform", `matrix(${sx} 0 0 ${sy} ${dx} ${dy})`);
    setRect(image, bounds); setRect(clipRect, bounds, 24); setRect(edge, bounds, 24);
    image.style.opacity = reveal.toFixed(4);
    solid.style.opacity = (1 - reveal).toFixed(4);
    edge.style.opacity = (phase(shape, .94, 1) * (1 - handoff)).toFixed(4);
    visual.style.opacity = (1 - handoff).toFixed(4);
    arrival.style.opacity = arrivalProgress.toFixed(4);
  }

  function refresh() { if (measure()) paint(clock.progress); }
  function restore(element, property, value, priority) {
    if (value) element.style.setProperty(property, value, priority);
    else element.style.removeProperty(property);
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    ScrollTrigger.removeEventListener("refresh", refresh);
    timeline?.scrollTrigger?.kill(); timeline?.kill(); morph?.kill();
    visual.remove(); stage.classList.remove("study-glyph-stage");
    if (!old.photoStage) stage.classList.remove("projects-photo-stage");
    heading.classList.remove("study-glyph-source");
    restore(heading, "opacity", old.headingOpacity, old.headingPriority);
    restore(arrival, "opacity", old.arrivalOpacity, old.arrivalPriority);
  }
  if (!measure()) { dispose(); return noop; }
  paint(0);
  timeline = gsap.timeline({ scrollTrigger: {
    id: "study-glyph-reveal", trigger: stage, start: "top 100px", end: "bottom 20%",
    scrub: true, invalidateOnRefresh: true,
  }});
  timeline.to(clock, { progress: 1, duration: 1, ease: "none", onUpdate: () => paint(clock.progress) });
  ScrollTrigger.addEventListener("refresh", refresh);
  refresh(); paint(timeline.progress());
  return { dispose, refresh, getState: () => ({
    enabled: true, progress: clock.progress, glyphCount: layout?.glyphCount || 0,
    holdEnd: layout?.holdEnd, expanded: layout?.expanded, destination: layout?.destination,
  }) };
}

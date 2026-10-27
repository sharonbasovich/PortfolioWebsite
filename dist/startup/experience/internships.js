import { installProjectDetails } from "./project-details.js?v=20261024-robotics";

const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const mix = (from, to, amount) => from + (to - from) * amount;
const settle = (value) => {
  const p = clamp(value);
  return p * p * p * (p * (p * 6 - 15) + 10);
};
const number = (value) => Math.round(value * 1000) / 1000;
const text = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
const fit = (width, height, ratio) => {
  const w = Math.min(width, height * ratio);
  return { width: w, height: w / ratio, x: (width - w) / 2, y: (height - w / ratio) / 2 };
};

function make(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

function restoreAttribute(node, name, value) {
  if (value === null) node.removeAttribute(name);
  else node.setAttribute(name, value);
}

/**
 * One internship reading stage on the page's existing GSAP/ScrollTrigger clock.
 * The original work-window is never cloned or replaced: root's Three.js carrier
 * and renderer continue to measure that same data-world-window element.
 * Only this element's transform, and each copy face's transform/opacity, change
 * during paint. Layout is measured at mount and ScrollTrigger refresh only.
 *
 * Disabled/native/reduced views retain the source markup without mutations.
 * Optional dialog/navigation callbacks let the caller keep ownership of Lenis.
 */
export function mountInternships({
  section,
  gsap,
  ScrollTrigger,
  enabled = true,
  onOpen,
  onClose,
  onNavigate,
} = {}) {
  const noop = (reason) => ({
    update() {},
    dispose() {},
    getState: () => ({ enabled: false, reason }),
  });
  if (!enabled || !section || !gsap || !ScrollTrigger) return noop("disabled");
  if (!matchMedia("(min-width: 760px) and (min-height: 480px) and (hover: hover) and (pointer: fine)").matches ||
      matchMedia("(prefers-reduced-motion: reduce)").matches) return noop("native-layout");
  if (section.classList.contains("internships-active")) return noop("already-mounted");

  const layout = section.querySelector(".work-layout");
  const story = section.querySelector(".work-story");
  const heading = section.querySelector(".work-heading");
  const art = section.querySelector(".work-window[data-world-window]");
  const originals = [...section.querySelectorAll(".work-record")];
  if (!layout || !story || !heading || !art || originals.length < 2 ||
      originals.some((record) => !record.querySelector("h3") || !record.querySelector(".record-role")))
    return noop("missing-content");

  const oldArtStyle = art.getAttribute("style");
  const slot = make("div", "internship-art-slot");
  slot.setAttribute("aria-hidden", "true");
  const cards = make("div", "internship-cards");
  const navigation = make("nav", "internship-switcher");
  navigation.setAttribute("aria-label", "Choose an internship");
  const progress = make("span", "internship-progress");
  progress.setAttribute("aria-hidden", "true");
  const progressBar = make("i");
  progress.append(progressBar);

  const records = originals.map((source, index) => {
    const name = text(source.querySelector("h3"));
    const date = text(source.querySelector(".record-heading > span"));
    const role = text(source.querySelector(".record-role"));
    const separator = role.indexOf("·");
    const title = separator < 0 ? role : role.slice(0, separator).trim();
    const location = separator < 0 ? "" : role.slice(separator + 1).trim();
    const paragraphs = [...source.children].filter((child) => child.matches("p:not(.record-role)"));
    const summary = text(paragraphs[0]).split(/(?<=[.!?])\s+/)[0] || "";
    const card = make("article", "internship-card project-copy");
    const metadata = make("div", "project-index internship-index");
    metadata.append(make("span", "", `${String(index + 1).padStart(2, "0")} / ${String(originals.length).padStart(2, "0")}`));
    metadata.append(make("span", "", [date, location].filter(Boolean).join(" · ")));
    card.append(metadata, make("h3", "", name), make("p", "internship-role", title), make("p", "internship-summary", summary));
    const metrics = source.querySelector(".work-metrics")?.cloneNode(true);
    if (metrics) card.append(metrics);
    const skills = source.querySelector(".technology-list")?.cloneNode(true);
    if (skills) card.append(skills);
    const actions = make("div", "project-actions internship-actions");
    const more = make("button", "project-more internship-more", "View more");
    more.type = "button";
    more.dataset.projectDetails = "";
    more.setAttribute("aria-label", `View ${name} internship details`);
    const arrow = make("span", "", "↗");
    arrow.setAttribute("aria-hidden", "true");
    more.append(arrow);
    actions.append(more);
    card.append(actions);
    const template = document.createElement("template");
    template.className = "project-resume";
    const list = make("ul", "project-resume-bullets");
    for (const paragraph of paragraphs) {
      const item = make("li");
      item.append(...paragraph.cloneNode(true).childNodes);
      list.append(item);
    }
    template.content.append(list);
    card.append(template);
    cards.append(card);
    const button = make("button", "", name);
    button.type = "button";
    button.setAttribute("aria-label", `Show ${name} internship`);
    navigation.append(button);
    return { source, name, card, button, ratio: index === 0 ? 4 / 3 : 1.2, opacity: NaN, x: NaN, accessible: null };
  });
  navigation.append(progress);
  heading.append(navigation);
  story.append(cards);
  layout.append(slot);
  section.classList.add("internships-active");

  let disposed = false;
  let clock = { index: 0 };
  let timeline;
  let details;
  let geometry;
  let lastIndex = NaN;
  let selected = -1;
  let failure = null;
  const hold = 1.2, transfer = 0.9;
  const duration = records.length * hold + (records.length - 1) * transfer;
  const stops = records.map((_, index) => (index * (hold + transfer) + hold / 2) / duration);
  const clicks = [];

  function update(value = clock.index) {
    if (disposed || !geometry) return;
    const index = clamp(Number.isFinite(value) ? value : clock.index, 0, records.length - 1);
    if (Math.abs(index - lastIndex) < 0.000001) return;
    lastIndex = index;
    const lower = Math.floor(index), upper = Math.min(lower + 1, records.length - 1);
    const fraction = index - lower, blend = settle(fraction);
    const first = geometry.fits[0];
    const width = mix(geometry.fits[lower].width, geometry.fits[upper].width, blend);
    const height = mix(geometry.fits[lower].height, geometry.fits[upper].height, blend);
    // Scaling the one existing art host also gives root the correct DOMRect for
    // its carrier docking. No new canvas, renderer, viewport or RAF is created.
    const sx = width / first.width, sy = height / first.height;
    art.style.transform = `translate3d(${number(geometry.x + (geometry.width - first.width) / 2)}px,${number(geometry.y + (geometry.height - first.height) / 2)}px,0) scale(${number(sx)},${number(sy)})`;
    art.style.borderRadius = `${number(24 / sx)}px / ${number(24 / sy)}px`;
    progressBar.style.transform = `translateX(${number(index * 100)}%)`;
    const current = Math.round(index);
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      let opacity = 0, x = 42;
      if (i === lower) {
        const leaving = settle(fraction / 0.48);
        opacity = 1 - leaving;
        x = -36 * leaving;
      } else if (i === upper) {
        const entering = settle((fraction - 0.4) / 0.6);
        opacity = entering;
        x = 42 * (1 - entering);
      }
      if (opacity !== record.opacity) {
        record.card.style.opacity = String(number(opacity));
        record.card.style.visibility = opacity > 0.0005 ? "visible" : "hidden";
        record.opacity = opacity;
      }
      if (x !== record.x) {
        record.card.style.transform = `translate3d(${number(x)}px,0,0)`;
        record.x = x;
      }
      const accessible = i === current && opacity > 0.1;
      if (accessible !== record.accessible) {
        record.card.inert = !accessible;
        record.card.setAttribute("aria-hidden", String(!accessible));
        record.card.style.pointerEvents = accessible ? "auto" : "none";
        record.accessible = accessible;
      }
      if (current !== selected) {
        if (i === current) record.button.setAttribute("aria-current", "true");
        else record.button.removeAttribute("aria-current");
      }
    }
    selected = current;
  }

  function measure() {
    if (disposed) return false;
    // One read batch per refresh, before any geometry writes.
    const box = slot.getBoundingClientRect(), parent = layout.getBoundingClientRect();
    const availableHeight = cards.clientHeight;
    const overflow = records.some(({ card }) => card.scrollHeight > availableHeight + 1);
    if (box.width < 2 || box.height < 2 || overflow) {
      failure = overflow ? "copy-does-not-fit" : "missing-layout";
      return false;
    }
    const fits = records.map(({ ratio }) => fit(box.width, box.height, ratio));
    geometry = { x: box.left - parent.left, y: box.top - parent.top, width: box.width, height: box.height, fits };
    art.style.width = `${number(fits[0].width)}px`;
    art.style.height = `${number(fits[0].height)}px`;
    lastIndex = NaN;
    update(clock.index);
    return true;
  }

  function refresh() {
    if (!measure() && !disposed) {
      dispose();
      // Removing an upstream pin changes every downstream scroll coordinate.
      // Settle once after the current refresh, without another animation loop.
      queueMicrotask(() => { if (section.isConnected) ScrollTrigger.refresh(); });
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    ScrollTrigger.removeEventListener("refresh", refresh);
    timeline?.scrollTrigger?.kill();
    timeline?.kill();
    details?.dispose();
    for (const [button, listener] of clicks) button.removeEventListener("click", listener);
    navigation.remove();
    cards.remove();
    slot.remove();
    section.classList.remove("internships-active");
    restoreAttribute(art, "style", oldArtStyle);
  }

  if (!measure()) {
    const reason = failure;
    dispose();
    return noop(reason);
  }
  details = installProjectDetails({ panels: records.map(({ card }) => card), gsap, onOpen, onClose });
  timeline = gsap.timeline({
    onUpdate: () => update(clock.index),
    scrollTrigger: {
      id: "internship-gallery",
      trigger: section,
      start: "top top",
      end: () => `+=${innerHeight * 2.4}`,
      pin: true,
      scrub: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      refreshPriority: 3,
    },
  });
  timeline.to(clock, { index: 0, duration: hold, ease: "none" });
  for (let index = 1; index < records.length; index++) {
    timeline.to(clock, { index, duration: transfer, ease: "none" });
    timeline.to({}, { duration: hold });
  }
  records.forEach(({ button }, index) => {
    const listener = () => {
      const trigger = timeline.scrollTrigger;
      if (!trigger || disposed) return;
      const position = trigger.start + stops[index] * (trigger.end - trigger.start);
      if (onNavigate) onNavigate(position);
      else window.scrollTo({ top: position, behavior: "smooth" });
    };
    button.addEventListener("click", listener);
    clicks.push([button, listener]);
  });
  ScrollTrigger.addEventListener("refresh", refresh);
  measure();
  return {
    timeline,
    trigger: timeline.scrollTrigger,
    update,
    dispose,
    getState: () => ({
      enabled: !disposed,
      index: clock.index,
      active: Boolean(timeline?.scrollTrigger?.isActive),
      reason: failure,
      selected: records[Math.round(clamp(clock.index, 0, records.length - 1))]?.name,
      start: timeline?.scrollTrigger?.start,
      end: timeline?.scrollTrigger?.end,
    }),
  };
}

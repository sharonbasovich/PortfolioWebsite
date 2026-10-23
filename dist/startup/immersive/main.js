import Lenis from "../vendor/lenis/lenis.js";
import { createWorld } from "./world.js?v=20261023-dock";
import { createPointerRibbon } from "./pointer-ribbon.js";
import { installProjectEvidence } from "./project-evidence.js";
import { installTheme } from "./theme.js";
import { mountProjectMotion as mountTypeMotion } from "./projects-type.js";
import { mountProjectMotion as mountPhotoMotion } from "./projects-photo.js";
import { mountProjectMotion as mountDepthMotion } from "./projects-depth.js";

const theme = installTheme();
const requestedProjectMotion = new URLSearchParams(location.search).get("projects-motion");
const projectMotions = new Map([
  ["1", mountTypeMotion], ["2", mountPhotoMotion], ["3", mountDepthMotion],
]);
const projectMotionChoice = projectMotions.has(requestedProjectMotion) ? requestedProjectMotion : "2";
const projectMotionMount = projectMotions.get(projectMotionChoice);
const projectHeading = document.querySelector(".projects-heading h2");
const projectStage = document.querySelector(".projects-heading");
let projectMotion;
projectStage.dataset.motionPreview = projectMotionChoice;
if (projectMotions.has(requestedProjectMotion)) {
  const comparison = document.createElement("nav");
  comparison.className = "motion-comparison";
  comparison.setAttribute("aria-label", "Project title previews");
  const label = document.createElement("span");
  label.textContent = "Project title previews";
  comparison.append(label);
  ["Scroll-built type", "Photo through type", "Depth zoom"].forEach((name, index) => {
    const link = document.createElement("a");
    const url = new URL(location.href);
    url.searchParams.set("projects-motion", String(index + 1));
    url.hash = "projects";
    link.href = url.href;
    link.textContent = `${index + 1}. ${name}`;
    if (projectMotionChoice === String(index + 1)) link.setAttribute("aria-current", "page");
    comparison.append(link);
  });
  projectStage.before(comparison);
}

const gsap = window.gsap,
  ScrollTrigger = window.ScrollTrigger,
  SplitText = window.SplitText;
const root = document.documentElement;
const canvas = document.querySelector("#world"),
  frame = document.querySelector(".world-frame");
const motionButton = document.querySelector(".motion");
const gallery = document.querySelector(".project-gallery"),
  track = document.querySelector(".project-panels");
const panels = [...document.querySelectorAll(".project-panel")];
const projectEvidence = installProjectEvidence(panels);
const rail = document.querySelector(".scroll-rail"),
  thumb = document.querySelector(".scroll-thumb");
const projectSwitcher = document.querySelector(".project-switcher");
const projectButtons = [...document.querySelectorAll("[data-select-project]")];
const projectStops = [1 / 9, 0.5, 8 / 9];
const chapters = [...document.querySelectorAll(".chapter")];
const sectionLinks = [
  ...document.querySelectorAll(
    '.site-header a[href="#work"], .site-header a[href="#projects"]',
  ),
].map((element) => ({
  element,
  chapter: element.getAttribute("href") === "#work" ? 1 : 2,
}));
const bridge = document.querySelector(".flow-bridge");
const route = document.querySelector(".route-line"),
  routeTube = document.querySelector(".route-tube"),
  routeDot = document.querySelector(".route-dot");
const routeLength = route?.getTotalLength() || 1;
const routePoints = Array.from({ length: 49 }, (_, index) => {
  const point = route.getPointAtLength((routeLength * index) / 48);
  return { x: point.x / 1440, y: point.y / 650 };
});
const routeClock = { progress: 0 };
const heroWindow = document.querySelector(".hero-window");
const trace = document.querySelector(".pointer-trace");
const ribbon = createPointerRibbon(trace);
const pointer = { x: 0, y: 0, active: false, movedAt: 0 };
let traceBounds;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
// Rotation must not give a phone the desktop render budget.
const compactQuery = matchMedia(
  "(max-width: 800px), (hover: none), (pointer: coarse)",
);
const desktopQuery = matchMedia(
  "(min-width: 1100px) and (min-height: 650px) and (hover: hover) and (pointer: fine)",
);
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = (value) => value * value * (3 - 2 * value);
const dockingEnd = 0.18;
const carrierRoutePoints = routePoints.map((_, index) => {
  const fraction = clamp((index / (routePoints.length - 1) - dockingEnd) / (1 - dockingEnd));
  const at = fraction * (routePoints.length - 1);
  const lower = Math.floor(at), upper = Math.min(routePoints.length - 1, lower + 1);
  return {
    x: routePoints[lower].x + (routePoints[upper].x - routePoints[lower].x) * (at - lower),
    y: routePoints[lower].y + (routePoints[upper].y - routePoints[lower].y) * (at - lower),
  };
});
const routeDrawProgress = () =>
  paused ? 1 : clamp((routeClock.progress - dockingEnd) / (1 - dockingEnd));
const windows = [...document.querySelectorAll("[data-world-window]")].map(
  (element) => {
    const panel = element.closest(".project-panel");
    return {
      element,
      chapter: panel
        ? 2
        : element.closest("#work")
          ? 1
          : element.closest("#contact")
            ? 3
            : 0,
      project: Number(panel?.dataset.project || 0),
      radius: 28,
    };
  },
);
if (gsap && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger, ...(SplitText ? [SplitText] : []));
  ScrollTrigger.config({ ignoreMobileResize: true });
}
let compact = compactQuery.matches,
  world;
try {
  world = createWorld(canvas, { compact });
} catch (error) {
  console.warn(
    "The 3D scene is unavailable; the page remains readable.",
    error,
  );
}
let paused = reduced.matches,
  lenis,
  context,
  deckTimeline,
  deckTrigger,
  entranceTimeline,
  activeWindow;
let activeChapter = -1,
  lastTime = 0,
  lastRender = 0,
  lastScroll = scrollY,
  velocity = 0,
  lastInput = 0;
let sceneTime = 0,
  selectedProject = -1,
  initialized = false,
  lostContext = false;
let resizeTimer,
  disposed = false,
  drag;
let railGeometry = { top: 0, height: 1, thumbHeight: 28, travel: 1 };
const deckClock = { index: 0 },
  entry = { reveal: 1, rotation: 0 };
let layoutHeight = innerHeight;
let viewport = {
  width: innerWidth,
  height: innerHeight,
  desktop: desktopQuery.matches,
  compact: compactQuery.matches,
};
const diagnostics = { choreographyBuilds: 0, scrollCorrections: 0 };
let impactInteraction = false;
const impactInputs = ["wheel", "touchmove", "keydown"];
function markImpactInteraction(event) {
  if (!event.isTrusted) return;
  if (event.type === "keydown" &&
      !["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) return;
  impactInteraction = true;
  for (const type of impactInputs) window.removeEventListener(type, markImpactInteraction);
}
for (const type of impactInputs)
  window.addEventListener(type, markImpactInteraction, { passive: true });

// One ticker drives Lenis, ScrollTrigger and WebGL. Smoothing the gallery a
// second time would make the text and its 3D frame drift apart.
function startScroller() {
  lenis?.destroy();
  lenis = undefined;
  if (paused || !gsap || !finePointer.matches) return;
  lenis = new Lenis({
    lerp: 0.085,
    smoothWheel: true,
    wheelMultiplier: 0.95,
    syncTouch: false,
    autoRaf: false,
    anchors: false,
  });
  lenis.on("scroll", () => {
    ScrollTrigger?.update();
    lastInput = performance.now();
  });
}
function scrollToPosition(top, immediate = false) {
  diagnostics.scrollCorrections++;
  const destination = clamp(
    top,
    0,
    Math.max(0, root.scrollHeight - innerHeight),
  );
  if (lenis) lenis.scrollTo(destination, { immediate, force: true });
  else
    window.scrollTo({
      top: destination,
      behavior: immediate || paused ? "instant" : "smooth",
    });
}
function refreshMeasurements() {
  for (const item of windows)
    item.radius =
      parseFloat(getComputedStyle(item.element).borderTopLeftRadius) || 28;
  if (rail) {
    const bounds = rail.getBoundingClientRect();
    const thumbHeight = Math.max(
      28,
      bounds.height *
        Math.min(0.25, innerHeight / Math.max(innerHeight, root.scrollHeight)),
    );
    railGeometry = {
      top: bounds.top,
      height: bounds.height,
      thumbHeight,
      travel: Math.max(1, bounds.height - thumbHeight),
    };
    thumb.style.height = `${thumbHeight}px`;
  }
  lenis?.resize();
  traceBounds = heroWindow.getBoundingClientRect();
  trace?.setAttribute(
    "viewBox",
    `0 0 ${traceBounds.width} ${traceBounds.height}`,
  );
  ribbon.resize(traceBounds.width, traceBounds.height);
  if (routeTube) {
    routeTube.style.strokeDasharray = String(routeLength);
    routeTube.style.strokeDashoffset = String(
      routeLength * (1 - routeDrawProgress()),
    );
  }
}

heroWindow.addEventListener("pointermove", (event) => {
  if (paused || !finePointer.matches || event.target.closest("button,a")) {
    pointer.active = false;
    ribbon.reset();
    return;
  }
  const rect = heroWindow.getBoundingClientRect();
  pointer.x = event.clientX - rect.left;
  pointer.y = event.clientY - rect.top;
  pointer.active = true;
  pointer.movedAt = performance.now();
});
heroWindow.addEventListener("pointerleave", () => {
  pointer.active = false;
  ribbon.reset();
});
function updateTrace(delta) {
  ribbon.update(pointer, delta, !paused && finePointer.matches);
}
function updateProjectNavigation() {
  projectSwitcher?.style.setProperty(
    "--project-index",
    String(clamp(deckClock.index, 0, panels.length - 1)),
  );
  const index = clamp(Math.round(deckClock.index), 0, panels.length - 1);
  if (index === selectedProject) return;
  selectedProject = index;
  for (const button of projectButtons) {
    if (Number(button.dataset.selectProject) === index)
      button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  }
}
function goToProject(index, immediate = false) {
  if (!panels[index]) return;
  if (deckTrigger) {
    const progress = projectStops[index];
    scrollToPosition(
      deckTrigger.start + progress * (deckTrigger.end - deckTrigger.start),
      immediate || paused,
    );
    if (immediate) {
      deckTimeline.progress(progress);
      ScrollTrigger.update();
    }
  } else {
    scrollToPosition(
      scrollY + panels[index].getBoundingClientRect().top - 100,
      paused || immediate,
    );
  }
}
for (const button of projectButtons)
  button.addEventListener("click", () =>
    goToProject(Number(button.dataset.selectProject)),
  );

const magnets = [...document.querySelectorAll(".magnetic")].map((element) => ({
  element,
  label: element.querySelector(".roll-label"),
  arrow: element.querySelector(".link-arrow"),
  x: 0,
  y: 0,
  tx: 0,
  ty: 0,
}));
for (const magnet of magnets) {
  magnet.element.addEventListener("pointermove", (event) => {
    if (paused || !finePointer.matches) return;
    const rect = magnet.element.getBoundingClientRect();
    magnet.tx = (event.clientX - rect.left - rect.width / 2) * 0.16;
    magnet.ty = (event.clientY - rect.top - rect.height / 2) * 0.23;
  });
  magnet.element.addEventListener("pointerleave", () => {
    magnet.tx = 0;
    magnet.ty = 0;
  });
}
function updateMagnetic(delta) {
  const settle = paused ? 1 : 1 - Math.exp(-Math.max(0, delta) * 12);
  for (const magnet of magnets) {
    if (paused || !finePointer.matches) {
      magnet.tx = 0;
      magnet.ty = 0;
    }
    magnet.x += (magnet.tx - magnet.x) * settle;
    magnet.y += (magnet.ty - magnet.y) * settle;
    if (magnet.label)
      magnet.label.style.translate = `${magnet.x.toFixed(2)}px ${magnet.y.toFixed(2)}px`;
    if (magnet.arrow)
      magnet.arrow.style.translate = `${(magnet.x * 0.65).toFixed(2)}px ${(magnet.y * 0.65).toFixed(2)}px`;
  }
}
function updateScrollRail() {
  if (!rail || !thumb) return;
  const progress = clamp(
    scrollY / Math.max(1, root.scrollHeight - innerHeight),
  );
  thumb.style.transform = `translate3d(0,${progress * railGeometry.travel}px,0)`;
  thumb.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
  rail.classList.toggle(
    "is-active",
    !!drag || performance.now() - lastInput < 1000,
  );
}
function paint(time = 0, delta = 1 / 60) {
  if (disposed || document.hidden) return;
  // Read all DOM geometry first; render every visible window in its own view.
  const heroBounds = document.querySelector(".hero").getBoundingClientRect();
  const workBounds = document.querySelector(".work").getBoundingClientRect();
  const bridgeBounds = bridge.getBoundingClientRect();
  if (!finePointer.matches && !paused)
    routeClock.progress = clamp(
      (layoutHeight * 0.8 - bridgeBounds.top) /
        (bridgeBounds.height + layoutHeight * 0.55),
    );
  const heroOpening = ease(
    clamp((-heroBounds.top - 20) / (layoutHeight * 0.34)),
  );
  const visible = [];
  const allFrames = [];
  let dominant,
    best = 0;
  for (const item of windows) {
    const rect = item.element.getBoundingClientRect();
    const area =
      Math.max(0, Math.min(innerWidth, rect.right) - Math.max(0, rect.left)) *
      Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top));
    if (!rect.width || !rect.height) continue;
    if (area > best) {
      best = area;
      dominant = { ...item, rect };
    }
    const progress = clamp(
      (innerHeight - rect.top) / (innerHeight + rect.height),
    );
    const heroProgress = clamp(-heroBounds.top / (layoutHeight * 0.9));
    const workProgress = clamp(
      (-workBounds.top + innerHeight * 0.2) /
        Math.max(innerHeight, workBounds.height),
    );
    const galleryOffset = deckTrigger ? deckClock.index - item.project : 0;
    const view = {
      rect,
      chapter: item.chapter,
      project: item.project,
      radius: item.radius,
      progress,
      explode: paused
        ? item.chapter === 1
          ? 0.68
          : 0
        : item.chapter === 0
          ? ease(heroProgress) * 0.25
          : item.chapter === 1
            ? 0.65 + workProgress * 0.2
            : 0,
      rotation: paused
        ? 0
        : item.chapter === 0
          ? heroProgress * 1.6
          : item.chapter === 1
            ? workProgress * 1.8 - 0.5
            : item.chapter === 2
              ? galleryOffset * 0.55
              : (progress - 0.5) * 0.7,
      zoom: paused
        ? 0
        : item.chapter === 0
          ? heroProgress * 0.75
          : item.chapter === 1
            ? 0.1 + workProgress * 0.2
            : item.chapter === 2
              ? 0.12 - Math.abs(galleryOffset) * 0.3
              : 0.05,
    };
    allFrames.push(view);
    if (area && !item.element.classList.contains("has-project-evidence"))
      visible.push(view);
  }
  if (!world) {
    for (const section of document.querySelectorAll(".chapter")) {
      const rect = section.getBoundingClientRect();
      const area = Math.max(
        0,
        Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top),
      );
      if (area > best) {
        best = area;
        dominant = {
          element: section,
          chapter: Number(section.dataset.scene),
          rect,
        };
      }
    }
  }
  if (world) {
    world.state.motion = !paused;
    world.state.velocity = paused ? 0 : velocity;
    world.state.reveal = entry.reveal;
    world.state.rotation = entry.rotation;
    if (!paused) world.state.burst = heroOpening;
    const handoff = {
      enabled: Boolean(
        desktopQuery.matches && !paused && gsap && ScrollTrigger && !lostContext,
      ),
      progress: routeClock.progress,
      impactEnabled: impactInteraction,
      startFrame: allFrames.find((item) => item.chapter === 0),
      endFrame: allFrames.find((item) => item.chapter === 1),
      path: (desktopQuery.matches || paused) ? carrierRoutePoints.map((point) => ({
        x: bridgeBounds.left + point.x * bridgeBounds.width,
        y: bridgeBounds.top + point.y * bridgeBounds.height,
      })) : [],
    };
    const flight =
      handoff.enabled && handoff.progress > 0 && handoff.progress < 1;
    if (visible.length || flight || paused)
      world.renderFrames(sceneTime, paused ? 0 : delta, visible, handoff);
    frame.style.visibility =
      visible.length || flight || paused ? "visible" : "hidden";
  }
  activeWindow = dominant || activeWindow;
  // Chapter state follows semantic content, including in the non-WebGL fallback.
  const currentChapter = chapters.reduce(
    (current, section) =>
      section.getBoundingClientRect().top <= innerHeight * 0.5
        ? Number(section.dataset.scene)
        : current,
    0,
  );
  if (currentChapter !== activeChapter) {
    activeChapter = currentChapter;
    root.dataset.chapter = String(activeChapter);
    for (const link of sectionLinks) {
      if (link.chapter === activeChapter)
        link.element.setAttribute("aria-current", "location");
      else link.element.removeAttribute("aria-current");
    }
    document.querySelector(".status-index").textContent =
      `0${activeChapter + 1} / 04`;
    document.querySelector(".status-label").textContent = [
      "CONNECT",
      "ENGINEER",
      "BUILD",
      "SAY HELLO",
    ][activeChapter];
  }
  updateScrollRail();
  updateMagnetic(delta);
  updateTrace(delta);
  updateProjectNavigation();
  projectEvidence.update(deckClock.index, { native: !deckTrigger, paused });
  if (route) {
    const progress = routeDrawProgress();
    routeTube.style.strokeDashoffset = String(routeLength * (1 - progress));
    const position = route.getPointAtLength(routeLength * progress);
    routeDot.setAttribute("cx", position.x);
    routeDot.setAttribute("cy", position.y);
    routeDot.style.opacity = progress > 0 ? "1" : "0";
  }
}
function tick(time, deltaMs) {
  if (disposed || document.hidden) return;
  const delta = Math.min(0.05, time - lastTime || deltaMs / 1000);
  lastTime = time;
  lenis?.raf(time * 1000);
  const actualVelocity = (scrollY - lastScroll) / Math.max(0.001, delta);
  lastScroll = scrollY;
  velocity +=
    (clamp(actualVelocity / 2200, -1, 1) - velocity) *
    (1 - Math.exp(-delta * 9));
  if (Math.abs(actualVelocity) > 2) lastInput = performance.now();
  // Paused scenes render only on scroll/resize/control input. Idle rail fading
  // still works without running the GPU at the display's refresh rate.
  if (paused) {
    updateScrollRail();
    return;
  }
  sceneTime += delta;
  const interval = compactQuery.matches ? 1 / 30 : 1 / 60;
  if (time - lastRender < interval * 0.9 && !paused) return;
  const renderDelta = Math.min(0.05, time - lastRender || delta);
  lastRender = time;
  paint(time, renderDelta);
}

function buildChoreography(entrance = false) {
  diagnostics.choreographyBuilds++;
  const introBounds = projectStage.getBoundingClientRect();
  const preserveProjectIntro = projectMotionMount && !entrance &&
    finePointer.matches && introBounds.top < innerHeight * 0.85 &&
    introBounds.bottom > innerHeight * 0.35;
  const preservePanel =
    finePointer.matches && !entrance && !preserveProjectIntro && activeWindow?.chapter === 2
      ? panels[activeWindow.project]
      : null;
  const anchor =
    finePointer.matches && !entrance && !preservePanel
      ? preserveProjectIntro ? projectStage : activeWindow?.element
      : null;
  const anchorTop = anchor?.getBoundingClientRect().top,
    panelTop = preservePanel?.getBoundingClientRect().top;
  lenis?.destroy();
  lenis = undefined;
  context?.revert();
  projectMotion?.dispose();
  projectMotion = undefined;
  context = undefined;
  deckTrigger = undefined;
  deckTimeline = undefined;
  entranceTimeline = undefined;
  if (!entrance) {
    entry.reveal = 1;
    entry.rotation = 0;
  }
  gallery.classList.remove("is-horizontal");
  projectSwitcher.hidden = true;
  root.classList.toggle("motion-paused", paused);
  if (paused) {
    pointer.active = false;
    ribbon.reset();
  }
  motionButton.textContent = paused ? "Enable motion" : "Pause motion";
  motionButton.setAttribute("aria-pressed", String(paused));
  if (!paused && gsap && ScrollTrigger) {
    context = gsap.context(() => {
      if (desktopQuery.matches && world && !lostContext) {
        gallery.classList.add("is-horizontal");
        projectSwitcher.hidden = false;
        const deck = gsap.timeline({
          scrollTrigger: {
            trigger: gallery,
            start: "top top",
            end: () => `+=${innerHeight * 3.2}`,
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: 2,
          },
        });
        gsap.set(panels.map((panel) => panel.querySelector("h3")), {
          clipPath: "inset(0 0 0% 0)",
        });
        deck.to(deckClock, { index: 0, duration: 1.2 });
        deck.to(track, {
          x: () => -innerWidth,
          duration: 0.9,
          ease: "power2.inOut",
        });
        deck.to(
          deckClock,
          { index: 1, duration: 0.9, ease: "power2.inOut" },
          "<",
        );
        deck.to({}, { duration: 1.2 });
        deck.to(track, {
          x: () => -innerWidth * 2,
          duration: 0.9,
          ease: "power2.inOut",
        });
        deck.to(
          deckClock,
          { index: 2, duration: 0.9, ease: "power2.inOut" },
          "<",
        );
        deck.to({}, { duration: 1.2 });
        // Copy shares the deck clock: each transfer finishes before its reading
        // hold, and reversing or keyboard-seeking restores the same clear state.
        // The context reverts every inline style for native/reduced-motion views.
        const copyTransition = (panel, entering) => {
          const copy = panel.querySelector(".project-copy");
          const metadata = copy.querySelector(".project-index");
          const title = copy.querySelector("h3");
          const details = [
            ...copy.querySelectorAll(
              ":scope > p, :scope > .technology-list, :scope > .project-actions, :scope > .project-link",
            ),
          ];
          const sequence = gsap.timeline();
          if (entering) {
            sequence
              .fromTo(
                metadata,
                { y: 8, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" },
                0.18,
              )
              .fromTo(
                title,
                { y: 18, clipPath: "inset(0 0 100% 0)" },
                {
                  y: 0,
                  clipPath: "inset(0 0 0% 0)",
                  duration: 0.58,
                  ease: "power3.out",
                },
                0.16,
              )
              .fromTo(
                details,
                { x: 18, opacity: 0 },
                {
                  x: 0,
                  opacity: 1,
                  duration: 0.44,
                  stagger: 0.04,
                  ease: "power2.out",
                },
                0.3,
              );
          } else {
            sequence
              .to(
                metadata,
                { y: -6, opacity: 0, duration: 0.24, ease: "power2.in" },
                0,
              )
              .to(
                title,
                {
                  y: -12,
                  clipPath: "inset(100% 0 0% 0)",
                  duration: 0.42,
                  ease: "power2.inOut",
                },
                0,
              )
              .to(
                details,
                {
                  x: -16,
                  opacity: 0,
                  duration: 0.28,
                  stagger: 0.03,
                  ease: "power2.in",
                },
                0,
              );
          }
          return sequence;
        };
        for (let index = 0; index < panels.length - 1; index++) {
          const transfer = 1.2 + index * 2.1;
          deck.add(copyTransition(panels[index], false), transfer);
          deck.add(copyTransition(panels[index + 1], true), transfer);
        }
        deckTimeline = deck;
        deckTrigger = deck.scrollTrigger;
      }
      if (bridge && finePointer.matches) {
        gsap.fromTo(
          ".flow-words span:first-child",
          { x: () => innerWidth * 0.08 },
          {
            x: () => -innerWidth * 0.1,
            ease: "none",
            scrollTrigger: {
              trigger: bridge,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
        gsap.fromTo(
          ".flow-words span:last-child",
          { x: () => -innerWidth * 0.06 },
          {
            x: () => innerWidth * 0.1,
            ease: "none",
            scrollTrigger: {
              trigger: bridge,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
        gsap.fromTo(
          routeClock,
          { progress: 0 },
          {
            progress: 1,
            ease: "none",
            scrollTrigger: {
              trigger: bridge,
              start: "top 80%",
              end: "bottom 25%",
              scrub: true,
            },
          },
        );
      }
      if (entrance) {
        entry.reveal = 0;
        entry.rotation = -2;
        entranceTimeline = gsap
          .timeline()
          .from(
            ".hero h1",
            { y: 44, opacity: 0, duration: 1.05, ease: "power3.out" },
            0.1,
          )
          .from(
            ".hero-intro",
            {
              y: 16,
              opacity: 0,
              duration: 0.8,
              stagger: 0.08,
              ease: "power2.out",
            },
            0.3,
          )
          .fromTo(
            entry,
            { reveal: 0, rotation: -2 },
            { reveal: 1, rotation: 0, duration: 1.3, ease: "power3.out" },
            0.2,
          );
      }
      if (projectMotionMount) projectMotion = projectMotionMount({
        heading: projectHeading, stage: projectStage, firstProject: panels[0],
        gsap, ScrollTrigger, SplitText,
        enabled: desktopQuery.matches,
      });
      for (const heading of document.querySelectorAll(
        ".work-heading h2, .projects-heading h2, .contact h2",
      )) {
        if (!finePointer.matches || (heading === projectHeading && projectMotionMount && desktopQuery.matches)) continue;
        SplitText?.create(heading, {
          type: "lines",
          mask: "lines",
          linesClass: "chapter-line",
          autoSplit: true,
          onSplit(split) {
            return gsap.from(split.lines, {
              yPercent: 105,
              duration: 0.9,
              stagger: 0.08,
              ease: "power3.out",
              scrollTrigger: {
                trigger: heading.parentElement,
                start: "top 88%",
                once: true,
              },
            });
          },
        });
      }
    });
  } else {
    entry.reveal = 1;
    entry.rotation = 0;
  }
  ScrollTrigger?.refresh();
  if (preservePanel && deckTrigger) {
    const progress = projectStops[Number(preservePanel.dataset.project)];
    scrollToPosition(
      deckTrigger.start + progress * (deckTrigger.end - deckTrigger.start),
      true,
    );
  } else if (preservePanel)
    scrollToPosition(
      scrollY + preservePanel.getBoundingClientRect().top - panelTop,
      true,
    );
  else if (anchor)
    scrollToPosition(
      scrollY + anchor.getBoundingClientRect().top - anchorTop,
      true,
    );
  startScroller();
  refreshMeasurements();
  lastScroll = scrollY;
  velocity = 0;
  paint(gsap?.ticker.time || 0, paused ? 0 : 1 / 60);
}

// Native scrolling is kept until the custom thumb has working drag/key controls.
if (rail && thumb) {
  rail.hidden = !finePointer.matches;
  refreshMeasurements();
  root.classList.toggle("custom-scrollbar", finePointer.matches);
  finePointer.addEventListener("change", () => {
    rail.hidden = !finePointer.matches;
    root.classList.toggle("custom-scrollbar", finePointer.matches);
    refreshMeasurements();
    paint(gsap?.ticker.time || 0, paused ? 0 : 1 / 60);
    scheduleViewportRefresh(true);
  });
  const moveThumb = (event) => {
    if (!drag) return;
    const top =
      clamp(
        (event.clientY - railGeometry.top - drag.offset) / railGeometry.travel,
      ) * Math.max(0, root.scrollHeight - innerHeight);
    scrollToPosition(top, true);
    paint(gsap?.ticker.time || 0, paused ? 0 : 1 / 60);
  };
  rail.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    markImpactInteraction(event);
    const thumbBounds = thumb.getBoundingClientRect();
    drag = {
      offset: event.target.closest(".scroll-thumb")
        ? event.clientY - thumbBounds.top
        : railGeometry.thumbHeight / 2,
    };
    rail.setPointerCapture(event.pointerId);
    thumb.focus({ preventScroll: true });
    rail.classList.add("is-dragging");
    event.preventDefault();
    moveThumb(event);
  });
  rail.addEventListener("pointermove", moveThumb);
  const endDrag = () => {
    drag = undefined;
    rail.classList.remove("is-dragging");
    lastInput = performance.now();
  };
  rail.addEventListener("pointerup", endDrag);
  rail.addEventListener("pointercancel", endDrag);
  thumb.addEventListener("keydown", (event) => {
    const steps = {
      ArrowDown: 64,
      ArrowUp: -64,
      PageDown: innerHeight * 0.85,
      PageUp: -innerHeight * 0.85,
      Home: -root.scrollHeight,
      End: root.scrollHeight,
    };
    if (!(event.key in steps)) return;
    event.preventDefault();
    scrollToPosition(scrollY + steps[event.key], true);
    lastInput = performance.now();
  });
}
// Keyboard navigation must cancel a wheel coast rather than fighting its target.
document.addEventListener("keydown", (event) => {
  if (
    event.defaultPrevented ||
    !lenis ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  )
    return;
  if (
    event.target.closest(
      'input,textarea,select,[contenteditable="true"],[data-lenis-prevent]',
    )
  )
    return;
  const destinations = {
    ArrowDown: scrollY + 64,
    ArrowUp: scrollY - 64,
    PageDown: scrollY + innerHeight * 0.85,
    PageUp: scrollY - innerHeight * 0.85,
    Home: 0,
    End: root.scrollHeight - innerHeight,
    " ": scrollY + innerHeight * (event.shiftKey ? -0.85 : 0.85),
  };
  if (event.key === " " && event.target.closest("button,a")) return;
  if (!(event.key in destinations)) return;
  event.preventDefault();
  scrollToPosition(destinations[event.key], true);
  lastInput = performance.now();
});

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (
    !link ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    link.classList.contains("skip")
  )
    return;
  const id = link.getAttribute("href"),
    target = document.querySelector(id);
  if (!target) return;
  markImpactInteraction(event);
  event.preventDefault();
  const offset =
    document.querySelector(".site-header").getBoundingClientRect().height + 12;
  scrollToPosition(
    scrollY + target.getBoundingClientRect().top - offset,
    paused,
  );
  if (event.detail === 0) {
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }
  if (location.hash !== id) history.pushState(null, "", id);
});
gallery.addEventListener("focusin", (event) => {
  const panel = event.target.closest(".project-panel");
  if (!panel || !deckTrigger) return;
  const progress = projectStops[Number(panel.dataset.project)];
  scrollToPosition(
    deckTrigger.start + progress * (deckTrigger.end - deckTrigger.start),
    true,
  );
  deckTimeline.progress(progress);
  ScrollTrigger.update();
  paint(gsap.ticker.time);
});
motionButton.hidden = !gsap;
motionButton.addEventListener("click", () => {
  paused = !paused;
  buildChoreography();
});
if (world) {
  root.classList.add("has-world");
} else {
  frame.remove();
  root.classList.add("world-unavailable");
}
async function initialize() {
  if (initialized) return;
  initialized = true;
  if (disposed) return;
  buildChoreography(true);
  if (gsap) gsap.ticker.add(tick);
  root.dataset.ready = "true";
  if (
    ["127.0.0.1", "localhost"].includes(location.hostname) &&
    new URLSearchParams(location.search).get("review") === "1"
  ) {
    const { installReview } = await import("/__motion_lab__/review-api.js");
    installReview({
      getState: () => ({
        paused,
        sceneTime,
        entry: { reveal: entry.reveal, rotation: entry.rotation },
        activeChapter,
        selectedProject,
        deckProgress: deckTrigger?.progress,
        routeProgress: routeClock.progress,
        routeDrawProgress: routeDrawProgress(),
        viewport: { ...viewport, layoutHeight },
        diagnostics: { ...diagnostics },
        nativeScroll: !finePointer.matches,
        impactEnabled: impactInteraction,
        scrollY,
        world: world?.getStats?.() || null,
      }),
      jumpProject: (index) => {
        goToProject(index, true);
        paint(sceneTime, 0);
      },
      freezeEntrance: () => {
        entranceTimeline?.progress(1);
        paint(sceneTime, 0);
      },
      repaint: () => paint(sceneTime, 0),
      freezeClock: () => gsap?.ticker.remove(tick),
      stepMotion: (delta = 1 / 60) => {
        sceneTime += delta;
        paint(sceneTime, delta);
      },
      finishReveals: () => {
        for (const trigger of ScrollTrigger?.getAll() || [])
          if (trigger.vars.once && trigger.animation)
            trigger.animation.progress(1);
        paint(sceneTime, 0);
      },
    });
  }
  // This harness is served only by tools/motion-lab.py, outside public assets.
  if (
    ["127.0.0.1", "localhost"].includes(location.hostname) &&
    new URLSearchParams(location.search).get("motion-lab") === "1"
  ) {
    const { installMotionLab } = await import("/__motion_lab__/motion-lab.js");
    installMotionLab(() => entranceTimeline).catch(console.warn);
  }
}
initialize();
document.fonts.ready.then(() => {
  if (disposed) return;
  ScrollTrigger?.refresh();
  refreshMeasurements();
});
window.addEventListener(
  "scroll",
  () => {
    lastInput = performance.now();
    if (paused || !gsap) paint(0, 0);
  },
  { passive: true },
);
function scheduleViewportRefresh(force = false) {
    if (disposed) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (disposed) return;
      const next = {
        width: innerWidth,
        height: innerHeight,
        desktop: desktopQuery.matches,
        compact: compactQuery.matches,
      };
      const layoutChanged =
        force === true ||
        next.width !== viewport.width ||
        (finePointer.matches && next.height !== viewport.height) ||
        next.desktop !== viewport.desktop ||
        next.compact !== viewport.compact;
      viewport = next;
      if (!layoutChanged) {
        // Address-bar resizing must never rebuild layouts or correct scroll.
        if (finePointer.matches) {
          layoutHeight = innerHeight;
          ScrollTrigger?.refresh();
        }
        world?.resize();
        refreshMeasurements();
        paint(gsap?.ticker.time || 0, 0);
        return;
      }
      layoutHeight = innerHeight;
      if (world && compact !== compactQuery.matches) {
        const opening = world.state.burst;
        world.dispose();
        compact = compactQuery.matches;
        try {
          world = createWorld(canvas, {
            compact,
            initialBurst: opening,
          });
          if (world) world.state.burst = opening;
        } catch (error) {
          console.warn("The 3D scene could not resize.", error);
          world = null;
        }
        if (!world) {
          frame.style.display = "none";
          root.classList.remove("has-world");
          root.classList.add("world-unavailable");
        }
      } else world?.resize();
      buildChoreography();
    }, 170);
}
window.addEventListener(
  "resize",
  scheduleViewportRefresh,
  { passive: true },
);
canvas.addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  lostContext = true;
  root.classList.add("world-unavailable");
  frame.style.display = "none";
  buildChoreography();
});
canvas.addEventListener("webglcontextrestored", () => {
  lostContext = false;
  if (!world) {
    root.classList.add("world-unavailable");
    frame.style.display = "none";
    buildChoreography();
    return;
  }
  root.classList.remove("world-unavailable");
  frame.style.display = "";
  buildChoreography();
});
reduced.addEventListener("change", (event) => {
  paused = event.matches;
  buildChoreography();
});
document.addEventListener("visibilitychange", () => {
  lastTime = 0;
  lastRender = 0;
  lastScroll = scrollY;
  velocity = 0;
  if (!document.hidden) paint(gsap?.ticker.time || 0);
});
window.addEventListener("pagehide", (event) => {
  if (event.persisted) return;
  disposed = true;
  clearTimeout(resizeTimer);
  for (const type of impactInputs) window.removeEventListener(type, markImpactInteraction);
  lenis?.destroy();
  context?.revert();
  projectMotion?.dispose();
  gsap?.ticker.remove(tick);
  ribbon.dispose();
  projectEvidence.dispose();
  theme.dispose();
  world?.dispose();
});

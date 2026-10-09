import Lenis from "../vendor/lenis/lenis.js";
import { createWorld } from "./world.js";

const gsap = window.gsap,
  ScrollTrigger = window.ScrollTrigger,
  SplitText = window.SplitText;
const root = document.documentElement;
const canvas = document.querySelector("#world"),
  frame = document.querySelector(".world-frame");
const motionButton = document.querySelector(".motion"),
  burstButton = document.querySelector(".scene-burst");
const gallery = document.querySelector(".project-gallery"),
  track = document.querySelector(".project-panels");
const panels = [...document.querySelectorAll(".project-panel")];
const rail = document.querySelector(".scroll-rail"),
  thumb = document.querySelector(".scroll-thumb");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const compactQuery = matchMedia("(max-width: 800px)");
const desktopQuery = matchMedia("(min-width: 1100px) and (min-height: 650px)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = (value) => value * value * (3 - 2 * value);
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
if (gsap && ScrollTrigger)
  gsap.registerPlugin(ScrollTrigger, ...(SplitText ? [SplitText] : []));
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
let resizeTimer,
  disposed = false,
  drag;
let railGeometry = { top: 0, height: 1, thumbHeight: 28, travel: 1 };
const deckClock = { index: 0 },
  entry = { reveal: 1, rotation: 0 };

// One ticker drives Lenis, ScrollTrigger and WebGL. Smoothing the gallery a
// second time would make the text and its 3D frame drift apart.
function startScroller() {
  lenis?.destroy();
  lenis = undefined;
  if (paused || !gsap) return;
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
  const destination = clamp(
    top,
    0,
    Math.max(0, root.scrollHeight - innerHeight),
  );
  if (lenis) lenis.scrollTo(destination, { immediate, force: true });
  else window.scrollTo({ top: destination, behavior: "instant" });
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
}

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
  const visible = [];
  let dominant,
    best = 0;
  for (const item of windows) {
    const rect = item.element.getBoundingClientRect();
    const area =
      Math.max(0, Math.min(innerWidth, rect.right) - Math.max(0, rect.left)) *
      Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top));
    if (!area || !rect.width || !rect.height) continue;
    if (area > best) {
      best = area;
      dominant = { ...item, rect };
    }
    const progress = clamp(
      (innerHeight - rect.top) / (innerHeight + rect.height),
    );
    const heroProgress = clamp(-heroBounds.top / (innerHeight * 0.9));
    const workProgress = clamp(
      (-workBounds.top + innerHeight * 0.2) /
        Math.max(innerHeight, workBounds.height),
    );
    const galleryOffset = deckTrigger ? deckClock.index - item.project : 0;
    visible.push({
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
          ? ease(heroProgress) * 0.72
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
    });
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
    world.renderFrames(paused ? 0 : time, paused ? 0 : delta, visible);
    frame.style.visibility = visible.length ? "visible" : "hidden";
  }
  activeWindow = dominant || activeWindow;
  if (dominant && dominant.chapter !== activeChapter) {
    activeChapter = dominant.chapter;
    root.dataset.chapter = String(activeChapter);
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
  const interval = compactQuery.matches ? 1 / 30 : 1 / 60;
  if (time - lastRender < interval * 0.9 && !paused) return;
  const renderDelta = Math.min(0.05, time - lastRender || delta);
  lastRender = time;
  paint(time, renderDelta);
}

function buildChoreography(entrance = false) {
  const preservePanel =
    !entrance && activeWindow?.chapter === 2
      ? panels[activeWindow.project]
      : null;
  const anchor = !entrance && !preservePanel ? activeWindow?.element : null;
  const anchorTop = anchor?.getBoundingClientRect().top,
    panelTop = preservePanel?.getBoundingClientRect().top;
  lenis?.destroy();
  lenis = undefined;
  context?.revert();
  context = undefined;
  deckTrigger = undefined;
  deckTimeline = undefined;
  entranceTimeline = undefined;
  if (!entrance) {
    entry.reveal = 1;
    entry.rotation = 0;
  }
  gallery.classList.remove("is-horizontal");
  root.classList.toggle("motion-paused", paused);
  motionButton.textContent = paused ? "Enable motion" : "Pause motion";
  motionButton.setAttribute("aria-pressed", String(paused));
  burstButton.disabled = paused;
  if (!paused && gsap && ScrollTrigger) {
    context = gsap.context(() => {
      if (desktopQuery.matches && world) {
        gallery.classList.add("is-horizontal");
        const deck = gsap.timeline({
          scrollTrigger: {
            trigger: gallery,
            start: "top top",
            end: () => `+=${innerHeight * 3.4}`,
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: 2,
          },
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
        deckTimeline = deck;
        deckTrigger = deck.scrollTrigger;
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
            ".hero-intro, .hero-interaction",
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
      for (const heading of document.querySelectorAll(
        ".work-heading h2, .projects-heading h2, .contact h2",
      )) {
        SplitText?.create(heading, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit(split) {
            return gsap.from(split.lines, {
              yPercent: 105,
              duration: 0.9,
              stagger: 0.08,
              ease: "power3.out",
              scrollTrigger: {
                trigger: heading,
                start: "top 88%",
                toggleActions: "play none none reverse",
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
    const progress = [0.1, 0.5, 0.9][Number(preservePanel.dataset.project)];
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
  };
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
  const progress = [0.1, 0.5, 0.9][Number(panel.dataset.project)];
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
  burstButton.hidden = false;
  burstButton.addEventListener("click", () => {
    if (!paused) world.burst();
  });
  document.querySelector(".hero-window").addEventListener("click", (event) => {
    if (!paused && !event.target.closest("a,button")) world.burst();
  });
} else {
  frame.remove();
  root.classList.add("world-unavailable");
}
document.fonts.ready.then(async () => {
  if (disposed) return;
  buildChoreography(true);
  if (gsap) gsap.ticker.add(tick);
  // This harness is served only by tools/motion-lab.py, outside public assets.
  if (
    ["127.0.0.1", "localhost"].includes(location.hostname) &&
    new URLSearchParams(location.search).get("motion-lab") === "1"
  ) {
    const { installMotionLab } = await import("/__motion_lab__/motion-lab.js");
    installMotionLab(() => entranceTimeline).catch(console.warn);
  }
});
window.addEventListener(
  "scroll",
  () => {
    lastInput = performance.now();
    if (paused || !gsap) paint(0, 0);
  },
  { passive: true },
);
window.addEventListener(
  "resize",
  () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (world && compact !== compactQuery.matches) {
        world.dispose();
        compact = compactQuery.matches;
        try {
          world = createWorld(canvas, { compact });
        } catch (error) {
          console.warn("The 3D scene could not resize.", error);
          world = null;
        }
        if (!world) {
          frame.style.display = "none";
          root.classList.remove("has-world");
          root.classList.add("world-unavailable");
          burstButton.hidden = true;
        }
      } else world?.resize();
      buildChoreography();
    }, 170);
  },
  { passive: true },
);
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
  lenis?.destroy();
  context?.revert();
  gsap?.ticker.remove(tick);
  world?.dispose();
});

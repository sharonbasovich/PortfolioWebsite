import { createWorld } from "./world.js";

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const SplitText = window.SplitText;
const canvas = document.querySelector("#world");
const frame = document.querySelector(".world-frame");
const motionButton = document.querySelector(".motion");
const burstButton = document.querySelector(".scene-burst");
const gallery = document.querySelector(".project-gallery");
const track = document.querySelector(".project-panels");
const panels = [...document.querySelectorAll(".project-panel")];
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const compactQuery = matchMedia("(max-width: 800px)");
const desktopQuery = matchMedia("(min-width: 1100px) and (min-height: 650px)");
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
    };
  },
);

if (gsap && ScrollTrigger)
  gsap.registerPlugin(ScrollTrigger, ...(SplitText ? [SplitText] : []));

let compact = compactQuery.matches;
let world = createWorld(canvas, { compact });
let paused = reduced.matches;
let context;
let activeWindow;
let lastRender = 0;
let resizeTimer;
let activeScene = "";
let deckTrigger;
let deckTimeline;
let disposed = false;
const clock = { project: 0 };

function selectWindow() {
  let selected;
  let best = 0;
  for (const item of windows) {
    const rect = item.element.getBoundingClientRect();
    const visibleWidth = Math.max(
      0,
      Math.min(innerWidth, rect.right) - Math.max(0, rect.left),
    );
    const visibleHeight = Math.max(
      0,
      Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top),
    );
    // Screen area chooses the panel that actually occupies the viewport, rather
    // than the DOM's first item. This also works during horizontal transitions.
    const score = visibleWidth * visibleHeight;
    if (score > best && rect.width > 0 && rect.height > 0) {
      best = score;
      selected = { ...item, rect };
    }
  }
  return selected;
}

function paint(time = 0, delta = 1 / 60) {
  if (!world || disposed || document.hidden) return;
  const selected = selectWindow();
  if (!selected) {
    frame.style.visibility = "hidden";
    return;
  }
  frame.style.visibility = "visible";
  const { rect, chapter, project } = selected;
  const nextScene = `${chapter}:${project}`;
  if (nextScene !== activeScene) {
    activeScene = nextScene;
    if (paused || !gsap) {
      world.state.chapter = chapter;
      world.state.project = project;
    } else {
      gsap.fromTo(
        canvas,
        { opacity: 0.08 },
        { opacity: 1, duration: 0.7, ease: "power2.out", overwrite: true },
      );
      gsap.to(world.state, {
        chapter,
        project,
        duration: 0.85,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    }
    document.documentElement.dataset.chapter = String(chapter);
    document.querySelector(".status-index").textContent =
      `0${chapter + 1} / 04`;
    document.querySelector(".status-label").textContent = [
      "CONNECT",
      "ENGINEER",
      "BUILD",
      "SAY HELLO",
    ][chapter];
  }
  activeWindow = selected;
  const radius =
    getComputedStyle(selected.element).borderTopLeftRadius || "24px";
  frame.style.clipPath = `inset(${Math.max(0, rect.top)}px ${Math.max(0, innerWidth - rect.right)}px ${Math.max(0, innerHeight - rect.bottom)}px ${Math.max(0, rect.left)}px round ${radius})`;
  world.setFrame?.(rect);
  if (chapter === 0) {
    const hero = document.querySelector(".hero").getBoundingClientRect();
    world.state.explode = paused
      ? 0
      : Math.min(0.85, Math.max(0, -hero.top / (innerHeight * 0.75)));
  } else world.state.explode = 0;
  world.render(paused ? 0 : time, paused ? 0 : delta);
}

function tick(time, deltaMs) {
  if (paused || document.hidden) return;
  const minInterval = compactQuery.matches ? 1 / 30 : 1 / 60;
  if (time - lastRender < minInterval * 0.9) return;
  const delta = Math.min(0.05, time - lastRender || deltaMs / 1000);
  lastRender = time;
  paint(time, delta);
}

function clearChoreography() {
  context?.revert();
  context = undefined;
  deckTrigger = undefined;
  deckTimeline = undefined;
  if (world && gsap) gsap.killTweensOf(world.state);
  gsap?.killTweensOf(clock);
  gallery?.classList.remove("is-horizontal");
  activeScene = "";
}

function buildChoreography(entrance = false) {
  const preservePanel =
    !entrance && activeWindow?.chapter === 2
      ? panels[activeWindow.project]
      : null;
  const preserveAnchor =
    !entrance && !preservePanel ? activeWindow?.element : null;
  const oldAnchorTop = preserveAnchor?.getBoundingClientRect().top;
  const oldPanelTop = preservePanel?.getBoundingClientRect().top;
  clearChoreography();
  document.documentElement.classList.toggle("motion-paused", paused);
  if (motionButton) {
    motionButton.textContent = paused ? "Enable motion" : "Pause motion";
    motionButton.setAttribute("aria-pressed", String(paused));
  }
  if (burstButton) burstButton.disabled = paused;
  if (!world || paused || !gsap || !ScrollTrigger) {
    if (world) {
      world.state.reveal = 1;
      world.state.rotation = 0;
    }
    gsap?.killTweensOf(canvas);
    if (canvas) canvas.style.opacity = "1";
    ScrollTrigger?.refresh();
    if (preservePanel)
      window.scrollBy({
        top: preservePanel.getBoundingClientRect().top - oldPanelTop,
        behavior: "instant",
      });
    else if (preserveAnchor)
      window.scrollBy({
        top: preserveAnchor.getBoundingClientRect().top - oldAnchorTop,
        behavior: "instant",
      });
    paint();
    return;
  }
  context = gsap.context(() => {
    if (desktopQuery.matches && gallery && track) {
      gallery.classList.add("is-horizontal");
      const deck = gsap.timeline({
        scrollTrigger: {
          trigger: gallery,
          start: "top top",
          end: () => `+=${innerHeight * 3.7}`,
          pin: true,
          scrub: 0.75,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 2,
        },
      });
      deckTrigger = deck.scrollTrigger;
      deckTimeline = deck;
      // Holds give each project time to be read before the next scene travels in.
      deck.to(clock, { project: 0, duration: 1.3 });
      deck.to(track, {
        x: () => -innerWidth,
        duration: 0.9,
        ease: "power2.inOut",
      });
      deck.to(clock, { project: 1, duration: 1.3 });
      deck.to(track, {
        x: () => -innerWidth * 2,
        duration: 0.9,
        ease: "power2.inOut",
      });
      deck.to(clock, { project: 2, duration: 1.3 });
    }
    if (entrance) {
      gsap.from(".hero h1", {
        y: 48,
        opacity: 0,
        duration: 1.05,
        ease: "power3.out",
        delay: 0.12,
      });
      gsap.from(".hero-intro, .hero .eyebrow, .hero-interaction", {
        y: 18,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        delay: 0.3,
        ease: "power2.out",
      });
      world.state.reveal = 0;
      world.state.rotation = -2;
      gsap.to(world.state, {
        reveal: 1,
        rotation: 0,
        duration: 1.5,
        ease: "power3.out",
        delay: 0.15,
      });
    }
    for (const heading of document.querySelectorAll(
      ".work-heading h2, .contact h2",
    )) {
      if (SplitText) {
        SplitText.create(heading, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit(split) {
            return gsap.from(split.lines, {
              yPercent: 110,
              duration: 0.9,
              stagger: 0.1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: heading,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
            });
          },
        });
      }
    }
  });
  ScrollTrigger.refresh();
  if (preservePanel && deckTrigger) {
    const readingPositions = [0.11, 0.5, 0.89];
    const progress = readingPositions[Number(preservePanel.dataset.project)];
    window.scrollTo({
      top: deckTrigger.start + progress * (deckTrigger.end - deckTrigger.start),
      behavior: "instant",
    });
  } else if (preserveAnchor)
    window.scrollBy({
      top: preserveAnchor.getBoundingClientRect().top - oldAnchorTop,
      behavior: "instant",
    });
  paint(gsap.ticker.time);
}

if (world) {
  document.documentElement.classList.add("has-world");
  frame.setAttribute("aria-hidden", "true");
  if (burstButton) {
    burstButton.hidden = false;
    burstButton.addEventListener("click", () => {
      if (paused) return;
      world.burst();
      gsap?.fromTo(
        burstButton,
        { scale: 0.95 },
        { scale: 1, duration: 0.25, ease: "power2.out", overwrite: true },
      );
    });
  }
  if (motionButton) {
    motionButton.hidden = !gsap;
    motionButton.addEventListener("click", () => {
      paused = !paused;
      buildChoreography();
    });
  }
  document.fonts.ready.then(() => {
    if (disposed) return;
    buildChoreography(true);
    gsap?.ticker.add(tick);
  });
} else {
  frame?.remove();
  document.documentElement.classList.add("world-unavailable");
}

gallery?.addEventListener("focusin", (event) => {
  const panel = event.target.closest(".project-panel");
  if (!panel || !deckTrigger || !deckTimeline) return;
  const progress = [0.11, 0.5, 0.89][Number(panel.dataset.project)];
  window.scrollTo({
    top: deckTrigger.start + progress * (deckTrigger.end - deckTrigger.start),
    behavior: "instant",
  });
  deckTimeline.progress(progress);
  ScrollTrigger.update();
  paint(gsap.ticker.time);
});

// Native scrolling remains available with JS off, reduced motion, paused motion,
// and on small screens. A static scene follows the visible window while paused.
window.addEventListener(
  "scroll",
  () => {
    if (paused || !gsap) paint();
  },
  { passive: true },
);
window.addEventListener(
  "resize",
  () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (world && compact !== compactQuery.matches) {
        gsap?.killTweensOf(world.state);
        world.dispose();
        compact = compactQuery.matches;
        world = createWorld(canvas, { compact });
      } else world?.resize();
      buildChoreography();
    }, 160);
  },
  { passive: true },
);
reduced.addEventListener("change", (event) => {
  paused = event.matches;
  buildChoreography();
});
document.addEventListener("visibilitychange", () => {
  lastRender = 0;
  if (!document.hidden) paint(gsap?.ticker.time || 0);
});
window.addEventListener("pagehide", (event) => {
  if (event.persisted) return;
  disposed = true;
  clearChoreography();
  gsap?.ticker.remove(tick);
  world?.dispose();
});

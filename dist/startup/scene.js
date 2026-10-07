import Lenis from "./vendor/lenis/lenis.js";
import { createParticleScene } from "./particle-scene.js";

// See docs/creative-motion-experiment.md for the brief, sources, and local harness.
if (document.readyState === "loading")
  await new Promise((resolve) =>
    document.addEventListener("DOMContentLoaded", resolve, { once: true }),
  );
const { gsap, ScrollTrigger, SplitText } = window;
const button = document.querySelector(".motion");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const canvas = document.querySelector("#scene");
const art = createParticleScene(canvas, { mobile: innerWidth < 700 });
const sections = [...document.querySelectorAll("main .chapter")];
const cards = [...document.querySelectorAll(".project-list article")];
const controls = document.querySelector(".project-controls");
const projectButtons = [...controls.querySelectorAll("button")];
let paused = reduced.matches;
let entered = false;
let entrance;
let motionContext;
let lenis;
let lastFrame = 0;
let resizeFrame;

if (!gsap || !ScrollTrigger || !SplitText) {
  document.body.classList.add("no-webgl");
} else {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  document.body.classList.add(art ? "scene-ready" : "no-webgl");
  const statusIndex = document.querySelector(".status-index");
  const statusLabel = document.querySelector(".status-label");
  const labels = ["CONNECT", "ENGINEER", "BUILD", "CONNECT"];
  function setStatus(index) {
    statusIndex.textContent = `${String(index + 1).padStart(2, "0")} / 04`;
    statusLabel.textContent = labels[index];
  }

  function buildMotion() {
    const media = gsap.matchMedia();
    media.add(
      {
        wide: "(min-width: 1100px) and (min-height: 700px)",
        small: "(max-width: 700px)",
        all: "all",
      },
      (context) => {
        const { wide, small } = context.conditions;
        const splits = [];
        const cleanup = [];
        const poses = small
          ? [
              {
                morph: 0,
                x: 0.65,
                y: -1.6,
                scale: 0.72,
                rx: 0.12,
                ry: -0.3,
                rz: -0.18,
                cameraZ: 11,
                opacity: 1,
              },
              {
                morph: 1,
                x: 1.2,
                y: 0.2,
                scale: 0.85,
                rx: 0.4,
                ry: 0.65,
                rz: 0.08,
                cameraZ: 11,
                opacity: 0.55,
              },
              {
                morph: 2,
                x: 0.9,
                y: 0.3,
                scale: 0.9,
                rx: 0.8,
                ry: 1.15,
                rz: -0.3,
                cameraZ: 11,
                opacity: 0.55,
              },
              {
                morph: 3,
                x: 1.1,
                y: 0.2,
                scale: 1,
                rx: 0.2,
                ry: 0.45,
                rz: -0.3,
                cameraZ: 11,
                opacity: 0.5,
              },
            ]
          : [
              {
                morph: 0,
                x: 3.25,
                y: 0.15,
                scale: 1,
                rx: 0.12,
                ry: -0.3,
                rz: -0.18,
                cameraZ: 10,
                opacity: 0.95,
              },
              {
                morph: 1,
                x: 3.25,
                y: 0.3,
                scale: 0.95,
                rx: 0.4,
                ry: 0.65,
                rz: 0.08,
                cameraZ: 10.5,
                opacity: 0.9,
              },
              {
                morph: 2,
                x: -3.25,
                y: -1.8,
                scale: 0.85,
                rx: 0.8,
                ry: 1.15,
                rz: -0.3,
                cameraZ: 11,
                opacity: 0.8,
              },
              {
                morph: 3,
                x: 3.4,
                y: 0.3,
                scale: 1.15,
                rx: 0.2,
                ry: 0.45,
                rz: -0.3,
                cameraZ: 11,
                opacity: 0.75,
              },
            ];
        // One hierarchy: the name leads, the introduction follows, the form settles.
        splits.push(
          SplitText.create("h1", {
            type: "lines",
            mask: "lines",
            linesClass: "name-line",
            autoSplit: true,
            aria: "auto",
            onSplit(self) {
              entrance = gsap
                .timeline({
                  id: "hero-arrival",
                  defaults: { ease: "power3.out" },
                  onComplete: () => {
                    entered = true;
                  },
                })
                .addLabel("introduce", 0)
                .from(
                  self.lines,
                  {
                    yPercent: 108,
                    rotation: 4,
                    transformOrigin: "0% 100%",
                    duration: 1,
                    stagger: 0.12,
                  },
                  "introduce",
                )
                .from(
                  ".eyebrow",
                  { y: 15, opacity: 0, duration: 0.6 },
                  "introduce+=.08",
                )
                .from(
                  ".hero-bottom, .hero-links",
                  { y: 24, opacity: 0, duration: 0.7, stagger: 0.13 },
                  "introduce+=.42",
                );
              if (art)
                entrance.fromTo(
                  art.state,
                  { opening: 0 },
                  { opening: 1, duration: 1.45, ease: "power2.out" },
                  0,
                );
              if (entered || scrollY > innerHeight * 0.25) entrance.progress(1);
              return entrance;
            },
          }),
        );
        document
          .querySelectorAll(".chapter:not(.hero) h2")
          .forEach((heading) => {
            splits.push(
              SplitText.create(heading, {
                type: "lines",
                mask: "lines",
                linesClass: "chapter-line",
                autoSplit: true,
                aria: "auto",
                onSplit(self) {
                  return gsap.from(self.lines, {
                    yPercent: 110,
                    rotation: 2,
                    transformOrigin: "0% 100%",
                    duration: 0.85,
                    stagger: 0.1,
                    ease: "power3.out",
                    scrollTrigger: {
                      trigger: heading,
                      start: "top 85%",
                      toggleActions: "play none none none",
                    },
                  });
                },
              }),
            );
          });
        gsap.from(".experience .content-block > *, .experience .fact", {
          y: 32,
          opacity: 0,
          duration: 0.75,
          stagger: 0.075,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".experience .content-block",
            start: "top 85%",
            once: true,
          },
        });
        gsap.from(
          ".closing .lead, .closing .email, .closing .about, .closing footer",
          {
            y: 25,
            opacity: 0,
            duration: 0.7,
            stagger: 0.09,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".closing .lead",
              start: "top 90%",
              once: true,
            },
          },
        );

        // Codrops' pinned 3D stack pattern: a stable stage pins; only children move.
        // Touch, short screens, pause, and reduced motion retain the native list.
        if (wide) {
          const stage = document.querySelector(".project-stage");
          const list = document.querySelector(".project-list");
          stage.classList.add("is-deck");
          const measureDeck = () => {
            const height = Math.max(...cards.map((card) => card.offsetHeight));
            list.style.setProperty("--deck-height", `${height + 64}px`);
          };
          measureDeck();
          controls.hidden = false;
          cards.forEach((card, index) =>
            gsap.set(card, {
              x: index * 22,
              y: index * 28,
              z: index * -80,
              rotationX: index * 3,
              rotationY: index * -2,
              transformPerspective: 1300,
              transformOrigin: "50% 100%",
              opacity: index ? 0.45 : 1,
              zIndex: 3 - index,
            }),
          );
          let active = -1;
          function selectCard(index) {
            if (active === index) return;
            active = index;
            cards.forEach((card, cardIndex) => {
              card.inert = cardIndex !== index;
              card.setAttribute("aria-hidden", String(cardIndex !== index));
              card.querySelector("a").tabIndex = cardIndex === index ? 0 : -1;
              card.classList.toggle("is-active", cardIndex === index);
            });
            projectButtons.forEach((item, buttonIndex) =>
              item.setAttribute("aria-pressed", String(buttonIndex === index)),
            );
          }
          selectCard(0);
          const deck = gsap
            .timeline({
              defaults: { ease: "power2.inOut" },
              onUpdate() {
                const progress = this.progress();
                selectCard(progress < 0.293 ? 0 : progress < 0.659 ? 1 : 2);
              },
              scrollTrigger: {
                trigger: stage,
                start: "top 115px",
                end: () => `+=${innerHeight * 2.3}`,
                pin: true,
                scrub: 0.65,
                invalidateOnRefresh: true,
                refreshPriority: 1,
                onRefreshInit: measureDeck,
              },
            })
            .addLabel("robot", 0)
            .to(
              cards[0],
              {
                y: -110,
                x: -45,
                z: 60,
                rotationX: -9,
                rotationY: 8,
                autoAlpha: 0,
                duration: 0.8,
              },
              0.8,
            )
            .to(
              cards[1],
              {
                y: 0,
                x: 0,
                z: 0,
                rotationX: 0,
                rotationY: 0,
                opacity: 1,
                duration: 0.8,
              },
              0.8,
            )
            .to(
              cards[2],
              {
                y: 28,
                x: 22,
                z: -80,
                rotationX: 3,
                rotationY: -2,
                opacity: 0.45,
                duration: 0.8,
              },
              0.8,
            )
            .addLabel("skycell", 1.6)
            .to(
              cards[1],
              {
                y: -110,
                x: -45,
                z: 60,
                rotationX: -9,
                rotationY: 8,
                autoAlpha: 0,
                duration: 0.8,
              },
              2.3,
            )
            .to(
              cards[2],
              {
                y: 0,
                x: 0,
                z: 0,
                rotationX: 0,
                rotationY: 0,
                opacity: 1,
                duration: 0.8,
              },
              2.3,
            )
            .addLabel("marble", 3.1)
            .to({}, { duration: 1 }, 3.1);
          projectButtons.forEach((item, index) => {
            const seek = () => {
              lenis?.resize();
              const destination =
                deck.scrollTrigger.start +
                (deck.scrollTrigger.end - deck.scrollTrigger.start) *
                  [0.08, 0.49, 0.92][index];
              if (lenis) lenis.scrollTo(destination, { duration: 0.65 });
              else window.scrollTo({ top: destination, behavior: "smooth" });
            };
            item.addEventListener("click", seek);
            cleanup.push(() => item.removeEventListener("click", seek));
          });
          cleanup.push(() => {
            stage.classList.remove("is-deck");
            list.style.removeProperty("--deck-height");
            controls.hidden = true;
            cards.forEach((card) => {
              card.inert = false;
              card.removeAttribute("aria-hidden");
              card.querySelector("a").removeAttribute("tabindex");
              card.classList.remove("is-active");
            });
          });
        } else {
          cards.forEach((card) =>
            gsap.from(card, {
              y: 45,
              rotationX: 4,
              transformPerspective: 1200,
              opacity: 0.4,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top 95%",
                end: "top 62%",
                scrub: 0.5,
              },
            }),
          );
        }

        // One scrubber owns the 3D state; boundary transitions alternate with holds.
        if (art) {
          const formation = gsap.timeline({ paused: true });
          const rebuild = (self) => {
            formation.clear();
            formation.set(art.state, poses[0], 0);
            sections.slice(1).forEach((section, index) => {
              const top = section.getBoundingClientRect().top + scrollY;
              const start = Math.max(0, top - innerHeight * 0.82);
              const end = Math.min(self.end, top - innerHeight * 0.14);
              formation.to(
                art.state,
                {
                  ...poses[index + 1],
                  duration: Math.max(1, end - start),
                  ease: "power2.inOut",
                },
                start,
              );
            });
            formation.to(
              {},
              { duration: 1 },
              Math.max(formation.duration(), self.end),
            );
            formation.progress(self.progress);
          };
          ScrollTrigger.create({
            animation: formation,
            start: 0,
            end: () => ScrollTrigger.maxScroll(window),
            scrub: 0.8,
            invalidateOnRefresh: true,
            refreshPriority: -1,
            onRefresh: rebuild,
          });
        }
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
        return () => {
          cleanup.forEach((fn) => fn());
          splits.forEach((split) => split.revert());
        };
      },
    );
    return media;
  }

  function updateMotion(value) {
    paused = value;
    entrance?.progress(1);
    motionContext?.revert();
    motionContext = null;
    lenis?.destroy();
    lenis = null;
    document.body.classList.toggle("reduced-motion", paused);
    button.textContent = paused ? "Enable motion" : "Pause motion";
    button.setAttribute("aria-pressed", String(paused));
    if (!paused) {
      lenis = new Lenis({
        duration: 0.95,
        smoothWheel: true,
        syncTouch: false,
        anchors: true,
      });
      lenis.on("scroll", ScrollTrigger.update);
      motionContext = buildMotion();
    } else if (art) {
      Object.assign(art.state, {
        opening: 1,
        morph: 0,
        x: innerWidth < 700 ? 1.4 : 3.25,
        y: 0,
        opacity: 0.55,
      });
      art.render(0);
    }
    ScrollTrigger.refresh();
  }
  button.hidden = false;
  button.addEventListener("click", () => updateMotion(!paused));
  reduced.addEventListener("change", (event) => updateMotion(event.matches));
  updateMotion(paused);
  let chapterTops = [];
  ScrollTrigger.create({
    start: 0,
    end: () => ScrollTrigger.maxScroll(window),
    refreshPriority: -10,
    onRefresh() {
      chapterTops = sections.map(
        (section) => section.getBoundingClientRect().top + scrollY,
      );
    },
    onUpdate(self) {
      gsap.set(".progress span", { scaleX: self.progress });
      const center = scrollY + innerHeight * 0.5;
      let chapter = 0;
      chapterTops.forEach((top, index) => {
        if (center >= top) chapter = index;
      });
      setStatus(chapter);
    },
  });
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  gsap.ticker.add((time) => {
    if (document.hidden) return;
    lenis?.raf(time * 1000);
    if (
      !paused &&
      art &&
      time - lastFrame >= 1 / (innerWidth < 700 ? 30 : 60)
    ) {
      lastFrame = time;
      art.render(time);
    }
  });
  gsap.ticker.lagSmoothing(0);
  addEventListener(
    "resize",
    () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        art?.resize();
        if (paused) art?.render(0);
      });
    },
    { passive: true },
  );
  ScrollTrigger.addEventListener("refresh", () => lenis?.resize());
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  canvas.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      art?.dispose();
      document.body.classList.replace("scene-ready", "no-webgl");
    },
    { once: true },
  );

  // The local server maps this route outside the production output directory.
  if (
    ["localhost", "127.0.0.1"].includes(location.hostname) &&
    new URLSearchParams(location.search).has("motion-lab")
  ) {
    import("/__motion_lab__/motion-lab.js").then(({ installMotionLab }) =>
      installMotionLab(() => (paused ? null : entrance)),
    );
  }
}

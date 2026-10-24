const asset = (name) =>
  new URL(`./assets/project-evidence/${name}`, import.meta.url).href;

const photographs = {
  marble: {
    key: "marble", file: "marble-logo.svg", width: 467, height: 157,
    logo: true, alt: "Marble Investments logo",
  },
  hpc: {
    key: "hpc", file: "uwhpc-logo.svg", width: 387, height: 234,
    logo: true, alt: "UW High Performance Computing logo",
  },
  skycell: {
    key: "skycell", file: "skycell-balloon-launch.jpg", width: 659, height: 880,
    frameRatio: 4 / 3, focusY: 0.34,
    alt: "SkyCell balloon train with two balloons and suspended payload against a blue sky",
  },
  robotics: {
    key: "robotics", file: "lions-robots-trophies.jpg", width: 1200, height: 800,
    alt: "Four Lions Robotics VEX robots displayed with competition trophies",
  },
};

const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => value * value * (3 - 2 * value);

function makePhoto(specification) {
  const figure = document.createElement("figure");
  figure.className = `project-evidence project-evidence--${specification.key}`;
  if (specification.logo) figure.classList.add("project-evidence--logo");
  const media = document.createElement("div");
  media.className = "project-evidence-media";
  const image = document.createElement("img");
  image.src = asset(specification.file);
  image.alt = specification.alt;
  image.width = specification.width;
  image.height = specification.height;
  if (specification.frameRatio) {
    image.dataset.frameRatio = String(specification.frameRatio);
    image.dataset.frameFocusY = String(specification.focusY ?? 0.5);
    image.style.objectPosition = `50% ${(specification.focusY ?? 0.5) * 100}%`;
  }
  image.loading = "lazy";
  image.decoding = "async";
  media.append(image);
  figure.append(media);
  return figure;
}

/**
 * Install real project evidence without creating a second animation clock.
 * The caller supplies the existing gallery's fractional index on each paint.
 * Native, paused and reduced-motion modes should pass native/paused = true.
 * Hosts must not remain aria-hidden, because the photographs have useful alt text.
 */
export function installProjectEvidence(panels) {
  const views = [];
  const markedTracks = new Set();
  let disposed = false;
  for (const [position, panel] of Array.from(panels || []).entries()) {
    const index = Number(panel.dataset.project ?? position);
    const host = panel.querySelector(".project-window");
    if (!host || index < 0 || index > 3 || !Number.isInteger(index)) continue;
    // A repeated installation must not stack figures or own someone else's DOM.
    if (host.querySelector(".project-evidence")) continue;
    const key = panel.dataset.projectKey;
    if (!photographs[key]) continue;
    const figure = makePhoto(photographs[key]);
    const wasMarked = host.classList.contains("has-project-evidence");
    host.classList.add("has-project-evidence");
    host.append(figure);
    const track = panel.closest(".project-panels");
    if (track && !track.classList.contains("has-project-evidence")) {
      track.classList.add("has-project-evidence");
      markedTracks.add(track);
    }
    views.push({ index, host, figure, wasMarked, lastRight: -1 });
  }

  return {
    update(deckIndex, { native = false, paused = false } = {}) {
      if (disposed) return;
      const index = Number.isFinite(deckIndex) ? deckIndex : 0;
      for (const view of views) {
        // Incoming work opens from a narrow slice and settles fully by arrival.
        // Outgoing work remains open. Reverse scroll reverses only that arrival;
        // a reading hold never introduces drift or another timed animation.
        const arrival = native || paused
          ? 1
          : ease(clamp((index - (view.index - 0.72)) / 0.72));
        const right = Math.round((1 - arrival) * 92 * 1000) / 1000;
        if (right === view.lastRight) continue;
        view.lastRight = right;
        view.figure.style.setProperty("--evidence-right", `${right}%`);
        view.figure.style.setProperty(
          "--evidence-shift",
          `${((1 - arrival) * 20).toFixed(2)}px`,
        );
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const { host, figure, wasMarked } of views) {
        figure.remove();
        if (!wasMarked) host.classList.remove("has-project-evidence");
      }
      for (const track of markedTracks)
        track.classList.remove("has-project-evidence");
      views.length = 0;
      markedTracks.clear();
    },
  };
}

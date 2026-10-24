const asset = (name) =>
  new URL(`./assets/project-evidence/${name}`, import.meta.url).href;

const photographs = {
  marble: {
    key: "marble", file: "marble-workflows.svg", mobile: "marble-workflows-mobile.svg", width: 1280, height: 840,
    alt: "Illustrative Marble Investments workflow diagram: a React relationship graph, news extraction, and a Python stock pair screener; not a production screenshot.",
    title: "Marble Investments", detail: "Research workflows · illustrative diagram",
  },
  skycell: {
    key: "skycell", file: "skycell-replay.jpg", width: 1280, height: 1500,
    alt: "SkyCell's archived flight replay dashboard, showing telemetry charts and the recorded APEX / SondeHub trajectory.",
    title: "SkyCell", detail: "Archived APEX / SondeHub tracker data",
  },
  robotics: {
    key: "robotics", file: "lions-worlds-robot.jpg", width: 1605, height: 1906,
    alt: "The Lions Robotics VEX V5 robot on the competition field, from Sharon's Worlds software repository.",
    title: "Lions Robotics", detail: "Actual VEX V5 robot · Worlds repository",
  },
};

const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => value * value * (3 - 2 * value);

function makeCaption(title, detail) {
  const caption = document.createElement("figcaption");
  caption.className = "project-evidence-caption";
  const heading = document.createElement("span");
  heading.className = "project-evidence-caption-title";
  heading.textContent = title;
  const context = document.createElement("span");
  context.className = "project-evidence-caption-detail";
  context.textContent = detail;
  caption.append(heading, context);
  return caption;
}

function makePhoto(specification) {
  const figure = document.createElement("figure");
  figure.className = `project-evidence project-evidence--${specification.key}`;
  const media = document.createElement("div");
  media.className = "project-evidence-media";
  const image = document.createElement("img");
  image.src = asset(specification.file);
  image.alt = specification.alt;
  image.width = specification.width;
  image.height = specification.height;
  image.loading = "lazy";
  image.decoding = "async";
  if (specification.mobile) {
    const picture = document.createElement("picture");
    const source = document.createElement("source");
    source.media = "(max-width: 650px)";
    source.srcset = asset(specification.mobile);
    source.width = 540;
    source.height = 670;
    picture.append(source, image);
    media.append(picture);
  } else media.append(image);
  figure.append(
    media,
    makeCaption(specification.title, specification.detail),
  );
  return figure;
}

function makeHPCOverview() {
  const figure = document.createElement("figure");
  figure.className = "project-evidence project-evidence--hpc";
  const content = document.createElement("div");
  content.className = "hpc-evidence";
  // This is an explanatory diagram, not a benchmark or simulation output.
  content.innerHTML = `
    <p class="hpc-evidence-label">Concept overview · In progress</p>
    <section class="hpc-evidence-lane" aria-label="XPU backend concept">
      <h4>XPU</h4>
      <div class="hpc-interface">One C++23 interface</div>
      <svg class="hpc-backend-branches" viewBox="0 0 400 32" fill="none" aria-hidden="true">
        <path d="M200 0v12H95v20M200 12h105v20" stroke="currentColor" stroke-width="1.25" />
      </svg>
      <div class="hpc-backends"><span>CPU</span><span>NVIDIA CUDA</span></div>
      <p class="hpc-evidence-detail">Memory · Math · Data layouts · Execution</p>
    </section>
    <section class="hpc-evidence-lane" aria-label="Variational Monte Carlo concept">
      <h4>Variational Monte Carlo</h4>
      <div class="hpc-sampling">
        <svg viewBox="0 0 180 105" fill="none" role="img" aria-label="Illustrative electron configuration; no simulation results shown">
          <rect x="5" y="5" width="170" height="95" rx="10" stroke="currentColor" stroke-opacity=".35" />
          <g fill="currentColor"><circle cx="33" cy="29" r="4"/><circle cx="76" cy="20" r="4"/><circle cx="140" cy="34" r="4"/><circle cx="52" cy="74" r="4"/><circle cx="125" cy="79" r="4"/><circle cx="95" cy="57" r="5"/></g>
          <circle cx="117" cy="46" r="6" stroke="currentColor" stroke-opacity=".65" stroke-dasharray="2 3"/>
          <path d="m100 54 11-5" stroke="currentColor" stroke-dasharray="2 3"/>
        </svg>
        <p>Slater–Jastrow trial<br /><span>Metropolis sampling</span></p>
      </div>
      <p class="hpc-evidence-detail">Homogeneous electron gas</p>
    </section>
  `;
  figure.append(content, makeCaption(
    "UWaterloo HPC", "Conceptual diagrams · both projects in progress",
  ));
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
    if (key !== "hpc" && !photographs[key]) continue;
    const figure = key === "hpc" ? makeHPCOverview() : makePhoto(photographs[key]);
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

const PREVIEWS = new Map([
  ["1", "Card expansion"],
  ["2", "Side sheet"],
  ["3", "Iris reveal"],
]);
let instance = 0;

const cleanClone = (element) => {
  if (!element) return null;
  const clone = element.cloneNode(true);
  for (const node of [clone, ...clone.querySelectorAll("[id]")])
    node.removeAttribute("id");
  return clone;
};

/** One shared native dialog keeps disclosure out of the pinned gallery layout.
 * Experimental treatments run only on localhost until Sharon selects one.
 * onOpen/onClose should stop/restore the page's existing scroller, not its
 * animation clock: these timelines share the existing GSAP ticker.
 */
export function installProjectDetails({ panels, gsap, onOpen, onClose } = {}) {
  const records = Array.from(panels || []).map((panel) => ({
    panel,
    button: panel.querySelector("[data-project-details]"),
    template: panel.querySelector("template.project-resume"),
  })).filter(({ button, template }) => button && template);
  if (!records.length) return { dispose() {} };

  const query = new URLSearchParams(location.search).get("details-motion");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  const choice = local && PREVIEWS.has(query) ? query : null;
  const id = `project-details-${++instance}`;
  const dialog = document.createElement("dialog");
  dialog.id = id;
  dialog.className = "project-details-dialog";
  dialog.dataset.motion = choice || "static";
  dialog.setAttribute("aria-labelledby", `${id}-title`);
  dialog.setAttribute("aria-describedby", `${id}-context`);
  dialog.innerHTML = `
    <div class="project-details-shade" aria-hidden="true"></div>
    <section class="project-details-sheet" data-lenis-prevent>
      <header class="project-details-header">
        <p class="project-details-context" id="${id}-context"></p>
        <h2 class="project-details-title" id="${id}-title"></h2>
        <button class="project-details-close" type="button" aria-label="Close project details">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
        </button>
      </header>
      <div class="project-details-scroll" data-lenis-prevent>
        <div class="project-details-bullets"></div>
        <div class="project-details-footer"></div>
      </div>
    </section>`;
  document.body.append(dialog);
  const sheet = dialog.querySelector(".project-details-sheet");
  const shade = dialog.querySelector(".project-details-shade");
  const header = dialog.querySelector(".project-details-header");
  const closeButton = dialog.querySelector(".project-details-close");
  const title = dialog.querySelector(".project-details-title");
  const context = dialog.querySelector(".project-details-context");
  const body = dialog.querySelector(".project-details-bullets");
  const footer = dialog.querySelector(".project-details-footer");
  const scroll = dialog.querySelector(".project-details-scroll");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let source;
  let timeline;
  let closing = false;
  let locked = false;
  let disposed = false;
  let previousOverflow;
  let comparison;
  const noMotion = () => !choice || !gsap || reduced.matches ||
    document.documentElement.matches(".motion-paused, .is-paused");

  function clearMotion() {
    timeline?.kill();
    timeline = undefined;
    if (gsap) gsap.set([sheet, shade, header, footer, ...body.querySelectorAll("li")], {
      clearProps: "transform,opacity,clipPath,transformOrigin,borderRadius",
    });
  }

  function finishClose(restoreFocus = true) {
    clearMotion();
    closing = false;
    if (dialog.open) dialog.close();
    source?.button.setAttribute("aria-expanded", "false");
    if (locked) {
      document.body.style.overflow = previousOverflow;
      document.documentElement.classList.remove("project-details-open");
      locked = false;
      onClose?.();
    }
    if (restoreFocus && source?.button.isConnected)
      source.button.focus({ preventScroll: true });
    source = undefined;
  }

  function makeTimeline(record) {
    // Read geometry once at the event boundary; no per-frame layout reads.
    const origin = record.panel.querySelector(".project-copy").getBoundingClientRect();
    const button = record.button.getBoundingClientRect();
    const target = sheet.getBoundingClientRect();
    const rows = [...body.querySelectorAll("li")];
    const sequence = gsap.timeline({
      paused: true,
      defaults: { ease: "power3.out" },
      onReverseComplete: () => finishClose(),
    });
    sequence.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.36 }, 0);
    if (choice === "1") {
      sequence.fromTo(sheet, {
        x: origin.left + origin.width / 2 - target.left - target.width / 2,
        y: origin.top + origin.height / 2 - target.top - target.height / 2,
        scaleX: Math.max(0.35, Math.min(0.9, origin.width / target.width)),
        scaleY: Math.max(0.35, Math.min(0.9, origin.height / target.height)),
        transformOrigin: "50% 50%",
        opacity: 0.45,
      }, { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: 0.48 }, 0);
      sequence.fromTo(header, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.24 }, 0.16);
      sequence.fromTo(rows, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.24, stagger: 0.045 }, 0.20);
    } else if (choice === "2") {
      sequence.fromTo(sheet, { x: 64, clipPath: "inset(0 0 0 100%)" }, {
        x: 0, clipPath: "inset(0 0 0 0%)", duration: 0.46,
      }, 0);
      sequence.fromTo(header, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 0.24 }, 0.16);
      sequence.fromTo(rows, { opacity: 0, x: 26 }, { opacity: 1, x: 0, duration: 0.24, stagger: 0.045 }, 0.20);
    } else {
      const x = Math.max(1, Math.min(99, 100 * (button.left + button.width / 2 - target.left) / target.width));
      const y = Math.max(1, Math.min(99, 100 * (button.top + button.height / 2 - target.top) / target.height));
      sequence.fromTo(sheet, { clipPath: `circle(0% at ${x}% ${y}%)`, scale: 0.985 }, {
        clipPath: `circle(145% at ${x}% ${y}%)`, scale: 1, duration: 0.5,
      }, 0);
      sequence.fromTo(header, { opacity: 0, y: 9 }, { opacity: 1, y: 0, duration: 0.24 }, 0.14);
      sequence.fromTo(rows, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.24, stagger: 0.045 }, 0.20);
    }
    sequence.fromTo(footer, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.20 }, 0.32);
    return sequence;
  }

  function open(record) {
    if (disposed) return;
    if (dialog.open && source === record) {
      if (closing && timeline && !noMotion()) {
        closing = false;
        timeline.timeScale(1).play();
      }
      return;
    }
    source?.button.setAttribute("aria-expanded", "false");
    clearMotion();
    source = record;
    closing = false;
    const heading = record.panel.querySelector("h3").cloneNode(true);
    for (const lineBreak of heading.querySelectorAll("br")) lineBreak.replaceWith(" ");
    title.textContent = heading.textContent.replace(/\s+/g, " ").trim();
    context.textContent = record.panel.querySelector(".project-index span:last-child")?.textContent.trim() || "";
    body.replaceChildren(record.template.content.cloneNode(true));
    for (const item of body.querySelectorAll("li")) {
      const content = document.createElement("span");
      content.append(...item.childNodes);
      item.append(content);
    }
    footer.replaceChildren();
    for (const selector of [".technology-list", ".project-actions"]) {
      const clone = cleanClone(record.panel.querySelector(selector));
      if (clone) {
        for (const button of clone.querySelectorAll("[data-project-details]")) button.remove();
        footer.append(clone);
      }
    }
    scroll.scrollTop = 0;
    record.button.setAttribute("aria-expanded", "true");
    if (!dialog.open) dialog.showModal();
    if (!locked) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.classList.add("project-details-open");
      locked = true;
      onOpen?.();
    }
    closeButton.focus({ preventScroll: true });
    if (!noMotion()) {
      timeline = makeTimeline(record);
      timeline.play(0);
    }
  }

  function close() {
    if (!dialog.open || closing) return;
    closing = true;
    if (timeline && !noMotion() && timeline.time() > 0) timeline.timeScale(1.5).reverse();
    else finishClose();
  }
  const cancel = (event) => { event.preventDefault(); close(); };
  const backdrop = (event) => {
    if (event.target === shade || event.target === dialog) close();
  };
  const settleReduced = () => {
    if (!dialog.open || !noMotion()) return;
    if (closing) finishClose();
    else { timeline?.progress(1); clearMotion(); }
  };
  const listeners = records.map((record) => {
    const callback = () => open(record);
    record.button.setAttribute("aria-haspopup", "dialog");
    record.button.setAttribute("aria-controls", id);
    record.button.setAttribute("aria-expanded", "false");
    record.button.addEventListener("click", callback);
    return [record.button, callback];
  });
  dialog.addEventListener("cancel", cancel);
  dialog.addEventListener("click", backdrop);
  closeButton.addEventListener("click", close);
  reduced.addEventListener("change", settleReduced);
  const pauseObserver = new MutationObserver(settleReduced);
  pauseObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  if (choice) {
    comparison = document.createElement("nav");
    comparison.className = "project-details-comparison";
    comparison.setAttribute("aria-label", "Project detail motion previews");
    const label = document.createElement("span");
    label.textContent = "View more previews";
    comparison.append(label);
    for (const [key, name] of PREVIEWS) {
      const link = document.createElement("a");
      const url = new URL(location.href);
      url.searchParams.set("details-motion", key);
      url.hash = "projects";
      link.href = url.href;
      link.textContent = `${key}. ${name}`;
      if (choice === key) link.setAttribute("aria-current", "page");
      comparison.append(link);
    }
    document.body.append(comparison);
  }

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    finishClose(false);
    for (const [button, callback] of listeners) {
      button.removeEventListener("click", callback);
      button.removeAttribute("aria-controls");
      button.removeAttribute("aria-expanded");
    }
    pauseObserver.disconnect();
    reduced.removeEventListener("change", settleReduced);
    dialog.remove();
    comparison?.remove();
    window.removeEventListener("pagehide", dispose);
  };
  window.addEventListener("pagehide", dispose);
  return { dispose };
}

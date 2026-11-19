(() => {
  if (!window.ResizeObserver || !window.PointerEvent) return;

  const svgNamespace = "http://www.w3.org/2000/svg";
  const pointer = matchMedia("(any-hover: hover) and (any-pointer: fine)");
  const motion = matchMedia("(prefers-reduced-motion: no-preference) and (forced-colors: none)");
  const inset = 2;

  const outlineResize = new ResizeObserver(entries => {
    for (const { target, contentRect } of entries) {
      const line = target.querySelector(".project-outline__line");
      line.setAttribute("width", Math.max(0, contentRect.width - inset * 2));
      line.setAttribute("height", Math.max(0, contentRect.height - inset * 2));
      const radius = Number.parseFloat(getComputedStyle(target).borderTopLeftRadius);
      line.setAttribute("rx", Math.max(0, radius - inset));
    }
  });

  for (const imageLink of document.querySelectorAll(".project-photo")) {
    const outline = document.createElementNS(svgNamespace, "svg");
    outline.setAttribute("class", "project-outline");
    outline.setAttribute("aria-hidden", "true");
    outline.setAttribute("focusable", "false");
    const line = document.createElementNS(svgNamespace, "rect");
    line.setAttribute("class", "project-outline__line");
    line.setAttribute("x", inset);
    line.setAttribute("y", inset);
    line.setAttribute("pathLength", "100");
    outline.append(line);
    imageLink.append(outline);
    outlineResize.observe(imageLink);

    let hovered = false;
    let focused = false;
    let release = 0;

    function update() {
      const visible = motion.matches && (hovered || focused);
      outline.toggleAttribute("data-visible", visible);
      clearTimeout(release);
      if (visible) outline.setAttribute("data-tracing", "");
      else {
        // Leave the current stroke in place while it fades. Rapid re-entry
        // can continue the same motion without a flash or a backwards sweep.
        release = setTimeout(() => outline.removeAttribute("data-tracing"), 180);
      }
    }

    imageLink.addEventListener("pointerenter", event => {
      if (!pointer.matches || event.pointerType === "touch") return;
      hovered = true;
      update();
    });
    function leave() {
      if (!hovered) return;
      hovered = false;
      update();
    }
    imageLink.addEventListener("pointerleave", leave);
    imageLink.addEventListener("pointercancel", leave);
    imageLink.addEventListener("focus", () => {
      focused = imageLink.matches(":focus-visible");
      update();
    });
    imageLink.addEventListener("blur", () => {
      focused = false;
      update();
    });
    motion.addEventListener("change", update);
  }
})();

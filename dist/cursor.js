(() => {
  if (!window.PointerEvent || !CSS.supports("mix-blend-mode", "difference")) return;

  const root = document.documentElement;
  const eligible = matchMedia("(any-pointer: fine) and (any-hover: hover) and (forced-colors: none)");
  const cursor = document.createElement("div");
  cursor.className = "site-cursor";
  cursor.setAttribute("aria-hidden", "true");
  document.body.append(cursor);

  let x = 0;
  let y = 0;
  let frame = 0;

  function hide() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    root.classList.remove("has-circular-cursor");
  }

  function draw() {
    frame = 0;
    cursor.style.transform = "translate3d(" + x + "px, " + y + "px, 0) translate(-50%, -50%)";
    root.classList.add("has-circular-cursor");
  }

  window.addEventListener("pointermove", event => {
    if (!eligible.matches || event.pointerType !== "mouse"
        || event.target.closest("input, textarea, select, [contenteditable], iframe")) {
      hide();
      return;
    }
    x = event.clientX;
    y = event.clientY;
    if (!frame) frame = requestAnimationFrame(draw);
  }, { passive: true });

  document.addEventListener("pointerout", event => {
    if (!event.relatedTarget || event.relatedTarget.closest?.("iframe")) hide();
  }, { passive: true });
  document.addEventListener("pointercancel", hide, { passive: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) hide(); });
  window.addEventListener("blur", hide);
  eligible.addEventListener("change", hide);
})();

// Development-only controls; based on GSAP's GSDevTools documentation.
export async function installMotionLab(getEntrance) {
  await document.fonts.ready;
  const script = document.createElement("script");
  script.src = "/__motion_lab__/GSDevTools.min.js";
  document.head.append(script);
  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
  });
  gsap.registerPlugin(GSDevTools);
  const panel = document.createElement("aside");
  panel.setAttribute("aria-label", "Local motion review");
  panel.style.cssText =
    "position:fixed;top:100px;right:20px;z-index:100;padding:14px;background:#172119;border:1px solid #d0ff71;border-radius:8px;font:12px Arial;display:flex;gap:10px;align-items:center";
  panel.innerHTML =
    '<span>LOCAL MOTION LAB</span><button type="button">Replay at 10%</button><button type="button">Replay at full speed</button>';
  document.body.append(panel);
  let tools;
  const attach = (speed) => {
    tools?.kill();
    const entrance = getEntrance();
    if (!entrance) return;
    entrance.timeScale(speed).restart();
    tools = GSDevTools.create({
      id: "entrance-review",
      animation: entrance,
      globalSync: false,
      minimal: true,
      persist: false,
      loop: false,
      timeScale: speed,
      paused: false,
    });
  };
  panel
    .querySelectorAll("button")
    .forEach((button, index) =>
      button.addEventListener("click", () => attach(index ? 1 : 0.1)),
    );
  attach(1);
}

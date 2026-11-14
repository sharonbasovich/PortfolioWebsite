(() => {
  const header = document.querySelector(".site-header");
  const hero = document.querySelector(".hero");
  const links = [...header.querySelectorAll('nav a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.getAttribute("href")));
  let scrollFrame = 0;
  let activeIndex = -1;

  function updateNavigation() {
    scrollFrame = 0;
    const headerHeight = header.offsetHeight;
    const showHeader = hero.getBoundingClientRect().bottom <= headerHeight + 1;
    header.classList.toggle("is-visible", showHeader);
    header.inert = !showHeader;

    const y = headerHeight + 37;
    let index = sections.length - 1;
    while (index >= 0 && sections[index].getBoundingClientRect().top > y) index--;
    if (index === activeIndex) return;

    links[activeIndex]?.removeAttribute("aria-current");
    links[index]?.setAttribute("aria-current", "location");
    activeIndex = index;
  }

  function scheduleNavigation() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateNavigation);
  }

  window.addEventListener("scroll", scheduleNavigation, { passive: true });
  window.addEventListener("resize", scheduleNavigation, { passive: true });
  updateNavigation();

  if (!Element.prototype.animate || !window.IntersectionObserver) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const running = new Set();
  const easeOut = "cubic-bezier(.2,.65,.3,1)";

  function animate(element, keyframes, options) {
    if (reducedMotion.matches || document.hidden) return;
    const animation = element.animate(keyframes, { easing: easeOut, ...options });
    running.add(animation);
    function release() { running.delete(animation); }
    animation.finished.then(release, release);
    return animation;
  }

  // Let an intentional jump or an early keyboard action settle the entrance immediately.
  function cancelEntrance() {
    running.forEach(animation => animation.cancel());
  }

  reducedMotion.addEventListener("change", cancelEntrance);
  window.addEventListener("hashchange", cancelEntrance);
  document.addEventListener("focusin", cancelEntrance);

  const wave = document.querySelector(".hero-wave");
  const hand = wave.querySelector(".wave-hand");
  let waveAnimation;
  let waveTimer;

  function waveHello() {
    if (waveAnimation?.playState === "running") return;
    waveAnimation = animate(hand, [
      { rotate: "0deg", offset: 0 },
      { rotate: "-7deg", offset: .16 },
      { rotate: "14deg", offset: .35 },
      { rotate: "-8deg", offset: .54 },
      { rotate: "7deg", offset: .71 },
      { rotate: "0deg", offset: 1 }
    ], { duration: 540, easing: "ease-in-out" });
  }

  wave.addEventListener("pointerenter", event => {
    if (event.pointerType === "touch") return;
    clearTimeout(waveTimer);
    waveHello();
  });

  if (!location.hash && scrollY < 8) {
    animate(document.querySelector(".hero h1"), [
      { opacity: .86, translate: "0 13px" },
      { opacity: 1, translate: "0 0" }
    ], { duration: 490 });
    animate(document.querySelector(".hero-intro"), [
      { opacity: .84, transform: "translateY(10px)" },
      { opacity: 1, transform: "translateY(0)" }
    ], { duration: 420, delay: 65 });
    waveTimer = setTimeout(() => {
      const bounds = wave.getBoundingClientRect();
      if (bounds.bottom > 0 && bounds.top < innerHeight) waveHello();
    }, 620);
  }

  const revealAt = .23;
  const entryObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.intersectionRatio < revealAt) continue;
      const element = entry.target;
      entryObserver.unobserve(element);
      if (element.contains(document.activeElement)) continue;

      if (element.matches(".project")) {
        animate(element.querySelector(".project-photo"), [
          { clipPath: "inset(0 0 16% 0 round 9px)", translate: "0 12px" },
          { clipPath: "inset(0 0 0 0 round 9px)", translate: "0 0" }
        ], { duration: 520 });
        reveal(element.querySelector(".project-info"), 50);
      } else {
        reveal(element.querySelector(".job-heading"));
        reveal(element.querySelector(".job-story"), 45);
        reveal(element.querySelector(".job-result"), 70);
      }
    }
  }, { threshold: revealAt });

  function reveal(element, delay = 0) {
    animate(element, [
      { opacity: .58, translate: "0 16px" },
      { opacity: 1, translate: "0 0" }
    ], { duration: 465, delay, fill: "backwards" });
  }

  document.querySelectorAll(".job, .project").forEach(element => entryObserver.observe(element));
})();

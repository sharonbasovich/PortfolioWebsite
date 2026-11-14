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

  // Let an intentional jump settle the entrance immediately.
  function cancelEntrance() {
    running.forEach(animation => animation.cancel());
  }

  reducedMotion.addEventListener("change", cancelEntrance);
  window.addEventListener("hashchange", cancelEntrance);
  document.addEventListener("focusin", event => {
    if (event.target.matches(":focus-visible")) cancelEntrance();
  });

  const wave = document.querySelector(".hero-wave");
  const hand = wave.querySelector(".wave-hand");
  let waveAnimation;
  let waveTimer;

  function waveHello() {
    if (waveAnimation?.playState === "running") return;
    // Ease into and out of each wrist turn.
    waveAnimation = animate(hand, [
      { rotate: "0deg", offset: 0, easing: "ease-in-out" },
      { rotate: "12deg", offset: .25, easing: "ease-in-out" },
      { rotate: "-8deg", offset: .52, easing: "ease-in-out" },
      { rotate: "4deg", offset: .77, easing: "ease-in-out" },
      { rotate: "0deg", offset: 1 }
    ], { duration: 960, easing: "linear" });
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

  // Start each piece just below the viewport. Keep content still if it was
  // already visible on load or arrived well into view in a fast scroll.
  let firstRevealBatch = true;
  const entryObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      entryObserver.unobserve(element);
      const { top } = entry.boundingClientRect;
      if (top < innerHeight - (firstRevealBatch ? 0 : 48)) continue;
      if (element.contains(document.activeElement)) continue;

      if (element.matches(".project-photo")) {
        animate(element.querySelector("img"), [
          { opacity: .76, scale: 1.025 },
          { opacity: 1, scale: 1 }
        ], { duration: 440 });
      } else {
        animate(element, [
          { opacity: .78, translate: "0 8px" },
          { opacity: 1, translate: "0 0" }
        ], { duration: 390 });
      }
    }
    firstRevealBatch = false;
  }, { rootMargin: "0px 0px 36px" });

  document.querySelectorAll(".job-heading, .job-story, .job-result, .project-photo, .project-info")
    .forEach(element => entryObserver.observe(element));
})();

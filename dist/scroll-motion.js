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

  // Prepare offscreen content before it can be painted in its resting state.
  // Content already in view, including a linked section, starts fully shown.
  const revealCopy = ".job-heading, .job-story, .job-result, .project-info, .about-bio p, .recognition, .email-link, .footer-links";
  const revealTargets = document.querySelectorAll(".reveal-title, .project-photo, " + revealCopy);
  const entryObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const element = entry.target;
      if (!element.classList.contains("is-awaiting-reveal")) continue;
      if (!entry.isIntersecting && entry.boundingClientRect.bottom > 0) continue;
      finishReveal(element, entry.isIntersecting && !element.contains(document.activeElement));
    }
  }, { rootMargin: "0px 0px -36px" });

  function finishReveal(element, play = false) {
    entryObserver.unobserve(element);
    element.classList.toggle("is-revealing", play);
    element.classList.remove("is-awaiting-reveal");
  }

  const initialAnchor = document.getElementById(location.hash.slice(1));
  const firstScreenBottom = innerHeight + Math.max(0, (initialAnchor?.getBoundingClientRect().top ?? 0) - header.offsetHeight);

  if (!reducedMotion.matches) {
    for (const element of revealTargets) {
      if (element.getBoundingClientRect().top < firstScreenBottom) continue;
      if (element.matches(revealCopy)) element.classList.add("reveal-copy");
      element.classList.add("is-awaiting-reveal");
      entryObserver.observe(element);
    }
  }

  document.addEventListener("focusin", event => {
    const element = event.target.closest(".is-awaiting-reveal, .is-revealing");
    if (element) finishReveal(element);
  });

  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) revealTargets.forEach(element => finishReveal(element));
  });
})();

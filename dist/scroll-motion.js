(() => {
  const header = document.querySelector(".site-header");
  const links = [...header.querySelectorAll('nav a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.getAttribute("href")));
  let scrollFrame = 0;
  let activeIndex = -1;

  function updateNavigation() {
    scrollFrame = 0;
    const y = header.offsetHeight + 37;
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
  }

  // Let an intentional jump or an early keyboard action settle the entrance immediately.
  function cancelEntrance() {
    running.forEach(animation => animation.cancel());
  }

  reducedMotion.addEventListener("change", cancelEntrance);
  window.addEventListener("hashchange", cancelEntrance);
  document.addEventListener("focusin", cancelEntrance);

  if (!location.hash && scrollY < 8) {
    animate(document.querySelector(".hero h1"), [
      { opacity: .86, translate: "0 13px" },
      { opacity: 1, translate: "0 0" }
    ], { duration: 490 });
    animate(document.querySelector(".hero-intro"), [
      { opacity: .84, transform: "translateY(10px)" },
      { opacity: 1, transform: "translateY(0)" }
    ], { duration: 420, delay: 65 });
  }

  const imageObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.intersectionRatio < .32) continue;
      imageObserver.unobserve(entry.target);
      animate(entry.target, [
        { clipPath: "inset(0 0 16% 0 round 9px)", translate: "0 12px" },
        { clipPath: "inset(0 0 0 0 round 9px)", translate: "0 0" }
      ], { duration: 520 });
    }
  }, { threshold: .32 });

  document.querySelectorAll(".project-photo, .marble-media").forEach(media => imageObserver.observe(media));
})();

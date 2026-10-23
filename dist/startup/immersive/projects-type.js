const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Scroll-built typography preview. Mount inside the site's existing GSAP
 * context; it uses the native page's scroll distance without pinning anything.
 */
export function mountProjectMotion({
  heading,
  stage,
  firstProject,
  gsap,
  ScrollTrigger,
  SplitText,
  enabled = false,
}) {
  if (!enabled || !heading || !stage || !gsap || !ScrollTrigger || !SplitText)
    return { dispose() {} };

  const hadStageClass = stage.classList.contains("projects-type");
  const hadHeadingClass = heading.classList.contains("projects-type__heading");
  const previousVariant = stage.getAttribute("data-project-motion");
  stage.classList.add("projects-type");
  heading.classList.add("projects-type__heading");
  stage.setAttribute("data-project-motion", "type");

  const artwork = firstProject?.matches?.(".project-window")
    ? firstProject
    : firstProject?.querySelector(".project-window");
  let split;
  let disposed = false;

  gsap.registerPlugin(ScrollTrigger, SplitText);
  const context = gsap.context(() => {
    split = SplitText.create(heading, {
      type: "chars,words",
      charsClass: "projects-type__char",
      wordsClass: "projects-type__word",
      aria: "auto",
      // The owner rebuilds on real width changes, not toolbar-height changes.
      autoSplit: false,
    });
    const chars = split.chars;
    if (!chars.length) return;

    // Measure once before applying any transforms. Scrubbing performs no layout
    // reads, and refreshed timelines reuse these stable local offsets.
    const bounds = heading.getBoundingClientRect();
    const center = bounds.left + bounds.width / 2;
    const pulls = chars.map((character) => {
      const rect = character.getBoundingClientRect();
      return clamp((center - rect.left - rect.width / 2) * 0.38, -140, 140);
    });
    const middle = (chars.length - 1) / 2;
    const timeline = gsap.timeline({
      id: "projects-type-build",
      scrollTrigger: {
        id: "projects-type-build",
        trigger: stage,
        start: "top 85%",
        end: "bottom 25%",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    timeline.fromTo(
      chars,
      {
        x: (index) => pulls[index],
        y: (index) =>
          26 + Math.sin((index / Math.max(1, chars.length - 1)) * Math.PI) * 30,
        rotation: (index) => clamp((index - middle) * 2.2, -11, 11),
        scaleX: 0.84,
        opacity: 0.28,
        transformOrigin: "50% 100%",
      },
      {
        x: 0,
        y: 0,
        rotation: 0,
        scaleX: 1,
        opacity: 1,
        duration: 0.62,
        stagger: { amount: 0.2, from: "center" },
        ease: "power3.out",
      },
      0,
    );
    if (artwork)
      timeline.fromTo(
        artwork,
        { y: 64, scale: 0.94, transformOrigin: "50% 35%" },
        { y: 0, scale: 1, duration: 0.7, ease: "power2.out" },
        0.28,
      );
    // A short settled tail belongs to the same scroll clock, not another tween.
    timeline.to({}, { duration: 0.02 }, 0.98);
  }, stage);

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      context.revert();
      if (split?.isSplit) split.revert();
      if (!hadStageClass) stage.classList.remove("projects-type");
      if (!hadHeadingClass) heading.classList.remove("projects-type__heading");
      if (stage.getAttribute("data-project-motion") === "type") {
        if (previousVariant === null) stage.removeAttribute("data-project-motion");
        else stage.setAttribute("data-project-motion", previousVariant);
      }
    },
  };
}

/** A reversible, single-clock depth treatment for the comparison preview. */
export function mountProjectMotion({ heading, stage, firstProject, gsap, ScrollTrigger, enabled = false }) {
  if (!enabled || !heading || !stage || !gsap || !ScrollTrigger)
    return { dispose() {} };
  const artwork = firstProject?.querySelector('.project-window');
  stage.classList.add('projects-depth');
  heading.classList.add('projects-depth__heading');
  let disposed = false;
  const context = gsap.context(() => {
    const timeline = gsap.timeline({
      scrollTrigger: {
        id: 'projects-depth-zoom', trigger: stage,
        start: 'top 85%', end: 'bottom 15%', scrub: true,
        invalidateOnRefresh: true,
      },
    });
    timeline.fromTo(heading,
      { z: -440, rotationX: 24, y: 55, opacity: 0.18, transformOrigin: '50% 50%' },
      { z: 0, rotationX: 0, y: 0, opacity: 1, duration: 0.58, ease: 'power2.out' }, 0);
    timeline.to(heading,
      { z: 170, y: -90, opacity: 0, duration: 0.42, ease: 'power2.in' }, 0.58);
    if (artwork) timeline.fromTo(artwork,
      { y: -110, scale: 0.82, rotationX: 8, transformOrigin: '50% 20%' },
      { y: 0, scale: 1, rotationX: 0, duration: 0.62, ease: 'power2.out' }, 0.38);
  }, stage);
  return { dispose() {
    if (disposed) return;
    disposed = true;
    context.revert();
    stage.classList.remove('projects-depth');
    heading.classList.remove('projects-depth__heading');
  } };
}

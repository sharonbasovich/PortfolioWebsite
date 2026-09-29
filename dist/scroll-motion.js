(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const media = gsap.matchMedia();
  media.add('(min-height: 600px) and (prefers-reduced-motion: no-preference)', () => {
    const scene = document.querySelector('.motion-story');
    const words = gsap.utils.toArray('.motion-word');
    const panels = gsap.utils.toArray('.motion-panel');
    const counter = document.querySelector('.motion-count');
    const mobile = matchMedia('(max-width: 700px)').matches;
    if (!scene || words.length !== 3 || panels.length !== 3) return;

    scene.classList.add('has-motion');
    gsap.set(words, {autoAlpha: 0, xPercent: 25, scale: 0.76, filter: 'blur(16px)'});
    gsap.set(panels, {autoAlpha: 0, yPercent: 42, rotation: 8, scale: 0.8});
    gsap.set([words[0], panels[0]], {autoAlpha: 1, xPercent: 0, yPercent: 0, rotation: 0, scale: 1, filter: 'blur(0px)'});

    const sequence = gsap.timeline({
      defaults: {ease: 'none'},
      scrollTrigger: {
        trigger: scene,
        start: 'top top',
        end: () => '+=' + Math.round(innerHeight * (mobile ? 2.1 : 2.4)),
        pin: true,
        scrub: 0.55,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: self => {
          const position = self.progress * 3.4;
          const index = position < 0.87 ? 1 : position < 1.95 ? 2 : 3;
          counter.textContent = String(index).padStart(2, '0') + ' / 03';
        }
      }
    });
    sequence.to('.motion-progress span', {scaleX: 1, duration: 3.4}, 0);
    sequence.to(words[0], {xPercent: -24, scale: 1.15, autoAlpha: 0, filter: 'blur(12px)', duration: 0.34}, 0.67)
      .to(panels[0], {yPercent: -40, rotation: -7, scale: 1.08, autoAlpha: 0, duration: 0.34}, 0.67)
      .to(words[1], {xPercent: 0, scale: 1, autoAlpha: 1, filter: 'blur(0px)', duration: 0.38}, 0.87)
      .to(panels[1], {yPercent: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 0.38}, 0.87)
      .to(words[1], {xPercent: -24, scale: 1.15, autoAlpha: 0, filter: 'blur(12px)', duration: 0.34}, 1.75)
      .to(panels[1], {yPercent: -40, rotation: -7, scale: 1.08, autoAlpha: 0, duration: 0.34}, 1.75)
      .to(words[2], {xPercent: 0, scale: 1, autoAlpha: 1, filter: 'blur(0px)', duration: 0.38}, 1.95)
      .to(panels[2], {yPercent: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 0.38}, 1.95)
      .to({}, {duration: 0.75}, 2.35);

    // Codrops' on-scroll typography demos informed the mask/transform treatment.
    // The choreography and site content here are original.
    gsap.from('.hero h1', {y: 70, clipPath: 'inset(100% 0 0 0)', duration: 1.15, ease: 'power3.out'});
    gsap.to('.hero h1', {
      yPercent: mobile ? 8 : 16, scale: mobile ? 0.96 : 0.89, transformOrigin: 'left top', ease: 'none',
      scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.65}
    });
    document.querySelectorAll('.section-heading h2, .contact h2').forEach(el => {
      gsap.from(el, {
        yPercent: 90, clipPath: 'inset(100% 0 0 0)', duration: 0.95, ease: 'power3.out',
        scrollTrigger: {trigger: el, start: 'top 92%', once: true}
      });
    });
    document.querySelectorAll('.job').forEach(el => {
      gsap.from(el, {
        x: mobile ? 32 : 88, opacity: 0.18, duration: 0.95, ease: 'power3.out',
        scrollTrigger: {trigger: el, start: 'top 90%', once: true}
      });
    });
    document.querySelectorAll('.project').forEach((el, index) => {
      gsap.from(el, {
        y: mobile ? 70 : 105, rotation: mobile ? 0 : (index - 1) * 3,
        scale: 0.86, opacity: 0.25, duration: 0.9, ease: 'power3.out',
        scrollTrigger: {trigger: el, start: 'top 94%', once: true}
      });
    });
    const focusReveal = event => {
      const block = event.target.closest('.job, .project, .contact');
      if (block) gsap.to(block, {opacity: 1, duration: 0.1, overwrite: 'auto'});
    };
    document.addEventListener('focusin', focusReveal);
    return () => {
      scene.classList.remove('has-motion');
      document.removeEventListener('focusin', focusReveal);
    };
  });
})();

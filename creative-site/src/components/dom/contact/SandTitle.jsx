import { useEffect, useRef, useState } from 'react';
import styles from './sandTitle.module.scss';

// Particle flow and pointer repulsion adapted from the MIT-licensed Ambocus
// particle field. See public/sharon/PARTICLE-NOTICE.txt.
function seededRandom(seed) {
  let state = seed;
  return () => {
    /* eslint-disable no-bitwise -- xorshift32 uses unsigned 32-bit shifts. */
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
    /* eslint-enable no-bitwise */
  };
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function makeGrain(random, tx, ty, grainWidth, radius) {
  const angle = random() * Math.PI * 2;
  const spread = (0.2 + random()) * radius;
  const tone = random();
  return {
    tx,
    ty,
    x: tx,
    y: ty,
    vx: 0,
    vy: 0,
    dx: Math.cos(angle) * spread * 1.7,
    dy: Math.sin(angle) * spread,
    size: grainWidth * (0.65 + random() * 0.85),
    tone: Number(tone > 0.76) + Number(tone > 0.91),
  };
}

function makeField(width, height) {
  const random = seededRandom(203471);
  const attempts = clamp(Math.round(width * height / 12), 6700, 32000);
  const grains = [];
  for (let i = 0; i < attempts; i += 1) {
    const x = random();
    const y = random();
    // Keep the badge silhouette clear and use broad curved banks to frame it.
    const contour = 0.5 + 0.5 * Math.sin(y * 12 - x * 7 + Math.sin(x * 5) * 2.2);
    const rim = Math.min(1, Math.hypot((x - 0.5) * 2.7, (y - 0.55) * 2.2));
    if (random() < 0.15 + (0.26 + rim * 0.57) * contour ** 2) {
      grains.push(makeGrain(random, x * width, y * height, 0.94, 42));
    }
  }
  return grains;
}

export default function SandTitle({ name = false, field = false }) {
  const rootRef = useRef(null);
  const headingRef = useRef(null);
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const Heading = name ? 'h1' : 'h2';
  const title = name ? 'Sharon Basovich' : 'Let’s talk.';

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const raster = document.createElement('canvas');
    const mask = raster.getContext('2d', { willReadFrequently: true });
    if (!context || !mask) return undefined;

    const scroller = root.closest('main');
    const interactionRoot = field ? root.parentElement : root;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = { x: 0, y: 0, active: false };
    let visible = false;
    let disposed = false;
    let frame = 0;
    let width = 0;
    let height = 0;
    let grains = [];
    let palette = [];
    let lastTime = 0;
    let awakeUntil = 0;
    let progress = 1;
    let pulse = 0;
    let firstFrame = true;
    let scrollImpulse = 0;
    let previousScroll = scroller?.scrollTop ?? window.scrollY;

    function measureProgress() {
      if (name || field) return;
      const viewHeight = scroller?.clientHeight || window.innerHeight;
      const { top } = root.getBoundingClientRect();
      progress = clamp((viewHeight - top) / Math.min(height * 0.8, viewHeight * 0.24), 0, 1);
    }

    function draw(now) {
      frame = 0;
      if (!visible || motion.matches || disposed || document.hidden || !grains.length) return;
      const dt = clamp((now - (lastTime || now - 16.67)) / 1000, 0.005, 0.04);
      lastTime = now;
      const step = dt * 60;
      const damping = Math.exp(-11 * dt);
      const loose = (1 - progress) ** 2 + scrollImpulse;
      scrollImpulse *= Math.exp(-6.4 * dt);
      const reach = name ? Math.min(54, height * 0.54) : Math.min(97, height * 0.45);
      const reachSquared = reach * reach;
      const pulseRadius = (1 - pulse) * reach * 2.1;
      let tone = -1;
      context.clearRect(0, 0, width, height);
      for (let i = 0; i < grains.length; i += 1) {
        const grain = grains[i];
        let tx = grain.tx + grain.dx * loose;
        let ty = grain.ty + grain.dy * loose;
        if (pointer.active || pulse > 0) {
          const dx = grain.tx - pointer.x;
          const dy = grain.ty - pointer.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < reachSquared * 6) {
            const distance = Math.sqrt(distanceSquared) || 0.1;
            const scatter = pointer.active ? Math.max(0, 1 - distance / reach) ** 2 * reach * 0.78 : 0;
            const wave = pulse * Math.max(0, 1 - Math.abs(distance - pulseRadius) / (reach * 0.46)) * reach * 0.76;
            tx += (dx / distance) * (scatter + wave);
            ty += (dy / distance) * (scatter + wave);
          }
        }
        grain.vx = (grain.vx + (tx - grain.x) * 0.081 * step) * damping;
        grain.vy = (grain.vy + (ty - grain.y) * 0.081 * step) * damping;
        grain.x += grain.vx * step;
        grain.y += grain.vy * step;
        if (tone !== grain.tone) {
          tone = grain.tone;
          context.fillStyle = palette[tone];
        }
        context.fillRect(grain.x, grain.y, grain.size, grain.size);
      }
      pulse = Math.max(0, pulse - dt * 1.45);
      if (firstFrame) {
        setReady(true);
        firstFrame = false;
      }
      if (now < awakeUntil) frame = requestAnimationFrame(draw);
    }

    function wake() {
      if (disposed || motion.matches || !visible || document.hidden) return;
      awakeUntil = performance.now() + 1800;
      if (!frame) {
        lastTime = 0;
        frame = requestAnimationFrame(draw);
      }
    }

    function updateColors() {
      if (disposed) return;
      const style = getComputedStyle(root);
      palette = ['--sand-ink', '--sand-shadow', '--sand-glint'].map((property) => style.getPropertyValue(property).trim());
      wake();
    }

    function rebuild() {
      if (disposed || motion.matches) return;
      width = root.clientWidth;
      height = root.clientHeight;
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (field) {
        grains = makeField(width, height).sort((a, b) => a.tone - b.tone);
        updateColors();
        return;
      }
      raster.width = width;
      raster.height = height;
      const style = getComputedStyle(headingRef.current);
      mask.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      mask.letterSpacing = style.letterSpacing;
      const metrics = mask.measureText(title);
      const x = name ? 3 : (width - metrics.width) * 0.5;
      const baseline = (height + metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) * 0.5;
      mask.fillStyle = 'white';
      mask.fillText(title, x, baseline);
      const pixels = mask.getImageData(0, 0, width, height).data;
      const random = seededRandom(name ? 78933 : 7426);
      // Uncorrelated samples avoid horizontal scan lines and a dot-matrix texture.
      const left = Math.max(0, Math.floor(x - metrics.actualBoundingBoxLeft - 2));
      const right = Math.min(width, Math.ceil(x + metrics.actualBoundingBoxRight + 2));
      const top = Math.max(0, Math.floor(baseline - metrics.actualBoundingBoxAscent - 1));
      const bottom = Math.min(height, Math.ceil(baseline + metrics.actualBoundingBoxDescent + 1));
      const area = (right - left) * (bottom - top);
      const grainWidth = clamp(parseFloat(style.fontSize) / 85, 0.55, 1.45);
      const attempts = Math.min(58000, Math.ceil(area / (grainWidth * grainWidth * 1.8)));
      const radius = Math.min(parseFloat(style.fontSize) * 0.65, 78);
      grains = [];
      for (let i = 0; i < attempts; i += 1) {
        const tx = left + random() * (right - left);
        const ty = top + random() * (bottom - top);
        if (pixels[(Math.floor(ty) * width + Math.floor(tx)) * 4 + 3] >= 155) {
          grains.push(makeGrain(random, tx, ty, grainWidth, radius));
        }
      }
      // Sort once so the paint loop only switches colours twice per frame.
      grains.sort((a, b) => a.tone - b.tone);
      measureProgress();
      updateColors();
    }

    function scroll() {
      const nextScroll = scroller?.scrollTop ?? window.scrollY;
      if (visible) {
        if (field) scrollImpulse = clamp(scrollImpulse + Math.abs(nextScroll - previousScroll) * 0.005, 0, 0.52);
        measureProgress();
        wake();
      }
      previousScroll = nextScroll;
    }
    function move(event) {
      const rect = root.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
      wake();
    }
    function press(event) {
      move(event);
      pulse = 1;
    }
    function leave() {
      pointer.active = false;
      wake();
    }
    function resetMotion() {
      cancelAnimationFrame(frame);
      frame = 0;
      firstFrame = true;
      setReady(false);
      if (!motion.matches) rebuild();
    }
    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          measureProgress();
          wake();
        } else {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { root: scroller },
    );
    const size = new ResizeObserver(rebuild);
    const theme = new MutationObserver(updateColors);
    intersection.observe(root);
    size.observe(root);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    document.fonts.ready.then(() => {
      if (!disposed) rebuild();
    });
    motion.addEventListener('change', resetMotion);
    document.addEventListener('visibilitychange', wake);
    const scrollEventTarget = scroller ?? window;
    scrollEventTarget.addEventListener('scroll', scroll, { passive: true });
    interactionRoot.addEventListener('pointermove', move, { passive: true });
    interactionRoot.addEventListener('pointerdown', press, { passive: true });
    interactionRoot.addEventListener('pointerleave', leave);
    interactionRoot.addEventListener('pointercancel', leave);
    interactionRoot.addEventListener('pointerup', leave);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      intersection.disconnect();
      size.disconnect();
      theme.disconnect();
      motion.removeEventListener('change', resetMotion);
      document.removeEventListener('visibilitychange', wake);
      scrollEventTarget.removeEventListener('scroll', scroll);
      interactionRoot.removeEventListener('pointermove', move);
      interactionRoot.removeEventListener('pointerdown', press);
      interactionRoot.removeEventListener('pointerleave', leave);
      interactionRoot.removeEventListener('pointercancel', leave);
      interactionRoot.removeEventListener('pointerup', leave);
    };
  }, [field, name, title]);

  if (field) {
    return (
      <div ref={rootRef} className={styles.field} data-particles-ready={ready || undefined} aria-hidden="true">
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
    );
  }

  return (
    <div ref={rootRef} className={name ? styles.name : styles.contact} data-particles-ready={ready || undefined}>
      <Heading className={styles.heading} ref={headingRef}>
        {title}
      </Heading>
      <canvas ref={canvasRef} aria-hidden="true" className={styles.canvas} />
    </div>
  );
}

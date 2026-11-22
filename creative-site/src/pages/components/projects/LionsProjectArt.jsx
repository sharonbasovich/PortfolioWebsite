import { useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './LionsProjectArt.module.scss';

function getScrollProgress(track, scroller) {
  const height = scroller?.clientHeight || window.innerHeight;
  const top = track.getBoundingClientRect().top - (scroller?.getBoundingClientRect().top || 0);
  const distance = Math.min(track.offsetHeight, height * 1.2) * 0.6 + height * 0.65;
  return Math.min(1, Math.max(0, (height * 0.85 - top) / Math.max(1, distance)));
}

export default function LionsProjectArt({ priority = false, decorative = false }) {
  const stage = useRef(null);
  const canvas = useRef(null);

  useEffect(() => {
    const box = stage.current;
    const surface = canvas.current;
    const scroller = box.closest('main');
    const track = box.closest('article, [data-project-art-track]') || box;
    const eventTarget = scroller || window;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let scene;
    let frame = 0;
    let inRange = false;
    let loading = false;
    let failed = false;
    let cancelled = false;

    function draw() {
      frame = 0;
      if (!inRange || !scene || motion.matches || failed || document.hidden) return;
      const { clientWidth, clientHeight } = box;
      if (clientWidth === 0 || clientHeight === 0) return;
      const reveal = scene.draw(getScrollProgress(track, scroller), clientWidth, clientHeight);
      box.dataset.lionsReveal = reveal.toFixed(3);
      box.dataset.lionsReady = 'true';
    }

    function requestDraw() {
      if (!frame && inRange && scene && !failed && !motion.matches) {
        frame = requestAnimationFrame(draw);
      }
    }

    async function prepare() {
      if (scene || loading || failed || motion.matches) return;
      loading = true;
      try {
        const { createLionsRobotScene } = await import('./LionsRobotScene');
        if (cancelled || motion.matches) return;
        const prepared = await createLionsRobotScene(surface);
        if (cancelled || motion.matches) {
          prepared.dispose();
          return;
        }
        scene = prepared;
        requestDraw();
      } catch {
        // Keep the photographic fallback on hardware without WebGL.
        failed = true;
      } finally {
        loading = false;
      }
    }

    function onPreferenceChange() {
      if (motion.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
        delete box.dataset.lionsReady;
        delete box.dataset.lionsReveal;
      } else if (inRange) {
        prepare();
        requestDraw();
      }
    }

    function onContextLost() {
      failed = true;
      delete box.dataset.lionsReady;
      delete box.dataset.lionsReveal;
    }

    const observer = new IntersectionObserver(([entry]) => {
      inRange = entry.isIntersecting;
      if (inRange) {
        prepare();
        requestDraw();
      }
    }, { root: scroller, rootMargin: '480px 0px' });
    const resize = new ResizeObserver(requestDraw);
    observer.observe(box);
    resize.observe(box);
    eventTarget.addEventListener('scroll', requestDraw, { passive: true });
    document.addEventListener('visibilitychange', requestDraw);
    motion.addEventListener('change', onPreferenceChange);
    surface.addEventListener('webglcontextlost', onContextLost);

    return () => {
      cancelled = true;
      observer.disconnect();
      resize.disconnect();
      cancelAnimationFrame(frame);
      eventTarget.removeEventListener('scroll', requestDraw);
      document.removeEventListener('visibilitychange', requestDraw);
      motion.removeEventListener('change', onPreferenceChange);
      surface.removeEventListener('webglcontextlost', onContextLost);
      scene?.dispose();
    };
  }, []);

  return (
    <div
      ref={stage}
      className={styles.stage}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'Lions Robotics’ competition robot.'}
      aria-hidden={decorative || undefined}
      data-lions-art
    >
      {/* The Lions site’s reference photo stays visible until the model renders. */}
      <Image className={styles.poster} src="/sharon/projects/lions-robot-poster.webp" alt="" fill priority={priority} unoptimized sizes="(max-width: 800px) 85vw, 55vw" />
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
    </div>
  );
}

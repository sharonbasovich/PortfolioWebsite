import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import Editorial from '@src/components/calibre/Editorial';
import { useProjectWindowOpen } from '@src/components/dom/projectWindow/ProjectWindow';
import styles from './calibre.module.scss';

const chapters = [
  { id: 'intro', title: 'Introduction', part: 'Dial and crown', still: 'calibre-dial' },
  { id: 'rbc', title: 'RBC', part: 'Wheel train', still: 'calibre-train' },
  { id: 'magna', title: 'Magna', part: 'Bridge assembly', still: 'calibre-separated' },
  { id: 'projects', title: 'Systems', part: 'Barrel and pinions', still: 'calibre-train' },
  { id: 'fieldwork', title: 'Fieldwork', part: 'Balance and escapement', still: 'calibre-balance' },
  { id: 'contact', title: 'Contact', part: 'Assembled movement', still: 'calibre-dial' },
];

const details = [
  { id: 'barrel', name: 'Barrel', description: 'The mainspring stores energy inside the barrel and releases it into the gear train.' },
  { id: 'bridge', name: 'Bridge', description: 'Bridges hold the wheel pivots in alignment so the gears can mesh with very little play.' },
  { id: 'balance', name: 'Balance', description: 'The balance wheel and hairspring oscillate together to regulate the rate of the watch.' },
];

function restoreChapter(hash) {
  if (hash === 'engineering') return 'rbc';
  if (hash === 'automation') return 'magna';
  return hash;
}

function Icon({ kind }) {
  const paths = {
    layers: 'M2 5.5 8 2l6 3.5L8 9 2 5.5Zm0 3L8 12l6-3.5M2 11.5 8 15l6-3.5',
    wind: 'M13.6 7a5.7 5.7 0 1 0-1.1 4.7M13.6 2.2V7H9.1',
    pause: 'M6 3.2v9.6m4-9.6v9.6',
    play: 'm6 3 6 5-6 5V3Z',
    arrow: 'M3 13 13 3m-7 0h7v7',
  };
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d={paths[kind]} />
    </svg>
  );
}

export default function Story() {
  const router = useRouter();
  const scroller = useRef(null);
  const stage = useRef(null);
  const canvas = useRef(null);
  const sections = useRef({});
  const studio = useRef(null);
  const drag = useRef(null);
  const windTimer = useRef(0);
  const [chapter, setChapter] = useState(0);
  const [available, setAvailable] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [detail, setDetail] = useState('');
  const [paused, setPaused] = useState(false);
  const [winding, setWinding] = useState(false);
  const modalOpen = useProjectWindowOpen();
  const input = useRef({ progress: 0, cursorX: 0, cursorY: 0, yaw: 0, pitch: 0, inspect: false, paused: false, wind: 0, suspended: false, changedLighting: true });

  useEffect(() => {
    input.current.suspended = modalOpen || reduced;
    studio.current?.invalidate();
  }, [modalOpen, reduced]);

  useEffect(() => {
    const root = scroller.current;
    const stageElement = stage.current;
    const canvasElement = canvas.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const articles = chapters.map(({ id }) => sections.current[id]);
    let disposed = false;
    let initializing = false;
    let active = 0;
    let nextFrame = 0;
    let stops = [];

    function sync() {
      nextFrame = 0;
      const scroll = root.scrollTop;
      const state = input.current;
      let index = 0;
      while (index < stops.length - 2 && scroll >= stops[index + 1]) index += 1;
      const distance = stops[index + 1] - stops[index] || 1;
      const progress = index + Math.max(0, Math.min(1, (scroll - stops[index]) / distance));
      const jump = Math.abs(progress - state.progress);
      if (jump > 0.004) {
        const relax = Math.exp(-6 * jump);
        state.yaw *= relax;
        state.pitch *= relax;
      }
      state.progress = progress;
      state.changedLighting = true;
      root.style.setProperty('--reading-progress', (progress / (chapters.length - 1)).toFixed(4));
      const current = Math.min(chapters.length - 1, Math.round(progress));
      if (active !== current) {
        active = current;
        setChapter(current);
        if (state.inspect) {
          state.inspect = false;
          state.detail = '';
          setInspecting(false);
          setDetail('');
        }
      }
      studio.current?.invalidate();
    }
    function schedule() {
      if (!nextFrame) nextFrame = window.requestAnimationFrame(sync);
    }
    function measure() {
      const limit = root.scrollHeight - root.clientHeight;
      stops = articles.map((section) => Math.min(section.offsetTop, limit));
      sync();
    }
    function restore(event) {
      if (event?.oldURL?.split('#')[1]?.startsWith('view=')) return;
      const id = restoreChapter(window.location.hash.slice(1));
      if (sections.current[id]) root.scrollTop = sections.current[id].offsetTop;
      measure();
    }
    function upgrade() {
      setReduced(motion.matches);
      if (motion.matches || studio.current || initializing) return;
      initializing = true;
      import('@src/components/calibre/scene')
        .then(({ default: mount }) => {
          if (disposed || motion.matches) return;
          studio.current = mount(canvasElement, stageElement, input, {
            ready: () => setAvailable(true),
            lost: () => setAvailable(false),
          });
        })
        .catch(() => setAvailable(false))
        .finally(() => {
          initializing = false;
        });
    }

    const observer = new ResizeObserver(measure);
    articles.forEach((article) => observer.observe(article));
    observer.observe(root);
    root.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('hashchange', restore);
    window.addEventListener('pageshow', measure);
    motion.addEventListener('change', upgrade);
    restore();
    upgrade();
    return () => {
      disposed = true;
      observer.disconnect();
      window.cancelAnimationFrame(nextFrame);
      window.clearTimeout(windTimer.current);
      root.removeEventListener('scroll', schedule);
      window.removeEventListener('hashchange', restore);
      window.removeEventListener('pageshow', measure);
      motion.removeEventListener('change', upgrade);
      studio.current?.dispose();
      studio.current = null;
    };
  }, []);

  const navigate = useCallback(
    (event, id) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const section = sections.current[id];
      if (!section) return;
      event.preventDefault();
      router.replace(`/story#${id}`, undefined, { shallow: true, scroll: false });
      section.focus({ preventScroll: true });
      scroller.current.scrollTo({ top: section.offsetTop, behavior: reduced ? 'instant' : 'smooth' });
    },
    [reduced, router],
  );

  function move(event) {
    if (!available || reduced) return;
    const state = input.current;
    const held = drag.current;
    if (held?.id === event.pointerId) {
      state.yaw = Math.max(-0.8, Math.min(0.8, held.yaw + (event.clientX - held.x) / 245));
      state.pitch = Math.max(-0.52, Math.min(0.52, held.pitch + (event.clientY - held.y) / 270));
    } else if (event.pointerType !== 'touch') {
      const bounds = stage.current.getBoundingClientRect();
      state.cursorX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.19;
      state.cursorY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.15;
    }
    studio.current?.invalidate();
  }
  function release(event) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    const viewer = event.currentTarget;
    if (viewer.hasPointerCapture(event.pointerId)) viewer.releasePointerCapture(event.pointerId);
    viewer.removeAttribute('data-held');
  }
  function orbitKey(event) {
    const steps = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12], Home: [0, 0] };
    if (!available || reduced || !steps[event.key]) return;
    event.preventDefault();
    const [x, y] = steps[event.key];
    const state = input.current;
    state.yaw = event.key === 'Home' ? 0 : Math.max(-0.8, Math.min(0.8, state.yaw + x));
    state.pitch = event.key === 'Home' ? 0 : Math.max(-0.52, Math.min(0.52, state.pitch + y));
    studio.current?.invalidate();
  }

  const live = available && !reduced;
  const current = chapters[chapter];
  return (
    <>
      <Head>
        <title>Sharon Basovich</title>
        <meta name="description" content="Sharon Basovich’s engineering portfolio, told through an interactive mechanical watch." />
        <meta name="theme-color" content="#12110f" />
        <link rel="preload" href="/story/cormorant-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {['calibre-dial', 'calibre-train', 'calibre-separated', 'calibre-balance'].map((still) => (
          <link key={still} rel="preload" href={`/story/${still}.webp`} as="image" fetchPriority={still === 'calibre-dial' ? 'auto' : 'low'} />
        ))}
      </Head>
      <div className={styles.root} id="main" ref={scroller} data-chapter={current.id}>
        <a className={styles.skip} href="#intro" onClick={(event) => navigate(event, 'intro')}>
          Skip to content
        </a>
        <header className={styles.header}>
          <a className={styles.brand} href="#intro" onClick={(event) => navigate(event, 'intro')} aria-label="Sharon Basovich, beginning of story">
            SB<span>.</span>
          </a>
          <nav aria-label="Portfolio navigation">
            <a href="#rbc" onClick={(event) => navigate(event, 'rbc')} data-current={chapter === 1 || chapter === 2}>
              Experience
            </a>
            <a href="#projects" onClick={(event) => navigate(event, 'projects')} data-current={chapter === 3 || chapter === 4}>
              Projects
            </a>
            <a href="#contact" onClick={(event) => navigate(event, 'contact')} data-current={chapter === 5}>
              Contact
            </a>
          </nav>
          <a className={styles.resume} href="/resume.pdf">
            Resume <Icon kind="arrow" />
          </a>
        </header>
        <div className={styles.stage} ref={stage} data-live={live}>
          <div className={styles.light} aria-hidden="true" />
          <div className={styles.rings} aria-hidden="true" />
          <div className={styles.poster} aria-hidden="true" style={{ '--poster': `url(/story/${current.still}.webp)` }} />
          <canvas ref={canvas} data-visible={live} aria-hidden="true" />
          <button
            type="button"
            className={styles.surface}
            disabled={!live}
            aria-label="Watch movement. Drag or use arrow keys to rotate. Press Enter to reset the angle."
            onKeyDown={orbitKey}
            onClick={(event) => {
              if (event.detail !== 0) return;
              input.current.yaw = 0;
              input.current.pitch = 0;
              studio.current?.invalidate();
            }}
            onPointerMove={move}
            onPointerDown={(event) => {
              if (!live || event.button !== 0 || !event.isPrimary) return;
              const { yaw, pitch } = input.current;
              drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw, pitch };
              event.currentTarget.setPointerCapture(event.pointerId);
              event.currentTarget.dataset.held = 'true';
            }}
            onPointerUp={release}
            onPointerCancel={release}
            onLostPointerCapture={release}
            onPointerLeave={() => {
              input.current.cursorX = 0;
              input.current.cursorY = 0;
              studio.current?.invalidate();
            }}
          />
        </div>
        <Editorial onNavigate={navigate} sectionRefs={sections} />
        {live && inspecting && (
          <aside className={styles.inspector} aria-label="Inspect the movement">
            <div className={styles.partOptions}>
              <button
                type="button"
                aria-pressed={!detail}
                onClick={() => {
                  input.current.detail = '';
                  setDetail('');
                  studio.current?.invalidate();
                }}
              >
                Overview
              </button>
              {details.map(({ id, name }) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={detail === id}
                  onClick={() => {
                    input.current.detail = id;
                    setDetail(id);
                    studio.current?.invalidate();
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
            <p aria-live="polite">{details.find(({ id }) => id === detail)?.description || 'Select a component to see how it works.'}</p>
          </aside>
        )}
        <footer className={styles.dock}>
          <nav aria-label="Story chapters">
            {chapters.map(({ id, title }, index) => (
              <a key={id} aria-label={title} aria-current={chapter === index ? 'step' : undefined} href={`#${id}`} onClick={(event) => navigate(event, id)}>
                <span />
              </a>
            ))}
          </nav>
          <span className={styles.part}>{current.part}</span>
          {live && (
            <div className={styles.tools} aria-label="Watch controls">
              <button
                type="button"
                aria-label={inspecting ? 'Close movement' : 'Open movement'}
                aria-pressed={inspecting}
                onClick={() => {
                  input.current.inspect = !inspecting;
                  input.current.detail = '';
                  setDetail('');
                  setInspecting(!inspecting);
                  studio.current?.invalidate();
                }}
              >
                <Icon kind="layers" /> <span>{inspecting ? 'Close movement' : 'Open movement'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  input.current.paused = false;
                  input.current.wind = 9;
                  setPaused(false);
                  setWinding(true);
                  window.clearTimeout(windTimer.current);
                  windTimer.current = window.setTimeout(() => setWinding(false), 1600);
                  studio.current?.invalidate();
                }}
              >
                <Icon kind="wind" /> <span>{winding ? 'Winding…' : 'Wind crown'}</span>
              </button>
              <button
                type="button"
                aria-label={paused ? 'Resume watch motion' : 'Pause watch motion'}
                onClick={() => {
                  input.current.paused = !paused;
                  setPaused(!paused);
                  studio.current?.invalidate();
                }}
              >
                <Icon kind={paused ? 'play' : 'pause'} />
              </button>
            </div>
          )}
        </footer>
      </div>
    </>
  );
}

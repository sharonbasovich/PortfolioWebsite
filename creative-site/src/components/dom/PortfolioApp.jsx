/* eslint-disable react/jsx-props-no-spreading */

import * as THREE from 'three';

import { useEffect, useMemo, useRef, useState } from 'react';

import Background from '@src/components/canvas/background/Index';
import { Canvas } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import Fluid from '@src/components/canvas/fluid/Fluid';
import Layout from '@src/components/dom/Layout';
import Lenis from 'lenis';
import Loader from '@src/components/dom/Loader';
import Navbar from '@src/components/dom/navbar/Index';
import { useProjectWindowOpen } from '@src/components/dom/projectWindow/ProjectWindow';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import Scrollbar from '@src/components/dom/Scrollbar';
import Tempus from '@darkroom.engineering/tempus';
import { View } from '@react-three/drei';
import { gsap } from 'gsap';
import styles from '@src/pages/app.module.scss';
import useFoucFix from '@src/hooks/useFoucFix';
import { useFrame } from '@darkroom.engineering/hamo';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import useScroll from '@src/hooks/useScroll';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

if (typeof window !== 'undefined') {
  gsap.defaults({ ease: 'none' });
  gsap.registerPlugin(ScrollTrigger);

  gsap.ticker.lagSmoothing(0);
  gsap.ticker.remove(gsap.updateRoot);
  Tempus?.add((time) => {
    gsap.updateRoot(time / 1000);
  }, 0);
}

export default function PortfolioApp({ Component, pageProps, router }) {
  const [lenis, setLenis, fluidColor, isAbout] = useStore(useShallow((state) => [state.lenis, state.setLenis, state.fluidColor, state.isAbout]));
  const theme = useStore((state) => state.theme);
  const isLoading = useStore((state) => state.isLoading);
  const [hasFluidPointer, setHasFluidPointer] = useState(false);
  const viewingProject = useProjectWindowOpen();

  const mainRef = useRef();
  const mainContainerRef = useRef();
  const layoutRef = useRef();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#10141d' : '#f0f4f1');
  }, [theme]);

  useFoucFix();
  useScroll(() => ScrollTrigger.update());
  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const update = () => setHasFluidPointer(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    ScrollTrigger.clearScrollMemory('manual');
    // eslint-disable-next-line no-shadow
    const lenis = new Lenis({
      smoothWheel: true,
      syncTouch: false,
      wrapper: mainRef.current || undefined,
      content: mainContainerRef.current || undefined,
    });

    setLenis(lenis);
    lenis.stop();

    return () => {
      lenis.destroy();
      setLenis(null);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (lenis) {
      ScrollTrigger.refresh();
    }
  }, [lenis]);

  useEffect(() => {
    if (!lenis || isLoading || router.pathname !== '/') return undefined;
    const id = window.location.hash.slice(1);
    const target = ['top', 'internships', 'projects', 'contact'].includes(id) && document.getElementById(id);
    if (!target) return undefined;
    const frame = requestAnimationFrame(() => {
      const needsOffset = id === 'projects';
      const headerHeight = document.querySelector('[role="banner"]')?.getBoundingClientRect().height ?? 0;
      lenis.scrollTo(target, { offset: needsOffset ? -headerHeight - 12 : 0, immediate: true, force: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [isLoading, lenis, router.pathname]);

  useFrame((time) => {
    if (lenis) {
      lenis.raf(time);
    }
  }, 0);

  const domElements = useMemo(
    () => (
      <>
        <Loader />
        <div className={styles.background}>
          <Background />
        </div>
        <Scrollbar />
        <Navbar />
      </>
    ),
    [],
  );

  const canvasElements = useMemo(
    () => (
      <Canvas
        frameloop={viewingProject ? 'never' : 'always'}
        gl={{
          pixelRatio: 0.5,
          outputColorSpace: isAbout === false ? THREE.LinearSRGBColorSpace : THREE.SRGBColorSpace,
        }}
        style={{ zIndex: 0 }}
        resize={{ debounce: { resize: 0, scroll: 0 }, polyfill: undefined }}
        className={styles.canvasContainer}
        dpr={[0.5, 1.5]}
      >
        <View.Port />
      </Canvas>
    ),
    [isAbout, viewingProject],
  );

  return (
    <div className={styles.root}>
      {domElements}
      <div ref={layoutRef} id="layout" className={styles.layout}>
        {canvasElements}
        {hasFluidPointer && (
          <Canvas
            frameloop={viewingProject ? 'never' : 'always'}
            id="fluidCanvas"
            flat
            gl={{
              antialias: false,
              stencil: false,
              depth: false,
              pixelRatio: 0.1,
            }}
            style={{ mixBlendMode: 'difference', background: 'black' }}
            linear
            className={styles.canvasContainer}
            eventSource={mainRef.current}
            dpr={[0.1, 0.5]}
          >
            <EffectComposer>
              <Fluid fluidColor={fluidColor} mainRef={mainRef} />
            </EffectComposer>
          </Canvas>
        )}
        <main id="main" tabIndex={-1} ref={mainRef} className={styles.main}>
          <div ref={mainContainerRef} id="mainContainer" className={styles.mainContainer}>
            <Layout layoutRef={layoutRef} mainRef={mainRef} router={router}>
              <Component {...pageProps} />
            </Layout>
          </div>
        </main>
      </div>
    </div>
  );
}

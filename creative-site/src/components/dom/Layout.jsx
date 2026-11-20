import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Transition as ReactTransition, SwitchTransition } from 'react-transition-group';

import Footer from '@src/components/dom/Footer';
import gsap from 'gsap';
import styles from '@src/components/dom/styles/layout.module.scss';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

function Layout({ children, layoutRef, mainRef, router }) {
  const [lenis, introOut, setIsLoading, isMenuOpen, setIsMenuOpen, setIsAbout] = useStore(
    useShallow((state) => [state.lenis, state.introOut, state.setIsLoading, state.isMenuOpen, state.setIsMenuOpen, state.setIsAbout]),
  );

  const enterTimelineRef = useRef();
  const exitTimelineRef = useRef();

  const [isEntering, setIsEntering] = useState(false);

  const menuTime = useMemo(() => (isMenuOpen ? 0.8 : 0), [isMenuOpen]);

  const handleEnter = useCallback(
    () => {
      if (introOut && lenis) {
        if (exitTimelineRef.current) exitTimelineRef.current.pause();

        const tl = gsap.timeline({
          onComplete: () => {
            setIsAbout(router.pathname === '/about');
            setIsLoading(false);
            lenis.start();
          },
        });

        enterTimelineRef.current = tl;
        setIsEntering(true);

        tl.set(
          layoutRef.current,
          {
            ease: 'power2.inOut',
            height: '90%',
            opacity: 1,
            onComplete: () => {
              setIsAbout(router.pathname === '/about');
              setIsEntering(false);
            },
          },
          0.48,
        )
          .to(
            '#loader',
            {
              x: '-100%',
              ease: 'power2.inOut',
            },
            0.48,
          )
          .to(
            mainRef.current,
            {
              ease: 'power2.inOut',
              x: '0px',
            },
            0.48,
          )
          .to(
            mainRef.current,
            {
              ease: 'power2.inOut',
              borderRadius: 0,
              scale: 1,
            },
            0.86,
          )
          .to(
            layoutRef.current,
            {
              ease: 'power2.inOut',
              height: '100%',
              opacity: 1,
            },
            0.86,
          )
          .to(
            'header',
            {
              ease: 'power2.inOut',
              autoAlpha: 1,
            },
            1.06,
          )
          .to(
            mainRef.current,
            {
              ease: 'power2.inOut',
              height: 'auto',
              border: 'none',
              pointerEvents: 'auto',
            },
            1.06,
          );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [introOut, lenis, router.asPath],
  );

  const handleExit = useCallback(
    () => {
      if (introOut && lenis) {
        if (enterTimelineRef.current) enterTimelineRef.current.pause();

        lenis.stop();
        if (isMenuOpen) {
          setIsMenuOpen(false);
        }
        if (isEntering === false) {
          const tl = gsap.timeline({
            onComplete: () => {
              setIsLoading(true);
              lenis.scrollTo(0, { force: true });
            },
          });

          exitTimelineRef.current = tl;

          if (document?.getElementById('scrollbar')) {
            tl.to(
              document.getElementById('scrollbar'),
              {
                ease: 'power2.inOut',
                autoAlpha: 0,
                duration: 0.5,
              },
              menuTime,
            );
          }

          tl.to(
            'header',
            {
              ease: 'power2.inOut',
              autoAlpha: 0,
              duration: 0.5,
              onComplete: () => {
                gsap.set('#loader', {
                  scale: 0.9,
                  x: '100%',
                  borderRadius: '1.3888888889vw',
                });
                gsap.set('header', {
                  left: 0,
                  top: 0,
                  scale: 1,
                  duration: 0,
                });
              },
              overwrite: true,
            },
            menuTime,
          )
            .to(
              layoutRef.current,
              {
                ease: 'power2.inOut',
                height: '90svh',
                opacity: 1,
                duration: 0.5,
              },
              menuTime,
            )
            .to(
              mainRef.current,
              {
                ease: 'power2.inOut',
                scale: 0.9,
                opacity: 1,
                border: '2px solid var(--white)',
                borderRadius: '1.3888888889vw',
                duration: 0.5,
              },
              menuTime,
            )
            .to(
              mainRef.current,
              {
                ease: 'power2.inOut',
                x: '-100%',
                duration: 0.5,
              },
              0.5 + menuTime,
            )
            .to(
              '#loader',
              {
                ease: 'power2.inOut',
                x: '0px',
                duration: 0.5,
              },
              0.5 + menuTime,
            )
            .set(mainRef.current, {
              x: '100%',
            });
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [introOut, lenis, menuTime, isEntering, isMenuOpen, setIsMenuOpen, setIsLoading],
  );

  return (
    <>
      <SwitchTransition>
        <ReactTransition
          key={router.asPath.split('#')[0]}
          in={false}
          unmountOnExit
          timeout={{
            enter: introOut ? 1900 : 0,
            exit: introOut ? 1800 : 0,
          }}
          onEnter={handleEnter}
          onExit={handleExit}
        >
          {children}
        </ReactTransition>
      </SwitchTransition>

      <footer id="contact" tabIndex={-1} className={styles.footer}>
        <Footer />
      </footer>
    </>
  );
}

export default Layout;

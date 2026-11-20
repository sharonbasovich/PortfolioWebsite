import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useStore } from '@src/store';
import styles from './styles/index.module.scss';

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 15 15 5M5 5h10v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Label({ children }) {
  return (
    <span className={styles.label}>
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}

export default function Navbar() {
  const router = useRouter();
  const lenis = useStore((state) => state.lenis);
  const isLoading = useStore((state) => state.isLoading);
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const [brandVisible, setBrandVisible] = useState(router.pathname !== '/');
  const pendingSection = useRef(null);

  const scrollToSection = useCallback(
    (id) => {
      const target = document.getElementById(id);
      if (!target || !lenis) return;
      setBrandVisible(true);
      requestAnimationFrame(() => {
        const headerHeight = document.querySelector('[role="banner"]')?.getBoundingClientRect().height || 84;
        lenis.scrollTo(target, {
          offset: ['contact', 'internships'].includes(id) ? 0 : -headerHeight - 12,
          duration: 1.2,
          force: true,
          onComplete: () => {
            lenis.start();
            if (id === 'contact') target.focus({ preventScroll: true });
          },
        });
      });
    },
    [lenis],
  );

  useEffect(() => {
    if (!lenis) return undefined;
    const update = () => {
      const hero = document.getElementById('top');
      setBrandVisible(router.pathname !== '/' || !hero || lenis.scroll > hero.offsetHeight * 0.68);
    };
    update();
    lenis.on('scroll', update);
    return () => lenis.off('scroll', update);
  }, [lenis, router.pathname]);

  useEffect(() => {
    if (isLoading || !pendingSection.current || router.pathname !== '/') return;
    const id = pendingSection.current;
    if (!document.getElementById(id)) return;
    pendingSection.current = null;
    scrollToSection(id);
  }, [isLoading, router.pathname, scrollToSection]);

  const navigateToSection = (event, id) => {
    event.preventDefault();
    if (id === 'contact' || router.pathname === '/') {
      scrollToSection(id);
    } else {
      pendingSection.current = id;
      router.push('/');
    }
  };

  const goHome = (event) => {
    if (router.pathname !== '/' || !lenis || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    lenis.scrollTo(0, { duration: 1.1, force: true, immediate: window.matchMedia('(prefers-reduced-motion: reduce)').matches });
  };

  return (
    <>
      <a
        className="skipLink"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus({ preventScroll: true });
        }}
      >
        Skip to content
      </a>
      <header className={styles.root} role="banner" data-brand-visible={brandVisible}>
        <div className={styles.innerHeader}>
          <Link href="/#top" scroll={false} onClick={goHome} className={styles.wordmark} aria-label="Sharon Basovich, home" tabIndex={brandVisible ? undefined : -1}>
            <Image src="/sharon/icon.svg" width={37} height={37} alt="" />
          </Link>
          <nav className={styles.navigation} aria-label="Main navigation">
            <Link href="/#internships" scroll={false} onClick={(event) => navigateToSection(event, 'internships')} className={styles.navLink}>
              <Label>Work</Label>
            </Link>
            <Link href="/#projects" scroll={false} onClick={(event) => navigateToSection(event, 'projects')} className={styles.navLink}>
              <Label>Projects</Label>
            </Link>
            <a href="/resume.pdf" target="_blank" rel="noreferrer" className={styles.navLink}>
              <Label>Resume</Label>
              <Arrow />
            </a>
            <button
              type="button"
              className={styles.themeToggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={theme === 'dark'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20.15 14.42A8.5 8.5 0 0 1 9.58 3.85a8.5 8.5 0 1 0 10.57 10.57Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="3.75" />
                  <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                </svg>
              )}
            </button>
            <a href="#contact" onClick={(event) => navigateToSection(event, 'contact')} className={styles.contact}>
              <Label>Let&apos;s talk</Label>
              <Arrow />
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}

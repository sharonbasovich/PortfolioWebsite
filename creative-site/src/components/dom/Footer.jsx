import { useRef } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { useRouter } from 'next/router';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import AppearTitle from '@src/components/animationComponents/appearTitle/Index';
import footerLinks from './navbar/constants/footerLinks';
import { useStore } from '@src/store';
import SandTitle from './contact/SandTitle';
import styles from './styles/footer.module.scss';

const Time = dynamic(() => import('./Time'), { ssr: false });
const GoTop = dynamic(() => import('./GoTop'), { ssr: false });

const sections = [
  { title: 'Home', href: '/#top' },
  { title: 'Projects', href: '/#projects' },
];

function LinkGroup({ title, links, external = false, onNavigate }) {
  return (
    <nav aria-label={title} className={styles.linkGroup}>
      <AppearTitle isFooter>
        <h3>{title}</h3>
        {links.map((link) => (
          <a key={link.title} className={styles.navLink} href={link.href} onClick={onNavigate} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <path d="M3 9h11m-5-5 5 5-5 5" />
            </svg>
            <span>{link.title}</span>
          </a>
        ))}
      </AppearTitle>
    </nav>
  );
}

function Footer() {
  const rootRef = useRef(null);
  const contentRef = useRef(null);
  const router = useRouter();
  const lenis = useStore((state) => state.lenis);

  const navigateOnHome = (event) => {
    if (router.pathname !== '/' || !lenis || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = event.currentTarget.hash.slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    const headerHeight = document.querySelector('[role="banner"]')?.getBoundingClientRect().height || 84;
    lenis.scrollTo(id === 'top' ? 0 : target, {
      offset: id === 'top' ? 0 : -headerHeight - 12,
      duration: 1.1,
      immediate: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      force: true,
      onComplete: () => {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      },
    });
  };

  useIsomorphicLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 813px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        contentRef.current,
        { y: -62 },
        {
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            scroller: rootRef.current.closest('main'),
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    });
    return () => mm.revert();
  }, [router.pathname]);

  return (
    <section ref={rootRef} className={styles.root} aria-label="Contact">
      <div ref={contentRef} className={styles.content}>
        <SandTitle />
        <div className={styles.contactRow}>
          <LinkGroup title="Sitemap" links={sections} onNavigate={navigateOnHome} />
          <LinkGroup title="Find me" links={footerLinks} external />
          <div className={styles.contactCopy}>
            <AppearTitle isFooter>
              <p>I’m always glad to meet curious people.</p>
              <a className={styles.email} href="mailto:sharon@basovich.com">
                <span>sharon@basovich.com</span>
                <svg aria-hidden="true" viewBox="0 0 1200 60" preserveAspectRatio="none">
                  <path d="M0,56.5h399.333C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,201,10.5H1200" />
                </svg>
              </a>
            </AppearTitle>
          </div>
        </div>
        <div className={styles.bottomRow}>
          <div className={styles.clock}>
            <span>Waterloo, Ontario</span>
            <span>
              Local time <Time />
            </span>
          </div>
          <div className={styles.copyright}>
            <span>© {new Date().getFullYear()} Sharon Basovich</span>
            <a href="https://giats.me/" target="_blank" rel="noreferrer">
              Original design by Evangelos Giatsidis
            </a>
          </div>
          <GoTop />
        </div>
      </div>
    </section>
  );
}
export default Footer;

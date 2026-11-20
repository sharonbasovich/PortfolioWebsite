import { useRef } from 'react';
import clsx from 'clsx';
import Image from 'next/image';
import SandTitle from '@src/components/dom/contact/SandTitle';
import { useStore } from '@src/store';
import FloatingMeshes from './components/floatingMeshes/Index';
import styles from './styles/home.module.scss';

function Home() {
  const interactionRef = useRef(null);
  const loading = useStore((state) => state.isLoading);
  return (
    <section id="top" className={styles.root}>
      <div className={clsx(styles.topContainer, 'layout-grid-inner')}>
        <div className={styles.leftContainer}>
          <SandTitle name />
        </div>
        <p className={clsx('h6', styles.intro)}>
          Building Inference at Abstract (HF0 S26) and studying computer science at the University of{' '}
          <span className={styles.crestLabel}>
            Waterloo.<Image src="/sharon/waterloo-crest.png" width={21} height={24} alt="" className={styles.crest} />
          </span>
        </p>
      </div>
      {/* The physics controller binds arrow and space-key input to this focusable scene. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div ref={interactionRef} className={styles.bottomContainer} role="group" tabIndex={0} aria-label="Interactive spheres. Sweep to scatter them, drag and release to throw, or use the arrow keys.">
        <FloatingMeshes interactionRef={interactionRef} />
        <div className={styles.shutters} data-open={!loading} aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} style={{ '--delay': `${(i % 4) * 55}ms` }} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Home;

import { Environment, PerspectiveCamera, View } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { useCallback, useEffect, useRef, useState } from 'react';
import useIsMobile from '@src/hooks/useIsMobile';
import FloatRigidBody from './FloatRigidBody';
import styles from '../../styles/home.module.scss';

export default function Index({ interactionRef }) {
  const isMobile = useIsMobile();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const pendingFrame = useRef(0);
  const mounted = useRef(true);
  const seen = useRef(false);
  const reveal = useCallback(() => {
    if (seen.current || !mounted.current) return;
    seen.current = true;
    pendingFrame.current = requestAnimationFrame(() => {
      if (mounted.current) setReady(true);
    });
  }, []);
  useEffect(() => {
    mounted.current = true;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { root: document.querySelector('main') });
    observer.observe(interactionRef.current);
    return () => {
      query.removeEventListener('change', update);
      observer.disconnect();
      mounted.current = false;
      cancelAnimationFrame(pendingFrame.current);
    };
  }, [interactionRef]);

  return (
    <>
      <div className={styles.spherePoster} data-ready={ready} aria-hidden="true" />
      <View style={{ position: 'relative', display: 'block', height: '100%', width: '100%' }}>
        <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={20} />
        <Physics interpolate timeStep={1 / 60} gravity={[0, 0, 0]} paused={!visible}>
          <FloatRigidBody key={isMobile ? 'compact' : 'wide'} interactionRef={interactionRef} reducedMotion={reducedMotion} compact={isMobile} onRendered={reveal} />
        </Physics>
        <Environment files="/other/studio_small_09_1k.hdr" />
      </View>
    </>
  );
}

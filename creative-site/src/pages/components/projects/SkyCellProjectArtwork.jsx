import { useRef } from 'react';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import Image from 'next/image';
import { gsap } from 'gsap';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import { useStore } from '@src/store';
import styles from './skyCellProjectArtwork.module.scss';

// Photographs from the SkyCell gallery, cropped from the originals served at skycell.vercel.app.
const photos = ['enclosure', 'electronics', 'radio'];
const reveals = [[0.14, 0.46], [0.52, 0.84]];

function revealAt(progress, start, end) {
  const position = gsap.utils.clamp(0, 1, (progress - start) / (end - start));
  return position * position * (3 - 2 * position);
}

export default function SkyCellProjectArtwork({ decorative = false, priority = false }) {
  const root = useRef(null);
  const isLoading = useStore((state) => state.isLoading);

  useIsomorphicLayoutEffect(() => {
    if (isLoading || !root.current) return undefined;

    const element = root.current;
    const section = element.closest('article, [data-project-art-track]') || element;
    const scroller = element.closest('main');
    const incoming = element.querySelectorAll('[data-skycell-layer]:not(:first-child)');
    const media = gsap.matchMedia(element);

    media.add({
      motion: '(prefers-reduced-motion: no-preference)',
      wide: '(min-width: 812px)',
    }, ({ conditions }) => {
      if (!conditions.motion) return undefined;

      const stickyGallery = conditions.wide && section.id === 'skycell';
      const paint = ({ progress }) => {
        incoming.forEach((layer, index) => {
          const [start, end] = reveals[index];
          layer.style.setProperty('--skycell-reveal', revealAt(progress, start, end));
        });
      };
      const trigger = ScrollTrigger.create({
        trigger: section,
        scroller: scroller || window,
        start: stickyGallery ? 'top 64%' : 'top 78%',
        end: stickyGallery ? 'bottom 62%' : 'bottom 36%',
        onUpdate: paint,
        onRefresh: paint,
      });
      paint(trigger);

      return () => {
        trigger.kill();
        incoming.forEach((layer) => layer.style.removeProperty('--skycell-reveal'));
      };
    });

    return () => media.revert();
  }, [isLoading]);

  return (
    <div
      ref={root}
      className={styles.gallery}
      data-skycell-artwork
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'SkyCell flight enclosure, assembled electronics and powered radio'}
    >
      {photos.map((name, index) => (
        <div key={name} className={styles.layer} data-skycell-layer={name}>
          <Image
            src={`/sharon/projects/skycell-gallery/${name}.webp`}
            alt=""
            fill
            priority={priority && index === 0}
            sizes="(max-width: 812px) 85vw, 55vw"
          />
        </div>
      ))}
    </div>
  );
}

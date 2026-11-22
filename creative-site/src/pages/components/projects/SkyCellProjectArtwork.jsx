import { useRef } from 'react';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import Image from 'next/image';
import { gsap } from 'gsap';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import { useStore } from '@src/store';
import styles from './skyCellProjectArtwork.module.scss';

// The first two photo cards in the SkyCell flight story.
const photos = ['enclosure', 'electronics'];

export default function SkyCellProjectArtwork({ decorative = false, priority = false }) {
  const root = useRef(null);
  const isLoading = useStore((state) => state.isLoading);

  useIsomorphicLayoutEffect(() => {
    if (isLoading || !root.current) return undefined;

    const element = root.current;
    const section = element.closest('article, [data-project-art-track]') || element;
    const scroller = element.closest('main');
    const secondPhoto = element.querySelector('[data-skycell-layer="electronics"] img');
    const media = gsap.matchMedia(element);

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const paint = ({ progress }) => {
        // Hold the enclosure through the card's first half and while the next photo loads.
        const showSecond = progress > 0 && secondPhoto.complete && secondPhoto.naturalWidth > 0;
        element.toggleAttribute('data-skycell-second', showSecond);
      };
      const trigger = ScrollTrigger.create({
        trigger: section,
        scroller: scroller || window,
        start: 'clamp(center center)',
        end: 'max',
        onUpdate: paint,
        onRefresh: paint,
      });
      const onPhotoReady = () => paint(trigger);
      secondPhoto.addEventListener('load', onPhotoReady);
      onPhotoReady();

      return () => {
        trigger.kill();
        secondPhoto.removeEventListener('load', onPhotoReady);
        element.removeAttribute('data-skycell-second');
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
      aria-label={decorative ? undefined : 'SkyCell flight enclosure and assembled electronics'}
    >
      {photos.map((name, index) => (
        <div key={name} className={styles.layer} data-skycell-layer={name}>
          <Image
            src={`/sharon/projects/skycell-gallery/hardware-${name}-1600.webp`}
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

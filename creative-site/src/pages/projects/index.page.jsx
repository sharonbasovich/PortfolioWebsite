/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable no-nested-ternary */

import CustomHead from '@src/components/dom/CustomHead';
import { ProjectLink } from '@src/components/dom/projectWindow/ProjectWindow';
import ProjectArtwork from '@src/pages/components/projects/ProjectArtwork';
import clsx from 'clsx';
import { gsap } from 'gsap';
import projects from '@src/constants/projects';
import styles from '@src/pages/projects/projects.module.scss';
import useIsMobile from '@src/hooks/useIsMobile';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import { useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import { useWindowSize } from '@darkroom.engineering/hamo';

const seo = {
  title: 'Projects · Sharon Basovich',
  description: 'Robotics, research tooling, high performance computing, and a high-altitude radio payload.',
};

function Page() {
  const isMobile = useIsMobile();

  const windowSize = useWindowSize();
  const rootRef = useRef();
  const projectRefs = useRef([]);
  const [isLoading] = useStore(useShallow((state) => [state.isLoading]));

  const setupProjectAnimations = () => {
    const ctx = gsap.context(() => {
      if (!isLoading) {
        projectRefs.current.slice(0, -1).forEach((projectRef, index) => {
          gsap.set(projectRef, { yPercent: 0 });
          gsap
            .timeline({
              scrollTrigger: {
                id: `projectRef-${index}`,
                trigger: rootRef.current,
                start: `top+=${windowSize.height * index * (isMobile ? 0.5 : 1)}`,
                end: () => `+=${(projectRefs.current.length - 2) * windowSize.height * (isMobile ? 0.5 : 1)}`,
                scrub: true,
                scroller: document?.querySelector('main'),
                invalidateOnRefresh: true,
              },
            })
            .to(projectRef, {
              yPercent: 100,
              stagger: 1,
            });
        });
      }
    });

    return ctx;
  };

  useIsomorphicLayoutEffect(() => {
    const ctx = setupProjectAnimations();
    return () => ctx.kill();
  }, [isLoading, isMobile, windowSize.height]);

  return (
    <>
      <CustomHead {...seo} />
      <section className={clsx(styles.titleContainer, 'layout-block-inner')}>
        <h1 className={clsx(styles.title, 'h1')}>All Projects</h1>
      </section>
      <section ref={rootRef} className={clsx(styles.root, 'layout-block-inner')}>
        <div className={styles.innerContainer}>
          {projects.map((project, index) => (
            <ProjectLink project={project} aria-label={`View ${project.title}`} id={project.id} key={project.id} className={styles.card} data-project-art-track>
              <div
                style={
                  !isMobile
                    ? {
                        height: index === projects.length - 1 ? '200svh' : `${200 + 100 * index}svh`,
                        top: index === 0 ? '0px' : '-100svh',
                      }
                    : {
                        height: '50svh',
                        top: 0,
                      }
                }
                className={styles.projectsWrap}
              >
                <div className={clsx(styles.container, 'layout-grid-inner')}>
                  <div className={styles.projectsDetails}>
                    <h6 className={clsx(styles.text, 'h6')}>{project.date}</h6>
                    <h3 className={clsx(styles.text, 'h3')}>{project.title}</h3>
                  </div>
                  <div className={styles.imageContainer} style={{ aspectRatio: project.frameRatio }}>
                    <ProjectArtwork project={project} priority={index === 0} />
                  </div>
                </div>
              </div>
              <div
                ref={(el) => {
                  projectRefs.current[index] = el;
                }}
                className={clsx(styles.canvas, index === 0 && styles.firstCard, index === projects.length - 1 && styles.lastCard)}
                aria-hidden="true"
              >
                <ProjectArtwork project={project} mode="ambient" />
              </div>
            </ProjectLink>
          ))}
        </div>
      </section>
    </>
  );
}

export default Page;

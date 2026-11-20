/* eslint-disable no-return-assign */
/* eslint-disable no-nested-ternary */
import AppearByWords from '@src/components/animationComponents/appearByWords/Index';
import { ProjectLink } from '@src/components/dom/projectWindow/ProjectWindow';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { featuredProjects } from '@src/constants/projects';
import styles from '@src/pages/components/projects/styles/projects.module.scss';
import useIsMobile from '@src/hooks/useIsMobile';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import { useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import { useWindowSize } from '@darkroom.engineering/hamo';
import ProjectArtwork from './ProjectArtwork';

function Projects() {
  const isMobile = useIsMobile();
  const windowSize = useWindowSize();
  const [isLoading] = useStore(useShallow((state) => [state.isLoading]));

  const rootRef = useRef();
  const projectRefs = useRef([]);

  const newProjects = featuredProjects;

  const setupProjectAnimations = () => {
    const ctx = gsap.context(() => {
      if (!isLoading && !isMobile) {
        projectRefs.current.slice(0, -1).forEach((projectRef, index) => {
          gsap.set(projectRef, { yPercent: 0 });
          gsap
            .timeline({
              scrollTrigger: {
                id: `projectRef-${index}`,
                trigger: rootRef.current,
                start: `top+=${windowSize.height * index}`,
                end: () => `+=${(projectRefs.current.length - 1) * windowSize.height}`,
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
    return () => ctx.revert();
  }, [isLoading, isMobile, windowSize.height]);

  return (
    <>
      <section id="projects" className={clsx(styles.titleContainer, 'layout-grid-inner')}>
        <h2 className={clsx(styles.title, 'h1')}>
          <AppearByWords>Projects</AppearByWords>
        </h2>
      </section>
      <section ref={rootRef} className={clsx(styles.root, 'layout-block-inner')}>
        <div className={styles.innerContainer}>
          {newProjects.map((project, index) => (
            <article id={project.id} key={project.id} className={styles.card}>
              <div
                style={
                  !isMobile
                    ? {
                        height: index === newProjects.length - 1 ? '200svh' : `${200 + 100 * index}svh`,
                        top: index === 0 ? '0px' : '-100svh',
                      }
                    : undefined
                }
                className={styles.projectsWrap}
              >
                <div className={clsx(styles.container, 'layout-grid-inner')}>
                  <div className={styles.projectsDetails}>
                    <p className="h6">{project.date}</p>
                    <h3 className="h3">{project.title}</h3>
                    <ProjectLink project={project} aria-label={`Check it out: ${project.title}`} className={styles.projectLink}>
                      <span className={styles.linkText}>
                        Check it out
                        <svg className={styles.underline} aria-hidden="true" viewBox="0 0 1200 60" preserveAspectRatio="none">
                          <path d="M0,56.5h399.333C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,201,10.5H1200" />
                        </svg>
                      </span>
                      <span aria-hidden="true">↗</span>
                    </ProjectLink>
                  </div>
                  <div className={styles.imageContainer} style={{ aspectRatio: project.frameRatio }}>
                    <ProjectArtwork project={project} />
                  </div>
                </div>
              </div>
              <div
                ref={(el) => (projectRefs.current[index] = el)}
                className={clsx(styles.canvas, index === 0 && styles.firstCard, index === newProjects.length - 1 && styles.lastCard)}
                aria-hidden="true"
              >
                <ProjectArtwork project={project} mode="ambient" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export default Projects;

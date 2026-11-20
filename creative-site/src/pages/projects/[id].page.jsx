/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useMemo, useRef } from 'react';

import CustomHead from '@src/components/dom/CustomHead';
import NextProject from '@src/pages/projects/components/nextProject/NextProject';
import ProjectDetails from '@src/pages/projects/components/projectDetails/ProjectDetails';
import ProjectImages from '@src/pages/projects/components/projectsImages/ProjectImages';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import clsx from 'clsx';
import { gsap } from 'gsap';
import projects from '@src/constants/projects';
import styles from '@src/pages/projects/project.module.scss';
import useIsMobile from '@src/hooks/useIsMobile';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import { useWindowSize } from '@darkroom.engineering/hamo';

function updateCSSVariables(project, theme) {
  const isDark = theme === 'dark';
  gsap.set('html', {
    '--black': isDark ? '#ecf0fb' : project.primary,
    '--white': isDark ? '#10141d' : project.secondary,
    '--accentColor': isDark ? '#222a3a' : project.accentColor,
    '--fillColor': isDark ? '#889fff' : project.fillColor,
    '--menuColor': project.menuColor,
    '--menuFontColor': project.menuFontColor,
  });
}

function Page({ id }) {
  const isMobile = useIsMobile();
  const theme = useStore((state) => state.theme);
  const rightContainerRef = useRef();
  const leftContainerRef = useRef();
  const [isLoading, setFluidColor] = useStore(useShallow((state) => [state.isLoading, state.setFluidColor]));
  const windowSize = useWindowSize();

  const projectIndex = useMemo(() => projects.findIndex((project) => project.id === id), [id]);
  const currentProject = useMemo(() => projects[projectIndex], [projectIndex]);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (!isLoading && !isMobile && rightContainerRef.current?.scrollHeight > windowSize.height) {
        ScrollTrigger.create({
          id: 'project',
          trigger: rightContainerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          pin: leftContainerRef.current,
          scrub: true,
          scroller: document?.querySelector('main'),
          invalidateOnRefresh: true,
          pinSpacing: false,
        });
      }
    });

    return () => {
      ctx.kill();
      ScrollTrigger.getById('project')?.kill();
    };
  }, [isMobile, isLoading, windowSize.width, windowSize.height]);

  useEffect(() => {
    if (currentProject) {
      updateCSSVariables(currentProject, theme);
      setFluidColor(currentProject.fluidColor);
    }
    return () => {
      ['--black', '--white', '--accentColor', '--fillColor', '--menuColor', '--menuFontColor'].forEach((variable) => {
        document.documentElement.style.removeProperty(variable);
      });
      setFluidColor('#d7d7d4');
    };
  }, [currentProject, theme, setFluidColor]);

  const seo = useMemo(
    () => ({
      title: `${currentProject.title} · Sharon Basovich`,
      description: currentProject.summary,
    }),
    [currentProject],
  );

  return (
    <>
      <CustomHead {...seo} />
      <section className={clsx(styles.root, 'layout-grid-inner')}>
        <div ref={leftContainerRef} className={styles.leftContainer}>
          <ProjectDetails project={currentProject} />
        </div>
        <div ref={rightContainerRef} className={styles.rightContainer}>
          <ProjectImages project={currentProject} />
        </div>
      </section>
      <NextProject nextProject={projectIndex === projects.length - 1 ? projects[0] : projects[projectIndex + 1]} />
    </>
  );
}

export async function getStaticPaths() {
  const paths = projects.map((project) => ({ params: { id: project.id } }));
  return { paths, fallback: false };
}

export async function getStaticProps(context) {
  const { params } = context;
  return { props: { id: params.id } };
}

export default Page;

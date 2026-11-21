import AppearByWords from '@src/components/animationComponents/appearByWords/Index';
import { ProjectLink } from '@src/components/dom/projectWindow/ProjectWindow';
import ProjectArtwork from '@src/pages/components/projects/ProjectArtwork';
import clsx from 'clsx';
import styles from '@src/pages/projects/components/nextProject/styles/nextProject.module.scss';

function NextProject({ nextProject }) {
  return (
    <>
      <section className={clsx(styles.titleContainer, 'layout-block-inner')}>
        <h1 className={clsx(styles.title, 'h1')}>
          <AppearByWords>Next Project</AppearByWords>
        </h1>
      </section>
      <section className={clsx(styles.nextRoot, 'layout-block-inner')}>
        <div className={styles.innerContainer}>
          <ProjectLink project={nextProject} aria-label={`View ${nextProject.title}`} id={nextProject.id} className={styles.card} data-project-art-track>
            <div className={styles.projectsWrap}>
              <div className={clsx(styles.container, 'layout-grid-inner')}>
                <div className={styles.projectsDetails}>
                  <h6 className={clsx(styles.text, 'h6')}>{nextProject.date}</h6>

                  <h3 className={clsx(styles.text, 'h3')}>{nextProject.title}</h3>
                </div>
                <div className={styles.imageContainer} style={{ aspectRatio: nextProject.frameRatio }}>
                  <ProjectArtwork project={nextProject} />
                </div>
              </div>
            </div>

            <div className={styles.canvas} aria-hidden="true">
              <ProjectArtwork project={nextProject} mode="ambient" />
            </div>
          </ProjectLink>
        </div>
      </section>
    </>
  );
}
export default NextProject;

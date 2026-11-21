import ProjectArtwork from '@src/pages/components/projects/ProjectArtwork';
import clsx from 'clsx';
import styles from '@src/pages/projects/components/projectsImages/styles/projectImages.module.scss';

function ProjectImages({ project }) {
  return (
    <section className={clsx(styles.root, 'layout-grid-inner')} aria-label={`${project.title} imagery`} data-project-art-track>
      <div className={styles.artworkFrame} style={{ aspectRatio: project.detailRatio || project.frameRatio }}>
        <ProjectArtwork project={project} mode="detail" priority />
      </div>
    </section>
  );
}

export default ProjectImages;

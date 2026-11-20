import Arrow from '@src/components/imageComponents/Arrow';
import { ProjectLink } from '@src/components/dom/projectWindow/ProjectWindow';
import clsx from 'clsx';
import styles from '@src/pages/projects/components/projectDetails/styles/projectDetails.module.scss';

function ProjectDetails({ project }) {
  return (
    <div className={styles.root}>
      <h1 className={clsx(styles.title, 'h3')}>{project.title}</h1>
      <p className={clsx(styles.date, 'h6')}>{project.date}</p>
      <div className={styles.others}>
        <p className={clsx(styles.summary, 'p-l')}>{project.summary}</p>
        <div className={styles.desc}>
          {project.desc.map((paragraph) => (
            <p className="p-l" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
        <ul className={styles.technologies} aria-label="Technologies">
          {project.technologies.map((technology) => (
            <li key={technology}>{technology}</li>
          ))}
        </ul>
        <div className={styles.actions}>
          <ProjectLink project={project} className={styles.action}>
            View website
            <span className={styles.actionIcon} aria-hidden="true">
              <Arrow />
            </span>
          </ProjectLink>
          {project.links
            .filter(({ href }) => href !== project.website)
            .map(({ label, href }) => (
              <a key={href} className={styles.action} href={href}>
                {label}
                <span className={styles.actionIcon} aria-hidden="true">
                  <Arrow />
                </span>
              </a>
            ))}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetails;

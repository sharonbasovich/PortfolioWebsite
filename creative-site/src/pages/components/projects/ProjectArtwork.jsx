import Image from 'next/image';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { HpcBackdrop, MarbleBackdrop } from './ProjectBackdrops';
import styles from './projectArtwork.module.scss';

const LionsProjectArt = dynamic(() => import('./LionsProjectArt'));
const SkyCellProjectArtwork = dynamic(() => import('./SkyCellProjectArtwork'));

const innerArtwork = {
  'lions-robotics': LionsProjectArt,
  skycell: SkyCellProjectArtwork,
};

const ambientArtwork = {
  'marble-investments': MarbleBackdrop,
  'uw-hpc': HpcBackdrop,
};

function ProjectArtwork({ project, mode = 'cover', priority = false }) {
  const ambient = mode === 'ambient';
  const detail = mode === 'detail';
  const decorative = ambient || !detail;
  const Artwork = ambient ? ambientArtwork[project.id] : innerArtwork[project.id];

  return (
    <div
      className={clsx(styles.artwork, ambient && styles.ambient, project.isLogo && styles.logo, detail && styles.detail)}
      style={{
        '--project-canvas': project.canvasColor,
        '--project-glow': project.canvasGlow,
        '--project-position': project.coverPosition || '50% 50%',
        '--project-logo-background': project.logoBackground,
      }}
    >
      {Artwork ? <Artwork decorative={decorative} priority={priority} /> : (!ambient || !project.isLogo) && (
        <Image src={project.img} alt={decorative ? '' : project.alt} fill priority={priority} unoptimized={project.isLogo} sizes={ambient ? '100vw' : '(max-width: 800px) 85vw, 55vw'} />
      )}
    </div>
  );
}

export default ProjectArtwork;

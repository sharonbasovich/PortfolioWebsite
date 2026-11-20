import Image from 'next/image';
import { useId, useState } from 'react';
import { ProjectLink } from '@src/components/dom/projectWindow/ProjectWindow';
import projects from '@src/constants/projects';
import styles from './editorial.module.scss';

const projectNotes = {
  'marble-investments': 'Built an investment research graph with 500+ companies and a Python screener for over a million stock pairs.',
  'uw-hpc': 'Developing C++ and CUDA infrastructure for scientific computing, including variational Monte Carlo simulations.',
  'lions-robotics': 'Wrote the robot’s autonomous control and localization software. Our team received the Judges Award at VEX Worlds.',
  skycell: 'Built telemetry for a balloon-borne LoRa network that reached 30 km altitude and communicated over 70 km.',
};

const applicationSources = ['GitHub', 'SonarQube', 'Snyk', 'DAST'];
const projectArt = {
  'lions-robotics': '/story/lions-field.webp',
  skycell: '/story/skycell-field.webp',
  'marble-investments': '/story/marble-research.webp',
};

function Arrow({ direction = 'right' }) {
  return <span className={styles.arrow} data-direction={direction} aria-hidden="true" />;
}

function Heading({ first, second, hero = false }) {
  const Tag = hero ? 'h1' : 'h2';
  return (
    <Tag className={hero ? styles.name : styles.headline}>
      <span>{first}</span>
      <em>{second}</em>
    </Tag>
  );
}

function Figures({ figures }) {
  return (
    <dl className={styles.figures}>
      {figures.map(([number, label]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{number}</dd>
        </div>
      ))}
    </dl>
  );
}

function Record({ label, children }) {
  return (
    <details className={styles.record}>
      <summary>
        {label}
        <span aria-hidden="true" />
      </summary>
      {children}
    </details>
  );
}

function Pipeline() {
  return (
    <Record label="See the data pipeline">
      <figure className={styles.pipeline}>
        <ul aria-label="Service health data sources" className={styles.streams}>
          {applicationSources.map((source) => (
            <li key={source}>{source}</li>
          ))}
        </ul>
        <ol className={styles.stages} aria-label="Pipeline stages">
          <li>GraphQL & REST</li>
          <li>MongoDB</li>
          <li>React dashboard</li>
        </ol>
        <figcaption>Four data sources flow into one dashboard for service owners to review code quality and security findings.</figcaption>
      </figure>
    </Record>
  );
}

function Lever() {
  const inputId = useId();
  const [forceArm, setForceArm] = useState(108);
  const inputForce = 20;
  const outputArm = 36;
  const outputForce = Math.round((inputForce * forceArm) / outputArm);
  const forcePosition = 30 + 60 * (forceArm / 180);

  return (
    <Record label="Try the lever calculation">
      <figure className={styles.lever}>
        <div className={styles.leverSketch} style={{ '--force-position': `${forcePosition}%` }} aria-hidden="true">
          <span className={styles.loadMarker}>{outputForce} N</span>
          <span className={styles.forceMarker}>{inputForce} N</span>
          <span className={styles.leverBeam} />
          <span className={styles.fulcrum}>Hinge</span>
        </div>
        <div className={styles.leverLabel}>
          <span id={`${inputId}-label`}>Distance from hinge</span>
          <output htmlFor={inputId}>{forceArm} mm</output>
        </div>
        <input
          id={inputId}
          aria-labelledby={`${inputId}-label`}
          type="range"
          min="44"
          max="180"
          step="4"
          value={forceArm}
          aria-valuetext={`${forceArm} millimeters`}
          onChange={(event) => setForceArm(Number(event.target.value))}
        />
        <figcaption>
          Illustrative calculation with a {outputArm} mm load arm. Here, a {inputForce} N input produces {outputForce} N at the load.
        </figcaption>
      </figure>
    </Record>
  );
}

function ProjectRecords({ ids, gallery = false }) {
  return (
    <ul className={styles.projectRecords} data-gallery={gallery || undefined}>
      {ids.map((id) => {
        const project = projects.find((entry) => entry.id === id);
        return (
          <li key={id}>
            <ProjectLink project={project} className={styles.project} aria-label={`Open ${project.title} project`}>
              <span className={styles.thumbnail} data-logo={project.isLogo || undefined} style={{ '--project-logo-filter': project.logoFilter }}>
                <Image src={projectArt[id] || project.img} alt="" fill unoptimized loading="eager" decoding="async" />
              </span>
              <span className={styles.projectCopy}>
                <strong>{project.title}</strong>
                <span>{projectNotes[id]}</span>
              </span>
              <Arrow direction="diagonal" />
            </ProjectLink>
          </li>
        );
      })}
    </ul>
  );
}

function Chapter({ id, side = 'left', sectionRefs, children }) {
  return (
    <article
      id={id}
      tabIndex={-1}
      className={styles.chapter}
      data-side={side}
      ref={(node) => {
        sectionRefs.current[id] = node;
      }}
    >
      <div className={styles.copy}>{children}</div>
    </article>
  );
}

export default function Editorial({ onNavigate, sectionRefs }) {
  return (
    <div className={styles.editorial}>
      <Chapter id="intro" sectionRefs={sectionRefs}>
        <Heading first="Sharon" second="Basovich" hero />
        <p className={styles.intro}>I study computer science at the University of Waterloo. I’m drawn to systems with moving parts, from mechanical watches to autonomous robots.</p>
        <a className={styles.primaryAction} href="#rbc" onClick={(event) => onNavigate?.(event, 'rbc')}>
          Explore my work <Arrow direction="down" />
        </a>
      </Chapter>

      <Chapter id="rbc" sectionRefs={sectionRefs}>
        <p className={styles.role}>Software engineering at RBC</p>
        <Heading first="Many signals." second="One view." />
        <p className={styles.description}>
          I built a service-health pipeline that consolidates code quality and security data. Engineers across 200+ banking applications could check their services in one place.
        </p>
        <Figures
          figures={[
            ['1,200', 'repositories covered'],
            ['12,000+', 'service-owner hours saved annually'],
          ]}
        />
        <Pipeline />
      </Chapter>

      <Chapter id="magna" side="right" sectionRefs={sectionRefs}>
        <p className={styles.role}>Software automation at Magna International</p>
        <Heading first="Precision" second="under load." />
        <p className={styles.description}>
          I used CATIA V5 geometry and VBA to automate force and leverage calculations for safety reports. In the lab, I prototyped wiring harnesses and helped test hood latches to failure.
        </p>
        <Figures
          figures={[
            ['50+', 'hours of analysis automated'],
            ['78', 'engineering drawings imported'],
          ]}
        />
        <Lever />
      </Chapter>

      <Chapter id="projects" sectionRefs={sectionRefs}>
        <Heading first="Research" second="at scale." />
        <ProjectRecords ids={['marble-investments', 'uw-hpc']} />
      </Chapter>

      <Chapter id="fieldwork" side="right" sectionRefs={sectionRefs}>
        <Heading first="Beyond" second="the bench." />
        <ProjectRecords ids={['lions-robotics', 'skycell']} gallery />
      </Chapter>

      <Chapter id="contact" sectionRefs={sectionRefs}>
        <Heading first="What makes" second="you tick?" />
        <p className={styles.description}>I’d love to hear what you’re building or what you’ve been curious about lately.</p>
        <a className={styles.email} href="mailto:sharon@basovich.com">
          sharon@basovich.com <Arrow direction="diagonal" />
        </a>
        <nav className={styles.socials} aria-label="Contact and profile links">
          <a href="https://github.com/sharonbasovich">
            GitHub <Arrow direction="diagonal" />
          </a>
          <a href="https://www.linkedin.com/in/sharon-basovich">
            LinkedIn <Arrow direction="diagonal" />
          </a>
          <a href="/resume.pdf">
            Resume <Arrow direction="diagonal" />
          </a>
        </nav>
      </Chapter>
    </div>
  );
}

import Badge from '@src/pages/components/clients/components/Badge';
import { useRef, useState } from 'react';
import styles from '@src/pages/components/clients/styles/clients.module.scss';
import { useIsomorphicLayoutEffect } from '@src/hooks/useIsomorphicLayoutEffect';

const internships = [
  {
    id: 'abstract',
    name: 'Abstract',
    date: 'Fall 2026',
    role: 'Inference Engineering',
    location: 'San Francisco, CA (Remote)',
    summary: 'I’m building cloud-agnostic GPU provisioning and autoscaling at Abstract (HF0 S26).',
    detail: 'I’m also working on faster vLLM container deployments.',
    tools: 'vLLM · GPU Infrastructure · Autoscaling',
  },
  {
    id: 'rbc',
    name: 'RBC',
    date: 'Summer 2026',
    role: 'Software Engineering',
    location: 'Toronto, Ontario',
    summary: 'I built an engineering intelligence platform used across 200+ banking applications and 1,200 repositories.',
    detail:
      'GraphQL and REST pipelines brought SonarQube, DAST, GitHub, and Snyk data into MongoDB. A modular React dashboard in an Nx monorepo gave service owners one view of service health and vulnerabilities.',
    metrics: [
      { value: '12,000+', label: 'hours saved annually' },
      { value: '1,200', label: 'repositories covered' },
    ],
    tools: 'React · Nx · MongoDB · Vitest · Playwright',
  },
  {
    id: 'magna',
    name: 'Magna International',
    date: 'Summer 2024',
    role: 'Software Automation Engineering',
    location: 'Newmarket, Ontario',
    summary: 'I automated geometry, force, and leverage analysis for automotive safety reports.',
    detail:
      'I wrote VBA, Excel, and CATIA V5 tools and streamlined ingestion of 100+ materials records and 78 engineering drawings into Siemens Teamcenter. In the validation lab, I soldered wiring harness prototypes and tested hood latch system failures.',
    metrics: [
      { value: '50+', label: 'manual hours automated' },
      { value: '78', label: 'engineering drawings' },
    ],
    tools: 'VBA · Excel · CATIA V5 · Siemens Teamcenter',
  },
];

function JobCopy({ job, copyRef }) {
  return (
    <article ref={copyRef} className={styles.recordCopy}>
      <div className={styles.recordMeta}>
        <span>{job.date}</span>
        <span>{job.location}</span>
      </div>
      <h3 className={styles.company}>{job.name}</h3>
      <p className={styles.recordRole}>{job.role}</p>
      <p className={styles.recordSummary}>{job.summary}</p>
      {job.detail && <p className={styles.recordDetail}>{job.detail}</p>}
      {job.metrics && (
        <dl className={styles.metrics}>
          {job.metrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {job.tools && <p className={styles.tools}>{job.tools}</p>}
    </article>
  );
}

export default function Clients() {
  const rootRef = useRef(null);
  const copyRefs = useRef([]);
  const progressRef = useRef(0);
  const [narrow, setNarrow] = useState(true);
  const [activeJob, setActiveJob] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const query = window.matchMedia('(max-width: 700px), (max-height: 430px)');
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const scroller = rootRef.current?.closest('main');
    if (!scroller || narrow) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = scroller.clientHeight;
      const scrollerTop = scroller.getBoundingClientRect().top;
      let turns = 0;
      let active = 0;
      copyRefs.current.forEach((copy, index) => {
        if (!copy) return;
        const top = copy.getBoundingClientRect().top - scrollerTop;
        // The first badge enters below the heading. Give its face time to
        // appear before turning; later cards rotate in the pinned window.
        const start = height * (index === 0 ? 0.60 : 0.68);
        const progress = Math.min(1, Math.max(0, (start - top) / Math.max(1, height * 0.34)));
        turns += progress * progress * (3 - 2 * progress);
        if (progress >= 0.5) active = index;
      });
      progressRef.current = turns;
      setActiveJob(active);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(scroller);
    observer.observe(rootRef.current);
    scroller.addEventListener('scroll', schedule, { passive: true });
    update();
    return () => {
      scroller.removeEventListener('scroll', schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [narrow]);

  const heading = <h2 id="internships-title" className={styles.sectionHeading}>Internships</h2>;

  return (
    <section ref={rootRef} id="internships" className={styles.root} aria-labelledby="internships-title">
      <div className={styles.stage}>
        {narrow ? (
          <>
            {heading}
            <div className={styles.flowRecords}>
              {internships.map((job) => (
                <div className={styles.flowRecord} key={job.id}>
                  <div className={styles.badgeWindow}>
                    <Badge name={job.id} />
                  </div>
                  <JobCopy job={job} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.presentation}>
            <div className={styles.stickyBadge}>
              {heading}
              <div className={styles.badgeWindow}>
                <Badge name={internships[activeJob].id} progressRef={progressRef} />
              </div>
            </div>
            <div className={styles.records}>
              {internships.map((job, index) => (
                <JobCopy
                  job={job}
                  key={job.id}
                  copyRef={(node) => {
                    copyRefs.current[index] = node;
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

import AppearTitle from '@src/components/animationComponents/appearTitle/Index';
import clsx from 'clsx';
import styles from '@src/pages/about/components/overview/styles/overview.module.scss';

export default function Overview() {
  return (
    <section className={clsx(styles.root, 'layout-grid-inner')}>
      <div className={styles.title}>
        <AppearTitle>
          <h1 className="h3">I study computer science at the University of Waterloo.</h1>
        </AppearTitle>
      </div>
      <div className={clsx(styles.text, 'p-l', styles.myStory)}>
        <AppearTitle>About me</AppearTitle>
      </div>
      <div className={styles.desc}>
        <AppearTitle>
          <p className="h6">At RBC I built tools to make it easier to look after hundreds of banking apps. At Magna I wrote software that automated safety analysis for automotive engineers.</p>
          <p className={clsx(styles.paddingTop, 'h6')}>Outside of work, I’ve built robots, worked on a high-altitude radio payload, and designed a keyboard down to its PCB and firmware.</p>
        </AppearTitle>
      </div>
    </section>
  );
}

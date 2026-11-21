import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import projects from '@src/constants/projects';
import { useStore } from '@src/store';
import styles from './projectWindow.module.scss';

const OpenProject = createContext(null);
const ProjectVisible = createContext(false);

export function useProjectWindowOpen() {
  return useContext(ProjectVisible);
}

// Keep a real destination for open-in-new-tab, copy link, and navigation without JS.
export function ProjectLink({ project, children, className, id, 'aria-label': label, 'data-project-art-track': artworkTrack }) {
  const open = useContext(OpenProject);
  return (
    <a
      className={className}
      id={id}
      aria-label={label}
      data-project-art-track={artworkTrack ? '' : undefined}
      href={project.website}
      onClick={(event) => {
        if (!open || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
        event.preventDefault();
        open(project, event.currentTarget);
      }}
    >
      {children}
    </a>
  );
}

export function ProjectWindowProvider({ children }) {
  const router = useRouter();
  const caller = useRef(null);
  const dialog = useRef(null);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const project = router.isReady && projects.find((item) => router.asPath.endsWith(`#view=${item.id}`));

  const open = useCallback(
    (item, trigger) => {
      caller.current = {
        trigger,
        url: router.asPath,
        historyKey: window.navigation?.currentEntry?.key,
      };
      const base = router.asPath.split('#')[0];
      router.push(`${base}#view=${item.id}`, undefined, { shallow: true, scroll: false });
    },
    [router],
  );

  const close = () => {
    const origin = caller.current;
    // A project can have its own history. Go straight to our original entry.
    if (origin?.historyKey && window.navigation?.entries().some((entry) => entry.key === origin.historyKey)) {
      window.navigation.traverseTo(origin.historyKey);
      return;
    }
    router.replace(origin?.url || router.asPath.split('#')[0], undefined, { shallow: true, scroll: false });
  };

  useEffect(() => {
    if (!project) return undefined;
    const modal = dialog.current;
    const trigger = caller.current?.trigger || document.activeElement;
    const main = document.getElementById('main');
    const { lenis } = useStore.getState();
    const running = lenis && !lenis.isStopped;
    if (running) lenis.stop();
    const start = main ? main.scrollTop : window.scrollY;
    modal.showModal();
    setReady(false);
    setSlow(false);
    const timer = window.setTimeout(() => setSlow(true), 12000);
    return () => {
      window.clearTimeout(timer);
      modal.close();
      if (running) lenis.start();
      if (main && lenis) lenis.scrollTo(start, { immediate: true, force: true });
      else if (main) main.scrollTop = start;
      else window.scrollTo({ top: start, behavior: 'instant' });
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [project]);

  return (
    <OpenProject.Provider value={open}>
      <ProjectVisible.Provider value={Boolean(project)}>{children}</ProjectVisible.Provider>
      {project && (
        <dialog
          ref={dialog}
          className={styles.window}
          aria-labelledby="project-window-title"
          onCancel={(event) => {
            event.preventDefault();
            close();
          }}
        >
          <div className={styles.toolbar}>
            <button type="button" className={styles.back} onClick={close}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m10 5-7 7 7 7M4 12h17" />
              </svg>
              Back
            </button>
            <strong id="project-window-title">{project.title}</strong>
            <a className={styles.external} href={project.website} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} in a new tab`} title="Open in a new tab">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M13 4h7v7m0-7L10 14m0-9H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-5" />
              </svg>
            </a>
          </div>
          <div className={styles.viewport}>
            {!ready && (
              <div className={styles.loading} role="status">
                {slow ? (
                  <a href={project.website} target="_blank" rel="noreferrer">
                    Taking a while. Open {project.title} directly ↗
                  </a>
                ) : (
                  `Opening ${project.title}…`
                )}
              </div>
            )}
            <iframe
              key={project.id}
              title={`${project.title} website`}
              src={project.website}
              data-ready={ready}
              onLoad={() => setReady(true)}
              allow="fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads"
            />
          </div>
        </dialog>
      )}
    </OpenProject.Provider>
  );
}

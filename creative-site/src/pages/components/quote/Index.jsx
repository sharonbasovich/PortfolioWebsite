import TextOpacity from '@src/components/animationComponents/textOpacity/Index';
import clsx from 'clsx';
import styles from '@src/pages/components/quote/styles/quote.module.scss';
import { useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

const quote = "I've won 13 hackathons. I'm a robotics world champion, and I'm relentlessly curious.";

function Quote() {
  const [isLoading] = useStore(useShallow((state) => [state.isLoading]));

  const rootRef = useRef();
  const textRef = useRef();

  return (
    <section ref={rootRef} className={clsx(styles.root, 'layout-block-inner')}>
      <h3 ref={textRef} className={clsx(styles.text, 'h3')}>
        {isLoading ? quote : (
          <TextOpacity textRef={textRef.current} trigger={rootRef.current}>
            {quote}
          </TextOpacity>
        )}
      </h3>
    </section>
  );
}

export default Quote;

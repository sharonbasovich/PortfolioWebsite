import Head from 'next/head';
import { useStore } from '@src/store';

export default function CustomHead({ title = 'Sharon', description = 'Sharon Basovich studies computer science at the University of Waterloo and builds inference infrastructure at Abstract.' }) {
  const theme = useStore((state) => state.theme);
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="author" content="Sharon Basovich" />
      <meta name="portfolio-version" content="giats" />
      <meta name="theme-color" content={theme === 'dark' ? '#10141d' : '#f0f4f1'} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <link rel="icon" type="image/svg+xml" href="/sharon/icon.svg" />
    </Head>
  );
}

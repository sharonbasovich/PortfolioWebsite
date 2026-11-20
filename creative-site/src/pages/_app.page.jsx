/* eslint-disable react/jsx-props-no-spreading */
import '@src/styles/global.scss';
import '@src/styles/global.css';
import dynamic from 'next/dynamic';
import { ProjectWindowProvider } from '@src/components/dom/projectWindow/ProjectWindow';

const PortfolioApp = dynamic(() => import('@src/components/dom/PortfolioApp'));

export default function MyApp(props) {
  const { Component, pageProps, router } = props;
  return <ProjectWindowProvider>{router.pathname === '/story' ? <Component {...pageProps} /> : <PortfolioApp {...props} />}</ProjectWindowProvider>;
}

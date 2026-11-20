import Link from 'next/link';
import CustomHead from '@src/components/dom/CustomHead';

export default function Custom404() {
  return (
    <section className="layout-block-inner" style={{ paddingTop: '24vh', minHeight: '70vh', background: 'var(--white)' }}>
      <CustomHead title="Page not found · Sharon Basovich" />
      <h1 className="h2">Page not found.</h1>
      <Link href="/" className="h6">
        Back home ↗
      </Link>
    </section>
  );
}

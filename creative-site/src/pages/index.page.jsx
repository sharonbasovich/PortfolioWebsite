/* eslint-disable react/jsx-props-no-spreading */
import Home from '@src/pages/components/home/Index';
import Quote from '@src/pages/components/quote/Index';
import Projects from '@src/pages/components/projects/Index';
import Clients from '@src/pages/components/clients/Index';
import CustomHead from '@src/components/dom/CustomHead';

function Page() {
  return (
    <>
      <CustomHead />
      <Home />
      <Clients />
      <Quote />
      <Projects />
    </>
  );
}

export default Page;

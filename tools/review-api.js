// Served only by the local review server, never from Vercel's output directory.
export function installReview(api) {
  window.__portfolioReview = Object.freeze(api);
  const panel=document.createElement('details');panel.id='local-qa';panel.style.cssText='position:fixed;bottom:4px;left:4px;z-index:99999;max-width:min(360px,calc(100vw - 8px));box-sizing:border-box;background:#fff;color:#111;border:1px solid #aaa;font:11px system-ui;padding:4px;';
  const summary=document.createElement('summary');summary.textContent='Local QA';panel.append(summary);
  const output=document.createElement('output');output.id='local-qa-state';output.style.cssText='display:block;max-height:150px;overflow:auto;white-space:pre-wrap';
  const capture=()=>{const s=api.getState();output.textContent=JSON.stringify({viewport:s.viewport,paused:s.paused,intro:s.studyIntro,projects:s.projects,internships:s.internships,contact:s.contact,routeProgress:s.routeProgress,routeDrawProgress:s.routeDrawProgress,world:s.world?{carrier:s.world.carrier,dockSparks:s.world.dockSparks}:null,scrollY:s.scrollY},null,2);};
  const button=(label,action)=>{const b=document.createElement('button');b.textContent=label;b.style.cssText='font:11px system-ui;margin:2px;padding:3px;';b.onclick=()=>{action();capture()};panel.append(b);};
  button('Refresh layout',()=>api.refreshLayout());
  button('About join',()=>api.seekRouteJoin());
  button('About complete',()=>api.seekAboutComplete());
  for(const p of [0,.3,.65,1])button(`Title ${p}`,()=>api.seekStudyIntro(p));
  for(const i of [0,1,2,3])button(`Project ${i}`,()=>api.jumpProject(i));
  for(const p of [0,.5,1])button(`Internship ${p}`,()=>api.seekSection('internship-gallery',p));
  for(const p of [0,.4,.85,1])button(`Contact ${p}`,()=>api.seekSection('contact-expand',p));
  button('Capture state',capture);panel.append(output);document.body.append(panel);capture();
}

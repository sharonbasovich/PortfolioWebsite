import { initFlexCarousel } from './flex-carousel.js';

const clamp = x => Math.max(0, Math.min(1, x));
const settle = x => { const p = clamp(x); return p*p*p*(p*(p*6-15)+10); };

/** ECHO's actual liquid carousel, advanced by the page's existing scroll clock. */
export function mountEchoProjects({gallery,track,panels,clock,gsap,ScrollTrigger,holdDuration=1.2,transferDuration=.9}) {
  const originals = panels.map(panel => ({panel,style:panel.getAttribute('style'),hidden:panel.getAttribute('aria-hidden'),inert:panel.inert,copy:panel.querySelector('.project-copy')}));
  const records = originals.map(r => {
    const img=r.panel.querySelector('.project-evidence img');
    const more=r.copy.querySelector('[data-project-details]');
    return {...r,img,more,moreNext:more.nextSibling,copyStyle:r.copy.getAttribute('style'),aspect:Number(img.dataset.frameRatio)||img.width/img.height};
  });
  const strip=document.createElement('div');strip.className='echo-project-strip';
  const fallback=document.createElement('div');fallback.className='echo-project-fallback';fallback.setAttribute('aria-hidden','true');
  const surface=document.createElement('div');surface.className='echo-project-canvas';
  const items=records.map(r=>({src:r.img.src,alt:r.img.alt,aspect:r.aspect,
    width:r.img.width,height:r.img.height,focusY:Number(r.img.dataset.frameFocusY??.5),contain:r.panel.dataset.projectKey==='marble'||r.panel.dataset.projectKey==='hpc',
    surface:r.panel.dataset.projectKey==='marble'?[.969,.973,.988]:[.047,.071,.118]}));
  for (let i=0;i<records.length;i++) {
    const card=document.createElement('div');card.className='echo-fallback-card';
    const img=records[i].img.cloneNode();img.loading='eager';card.append(img);fallback.append(card);records[i].fallback=card;
    records[i].img.loading='eager';
    records[i].copy.querySelector('.project-actions').prepend(records[i].more);
    card.style.background=items[i].contain&&i===1?'#f7f8fc':'#0c121e';
    card.style.setProperty('--image-aspect',records[i].aspect);
    img.style.objectFit=items[i].contain?'contain':'cover';if(items[i].contain)img.style.padding='24px';
  }
  strip.append(fallback,surface);gallery.append(strip);gallery.classList.add('echo-gallery','is-horizontal');
  let renderer;
  try { renderer=initFlexCarousel(surface,{items,className:'echo-project-canvas',preset:'liquid',externalClock:true,intro:'fade',cardHeight:.88,gap:18,radius:18,squeeze:.08,focusOnClick:false,captureWheel:false,captions:false,dispersion:.18}); }
  catch(error) { console.warn('Using the readable image carousel fallback.',error); }
  if(renderer)gallery.classList.add('echo-webgl');
  const oldCopyHeight=gallery.style.getPropertyValue('--project-copy-height');
  function measureCards(){
    const height=Math.max(...records.map(r=>r.copy.getBoundingClientRect().height));
    gallery.style.setProperty('--project-copy-height',`${Math.ceil(height)+18}px`);
    renderer?.resize();
  }
  measureCards();ScrollTrigger.addEventListener('refreshInit',measureCards);
  const resizeObserver=new ResizeObserver(([entry])=>strip.style.setProperty('--strip-height',`${entry.contentRect.height}px`));resizeObserver.observe(strip);
  let disposed=false,last=-1;
  function update(index=clock.index,time=0,render=true) {
    if(disposed)return;
    const raw=Math.max(0,Math.min(records.length-1,index)),a=Math.floor(raw),f=raw-a;
    const at=a+settle(f);renderer?.setProgress(at);if(render)renderer?.render(performance.now());
    if(Math.abs(raw-last)<.00001)return;last=raw;
    const selected=Math.round(raw);
    records.forEach((r,i)=>{
      let opacity=0,x=36;
      if(i===a){const t=settle(f/.48);opacity=1-t;x=-30*t;}
      else if(i===a+1){const t=settle((f-.4)/.6);opacity=t;x=36*(1-t);}
      r.copy.style.opacity=opacity.toFixed(4);r.copy.style.visibility=opacity>.001?'visible':'hidden';r.copy.style.transform=`translate3d(${x}px,0,0)`;
      r.panel.inert=i!==selected||opacity<.1;r.panel.setAttribute('aria-hidden',String(r.panel.inert));r.copy.style.pointerEvents=r.panel.inert?'none':'auto';
      const distance=i-at;r.fallback.style.transform=`translate(-50%,-50%) translateX(${distance*75}vw) scale(${1-Math.min(.14,Math.abs(distance)*.08)})`;
      r.fallback.style.opacity=String(Math.max(0,1-Math.abs(distance)*.2));
    });
    surface.setAttribute('aria-label',records[selected].img.alt);
  }
  function getFirstBounds() {
    if(renderer)return renderer.getFirstBounds();
    const r=strip.getBoundingClientRect(),height=r.height*.88,width=Math.min(r.width*.72,height*records[0].aspect);
    return {left:r.left+(r.width-width)/2,top:r.top+(r.height-height)/2,width,height};
  }
  gsap.set(clock,{index:0});
  const timeline=gsap.timeline({scrollTrigger:{id:'projects-liquid-gallery',trigger:gallery,start:'top top',end:()=>`+=${innerHeight*3.2*records.length/3}`,pin:true,scrub:true,anticipatePin:1,invalidateOnRefresh:true,refreshPriority:1},onUpdate:()=>update(clock.index,0,false)});
  timeline.to(clock,{index:0,duration:holdDuration,ease:'none'});
  for(let i=1;i<records.length;i++){timeline.to(clock,{index:i,duration:transferDuration,ease:'none'});timeline.to({},{duration:holdDuration});}
  update();
  return {timeline,trigger:timeline.scrollTrigger,frame:strip,firstImage:records[0].img,ratio:records[0].aspect,getFirstBounds,update,
    getState:()=>({enabled:true,index:clock.index,webgl:Boolean(renderer),renderer:renderer?.getState()}),
    dispose(){if(disposed)return;disposed=true;timeline.scrollTrigger?.kill();timeline.kill();ScrollTrigger.removeEventListener('refreshInit',measureCards);resizeObserver.disconnect();renderer?.destroy();strip.remove();gallery.classList.remove('echo-gallery','echo-webgl','is-horizontal');if(oldCopyHeight)gallery.style.setProperty('--project-copy-height',oldCopyHeight);else gallery.style.removeProperty('--project-copy-height');
      for(const r of records){r.copy.insertBefore(r.more,r.moreNext);for(const [node,key,value]of[[r.panel,'style',r.style],[r.panel,'aria-hidden',r.hidden],[r.copy,'style',r.copyStyle]]){if(value===null)node.removeAttribute(key);else node.setAttribute(key,value);}r.panel.inert=r.inert;}
    }};
}

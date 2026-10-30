// Adapted from ECHO's scroll-expand-media.js: expanding centre card,
// separating title words, ambient fade and late content reveal. MIT declaration
// and upstream revision are recorded in SOURCE.md. GSAP owns the existing clock.
const clamp=x=>Math.max(0,Math.min(1,x));
export function mountContactExpansion({section,gsap,ScrollTrigger,enabled,contained=false}) {
 const noop={dispose(){},getState:()=>({enabled:false})};if(!enabled)return noop;
 const layout=section.querySelector('.contact-layout'),copy=layout.querySelector('.contact-copy'),heading=copy.querySelector('h2');
 const art=layout.querySelector('.contact-window'),footer=section.querySelector('footer');
 const footerStyle=footer.getAttribute('style'),footerInert=footer.inert;
 const old={sectionStyle:section.getAttribute('style'),layoutStyle:layout.getAttribute('style'),copyStyle:copy.getAttribute('style'),headingStyle:heading.getAttribute('style'),artStyle:art.getAttribute('style'),emailStyle:copy.querySelector('.email').getAttribute('style')};
 const runway=document.createElement('div');runway.className='echo-contact-runway';
 const stage=document.createElement('div');stage.className='echo-contact-stage';
 const ambient=document.createElement('div');ambient.className='echo-contact-ambient';ambient.setAttribute('aria-hidden','true');
 const title=document.createElement('div');title.className='echo-contact-title';title.setAttribute('aria-hidden','true');title.innerHTML="<span>Let's</span><span>talk.</span>";
 const content=document.createElement('div');content.className='echo-contact-content';
 const nodes=[...copy.children].filter(n=>n!==heading);nodes.forEach(n=>content.append(n));copy.append(content);
 layout.before(runway);stage.append(ambient,layout,title,footer);runway.append(stage);section.classList.add('echo-contact');
 const clock={progress:0};let sizes,last=-1,disposed=false;
 function measure(){
 const w=stage.clientWidth,h=stage.clientHeight,header=Math.max(document.querySelector('.site-header').getBoundingClientRect().height,w<=650?114:0);
 const safeTop=header+16,safeBottom=h-(w<=600?100:64),endW=Math.min(w-32,1280),endH=Math.min(720,Math.max(150,safeBottom-safeTop));
 const center=(safeTop+safeBottom)/2;
 sizes={endW,endH,startW:Math.min(300,endW*.75),startH:Math.min(380,endH*.82)};
 layout.style.width=`${endW}px`;layout.style.height=`${endH}px`;layout.style.top=`${center}px`;
 title.style.top=`${center}px`;title.style.transform='translateY(-50%)';
 const gutter=Math.min(48,Math.max(24,w*.03));content.style.top=`${gutter}px`;
 const links=content.querySelector('.contact-links'),email=content.querySelector('.email');
 email.style.bottom=`${links.getBoundingClientRect().height+16}px`;
 last=-1;update();
 }
 function update(){if(disposed||!sizes)return;const p=clamp(clock.progress),open=clamp(p/.9);if(Math.abs(p-last)<.00001)return;last=p;
 const {endW,endH,startW,startH}=sizes;
 const x=(1-(startW+open*(endW-startW))/endW)*50,y=(1-(startH+open*(endH-startH))/endH)*50;
 layout.style.clipPath=`inset(${y}% ${x}% round 24px)`;
 // A phone's canvas lives inside this DOM card and inherits its clip. Keep
 // its render size stable instead of stretching or reallocating it on scroll.
 art.style.transform=contained?'none':`scale(${1-x/50},${1-y/50})`;
 const opacity=clamp(1-open*1.6);[...title.children].forEach((word,i)=>{word.style.transform=`translateX(${(i?1:-1)*open*110}vw)`;word.style.opacity=String(opacity)});
 ambient.style.opacity=String(clamp(1-open*1.3));
 const reveal=clamp((p-.78)/.22);footer.style.opacity=String(reveal);footer.inert=reveal<.9;content.style.opacity=String(reveal);content.style.transform=`translateY(${(1-reveal)*14}px)`;content.inert=reveal<.9;
 }
 measure();const timeline=gsap.timeline({scrollTrigger:{id:'contact-expand',trigger:runway,start:'top top',end:'clamp(bottom bottom)',scrub:true,invalidateOnRefresh:true,onRefresh:measure}}).to(clock,{progress:1,ease:'none',onUpdate:update});
 return {update,getState:()=>({enabled:true,progress:clock.progress}),dispose(){if(disposed)return;disposed=true;timeline.scrollTrigger?.kill();timeline.kill();nodes.forEach(n=>copy.append(n));content.remove();runway.before(layout);runway.after(footer);runway.remove();if(footerStyle===null)footer.removeAttribute('style');else footer.setAttribute('style',footerStyle);footer.inert=footerInert;section.classList.remove('echo-contact');for(const [n,v]of[[section,old.sectionStyle],[layout,old.layoutStyle],[copy,old.copyStyle],[heading,old.headingStyle],[art,old.artStyle],[copy.querySelector('.email'),old.emailStyle]]){if(v===null)n.removeAttribute('style');else n.setAttribute('style',v);}}};
}

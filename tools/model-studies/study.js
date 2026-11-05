import * as THREE from 'three';
import { RoomEnvironment } from '/dist/startup/vendor/three/addons/environments/RoomEnvironment.js';
import { makeModel } from './models.js';

const concepts={
  watch:{subject:'01 / HOROLOGY',title:'A closer look at time.',copy:'A machined case, open-work movement, blued hands, and a rotating gear train. Scroll to separate its construction.',description:'A mechanical watch with articulated bracelet ends, open movement, moving hands and a scroll-separated dial.'},
  keyboard:{subject:'02 / MECHANICAL KEYBOARDS',title:'Built, one layer at a time.',copy:'An aluminium keyboard with individually sculpted keycaps, switches, a mounting plate, and a circuit board. Scroll to lift the layers.',description:'An aluminium mechanical keyboard with key legends and a scroll-separated keycap, switch, plate and circuit-board assembly.'},
  payload:{subject:'03 / SKYCELL',title:'Software, off the ground.',copy:'A radio payload with a LoRa module, GPS patch, antenna, battery bay, and a removable enclosure. Scroll to open it up.',description:'An illustrative SkyCell-inspired radio payload with an exposed circuit board, antenna, GPS patch and separate enclosure.'}
};
const canvas=document.querySelector('#scene'),stage=canvas.parentElement,section=document.querySelector('.study');
const motion=matchMedia('(prefers-reduced-motion: reduce)'),small=matchMedia('(max-width:600px)');
let paused=false,hidden=document.hidden,lost=false,frame=0,time=0,last=0,progress=0,manual=null,model,environment,renderer,disposed=false;
let pointer={x:0,y:0},target={x:0,y:0};
const camera=new THREE.PerspectiveCamera(34,1,.1,70);camera.position.set(0,0,10.8);
const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xecf3ff,0x24324c,2));
const key=new THREE.DirectionalLight(0xffffff,3.3);key.position.set(-3,5,6);scene.add(key);
const rim=new THREE.DirectionalLight(0x8cafff,2.7);rim.position.set(4,-1,3);scene.add(rim);
const slider=document.createElement('label');slider.className='assembly-control';slider.innerHTML='<span>Inspect assembly</span><input aria-label="Assembly separation" type="range" min="0" max="100" value="0"><button type="button">Follow scroll</button>';
stage.append(slider);
const style=document.createElement('style');style.textContent='.assembly-control{position:absolute;left:26px;right:26px;bottom:45px;display:flex;align-items:center;gap:18px;font-size:11px;color:#c7d4e8}.assembly-control input{accent-color:#86adff;min-width:40px;flex:1;height:36px;margin:0}.assembly-control button{background:none;border:0;border-bottom:1px solid #a9b2c666;font-size:11px;color:inherit;padding:8px 0;min-height:36px}.assembly-control button:disabled{opacity:.45;cursor:default}@media(max-width:600px){.assembly-control{left:18px;right:18px;gap:12px}.assembly-control>span{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.assembly-control input,.assembly-control button{min-height:44px}}';document.head.append(style);
const range=slider.querySelector('input'),follow=slider.querySelector('button');follow.disabled=true;
function showFallback(){document.querySelector('.fallback').hidden=false;canvas.hidden=true;slider.hidden=true;stage.querySelector('.stage-bottom').hidden=true;document.querySelector('#pause').hidden=true;}
range.addEventListener('input',()=>{manual=range.valueAsNumber/100;follow.disabled=false;requestFrame();});
follow.addEventListener('click',()=>{manual=null;follow.disabled=true;requestFrame();});
function select(kind){
  const choice=concepts[kind]?kind:'watch';model?.dispose();model=makeModel(choice);scene.add(model.root);
  const item=concepts[choice];document.querySelector('#subject').textContent=item.subject;document.querySelector('#concept-title').textContent=item.title;document.querySelector('#concept-copy').textContent=motion.matches?item.copy.replace(/Scroll to[^.]*\./,'Use the slider to inspect each layer.'):item.copy;canvas.setAttribute('aria-label',item.description);
  for(const a of document.querySelectorAll('[data-model]')){if(a.dataset.model===choice)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');}
  manual=null;follow.disabled=true;fit();requestFrame();
}
function fit(){if(!renderer||!model)return;const r=stage.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;
  // Fit the actual assembled and separated geometry, including the antenna,
  // rather than a guessed box based on a desktop screenshot.
  const envelope=new THREE.Box3();
  for(const p of [0,.5,1]){model.update(time,p,{x:0,y:0},false);model.root.updateMatrixWorld(true);envelope.union(new THREE.Box3().setFromObject(model.root));}
  const size=envelope.getSize(new THREE.Vector3()),center=envelope.getCenter(new THREE.Vector3());
  const safeHeight=Math.max(.5,(r.height-148)/r.height),safeWidth=Math.max(.5,(r.width-60)/r.width);
  const distance=Math.max(size.y/safeHeight,size.x/(camera.aspect*safeWidth))/2/Math.tan(camera.fov*Math.PI/360)*1.04+size.z/2;
  camera.position.set(center.x,center.y,center.z+distance);camera.lookAt(center);camera.updateProjectionMatrix();requestFrame();
}
function getProgress(){const r=section.getBoundingClientRect();
  if(small.matches){const start=Math.max(0,scrollY+r.top-75),end=Math.max(start+160,scrollY+stage.getBoundingClientRect().top-70);return Math.max(0,Math.min(1,(scrollY-start)/(end-start)));}
  return Math.max(0,Math.min(1,-r.top/Math.max(1,r.height-innerHeight)));
}
function requestFrame(){if(!frame&&!disposed&&!hidden&&!lost)frame=requestAnimationFrame(render);}
function render(now){frame=0;if(disposed||hidden||!renderer)return;const dt=Math.min(.05,last?(now-last)/1000:0);last=now;
  const active=!paused&&!motion.matches;if(active)time+=dt;
  const p=manual??(motion.matches?0:paused?progress:getProgress());progress=p;
  if(active){pointer.x+=(target.x-pointer.x)*(1-Math.exp(-dt*9));pointer.y+=(target.y-pointer.y)*(1-Math.exp(-dt*9));}
  model.update(time,p,pointer,active);renderer.render(scene,camera);
  document.querySelector('.progress i').style.transform=`scaleX(${p})`;document.querySelector('#percent').textContent=`${Math.round(p*100)}%`;document.querySelector('#part-label').textContent=p<.08?'Assembled':p>.94?'Exploded view':'Separating layers';if(manual===null)range.value=String(Math.round(p*100));
  const r=stage.getBoundingClientRect();if(active&&r.bottom>0&&r.top<innerHeight)requestFrame();
}
try{
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'default'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,small.matches?1.25:1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  const gen=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();environment=gen.fromScene(room,.03);scene.environment=environment.texture;gen.dispose();room.dispose();
}catch(error){showFallback();renderer?.dispose();renderer=null;console.warn('Model study unavailable.',error);}
select(new URLSearchParams(location.search).get('model'));
document.querySelectorAll('[data-model]').forEach(a=>a.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();const kind=a.dataset.model;history.replaceState(null,'',`?model=${kind}`);select(kind);}));
const pause=document.querySelector('#pause');pause.addEventListener('click',()=>{paused=!paused;pause.textContent=paused?'Resume motion':'Pause motion';pause.setAttribute('aria-pressed',String(paused));requestFrame();});
const onMotion=()=>{pause.disabled=motion.matches;pause.textContent=motion.matches?'Reduced motion':paused?'Resume motion':'Pause motion';if(model){const copy=concepts[model.kind].copy;document.querySelector('#concept-copy').textContent=motion.matches?copy.replace(/Scroll to[^.]*\./,'Use the slider to inspect each layer.'):copy;}requestFrame();};onMotion();
stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=stage.getBoundingClientRect();target.x=(e.clientX-r.left)/r.width-.5;target.y=(e.clientY-r.top)/r.height-.5;requestFrame();});stage.addEventListener('pointerleave',()=>{target={x:0,y:0};requestFrame();});
const observer=new ResizeObserver(fit);observer.observe(stage);
const onScroll=()=>requestFrame(),onVisibility=()=>{hidden=document.hidden;last=0;if(hidden){cancelAnimationFrame(frame);frame=0;}else requestFrame();};
window.addEventListener('scroll',onScroll,{passive:true});document.addEventListener('visibilitychange',onVisibility);motion.addEventListener('change',onMotion);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;showFallback();cancelAnimationFrame(frame);frame=0;});canvas.addEventListener('webglcontextrestored',()=>location.reload());
window.addEventListener('pagehide',e=>{if(e.persisted)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();model?.dispose();environment?.dispose();renderer?.dispose();window.removeEventListener('scroll',onScroll);document.removeEventListener('visibilitychange',onVisibility);motion.removeEventListener('change',onMotion);});

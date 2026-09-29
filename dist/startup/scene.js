import * as THREE from './vendor/three/three.module.js';
import Lenis from './vendor/lenis/lenis.js';

// Reusable foundations: Bruno Simon's Codrops fixed-canvas/camera-group pattern,
// GSAP's documented scrubbed timeline, and Lenis' GSAP ticker integration.
// References and dependency licenses are linked from resources.html.
const canvas = document.querySelector('#scene');
const button = document.querySelector('.motion');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const small = matchMedia('(max-width: 700px)');
let paused = reduced.matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas, antialias: !small.matches, alpha: true, powerPreference: 'low-power'});
} catch {
  document.body.classList.add('no-webgl');
}

if (renderer) {
  if (document.readyState === 'loading') await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, {once:true}));
  const {gsap, ScrollTrigger} = window;
  gsap.registerPlugin(ScrollTrigger);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 100);
  camera.position.z = 10;
  const cameraGroup = new THREE.Group();
  cameraGroup.add(camera);scene.add(cameraGroup);
  const field = new THREE.Group();scene.add(field);
  const count = small.matches ? 1000 : 2200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const targets = Array.from({length:4}, () => new Float32Array(count * 3));
  const knotGeometry = new THREE.TorusKnotGeometry(1.65,.47,240,12,2,3);
  const knotPositions = knotGeometry.getAttribute('position');
  const tintA = new THREE.Color('#d0ff71'), tintB = new THREE.Color('#3fb8ff');
  const color = new THREE.Color();
  // Fibonacci sphere, regular volumetric lattice, double helix, and Three.js knot surface.
  // These are abstract geometry, not charts of actual company or financial records.
  for (let i=0;i<count;i++) {
    const n=i*3, f=i/(count-1), y=1-2*f, radius=Math.sqrt(1-y*y), a=i*Math.PI*(3-Math.sqrt(5));
    targets[0].set([Math.cos(a)*radius*2.45,y*2.45,Math.sin(a)*radius*2.45],n);
    const side=Math.ceil(Math.cbrt(count));
    targets[1].set([((i%side)/(side-1)-.5)*4.1,((Math.floor(i/side)%side)/(side-1)-.5)*4.1,((Math.floor(i/side**2))/(side-1)-.5)*4.1],n);
    const angle=f*Math.PI*11+(i%2)*Math.PI;
    targets[2].set([Math.cos(angle)*1.7,(f-.5)*6,Math.sin(angle)*1.7],n);
    const k=Math.floor(f*(knotPositions.count-1));
    targets[3].set([knotPositions.getX(k),knotPositions.getY(k),knotPositions.getZ(k)],n);
    color.copy(tintA).lerp(tintB,f*.9);colors.set([color.r,color.g,color.b],n);
  }
  positions.set(targets[0]);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const material=new THREE.PointsMaterial({size:small.matches?.047:.042,vertexColors:true,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending});
  const points=new THREE.Points(geometry,material);field.add(points);
  const wireMaterial=new THREE.MeshBasicMaterial({color:'#a9ff84',wireframe:true,transparent:true,opacity:.32,depthWrite:false,blending:THREE.AdditiveBlending});
  const wire=new THREE.Mesh(new THREE.IcosahedronGeometry(2.45,2),wireMaterial);field.add(wire);
  const orbit=new THREE.Group();field.add(orbit);
  for(let i=0;i<3;i++) {
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2.85+i*.18,.008,4,160),new THREE.MeshBasicMaterial({color:i===1?'#73caff':'#d0ff71',transparent:true,opacity:.6}));
    ring.rotation.set(Math.PI*.35+i*.6,i*.5,.2);orbit.add(ring);
  }
  const state={morph:0,rx:.1,ry:0,rz:-.18,x:small.matches?.7:2.25,scale:1,z:10,orbit:1};
  const pointer={x:0,y:0};
  addEventListener('pointermove',e=>{if(e.pointerType!=='touch'){pointer.x=e.clientX/innerWidth-.5;pointer.y=e.clientY/innerHeight-.5;}},{passive:true});
  const lenis=new Lenis({duration:1.05,smoothWheel:true,syncTouch:false,anchors:true});
  lenis.on('scroll',ScrollTrigger.update);
  const tl=gsap.timeline({scrollTrigger:{trigger:'main',start:'top top',end:'bottom bottom',scrub:1.2},defaults:{ease:'power2.inOut'}});
  tl.to(state,{morph:1,rx:.45,ry:1.4,rz:.3,x:small.matches?.4:2.3,z:9.8,orbit:.05,duration:1})
    .to(state,{morph:2,rx:-.4,ry:3.4,rz:-.55,x:small.matches?.6:2.9,z:10.6,orbit:.15,duration:1})
    .to(state,{morph:3,rx:1,ry:5.6,rz:.4,x:small.matches?-.4:-2.6,z:9.5,orbit:.7,duration:1.15})
    .to(state,{morph:0,rx:.2,ry:7.8,rz:0,x:0,z:8.5,scale:1.2,orbit:1,duration:.85});
  const statusLabels=['CONNECT','ENGINEER','ANALYZE','BUILD','COLLABORATE'];
  const sections=[...document.querySelectorAll('.chapter')];
  sections.forEach((section,i)=>{
    const label=()=>{
      document.querySelector('.status-index').textContent=`0${i+1} / 05`;
      document.querySelector('.status-label').textContent=statusLabels[i];
    };
    ScrollTrigger.create({trigger:section,start:'top center',end:'bottom center',onEnter:label,onEnterBack:label});
  });
  ScrollTrigger.create({trigger:'main',start:'top top',end:'bottom bottom',onUpdate:self=>{
    document.querySelector('.progress span').style.transform=`scaleX(${self.progress})`;
  }});
  const cardTweens = [];
  if (!reduced.matches && !small.matches) {
    document.querySelectorAll('.project-list article').forEach(card => {
      cardTweens.push(gsap.fromTo(card, {y:65, rotationX:9, rotationY:-5, transformPerspective:1100, transformOrigin:'center center'}, {
        y:0, rotationX:0, rotationY:0, ease:'none',
        scrollTrigger:{trigger:card,start:'top bottom',end:'top 48%',scrub:.8}
      }));
    });
  }
  let lastTime=0;
  function render(time,force=false) {
    if(!force&&(paused||document.hidden))return;
    if(!force&&time-lastTime<1/(small.matches?30:60))return;
    lastTime=time;
    const m=state.morph,from=Math.floor(m)%4,to=(from+1)%4,mix=m-Math.floor(m);
    for(let i=0;i<positions.length;i++)positions[i]=THREE.MathUtils.lerp(targets[from][i],targets[to][i],mix);
    geometry.attributes.position.needsUpdate=true;
    field.rotation.set(state.rx+Math.sin(time*.17)*.025,state.ry+time*.035,state.rz);
    field.position.x=state.x;field.scale.setScalar(state.scale);
    wire.rotation.y=-time*.06;wireMaterial.opacity=.32*(1-Math.min(1,m));
    orbit.rotation.y=time*.045;orbit.scale.setScalar(.9+state.orbit*.1);
    orbit.children.forEach(r=>r.material.opacity=state.orbit*.6);
    camera.position.z=state.z;
    cameraGroup.position.x+=(pointer.x*.22-cameraGroup.position.x)*.04;
    cameraGroup.position.y+=(-pointer.y*.18-cameraGroup.position.y)*.04;
    renderer.render(scene,camera);
  }
  const resize=()=>{
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,small.matches?1.4:1.8));
    render(lastTime,true);
  };
  // Pause stops automatic movement and scroll interpolation; native scrolling remains available.
  // Lenis is optional: it is used only while initial reduced-motion preference permits it.
  let lenisActive=!paused;
  if(paused)lenis.destroy();
  const updateMotion=value=>{
    if(value&&lenisActive){lenis.destroy();lenisActive=false;}
    paused=value;button.textContent=paused?'Enable motion':'Pause motion';
    button.setAttribute('aria-pressed',String(paused));document.body.classList.toggle('reduced-motion',paused);
    if(paused) {
      tl.scrollTrigger.disable(false);
      cardTweens.forEach(tween=>{tween.scrollTrigger.disable(false);tween.progress(1);});
    } else {
      tl.scrollTrigger.enable();cardTweens.forEach(tween=>tween.scrollTrigger.enable());
    }
  };
  button.hidden=false;button.addEventListener('click',()=>updateMotion(!paused));
  reduced.addEventListener('change',e=>updateMotion(e.matches));
  updateMotion(paused);resize();
  gsap.ticker.add(time=>{if(lenisActive)lenis.raf(time*1000);render(time);});
  gsap.ticker.lagSmoothing(0);
  addEventListener('resize',resize,{passive:true});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;document.body.classList.add('no-webgl');button.hidden=true;});
  document.body.classList.add('scene-ready');
  render(0,true);
}

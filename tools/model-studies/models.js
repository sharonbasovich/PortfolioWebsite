import * as THREE from 'three';
import { RoundedBoxGeometry } from '/dist/startup/vendor/three/addons/geometries/RoundedBoxGeometry.js';

// Original, illustrative geometry. The returned rig has no renderer or ticker;
// the host owns time, visibility, framing and resource disposal.
export function makeModel(kind) {
  const root = new THREE.Group(), parts = [], moving = [], materials = new Set(), geometries = new Set(), textures = new Set();
  const mat = (color, metalness=.0, roughness=.4, extra={}) => {
    const m = new THREE.MeshStandardMaterial({color, metalness, roughness, ...extra}); materials.add(m); return m;
  };
  const steel=mat(0xbccbd8,1,.21), edge=mat(0xe2e8ed,1,.13), dark=mat(0x101b2a,.45,.3), blue=mat(0x204fc7,.65,.22), gold=mat(0xbca16b,.85,.29), ivory=mat(0xe8e8e1,.08,.3), pcb=mat(0x173b36,.35,.42), black=mat(0x0a1015,.1,.48);
  const geo = g => (geometries.add(g),g), shapeCache=new Map();
  const cached=(key,create)=>{if(!shapeCache.has(key))shapeCache.set(key,geo(create()));return shapeCache.get(key);};
  const mesh = (parent,g,m,x=0,y=0,z=0) => {const o=new THREE.Mesh(g,m); o.position.set(x,y,z); parent.add(o); return o;};
  const rounded = (w,h,d,r=.04) => cached(`r:${w}:${h}:${d}:${r}`,()=>new RoundedBoxGeometry(w,h,d,3,r));
  const cylinder = (r,h,n=64) => cached(`c:${r}:${h}:${n}`,()=>new THREE.CylinderGeometry(r,r,h,n));
  const disk = (p,r,d,m,x=0,y=0,z=0) => {const o=mesh(p,cylinder(r,d),m,x,y,z);o.rotation.x=Math.PI/2;return o;};
  const ring = (p,r,t,m,x=0,y=0,z=0) => mesh(p,geo(new THREE.TorusGeometry(r,t,12,96)),m,x,y,z);
  const group = (x=0,y=0,z=0,lift=[0,0,0],order=0) => {const o=new THREE.Group();o.position.set(x,y,z);root.add(o);parts.push({object:o,base:o.position.clone(),lift:new THREE.Vector3(...lift),order});return o;};
  const label = (parent,text,w,h,x,y,z,{color='#e4e8ed',size=60,background=null}={}) => {
    const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');
    if(background){ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);}ctx.font=`500 ${size}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,512,128);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.add(t);
    const m=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false});materials.add(m);return mesh(parent,geo(new THREE.PlaneGeometry(w,h)),m,x,y,z);
  };
  const screw = (p,x,y,z,r=.035) => {disk(p,r,.018,edge,x,y,z);mesh(p,rounded(r*1.15,.008,.004,.002),dark,x,y,z+.011);};
  function gear(p,r,teeth,m,x,y,z) {
    const s=new THREE.Shape();
    for(let i=0;i<teeth*4;i++){const a=i/(teeth*4)*Math.PI*2,rr=r*(i%4===0||i%4===3?.88:1);i?s.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):s.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}s.closePath();
    const hole=new THREE.Path();hole.absarc(0,0,r*.3,0,Math.PI*2,true);s.holes.push(hole);
    const g=new THREE.Group();g.position.set(x,y,z);p.add(g);mesh(g,geo(new THREE.ExtrudeGeometry(s,{depth:.045,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.008,bevelThickness:.008,curveSegments:32})),m);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const spoke=mesh(g,rounded(r*.7,.035,.04,.006),m,Math.cos(a)*r*.37,Math.sin(a)*r*.37,.023);spoke.rotation.z=a;}
    disk(g,r*.15,.1,steel,0,0,.025);return g;
  }
  let tilt, spin;
  if(kind==='watch') {
    // A legible wristwatch: lugs, case, crown, dial, hands and an open movement.
    const base=group(0,0,-.16,[0,0,-.65]);
    const profile=[[1.30,-.18],[1.39,-.14],[1.43,-.08],[1.43,.13],[1.39,.20],[1.25,.20],[1.23,.13],[1.23,-.14],[1.30,-.18]].map(([r,y])=>new THREE.Vector2(r,y));
    const body=mesh(base,geo(new THREE.LatheGeometry(profile,96)),steel);body.rotation.x=Math.PI/2;
    for(const y of [-1,1]){
      for(const x of [-1,1]){const lug=mesh(base,rounded(.23,.54,.24,.07),steel,x*.95,y*1.37,-.03);lug.rotation.z=-x*y*.22;}
      mesh(base,rounded(1.88,.08,.08,.03),steel,0,y*1.59,-.04);
    }
    // Short articulated bracelet ends are subordinate to the movement.
    for(const side of [-1,1])for(let row=0;row<3;row++){
      const y=side*(1.7+row*.27),z=-.1-row*.03;
      for(let col=-1;col<=1;col++){mesh(base,rounded(col===0?.58:.35,.24,.13,.045),col===0?edge:steel,col*.44,y,z);}
    }
    const crown=new THREE.Group();base.add(crown);crown.position.set(1.47,0,-.02);const crownCore=mesh(crown,cylinder(.16,.24,48),steel);crownCore.rotation.z=Math.PI/2;
    for(let i=0;i<28;i++){let a=i/28*Math.PI*2;const ridge=mesh(crown,rounded(.19,.014,.014,.003),edge,0,Math.sin(a)*.16,Math.cos(a)*.16);ridge.rotation.x=-a;}
    const movement=group(0,0,-.12,[0,0,-.1],.1);disk(movement,1.21,.12,dark);
    const train=[[-.56,.32,.35,26,1],[.05,.58,.25,22,-1.25],[.60,.25,.32,24,1],[-.15,-.43,.43,32,-.75],[.64,-.52,.22,20,1.45]];
    for(const [x,y,r,n,v] of train){const wheel=gear(movement,r,n,gold,x,y,.09);moving.push((t)=>wheel.rotation.z=t*v*.13);screw(movement,x,y,.21,.029);}
    const bridge=mesh(movement,rounded(1.75,.16,.08,.05),steel,.02,.02,.20);bridge.rotation.z=.65;
    const bridge2=mesh(movement,rounded(.83,.19,.08,.045),steel,-.37,-.45,.22);bridge2.rotation.z=-.45;
    const ruby=mat(0x8d214c,.45,.18);
    for(const [x,y] of [[-.64,-.46],[.68,.58],[-.48,.49]]){screw(movement,x,y,.27,.045);disk(movement,.024,.012,ruby,x,y,.288);}
    const dial=group(0,0,.14,[0,0,.70],.25);ring(dial,1.15,.08,ivory);
    for(let i=0;i<60;i++){const a=i/60*Math.PI*2;const tick=mesh(dial,rounded(i%5===0?.035:.015,i%5===0?.17:.07,.018,.004),i%5===0?edge:gold,Math.sin(a)*1.08,Math.cos(a)*1.08,.06);tick.rotation.z=-a;}
    for(const [n,x,y] of [['12',0,.91],['3',.94,0],['6',0,-.91],['9',-.94,0]])label(dial,n,.24,.12,x,y,.085,{size:140});
    label(dial,'BASOVICH',.7,.17,0,.37,.08,{size:45});
    const hands=group(0,0,.27,[0,0,1.25],.40);
    const hand=(length,width,angle,m,z)=>{const pivot=new THREE.Group();hands.add(pivot);mesh(pivot,rounded(width,length,.025,width/3),m,0,length*.35,z);pivot.rotation.z=angle;return pivot;};
    hand(.73,.075,-Math.PI/3,blue,0);hand(.99,.048,Math.PI/3,blue,.035);const second=hand(1.1,.014,Math.PI*.85,gold,.065);moving.push(t=>second.rotation.z=Math.PI*.85-t*Math.PI/30);disk(hands,.078,.07,edge,0,0,.06);
    const bezel=group(0,0,.25,[0,0,1.65],.55);ring(bezel,1.30,.085,edge);ring(bezel,1.21,.022,blue,0,0,.02);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;screw(bezel,Math.sin(a)*1.31,Math.cos(a)*1.31,.07,.032);}
    tilt=[.15,-.38,-.20];spin=.035;root.scale.setScalar(1.02);
  } else if(kind==='keyboard') {
    const bottom=group(0,0,-.18,[0,0,-.9]);mesh(bottom,rounded(4.9,1.85,.28,.19),steel);mesh(bottom,rounded(4.67,1.63,.025,.13),dark,0,0,.15);
    // USB-C opening and rear feet make the enclosure read as a keyboard case.
    mesh(bottom,rounded(.30,.08,.07,.025),black,1.83,.93,-.03);
    const board=group(0,0,.0,[0,0,-.33],.1);mesh(board,rounded(4.57,1.49,.08,.1),pcb);
    const plate=group(0,0,.10,[0,0,.35],.2);mesh(plate,rounded(4.61,1.53,.06,.11),dark);
    const caps=group(0,0,.21,[0,0,1.3],.35),switches=group(0,0,.16,[0,0,.70],.28);
    const rows=[['esc','1','2','3','4','5','6','7','8','9','0','−','=','⌫'],['tab','Q','W','E','R','T','Y','U','I','O','P','[',']'],['ctrl','A','S','D','F','G','H','J','K','L',';','↵'],['shift','Z','X','C','V','B','N','M',',','.','/','↑'],['fn','alt','cmd','space','cmd','alt','←','↓','→']];
    // Legends share one canvas atlas and one material, not one texture per key.
    const atlas=document.createElement('canvas');atlas.width=2048;atlas.height=1024;const ctx=atlas.getContext('2d');const legends=[...new Set(rows.flat())];
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#27323e';ctx.font='500 52px Arial';legends.forEach((t,i)=>ctx.fillText(t==='space'?'':t,(i%16)*128+64,Math.floor(i/16)*128+64));
    const tx=new THREE.CanvasTexture(atlas);tx.colorSpace=THREE.SRGBColorSpace;textures.add(tx);const lm=new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false});materials.add(lm);
    const unit=.316;
    rows.forEach((row,ri)=>{
      const widths=row.map((k,i)=>k==='space'?5.3:ri===0&&i===13?1.8:ri===1&&i===0?1.5:ri===2&&(i===0||i===11)?1.5:ri===3&&i===0?2:1);
      const sum=widths.reduce((a,b)=>a+b,0);let pos=-sum*unit/2;
      row.forEach((key,i)=>{const w=widths[i]*unit-.035,x=pos+widths[i]*unit/2,y=.60-ri*.306;pos+=widths[i]*unit;
        const keyGroup=new THREE.Group();caps.add(keyGroup);keyGroup.position.set(x,y,0);
        const cap=mesh(keyGroup,rounded(w,.265,.17,.035),key==='esc'||key==='↵'?blue:ivory);cap.rotation.x=-.07;
        mesh(switches,rounded(Math.min(w,.20),.19,.12,.025),black,x,y,0);mesh(board,rounded(.06,.06,.025,.005),gold,x,y,.05);
        const idx=legends.indexOf(key),g=geo(new THREE.PlaneGeometry(Math.min(w,.28),.20));const uv=g.attributes.uv;for(let j=0;j<uv.count;j++)uv.setXY(j,(uv.getX(j)+idx%16)/16,(uv.getY(j)+7-Math.floor(idx/16))/8);
        const l=mesh(keyGroup,g,lm,0,0,.091);if(key==='esc'||key==='↵')l.material=mat(0xffffff,0,.5,{map:tx,transparent:true});
      });
    });
    for(const x of [-2.18,2.18])for(const y of [-.65,.65])screw(plate,x,y,.075,.025);
    label(bottom,'B A S O V I C H',1.6,.12,0,-.82,.15,{size:42,color:'#687b93'});
    tilt=[-.82,-.14,-.08];spin=.025;
  } else {
    const shell=group(0,0,-.1,[0,0,-.75]);
    mesh(shell,rounded(1.95,1.72,.65,.12),ivory);mesh(shell,rounded(1.77,1.55,.04,.08),dark,0,0,.34);
    // Four exposed stand-offs support the radio board above the battery cavity.
    for(const x of [-.72,.72])for(const y of [-.6,.6]){const s=mesh(shell,cylinder(.055,.45,20),gold,x,y,.35);s.rotation.x=Math.PI/2;screw(shell,x,y,.60,.045);}
    mesh(shell,rounded(1.25,.8,.22,.06),steel,0,0,.35);label(shell,'Li-ion',.54,.14,0,0,.47,{size:85,color:'#0a172b'});
    const board=group(0,0,.53,[0,0,.45],.2);mesh(board,rounded(1.61,1.37,.065,.065),pcb);
    const shield=group(.24,.18,.60,[.25,.15,1.0],.4);mesh(shield,rounded(.83,.69,.09,.045),steel);label(shield,'LoRa',.51,.17,0,.03,.05,{size:95,color:'#253848'});
    for(let i=0;i<11;i++){const x=-.60+i*.115;mesh(board,rounded(.045,.10,.026,.005),gold,x,-.48,.05);}
    mesh(board,rounded(.34,.36,.065,.025),black,-.48,.24,.065);
    for(let i=0;i<8;i++){const y=-.2+i*.055;mesh(board,rounded(.11,.018,.02,.003),steel,-.70,y,.05);}
    for(const [x,y] of [[-.45,-.1],[-.2,-.13],[.14,-.28],[.58,-.25],[.59,.55]]){mesh(board,rounded(.10,.065,.045,.01),black,x,y,.065);mesh(board,rounded(.025,.065,.05,.004),gold,x-.05,y,.065);}
    const gps=group(-.46,.86,.56,[-.35,.55,.85],.3);mesh(gps,rounded(.59,.42,.12,.055),ivory);disk(gps,.13,.04,gold,0,0,.08);
    const antenna=group(.78,.88,.18,[.55,.65,-.1],.18);const rod=mesh(antenna,cylinder(.025,1.5,20),dark,0,.70,0);rod.rotation.z=-.18;disk(antenna,.095,.16,gold);ring(antenna,.07,.022,edge);
    const lid=group(0,0,.75,[-.65,.25,1.65],.55);mesh(lid,rounded(1.96,1.72,.095,.12),ivory);mesh(lid,rounded(1.47,.65,.012,.05),blue,0,-.05,.055);label(lid,'SKYCELL',1.19,.29,0,-.05,.065,{size:88});
    for(const x of [-.79,.79])for(const y of [-.66,.66])screw(lid,x,y,.063,.036);
    for(let i=0;i<6;i++)mesh(lid,rounded(.40,.018,.01,.005),dark,-.43,.48-i*.06,.055);
    // Detachable bottom mounting rail echoes a payload attachment, not solar wings.
    const rail=group(0,-1.03,-.22,[0,-.5,-.3],.15);mesh(rail,rounded(2.2,.16,.22,.04),steel);
    for(const x of [-.87,.87])ring(rail,.08,.024,dark,x,0,.13);
    tilt=[-.25,-.48,-.12];spin=.025;
  }
  // Batch repeated rigid details within each moving layer. Pointer/scroll
  // transforms belong to the layer, so screws, keycaps and ticks need no
  // individual draw calls. Moving watch wheels retain their own transforms.
  root.updateMatrixWorld(true);
  for(const part of parts){
    const batches=new Map(),inverse=new THREE.Matrix4().copy(part.object.matrixWorld).invert();
    part.object.traverse(o=>{if(!o.isMesh)return;
      // Wheels have animated ancestors and therefore cannot join a rigid batch.
      let ancestor=o.parent,animated=false;while(ancestor&&ancestor!==part.object){if(kind==='watch'&&part.object===parts[1].object){animated=true;break;}ancestor=ancestor.parent;}
      if(animated)return;
      const key=`${o.geometry.uuid}:${o.material.uuid}`;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);
    });
    for(const meshes of batches.values()){
      if(meshes.length<2)continue;const instanced=new THREE.InstancedMesh(meshes[0].geometry,meshes[0].material,meshes.length);
      meshes.forEach((o,i)=>{instanced.setMatrixAt(i,new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));o.removeFromParent();});instanced.instanceMatrix.needsUpdate=true;part.object.add(instanced);
    }
  }
  const bounds=new THREE.Box3().setFromObject(root);const center=bounds.getCenter(new THREE.Vector3());
  // Store immutable authored positions. No frame adds onto its previous pose.
  const baseRotation=new THREE.Euler(...tilt);
  return {root,kind,parts,center,
    update(t,p,pointer,motion=true){
      const e=p*p*(3-2*p);
      root.rotation.set(baseRotation.x+(motion?Math.sin(t*.42)*.025:0)+(pointer?.y||0)*.10,baseRotation.y-e*.25+(motion?Math.sin(t*.31)*spin:0)+(pointer?.x||0)*.15,baseRotation.z);
      for(const part of parts){const v=Math.max(0,Math.min(1,(e-part.order*.28)/(1-part.order*.28)));part.object.position.copy(part.base).addScaledVector(part.lift,v);}
      if(motion)for(const animate of moving)animate(t);
    },
    dispose(){root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();root.removeFromParent();}
  };
}

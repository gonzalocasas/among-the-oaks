import * as THREE from 'three/webgpu';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {GaussianSplat} from 'three/addons/objects/GaussianSplat.js';
import {SPZLoader} from 'three/addons/loaders/SPZLoader.js';
import {GaussianSplatPLYLoader} from 'three/addons/loaders/GaussianSplatPLYLoader.js';
import {SPLATLoader} from 'three/addons/loaders/SPLATLoader.js';
import {KSPLATLoader} from 'three/addons/loaders/KSPLATLoader.js';
// Two artistic approaches, ONE forest layout, ONE first-person camera and ONE measurement harness.
// A transparent renderer fallback is managed by Three.js WebGPURenderer itself.
const $=id=>document.getElementById(id);
const scene=new THREE.Scene(); const clock=new THREE.Clock();
const camera=new THREE.PerspectiveCamera(67,innerWidth/innerHeight,0.07,160);
camera.position.set(2.7,1.75,11.5); let yaw=0.07,pitch=-0.015;
const renderer=new THREE.WebGPURenderer({antialias:true,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.25;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const sun=new THREE.DirectionalLight(0xffdfa0,3.3); sun.position.set(-14,25,-17);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-36;sun.shadow.camera.right=36;sun.shadow.camera.top=36;sun.shadow.camera.bottom=-36;sun.shadow.camera.near=0.5;sun.shadow.camera.far=90;sun.shadow.bias=-.0006;scene.add(sun);scene.add(sun.target);
const ambient=new THREE.HemisphereLight(0xc9e0cf,0x756548,1.8);scene.add(ambient);
// Sky: camera-following dome with a vertical blue gradient and a warm glow around the sun.
const SUN_NATURAL=new THREE.Vector3(-14,18,-22);
const SKY_HORIZON=new THREE.Color(0x9cc6ee),SKY_ZENITH=new THREE.Color(0x2a66cc),SKY_GLOW=new THREE.Color(0xffe2a0);
const sky=(()=>{const g=new THREE.SphereGeometry(140,64,32),pos=g.attributes.position,col=new Float32Array(pos.count*3),d=new THREE.Vector3(),sd=SUN_NATURAL.clone().normalize(),c=new THREE.Color();
 for(let i=0;i<pos.count;i++){d.fromBufferAttribute(pos,i).normalize();const h=Math.max(d.y,0);c.copy(SKY_HORIZON).lerp(SKY_ZENITH,Math.pow(h,0.3));const glow=Math.pow(Math.max(d.dot(sd),0),24);c.lerp(SKY_GLOW,glow*0.12);col.set([c.r,c.g,c.b],i*3)}
 g.setAttribute('color',new THREE.BufferAttribute(col,3));const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));m.renderOrder=-1;m.frustumCulled=false;scene.add(m);
 // Sun disc: small bright core with a tight warm rim, parented to the dome so it stays at sky distance.
 const cv=document.createElement('canvas');cv.width=cv.height=128;const cx=cv.getContext('2d'),gr=cx.createRadialGradient(64,64,0,64,64,64);
 gr.addColorStop(0,'rgba(255,253,235,1)');gr.addColorStop(0.28,'rgba(255,226,140,1)');gr.addColorStop(0.36,'rgba(255,196,90,0.55)');gr.addColorStop(0.55,'rgba(255,170,60,0.12)');gr.addColorStop(1,'rgba(255,160,60,0)');
 cx.fillStyle=gr;cx.fillRect(0,0,128,128);const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 const disc=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,fog:false,toneMapped:false,depthWrite:false,transparent:true}));
 disc.position.copy(SUN_NATURAL).normalize().multiplyScalar(130);disc.scale.setScalar(19);m.add(disc);return m})();
const TREES=[[-13,-12,1.5,111],[11,-12,1.55,112],[-18,3,1.4,113],[18,0,1.5,114],[-12,15,1.5,115],[14,17,1.4,116],[1,-26,1.9,117],[29,-16,2,118],[-29,-20,1.8,119]];
const COLLIDERS=[[0,-4,2.3],...TREES.map(([x,z,sc])=>[x,z,0.55*sc+0.45])];const vel={x:0,z:0};let bob=0;
let forest=null,quality='medium', frameStats=[], lastReport=0;
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rand=rng(2341);
function texWood(bark=true){const c=document.createElement('canvas');c.width=256;c.height=512;const x=c.getContext('2d');x.fillStyle=bark?'#62523e':'#b89665';x.fillRect(0,0,c.width,c.height);const r=rng(bark?12:13);for(let i=0;i<1100;i++){const X=r()*256,Y=r()*512;x.strokeStyle=bark?`rgba(${10+r()*38},${12+r()*28},${5+r()*18},${.1+r()*.42})`:`rgba(92,55,22,${.02+r()*.16})`;x.lineWidth=bark?1+r()*5:.3+r()*1.4;x.beginPath();x.moveTo(X,Y);x.bezierCurveTo(X-8+r()*16,Y+12,X-8+r()*16,Y+27,X-9+r()*18,Y+45+r()*100);x.stroke()} const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1,2);t.anisotropy=4;return t}
const barkTex=texWood(true),woodTex=texWood(false);
function mat(color,rough=1,map){return new THREE.MeshStandardMaterial({color,roughness:rough,map:map||null})}
function cylinderBetween(a,b,r1,r2,material,radial=8){const v=new THREE.Vector3().subVectors(b,a),len=v.length();const m=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,len,radial,1),material);m.position.copy(a).addScaledVector(v,.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());m.castShadow=true;m.receiveShadow=true;return m}
function groundMaterials(){const g= new THREE.Mesh(new THREE.PlaneGeometry(180,180,1,1),mat(0x626d4d));g.rotation.x=-Math.PI/2;g.receiveShadow=true;g.position.y=-.08;return g}
function createTree(group,px,pz,scale,seed,main,detail){const r=rng(seed);const root=new THREE.Group();root.position.set(px,0,pz);group.add(root);
 const bark=mat(0xa78c6b,1,barkTex);const rootBase=scale*(main?.76:.39),height=scale*(main?8.8:5.7);
 const trunk=cylinderBetween(new THREE.Vector3(0,0,0),new THREE.Vector3(0,height,0),rootBase,rootBase*.65,bark,12);root.add(trunk);
 const branchMat=bark;
 const leafColor=[0x667d37,0x7e9646,0x8da451,0x506d36,0xa6a35b];
 const canopyCenters=[];const branches=main?9:6;
 for(let j=0;j<branches;j++){const a=(j/branches)*Math.PI*2+r()*.42;const start=new THREE.Vector3(0,height*(.55+r()*.15),0);const end=new THREE.Vector3(Math.cos(a)*scale*(1.7+r()*1.4),height*(.8+r()*.29),Math.sin(a)*scale*(1.7+r()*1.4));root.add(cylinderBetween(start,end,rootBase*.19,rootBase*.065,branchMat,7));canopyCenters.push(end)}canopyCenters.push(new THREE.Vector3(0,height*1.1,0));
 const leafMat=leafColor.map(c=>new THREE.MeshStandardMaterial({color:c,roughness:1,side:THREE.DoubleSide,transparent:false}));
 {const count=(main?detail*190:detail*90);const leafGeo=new THREE.PlaneGeometry(.25*scale,.52*scale);leafGeo.translate(0,.12*scale,0);
  const mats=leafMat;const bucket=Array.from({length:mats.length},()=>[]);
  for(let i=0;i<count;i++){const c=canopyCenters[Math.floor(r()*canopyCenters.length)];const theta=r()*Math.PI*2,phi=Math.acos(2*r()-1);let rr=Math.cbrt(r())*scale*(main?1.7:1.2);const pos=new THREE.Vector3(c.x+rr*Math.cos(theta)*Math.sin(phi),c.y+rr*.53*Math.cos(phi),c.z+rr*Math.sin(theta)*Math.sin(phi));bucket[Math.floor(r()*mats.length)].push([pos,r()*6.283,r()*6.283,.65+r()*.7])}
  for(let b=0;b<mats.length;b++){const entries=bucket[b];const inst=new THREE.InstancedMesh(leafGeo,mats[b],entries.length);const obj=new THREE.Object3D();entries.forEach(([p,ry,rz,s],i)=>{obj.position.copy(p);obj.rotation.set(.5+r()*.8,ry,rz);obj.scale.setScalar(s);obj.updateMatrix();inst.setMatrixAt(i,obj.matrix)});inst.instanceMatrix.needsUpdate=true;inst.castShadow=false;inst.receiveShadow=false;inst.frustumCulled=false;root.add(inst)}
 }
 if(main){for(let k=0;k<7;k++){const a=k/7*Math.PI*2;const m=cylinderBetween(new THREE.Vector3(Math.cos(a)*rootBase*.95,.1,Math.sin(a)*rootBase*.95),new THREE.Vector3(Math.cos(a)*rootBase*1.8,.04,Math.sin(a)*rootBase*1.8),rootBase*.24,.025,bark,6);root.add(m)}}
 // Merge trunk, branches and roots (all bark) into one mesh: one draw call per tree instead of ~10-17.
 const wood=root.children.filter(c=>c.isMesh&&!c.isInstancedMesh&&c.material===bark);const geos=wood.map(c=>{c.updateMatrix();const g=c.geometry.clone().applyMatrix4(c.matrix);c.geometry.dispose();root.remove(c);return g});
 const merged=new THREE.Mesh(mergeGeometries(geos,false),bark);geos.forEach(g=>g.dispose());merged.castShadow=true;merged.receiveShadow=true;root.add(merged);return root}
function makeGroundObjects(group,detail){const r=rng(654);const rockGeo=new THREE.DodecahedronGeometry(1,0);const rockMat=mat(0x8e9080);const n=detail*170;const inst=new THREE.InstancedMesh(rockGeo,rockMat,n);const o=new THREE.Object3D();for(let i=0;i<n;i++){const a=r()*Math.PI*2,rr=2+r()*39;o.position.set(Math.cos(a)*rr,0.05,Math.sin(a)*rr);o.rotation.set(r()*2,r()*3,r()*2);o.scale.set(.08+r()*.45,.06+r()*.15,.08+r()*.35);o.updateMatrix();inst.setMatrixAt(i,o.matrix)}inst.instanceMatrix.needsUpdate=true;group.add(inst);
 const groundLeaf=new THREE.PlaneGeometry(.21,.33);const groundMat=new THREE.MeshBasicMaterial({color:0xb19a61,side:THREE.DoubleSide});const leafN=detail*900;const fallen=new THREE.InstancedMesh(groundLeaf,groundMat,leafN);for(let i=0;i<leafN;i++){const a=r()*Math.PI*2,rr=1+r()*42;o.position.set(Math.cos(a)*rr,.02,Math.sin(a)*rr);o.rotation.set(-Math.PI/2,0,r()*6.28);o.scale.setScalar(.45+r()*.7);o.updateMatrix();fallen.setMatrixAt(i,o.matrix)}fallen.instanceMatrix.needsUpdate=true;group.add(fallen);
 const count=detail*600;const bladeGeo=new THREE.ConeGeometry(.037,.5,3);const grassMat=mat(0x8c9a57);const grass=new THREE.InstancedMesh(bladeGeo,grassMat,count);for(let i=0;i<count;i++){const a=r()*Math.PI*2,rr=1.5+r()*37;o.position.set(Math.cos(a)*rr,.12,Math.sin(a)*rr);o.rotation.set((r()-.5)*.45,r()*6.28,(r()-.5)*.45);o.scale.setScalar(.35+r()*1.1);o.updateMatrix();grass.setMatrixAt(i,o.matrix)}grass.instanceMatrix.needsUpdate=true;group.add(grass);
}
function logs(group){const b=mat(0xa28a6c,1,barkTex);const face=mat(0xd4b281,1,woodTex);for(let i=0;i<4;i++){let x=-4+i*.9,z=6.2+(i%2)*.65;const len=1.5+(i%2)*.45,rad=.27+(i%3)*.06;const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,len,12,1,false),[b,face,face]);mesh.rotation.z=Math.PI/2;mesh.position.set(x,.4,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)}}
function build(){if(forest){scene.remove(forest);forest.traverse(n=>{if(n.geometry)n.geometry.dispose();if(n.material&&n.material!==barkTex){const arr=Array.isArray(n.material)?n.material:[n.material];arr.forEach(m=>m.dispose?.())}})}forest=new THREE.Group();scene.add(forest);const detail={low:1,medium:2,high:4}[quality];forest.add(groundMaterials());
 createTree(forest,0,-4,1.8,701,true,detail);TREES.forEach(([x,z,s,seed])=>createTree(forest,x,z,s,seed,false,detail));makeGroundObjects(forest,detail);logs(forest);scene.background=new THREE.Color(SKY_HORIZON);scene.fog=new THREE.FogExp2(SKY_HORIZON,.0045);
 sun.color.set(0xffc25a);sun.position.copy(SUN_NATURAL);sun.intensity=4.6;ambient.color.set(0xdde4dc);ambient.groundColor.set(0x9a7445);ambient.intensity=1.35;renderer.toneMappingExposure=1.3;renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?2:quality==='medium'?1.5:1));sun.shadow.mapSize.set(quality==='high'?2048:1024,quality==='high'?2048:1024);
 $('status').textContent='Naturalistic materials · dense leaf instances';frameStats=[];}
let keys={};window.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyR')reset();if(e.code==='KeyQ'){const opts=['low','medium','high'];$('quality').value=opts[(opts.indexOf(quality)+1)%3];quality=$('quality').value;build()}});window.addEventListener('keyup',e=>keys[e.code]=false);
function reset(){camera.position.set(2.7,1.75,11.5);yaw=.07;pitch=-.015;vel.x=vel.z=0}
$('quality').onchange=e=>{quality=e.target.value;build()};$('reset').onclick=reset;
const reports=[];$('export').onclick=()=>{const payload={project:'Among the Oaks · One Oak Benchmark',date:new Date().toISOString(),userAgent:navigator.userAgent,backend:$('backend').textContent,quality,splat:splatStats,report:reports.slice(-60),notes:'FPS is measured from requestAnimationFrame cadence; GPU time is not measured.'};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='among-the-oaks-benchmark.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
renderer.domElement.addEventListener('click',()=>{if(!matchMedia('(pointer:coarse)').matches)renderer.domElement.requestPointerLock?.()});document.addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement){yaw-=e.movementX*.0022;pitch=Math.max(-1.2,Math.min(1.2,pitch-e.movementY*.0022))}});
let stickX=0,stickY=0,stickId=null;const stick=$('stick'),knob=$('knob');function updateStick(e){const b=stick.getBoundingClientRect(),dx=e.clientX-(b.left+b.width/2),dy=e.clientY-(b.top+b.height/2);const len=Math.max(1,Math.hypot(dx,dy));const f=Math.min(1,len/38);stickX=dx/len*f;stickY=dy/len*f;knob.style.transform=`translate(${stickX*34}px,${stickY*34}px)`}stick.addEventListener('pointerdown',e=>{stickId=e.pointerId;stick.setPointerCapture(e.pointerId);updateStick(e)});stick.addEventListener('pointermove',e=>{if(stickId===e.pointerId)updateStick(e)});const end=()=>{stickId=null;stickX=stickY=0;knob.style.transform='translate(0,0)'};stick.addEventListener('pointerup',end);stick.addEventListener('pointercancel',end);
const look=$('look');let lookLast=null;look.addEventListener('pointerdown',e=>{look.setPointerCapture(e.pointerId);lookLast=[e.clientX,e.clientY]});look.addEventListener('pointermove',e=>{if(lookLast){yaw-=(e.clientX-lookLast[0])*.004;pitch=Math.max(-1.2,Math.min(1.2,pitch-(e.clientY-lookLast[1])*.004));lookLast=[e.clientX,e.clientY]}});look.addEventListener('pointerup',()=>lookLast=null);look.addEventListener('pointercancel',()=>lookLast=null);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
function tick(){const dt=Math.min(clock.getDelta(),.055);camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;// Movement: camera-relative (forward = -Z rotated by yaw), smoothed velocity, slide along trunks instead of stopping dead.
let f=(Number(!!keys.KeyW||!!keys.ArrowUp)-Number(!!keys.KeyS||!!keys.ArrowDown))-stickY,st=(Number(!!keys.KeyD||!!keys.ArrowRight)-Number(!!keys.KeyA||!!keys.ArrowLeft))+stickX;const mag=Math.hypot(f,st);if(mag>1){f/=mag;st/=mag}
const maxSpeed=(keys.ShiftLeft||keys.ShiftRight)?6:2.4,sn=Math.sin(yaw),cs=Math.cos(yaw);const tvx=(-sn*f+cs*st)*maxSpeed,tvz=(-cs*f-sn*st)*maxSpeed;const k=1-Math.exp(-(mag>0.01?10:14)*dt);vel.x+=(tvx-vel.x)*k;vel.z+=(tvz-vel.z)*k;
let nx=camera.position.x+vel.x*dt,nz=camera.position.z+vel.z*dt;for(const [cx,cz,r] of COLLIDERS){const ddx=nx-cx,ddz=nz-cz,d=Math.hypot(ddx,ddz);if(d<r&&d>1e-4){nx=cx+ddx/d*r;nz=cz+ddz/d*r}}const rr=Math.hypot(nx,nz);if(rr>45){nx*=45/rr;nz*=45/rr}camera.position.x=nx;camera.position.z=nz;
bob+=Math.hypot(vel.x,vel.z)*dt*2.2;camera.position.y=1.75+Math.sin(bob)*0.025*Math.min(1,Math.hypot(vel.x,vel.z)/2.4);
 sky.position.copy(camera.position);renderer.render(scene,camera);const elapsed=dt*1000;if(elapsed>0&&elapsed<100)frameStats.push(elapsed);if(frameStats.length>120)frameStats.shift();const now=performance.now();if(now-lastReport>700){const sorted=[...frameStats].sort((a,b)=>a-b);const med=sorted[Math.floor(sorted.length/2)]||0;const fps=med?1000/med:0;$('fps').textContent=fps.toFixed(1);$('ms').textContent=med.toFixed(1);$('draws').textContent=renderer.info.render.drawCalls.toLocaleString();$('triangles').textContent=renderer.info.render.triangles.toLocaleString();reports.push({at:now,quality,fps:Math.round(fps*10)/10,frameMs:med,draws:renderer.info.render.drawCalls,triangles:renderer.info.render.triangles});if(reports.length>500)reports.shift();lastReport=now}}

// ---- Gaussian splat experiment -------------------------------------------------------------
// Uses three.js r186's native GaussianSplat (WebGPU compute sort; JS sort on the WebGL2 fallback).
// A splat is placed on the ground ~6 m in front of the camera. Objects outside 0.3-40 m are scaled
// to 3 m; otherwise the capture keeps its own (usually metric) scale. Splats don't cast shadows or take fog.
const SPLAT_SAMPLES={lion:{name:'lion.v3.spz',url:'./splats/lion.v3.spz?v=__BUILD__',flip:true,fit:1.4,credit:'Sample splat “Lion” by Renaud (superspl.at), CC BY 4.0'}};
let splatMesh=null,splatPlace=null,splatStats=null;
function splatLoaderFor(name){const n=name.toLowerCase().split('?')[0];if(n.endsWith('.spz'))return SPZLoader;if(n.endsWith('.ply'))return GaussianSplatPLYLoader;if(n.endsWith('.ksplat'))return KSPLATLoader;if(n.endsWith('.splat'))return SPLATLoader;return null}
function clearSplat(){if(!splatMesh)return;scene.remove(splatMesh);splatMesh.geometry.dispose();splatMesh.material.dispose();splatMesh=null;splatStats=null;$('flip').hidden=true;$('splatrow').hidden=true}
function placeSplat(){const m=splatMesh,o=splatPlace;m.position.set(0,0,0);m.rotation.set(o.flip?Math.PI:0,o.yaw,0);m.scale.setScalar(1);m.updateMatrixWorld(true);
 let box=m.splatGeometry.boundingBox.clone().applyMatrix4(m.matrixWorld);const size=box.getSize(new THREE.Vector3()),maxDim=Math.max(size.x,size.y,size.z);
 const sc=o.fit?o.fit/size.y:(maxDim>40||maxDim<0.3?3/maxDim:1);m.scale.setScalar(sc);m.updateMatrixWorld(true);box=m.splatGeometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
 const c=box.getCenter(new THREE.Vector3());m.position.set(o.target.x-c.x,-box.min.y,o.target.z-c.z);splatStats.scale=+sc.toFixed(3)}
async function loadSplat(url,name,opts={}){const L=splatLoaderFor(name);if(!L){$('status').textContent='Unsupported splat file: '+name+' (use .spz, .ply, .splat or .ksplat)';return}
 $('status').textContent='Loading splat '+name+'…';const t0=performance.now();
 try{const data=await new L().loadAsync(url);const t1=performance.now();clearSplat();splatMesh=new GaussianSplat(data);
  const fwd=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),target=camera.position.clone().addScaledVector(fwd,6);target.y=0;const tr=Math.hypot(target.x,target.z);if(tr>40)target.multiplyScalar(40/tr);
  splatPlace={flip:!!opts.flip,fit:opts.fit||0,yaw:yaw,target};splatStats={name,count:data.getAttribute('position').count,bytes:opts.bytes||null,loadMs:Math.round(t1-t0),scale:1};
  placeSplat();scene.add(splatMesh);$('flip').hidden=false;$('splatrow').hidden=false;$('splatcount').textContent=splatStats.count.toLocaleString()+' · '+splatStats.loadMs+' ms load';
  $('status').textContent=opts.credit||('Splat '+name+' · '+splatStats.count.toLocaleString()+' splats')}
 catch(e){console.error(e);$('status').textContent='Splat failed to load: '+e.message}}
$('splat').onchange=e=>{const v=e.target.value;if(v==='none'){clearSplat();$('status').textContent='Naturalistic materials · dense leaf instances'}else if(SPLAT_SAMPLES[v]){const sm=SPLAT_SAMPLES[v];loadSplat(sm.url,sm.name,sm)}};
$('open').onclick=()=>$('splatfile').click();
$('splatfile').onchange=e=>{const f=e.target.files[0];if(!f)return;const u=URL.createObjectURL(f);$('splat').value='none';loadSplat(u,f.name,{bytes:f.size}).finally(()=>URL.revokeObjectURL(u));e.target.value=''};
$('flip').onclick=()=>{if(!splatMesh)return;splatPlace.flip=!splatPlace.flip;placeSplat()};
// Keep the status pill just below the (wrapping) header.
function placeStatus(){$('status').style.top=Math.round(document.querySelector('header').getBoundingClientRect().bottom+8)+'px'}
window.addEventListener('resize',placeStatus);placeStatus();
(async()=>{try{await renderer.init();$('backend').textContent=renderer.backend?.isWebGPUBackend?'WebGPU':'WebGL2 fallback';build();renderer.setAnimationLoop(tick)}catch(e){$('status').textContent='Unable to start renderer: '+e.message;console.error(e)}})();

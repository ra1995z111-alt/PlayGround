import * as THREE from 'three';

const canvas = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x858074);
scene.fog = new THREE.FogExp2(0x77766c, 0.021);
const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 150);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x858074, 1);

const hemi = new THREE.HemisphereLight(0xc5c9c1, 0x392c22, 1.6); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffddb0, 3.2); sun.position.set(-18, 30, 10); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -28; sun.shadow.camera.right = 28; sun.shadow.camera.top = 28; sun.shadow.camera.bottom = -28; sun.shadow.bias = -0.00035; sun.shadow.normalBias = 0.035; scene.add(sun);
const fill = new THREE.DirectionalLight(0x8e9ba2, 0.8); fill.position.set(12, 9, -18); scene.add(fill);
const fireLight = new THREE.PointLight(0xff6126, 14, 14, 2); fireLight.position.set(-8, 2.2, -8); scene.add(fireLight);

const mat = (color, roughness = 0.9, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const materials = {
  brick: mat(0x8c7160), soot: mat(0x343432), plaster: mat(0xb2a58d), concrete: mat(0x766f64), wood: mat(0x493a2d), darkWood: mat(0x282521), metal: mat(0x343936, .55, .55), rubble: [mat(0x766d60), mat(0x514b43), mat(0x928779), mat(0x65594c)], cloth: mat(0x555642), skin: mat(0xb18a6b), leather: mat(0x49382b), glass: new THREE.MeshStandardMaterial({ color:0x242b2a, roughness:.32, metalness:.18 }), red: mat(0x8c3429)
};
function canvasTexture(draw, size=512) {
  const c=document.createElement('canvas'); c.width=c.height=size; const ctx=c.getContext('2d'); draw(ctx,size);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy()); return t;
}
const brickTex=canvasTexture((ctx,s)=>{
  ctx.fillStyle='#76675b';ctx.fillRect(0,0,s,s);
  for(let y=0;y<s;y+=28){ctx.fillStyle='#423b34';ctx.fillRect(0,y,s,3);let offset=(Math.floor(y/28)%2)*38;for(let x=-38+offset;x<s;x+=76){ctx.fillRect(x,y,3,28);const n=Math.random();ctx.fillStyle=n>.5?'#806957':'#947a65';ctx.fillRect(x+4,y+4,68,20);ctx.fillStyle='rgba(35,31,27,.17)';for(let j=0;j<20;j++){ctx.fillRect(x+Math.random()*65,y+Math.random()*18,Math.random()*10+1,1)}}}
  for(let i=0;i<2000;i++){ctx.fillStyle=`rgba(18,17,15,${Math.random()*.14})`;ctx.fillRect(Math.random()*s,Math.random()*s,Math.random()*8+1,Math.random()*5+1)}
});
const concreteTex=canvasTexture((ctx,s)=>{ctx.fillStyle='#817b70';ctx.fillRect(0,0,s,s);for(let i=0;i<14000;i++){const v=Math.random();ctx.fillStyle=`rgba(${v>0.5?240:30},${v>0.5?226:30},${v>0.5?203:27},${Math.random()*.12})`;ctx.fillRect(Math.random()*s,Math.random()*s,Math.random()*3+1,Math.random()*3+1)};for(let i=0;i<30;i++){ctx.strokeStyle='rgba(43,39,33,.28)';ctx.lineWidth=1+Math.random()*3;ctx.beginPath();let x=Math.random()*s,y=Math.random()*s;ctx.moveTo(x,y);for(let j=0;j<5;j++){x+=Math.random()*24-12;y+=Math.random()*20;ctx.lineTo(x,y)}ctx.stroke()}});
const cobbleTex=canvasTexture((ctx,s)=>{ctx.fillStyle='#393a37';ctx.fillRect(0,0,s,s);for(let y=0;y<s;y+=23){let off=(Math.floor(y/23)%2)*28;for(let x=-28+off;x<s;x+=56){let v=38+Math.random()*23;ctx.fillStyle=`rgb(${v+4},${v+5},${v+3})`;ctx.beginPath();ctx.roundRect(x+2,y+2,50,18,4);ctx.fill();ctx.strokeStyle='rgba(12,14,13,.7)';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='rgba(191,176,145,.08)';ctx.fillRect(x+8,y+4,22,2)}}for(let i=0;i<180;i++){ctx.fillStyle=`rgba(103,69,44,${Math.random()*.18})`;ctx.beginPath();ctx.arc(Math.random()*s,Math.random()*s,Math.random()*12+3,0,7);ctx.fill()}});
const brickMaterial=new THREE.MeshStandardMaterial({map:brickTex,color:0xbab1a1,roughness:.96}); brickTex.repeat.set(2.2,1.3);
const concreteMaterial=new THREE.MeshStandardMaterial({map:concreteTex,color:0xb4ad9e,roughness:.98});
const streetMaterial=new THREE.MeshStandardMaterial({map:cobbleTex,color:0xd0c8b7,roughness:.96}); cobbleTex.repeat.set(4,3);

const boxGeo=new THREE.BoxGeometry(1,1,1);
function box(parent, name, pos, size, material, cast=true, receive=true){const o=new THREE.Mesh(boxGeo,material);o.name=name;o.position.set(...pos);o.scale.set(...size);o.castShadow=cast;o.receiveShadow=receive;parent.add(o);return o;}
function sphere(parent,pos,scale,material,seg=12){const o=new THREE.Mesh(new THREE.SphereGeometry(1,seg,Math.max(8,seg-2)),material);o.position.set(...pos);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function cylinder(parent,pos,r1,r2,h,material,segments=12){const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function ground(){const g=new THREE.Mesh(new THREE.PlaneGeometry(72,66),streetMaterial);g.rotation.x=-Math.PI/2;g.position.set(0,-.08,-1);g.receiveShadow=true;scene.add(g);const dirt=new THREE.Mesh(new THREE.PlaneGeometry(100,100),mat(0x49443b));dirt.rotation.x=-Math.PI/2;dirt.position.y=-.19;dirt.receiveShadow=true;scene.add(dirt);}

// Procedural masonry architecture: chipped facades, deep windows, lintels, cornices and broken rooflines.
function makeBuilding(x,z,w,d,h,variant=0){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  const shell=box(g,'masonry shell',[0,h/2,0],[w,h,d],brickMaterial); shell.material=brickMaterial;
  const frontZ=-d/2-.06;
  // Soot-stained vertical scars and fractured plaster remnants.
  for(let i=0;i<9;i++){let px=(Math.random()-.5)*w*.88;let ph=h*(.25+Math.random()*.62);box(g,'soot scar',[px,ph,frontZ-.012],[.12+Math.random()*.6,Math.random()*2+.4,.025],i%3?materials.soot:materials.concrete,false);}
  const floors=Math.floor(h/2.5), columns=Math.floor(w/2.45);
  for(let fy=0;fy<floors;fy++)for(let col=0;col<columns;col++){
    const px=-w/2+(col+.5)*w/columns, py=1.05+fy*2.35;
    if(py>h-.5 || (Math.random()<.12))continue;
    const ww=Math.min(1.05,w/columns*.56), hh=1.35;
    box(g,'shadowed window recess',[px,py,frontZ-.035],[ww+.25,hh+.2,.08],materials.darkWood,false);
    if(Math.random()>.25){box(g,'window glass',[px,py,frontZ-.09],[ww*.78,hh*.78,.025],materials.glass,false);box(g,'mullion',[px,py,frontZ-.12],[.045,hh*.82,.045],materials.concrete,false);box(g,'sill',[px,py-hh/2-.08,frontZ-.12],[ww+.32,.14,.18],materials.concrete);}
    else {box(g,'window void',[px,py,frontZ-.09],[ww*.82,hh*.85,.025],mat(0x171b1b),false);if(Math.random()>.45)box(g,'broken shutter',[px+.1,py,frontZ-.18],[.18,hh*.78,.08],materials.wood);}
    box(g,'window lintel',[px,py+hh/2+.1,frontZ-.11],[ww+.35,.16,.2],materials.concrete);
  }
  for(let yy=2.8;yy<h-.1;yy+=2.45)box(g,'floor belt',[0,yy,frontZ-.08],[w+.08,.12,.19],materials.concrete);
  box(g,'cornice',[0,h-.05,frontZ],[w+.6,.28,.36],materials.concrete);
  // A torn, irregular parapet and exposed rafters on shattered roofs.
  box(g,'roof slab',[0,h+.08,0],[w+.2,.35,d+.15],materials.concrete);
  for(let k=0;k<6;k++){const bx=(Math.random()-.5)*w,by=h+.35+Math.random()*1.3;const beam=box(g,'broken roof beam',[bx,by,(Math.random()-.5)*d],[.16,Math.random()*1.2+.35,d*.72],materials.darkWood);beam.rotation.z=(Math.random()-.5)*.8;beam.rotation.x=(Math.random()-.5)*.35;}
  // Rubble spilling from a collapsed section, with individual angular masonry.
  for(let i=0;i<23;i++){const geo=new THREE.DodecahedronGeometry(.2+Math.random()*.55,0);const r=new THREE.Mesh(geo,materials.rubble[Math.floor(Math.random()*materials.rubble.length)]);r.position.set((Math.random()-.5)*w*.9,.12+Math.random()*.45,frontZ-.45-Math.random()*1.3);r.scale.set(1+Math.random(),.45+Math.random(),.65+Math.random());r.rotation.set(Math.random()*2,Math.random()*3,Math.random()*2);r.castShadow=true;r.receiveShadow=true;g.add(r);}
  return g;
}
function buildEnvironment(){
  ground();
  // Compact factory-quarter street canyon, opened into a contested square.
  makeBuilding(-10,-9,10,9,13,0);makeBuilding(10,-11,11,9,10,1);
  makeBuilding(-12,7,9,8,9,1);makeBuilding(12,7,10,8,12,0);
  makeBuilding(-1,-23,18,7,11,1);
  // Partial side facades close the view while preserving a navigable playable street.
  box(scene,'distant ruined wall',[-24,4,-4],[3,8,32],materials.concrete);box(scene,'distant ruined wall',[24,4,-5],[3,8,32],materials.concrete);
  // Broken curb, crater lips and loose stone across the road.
  for(let side of [-1,1])for(let i=0;i<26;i++){let x=side*(8.1+Math.random()*2),z=14-i*1.1;let r=.15+Math.random()*.48;const geo=new THREE.DodecahedronGeometry(r,0);const o=new THREE.Mesh(geo,materials.rubble[Math.floor(Math.random()*4)]);o.position.set(x,r*.35,z);o.scale.set(1.5,.65,1);o.rotation.set(Math.random(),Math.random()*4,Math.random());o.castShadow=true;o.receiveShadow=true;scene.add(o);}
  // Scattered brick, splintered boards, spent casings.
  for(let i=0;i<150;i++){const x=(Math.random()-.5)*17,z=13-Math.random()*34;if(Math.abs(x)<1.4 && z>1)continue;const geo=new THREE.DodecahedronGeometry(.08+Math.random()*.24,0);const o=new THREE.Mesh(geo,materials.rubble[Math.floor(Math.random()*4)]);o.position.set(x,.04+Math.random()*.08,z);o.scale.set(1.6,.55,.8);o.rotation.set(Math.random(),Math.random()*3,Math.random());o.castShadow=true;o.receiveShadow=true;scene.add(o);}
  for(let i=0;i<23;i++){let plank=box(scene,'broken timber',[(Math.random()-.5)*15,.08,Math.random()*28-15],[.12+Math.random()*.12,.11,1+Math.random()*2],materials.wood);plank.rotation.y=Math.random()*Math.PI;plank.rotation.x=(Math.random()-.5)*.16;}
  // Bent streetlamps, cable spans and chipped utility poles.
  for(let x of [-7.3,7.3]){cylinder(scene,[x,2,-1],.10,.14,4,materials.metal,10);cylinder(scene,[x+.45,4,-1],.06,.1,1,materials.metal,8).rotation.z=Math.PI/2; sphere(scene,[x+.88,3.98,-1],[.14,.18,.18],mat(0x8a6743));}
  const wireMat=new THREE.LineBasicMaterial({color:0x242725,transparent:true,opacity:.65});const wire=new THREE.CatmullRomCurve3([new THREE.Vector3(-15,8,4),new THREE.Vector3(-5,6.6,0),new THREE.Vector3(5,7.2,-4),new THREE.Vector3(16,6.5,-8)]);scene.add(new THREE.Mesh(new THREE.TubeGeometry(wire,32,.018,5,false),wireMat));
  // Street sign, sandbag position and a burning wreck at the square edge.
  box(scene,'sign post',[-5,2,-8],[.13,4,.13],materials.metal);box(scene,'street sign',[-5,3.6,-8],[1.8,.46,.12],materials.darkWood);box(scene,'sign enamel',[-5,3.61,-8.07],[1.63,.32,.025],mat(0x9b8a6e),false);
  for(let i=0;i<3;i++){let bag=sphere(scene,[4.6+i*.72,.32,-8],[.78,.42,.46],mat(0x787462),12);bag.rotation.y=.12*i;}
  makeWreck(-8,-8);
  // A red signal flag tied to the shattered factory.
  const flag=box(scene,'red pennant',[-1.2,9.7,-19],[1.6,.76,.045],materials.red);flag.rotation.z=.12;
  // A few industrial pipes and a steam vent.
  for(let i=0;i<4;i++){cylinder(scene,[14.8,1.1,-15+i*1.2],.24,.24,2.4,materials.metal,14).rotation.z=Math.PI/2;}
  // Objective beacon at the central radio post.
  createRadio();
}
function makeWreck(x,z){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);const body=box(g,'burned truck chassis',[0,.75,0],[3.6,1.2,1.7],mat(0x302f2b));body.rotation.y=-.18;
  box(g,'cab',[1.1,1.38,-.04],[1.25,1.3,1.55],mat(0x3e403a)).rotation.z=-.1;
  box(g,'windshield',[1.1,1.56,-.84],[.82,.52,.035],materials.glass).rotation.z=-.13;
  for(let xx of [-1.1,1.18])for(let zz of [-.87,.87]){cylinder(g,[xx,.48,zz],.47,.47,.23,mat(0x191a19),16).rotation.x=Math.PI/2;cylinder(g,[xx,.48,zz*1.08],.23,.23,.25,mat(0x77756c),12).rotation.x=Math.PI/2;}
  for(let i=0;i<8;i++){const beam=box(g,'charred wreck beam',[(Math.random()-.5)*2,.9+Math.random()*1.6,(Math.random()-.5)*1.5],[.12,Math.random()*1.5+.4,.12],materials.darkWood);beam.rotation.z=Math.random()*1.5;beam.rotation.x=Math.random()*1.3;}
  const flameMat=new THREE.MeshBasicMaterial({color:0xf38b35,transparent:true,opacity:.84,side:THREE.DoubleSide});
  for(let i=0;i<5;i++){const f=new THREE.Mesh(new THREE.ConeGeometry(.22+Math.random()*.22,.8+Math.random()*.8,7),flameMat);f.position.set((Math.random()-.5)*1.5,1.25+Math.random()*.4,(Math.random()-.5)*.8);g.add(f);flames.push(f);}
}
const flames=[];
function createRadio(){
  const g=new THREE.Group();g.position.set(0,0,-12.5);scene.add(g);
  box(g,'radio table',[0,1.05,0],[1.35,.18,.72],materials.wood);
  for(let x of [-.54,.54])for(let z of [-.23,.23])box(g,'table leg',[x,.52,z],[.09,1,.09],materials.darkWood);
  box(g,'radio case',[0,1.52,-.04],[.72,.72,.44],mat(0x444943));box(g,'radio face',[0,1.54,-.27],[.58,.5,.035],mat(0x202723));
  for(let x of [-.17,.17]){cylinder(g,[x,1.55,-.31],.07,.07,.07,mat(0x99835d),12).rotation.x=Math.PI/2;}
  box(g,'radio dial glow',[0,1.65,-.31],[.22,.04,.015],mat(0xa98249),false);
  cylinder(g,[-.27,2.1,0],.025,.035,1.65,materials.metal,8);const aerial=box(g,'radio aerial',[-.27,2.91,0],[.025,.12,.025],materials.metal);aerial.rotation.z=-.12;
  // Field map, papers and wire spool add hand-dressed detail.
  box(g,'field map',[.12,1.15,.42],[.5,.018,.32],mat(0xb6a987),false).rotation.y=.15;
  cylinder(g,[.67,.42,0],.28,.28,.12,materials.metal,16).rotation.x=Math.PI/2;
  const lamp=new THREE.PointLight(0xff9f4e,2,4);lamp.position.set(.1,2.2,0);g.add(lamp);
}

const soldierParts=[];
function createSoldier(position, isPlayer=false){
  const root=new THREE.Group();root.position.set(position[0],0,position[1]);scene.add(root);
  const coat=mat(isPlayer?0x4c5546:0x555449), trousers=mat(isPlayer?0x4a4b3b:0x49483e), skin=mat(isPlayer?0xb68b68:0x9e795f), helmet=mat(isPlayer?0x55584d:0x4c5049,.76,.08), leather=materials.leather;
  const pelvis=box(root,'uniform pelvis',[0,1.04,0],[.48,.35,.34],trousers);
  const chest=box(root,'wool greatcoat',[0,1.65,0],[.73,.86,.43],coat); chest.rotation.x=-.04;
  box(root,'coat skirt',[0,1.23,.01],[.78,.44,.47],coat);
  // Greatcoat seams, collar, buttons, ammo pouches, webbing and bedroll.
  for(let s of [-1,1]){const strap=box(root,'webbing strap',[s*.19,1.69,-.225],[.105,.72,.035],materials.leather);strap.rotation.z=s*.17;box(root,'ammo pouch',[s*.31,1.48,-.25],[.16,.22,.11],leather);box(root,'pouch flap',[s*.31,1.6,-.27],[.17,.055,.12],mat(0x5a4935));}
  box(root,'coat collar',[0,2.06,0],[.46,.17,.42],mat(0x6a6654));
  for(let y=1.38;y<1.93;y+=.16)sphere(root,[.035,y,-.235],[.028,.028,.018],mat(0xb69b69),8);
  const neck=cylinder(root,[0,2.12,0],.13,.14,.22,skin,12);
  const head=sphere(root,[0,2.34,-.015],[.235,.29,.22],skin,16);
  sphere(root,[-.236,2.34,0],[.055,.09,.06],skin,10);sphere(root,[.236,2.34,0],[.055,.09,.06],skin,10);
  // Nose, brow, eyes and stubble create a readable human face even at gameplay distance.
  sphere(root,[0,2.32,-.22],[.055,.085,.075],skin,10);
  for(let s of [-1,1]){sphere(root,[s*.09,2.395,-.194],[.058,.026,.025],mat(0x554539),8);sphere(root,[s*.09,2.39,-.216],[.018,.016,.012],mat(0x211f1a),8);box(root,'brow',[s*.09,2.44,-.212],[.12,.035,.035],mat(0x615040));}
  sphere(root,[0,2.23,-.19],[.15,.05,.055],mat(0x574537),10);
  // Helmet shell and rolled brim.
  const helmetMesh=new THREE.Mesh(new THREE.SphereGeometry(.27,18,12,0,Math.PI*2,0,Math.PI*.57),helmet);helmetMesh.position.set(0,2.57,0);helmetMesh.scale.set(1.13,.72,1.03);helmetMesh.castShadow=true;root.add(helmetMesh);
  cylinder(root,[0,2.53,0],.276,.276,.055,helmet,18);
  const armPivots=[], legPivots=[];
  for(let s of [-1,1]){
    const shoulder=new THREE.Group();shoulder.position.set(s*.41,1.93,0);root.add(shoulder);armPivots.push(shoulder);
    const upper=new THREE.Mesh(new THREE.CylinderGeometry(.105,.14,.48,10),coat);upper.position.set(s*.01,-.26,-.015);upper.rotation.z=s*-.08;upper.castShadow=true;shoulder.add(upper);
    sphere(shoulder,[s*.01,-.52,-.025],[.115,.12,.12],skin,10);
    const leg=new THREE.Group();leg.position.set(s*.19,.98,0);root.add(leg);legPivots.push(leg);
    const thigh=new THREE.Mesh(new THREE.CylinderGeometry(.13,.105,.55,10),trousers);thigh.position.y=-.3;thigh.castShadow=true;leg.add(thigh);
    box(leg,'boot',[0,-.64,-.08],[.23,.17,.4],materials.darkWood);
  }
  // SVT-inspired rifle: stock, receiver, barrel, sight and wooden handguard.
  const rifle=new THREE.Group();rifle.position.set(.18,1.65,-.31);root.add(rifle);
  box(rifle,'rifle stock',[-.13,-.06,-.34],[.15,.16,.63],mat(0x493729));
  box(rifle,'rifle receiver',[-.08,.015,-.68],[.14,.18,.5],mat(0x353a38,.48,.62));
  cylinder(rifle,[-.08,.025,-1.02],.035,.035,.55,mat(0x303432,.5,.65),10).rotation.x=Math.PI/2;
  box(rifle,'wood handguard',[-.08,.035,-.89],[.17,.17,.29],mat(0x604a34));
  box(rifle,'front sight',[-.08,.12,-1.26],[.045,.09,.04],materials.metal);
  const backpack=box(root,'canvas pack',[0,1.69,.27],[.49,.62,.22],mat(0x545646));
  const soldier={root,head,armPivots,legPivots,rifle,health:100,isPlayer,alive:true,cooldown:Math.random()*1,walk:Math.random()*4,stun:0};soldierParts.push(soldier);return soldier;
}

buildEnvironment();
// Keep AI visibility raycasts on solid environment meshes only; sprites require a camera and particles are not cover.
const environmentOccluders=[];
scene.traverse(object=>{if(object.isMesh)environmentOccluders.push(object);});
const player=createSoldier([0,0],true);player.root.rotation.y=Math.PI;
const enemies=[];
const enemyPositions=[[-5,-6],[5,-7],[-2,-16],[7,-17],[-7,-18]];
for(let i=0;i<enemyPositions.length;i++){const e=createSoldier(enemyPositions[i]);e.root.rotation.y=i%2?Math.PI*.86:Math.PI*1.12;e.health=100;e.cooldown=2.3+Math.random()*2;enemies.push(e);}
// Sandbagged outpost and recognizable objective marker.
const marker=new THREE.Group();marker.position.set(0,0,-12.5);scene.add(marker);
const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.045,8,48),new THREE.MeshBasicMaterial({color:0xe6a45e,transparent:true,opacity:.9}));ring.rotation.x=Math.PI/2;ring.position.y=.12;marker.add(ring);
const beacon=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.5,8),new THREE.MeshBasicMaterial({color:0xe6a45e,transparent:true,opacity:.55}));beacon.position.y=1.8;marker.add(beacon);

// Smoke sprites built from a soft procedural alpha texture.
const smokeTexture=canvasTexture((ctx,s)=>{const grad=ctx.createRadialGradient(s/2,s/2,4,s/2,s/2,s*.48);grad.addColorStop(0,'rgba(40,39,35,.48)');grad.addColorStop(.42,'rgba(51,49,44,.3)');grad.addColorStop(1,'rgba(50,48,44,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,s,s);},128);
const smoke=[];
for(let i=0;i<44;i++){const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeTexture,color:i%3===0?0x71675a:0x4b4b46,transparent:true,depthWrite:false,opacity:.55}));sprite.position.set(-8+(Math.random()-.5)*8,1+Math.random()*12,-8+(Math.random()-.5)*8);const size=2+Math.random()*5;sprite.scale.set(size,size,1);sprite.userData={speed:.15+Math.random()*.45,phase:Math.random()*10,baseX:sprite.position.x};scene.add(sprite);smoke.push(sprite);}
const ash=[];const ashGeo=new THREE.BufferGeometry();const ashN=450;const ashPos=new Float32Array(ashN*3);for(let i=0;i<ashN;i++){ashPos[i*3]=(Math.random()-.5)*34;ashPos[i*3+1]=Math.random()*13;ashPos[i*3+2]=Math.random()*38-21;}ashGeo.setAttribute('position',new THREE.BufferAttribute(ashPos,3));const ashPoints=new THREE.Points(ashGeo,new THREE.PointsMaterial({color:0xd6c9ad,size:.045,transparent:true,opacity:.55,sizeAttenuation:true}));scene.add(ashPoints);

const $=s=>document.querySelector(s),hud=$('#hud'),titleCard=$('#title-card'),touchControls=$('#touch-controls');
let started=false,ended=false,health=100,mag=5,reserve=30,reloading=false,fireCooldown=0,objectiveIndex=0,captureTime=0,lookYaw=0,lookPitch=.23,damageFlash=0,hitFlash=0,toastTimer=0,elapsed=0;
const objectives=[{pos:new THREE.Vector3(0,0,-6.8),name:'CLEAR THE EASTERN APPROACH'},{pos:new THREE.Vector3(0,0,-12.5),name:'SECURE THE RADIO POST'},{pos:new THREE.Vector3(0,0,-19.2),name:'HOLD THE FACTORY GATE'}];
const keys={};let moveX=0,moveY=0,mouseDown=false,lastPointer=null;
window.__gameDebug=()=>({player:{x:player.root.position.x,z:player.root.position.z},lookYaw,moveX,moveY,objectiveIndex,captureTime,enemies:enemies.map(e=>({x:e.root.position.x,z:e.root.position.z,health:e.health,alive:e.alive}))});window.__gameDebugClearEnemies=()=>enemies.forEach(e=>{e.alive=false;e.root.visible=false;});
const raycaster=new THREE.Raycaster();raycaster.far=45;
const dampAngle=(current,target,lambda,dt)=>current+Math.atan2(Math.sin(target-current),Math.cos(target-current))*(1-Math.exp(-lambda*dt));
const tracerMat=new THREE.LineBasicMaterial({color:0xffd69a,transparent:true,opacity:.92});const tracers=[];
function notify(text){const node=$('#toast');node.textContent=text;node.classList.add('show');toastTimer=2.3;}
function showEnd(won){ended=true;$('#end-title').textContent=won?'SIGNAL SENT':'LINE LOST';$('#end-copy').textContent=won?'The line held. The city still stands.':'The radio falls silent in the smoke.';$('#end-card').classList.remove('hidden');$('#end-card').style.opacity=1;}
function startGame(){started=true;titleCard.classList.add('out');hud.classList.remove('hidden');touchControls.classList.remove('hidden');if(innerWidth<701)touchControls.style.display='block';notify('FOLLOW THE MARKER INTO THE SQUARE');updateObjectiveUI();}
$('#deploy').addEventListener('click',startGame);
$('#restart').addEventListener('click',()=>location.reload());
function updateObjectiveUI(){const obj=objectives[objectiveIndex];$('#objective-count').textContent=`0${objectiveIndex+1} / 03`;$('#objective-text').textContent=obj.name;$('#objective-progress').style.width=`${Math.min(100,captureTime/4*100)}%`;}
function reload(){if(!started||reloading||mag===5||reserve<=0)return;reloading=true;notify('RELOADING · KEEP YOUR HEAD DOWN');setTimeout(()=>{if(ended)return;const n=Math.min(5-mag,reserve);mag+=n;reserve-=n;reloading=false;$('#ammo-value').textContent=String(mag).padStart(2,'0');$('#reload-hint').textContent='R — RELOAD';},1250);}
function makeTracer(a,b,color=0xffd69a){const g=new THREE.BufferGeometry().setFromPoints([a,b]);const line=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:.88}));scene.add(line);tracers.push({line,life:.11,max:.11});}
function setEnemyFacing(e,position){const target=position.clone().sub(e.root.position);target.y=0;const facing=new THREE.Vector3(-Math.sin(e.root.rotation.y),0,-Math.cos(e.root.rotation.y));const angle=facing.angleTo(target);if(angle>0.72)return false;const origin=e.root.position.clone().add(new THREE.Vector3(0,1.55,0));const aim=position.clone().add(new THREE.Vector3(0,1.45,0));const direction=aim.clone().sub(origin);const distance=direction.length();raycaster.set(origin,direction.normalize());raycaster.far=distance;const blockers=raycaster.intersectObjects(environmentOccluders,false);return !blockers.some(hit=>hit.distance<distance-.3);}
function fire(){if(!started||ended||reloading||fireCooldown>0)return;if(mag<=0){notify('EMPTY · PRESS R TO RELOAD');reload();return;}mag--;$('#ammo-value').textContent=String(mag).padStart(2,'0');fireCooldown=.32;player.rifle.position.x=.25;player.rifle.position.z=-.25;
  const origin=camera.position.clone();const direction=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);raycaster.set(origin,direction);raycaster.far=38;
  const targetMeshes=[];for(const e of enemies)if(e.alive)e.root.traverse(o=>{if(o.isMesh)targetMeshes.push(o)});
  const hits=raycaster.intersectObjects(targetMeshes,false);let end=origin.clone().addScaledVector(direction,35);
  if(hits.length){const h=hits[0];end.copy(h.point);const hitFoe=enemies.find(e=>e.alive&&h.object.getWorldPosition(new THREE.Vector3()).distanceTo(e.root.position)<3.3);if(hitFoe){hitFoe.health-=55;hitFoe.stun=.26;$('#hit-marker').classList.add('show');hitFlash=.2;if(hitFoe.health<=0){hitFoe.alive=false;hitFoe.root.rotation.x=-.8;hitFoe.root.position.y=-.15;hitFoe.root.traverse(o=>{if(o.isMesh)o.material=o.material.clone(),o.material.color.multiplyScalar(.62)});notify('HOSTILE DOWN');}}}
  makeTracer(player.root.position.clone().add(new THREE.Vector3(0,1.7,-.5).applyAxisAngle(new THREE.Vector3(0,1,0),player.root.rotation.y)),end);
}
function updateHud(){const h=Math.max(0,Math.ceil(health));$('#health-value').textContent=String(h).padStart(3,'0');$('#health-bar').style.width=`${h}%`;$('#ammo-value').textContent=String(mag).padStart(2,'0');$('#reload-hint').textContent=reserve?`${reloading?'RELOADING…':'R — RELOAD'} · ${reserve} RES`:'R — RELOAD';const alive=enemies.filter(e=>e.alive).length;$('#threat').classList.toggle('active',alive>0&&player.root.position.distanceTo(enemies.find(e=>e.alive)?.root.position||new THREE.Vector3(100,0,100))<13);$('#heading').textContent=String(Math.round((34+lookYaw*57.3+360)%360)).padStart(3,'0');}
function moveSoldier(s,dt,speed,dx,dz){const moving=Math.hypot(dx,dz)>.01;s.walk+=dt*(moving?9:2);for(let i=0;i<2;i++){s.legPivots[i].rotation.x=moving?Math.sin(s.walk+i*Math.PI)*.52:Math.sin(s.walk*.5+i)*.025;s.armPivots[i].rotation.x=moving?Math.sin(s.walk+i*Math.PI+Math.PI)*.32:0;}if(moving){const len=Math.hypot(dx,dz);s.root.position.x+=dx/len*speed*dt;s.root.position.z+=dz/len*speed*dt;}return moving;}
function updatePlayer(dt){let x=moveX,y=moveY;if(keys.KeyA||keys.ArrowLeft)x-=1;if(keys.KeyD||keys.ArrowRight)x+=1;if(keys.KeyW||keys.ArrowUp)y+=1;if(keys.KeyS||keys.ArrowDown)y-=1;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}
  const yaw=lookYaw;const dx=x*Math.cos(yaw)-y*Math.sin(yaw),dz=-x*Math.sin(yaw)-y*Math.cos(yaw);
  const moving=moveSoldier(player,dt,3.55,dx,dz);player.root.position.x=THREE.MathUtils.clamp(player.root.position.x,-6.9,6.9);player.root.position.z=THREE.MathUtils.clamp(player.root.position.z,-23,14.4);
  if(moving){player.root.rotation.y=Math.atan2(-dx,-dz);}else player.root.rotation.y=dampAngle(player.root.rotation.y,lookYaw,4,dt);
  player.rifle.position.x=THREE.MathUtils.damp(player.rifle.position.x,.18,12,dt);player.rifle.position.z=THREE.MathUtils.damp(player.rifle.position.z,-.31,12,dt);
  const objective=objectives[objectiveIndex];if(objective){const d=player.root.position.distanceTo(objective.pos);const nearbyEnemy=enemies.some(e=>e.alive&&e.root.position.distanceTo(objective.pos)<4.4);if(d<2.1&&!nearbyEnemy){captureTime+=dt;if(captureTime>4){captureTime=0;objectiveIndex++;if(objectiveIndex>=objectives.length){showEnd(true);}else notify('POSITION SECURED · ADVANCE');}updateObjectiveUI();}else if(d>=2.1||nearbyEnemy){captureTime=Math.max(0,captureTime-dt*.3);updateObjectiveUI();}}
  if(keys.Space||mouseDown)fire();
}
function updateEnemies(dt){let near=false;for(const e of enemies){if(!e.alive)continue;const delta=player.root.position.clone().sub(e.root.position);delta.y=0;const dist=delta.length();if(dist<17)near=true;e.stun=Math.max(0,e.stun-dt);const dir=delta.normalize();e.root.rotation.y=Math.atan2(-dir.x,-dir.z);
    if(dist>5.2&&dist<21&&e.stun<=0){const speed=dist>10?1.05:.65;moveSoldier(e,dt,speed,dir.x,dir.z);e.root.position.x=THREE.MathUtils.clamp(e.root.position.x,-7.2,7.2);e.root.position.z=THREE.MathUtils.clamp(e.root.position.z,-23,13.8);}
    e.cooldown-=dt;if(dist<15&&e.cooldown<=0){e.cooldown=2.6+Math.random()*1.5;if(setEnemyFacing(e,player.root.position)){const start=e.root.position.clone().add(new THREE.Vector3(0,1.65,0));const end=player.root.position.clone().add(new THREE.Vector3(0,1.55,0));makeTracer(start,end,0xe56d43);if(dist<12&&Math.random()<.32){health-=3+Math.random()*4;damageFlash=.23;if(health<=0){health=0;showEnd(false);}}}}
  }$('#threat').classList.toggle('active',near);}
function updateCamera(dt){const target=new THREE.Vector3(player.root.position.x,1.55,player.root.position.z);const dist=6.9;const desired=new THREE.Vector3(target.x+Math.sin(lookYaw)*dist, target.y+2.25+lookPitch*2.5,target.z+Math.cos(lookYaw)*dist);camera.position.lerp(desired,1-Math.exp(-dt*5.5));const look=target.clone().add(new THREE.Vector3(-Math.sin(lookYaw)*2,lookPitch*1.1,-Math.cos(lookYaw)*2));camera.lookAt(look);}
function updateAmbient(dt){elapsed+=dt;for(let i=0;i<smoke.length;i++){const s=smoke[i];s.position.y+=dt*s.userData.speed;s.position.x=s.userData.baseX+Math.sin(elapsed*.34+s.userData.phase)*.7;s.material.opacity=.24+.25*(.5+.5*Math.sin(elapsed*.7+s.userData.phase));if(s.position.y>16){s.position.y=1;s.position.x=-8+(Math.random()-.5)*8;s.userData.baseX=s.position.x;}}
  const p=ashGeo.attributes.position;for(let i=0;i<ashN;i++){p.array[i*3+1]-=dt*(.4+(i%7)*.07);p.array[i*3]+=(Math.sin(elapsed+i)*.15)*dt;if(p.array[i*3+1]<0){p.array[i*3+1]=12+Math.random()*3;p.array[i*3+2]=Math.random()*38-21;}}p.needsUpdate=true;
  flames.forEach((f,i)=>{f.scale.y=.7+Math.sin(elapsed*8+i*2)*.35;f.rotation.y=elapsed*1.7+i;});fireLight.intensity=11+Math.sin(elapsed*8)*3+Math.sin(elapsed*3)*2;
  ring.rotation.z+=dt*.32;ring.material.opacity=.6+Math.sin(elapsed*3)*.28;beacon.scale.y=1+Math.sin(elapsed*3)*.08;
  for(let i=tracers.length-1;i>=0;i--){const t=tracers[i];t.life-=dt;t.line.material.opacity=Math.max(0,t.life/t.max);if(t.life<=0){scene.remove(t.line);t.line.geometry.dispose();t.line.material.dispose();tracers.splice(i,1);}}
  if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('#toast').classList.remove('show');}if(hitFlash>0){hitFlash-=dt;if(hitFlash<=0)$('#hit-marker').classList.remove('show');}if(damageFlash>0){damageFlash-=dt;scene.fog.color.setHex(0x9b5140);}else scene.fog.color.lerp(new THREE.Color(0x77766c),.025);
}
function render(){requestAnimationFrame(render);const dt=Math.min(.04,clock.getDelta());if(started&&!ended){fireCooldown=Math.max(0,fireCooldown-dt);updatePlayer(dt);updateEnemies(dt);updateCamera(dt);updateHud();}else if(!started){const t=performance.now()*.0001;camera.position.set(Math.sin(t)*.55,6.4,18.5);camera.lookAt(0,2.1,-7.5);}
  updateAmbient(dt);renderer.render(scene,camera);}
const clock=new THREE.Clock();

// Keyboard, mouse drag and mobile twin-stick input.
addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='KeyR')reload();});addEventListener('keyup',e=>keys[e.code]=false);
canvas.addEventListener('pointerdown',e=>{if(!started)return;canvas.setPointerCapture?.(e.pointerId);mouseDown=true;lastPointer={x:e.clientX,y:e.clientY};fire();});
canvas.addEventListener('pointerup',()=>{mouseDown=false;lastPointer=null;});
canvas.addEventListener('pointermove',e=>{if(mouseDown&&lastPointer){lookYaw-= (e.clientX-lastPointer.x)*.0042;lookPitch=THREE.MathUtils.clamp(lookPitch+(e.clientY-lastPointer.y)*.0027,-.35,.8);lastPointer={x:e.clientX,y:e.clientY};}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
const stickZone=$('#stick-zone'),stickBase=$('#stick-base'),stickKnob=$('#stick-knob');let stickId=null,stickCenter=null;
stickZone.addEventListener('pointerdown',e=>{e.preventDefault();stickId=e.pointerId;stickZone.setPointerCapture(e.pointerId);const r=stickZone.getBoundingClientRect();stickCenter={x:r.left+r.width/2,y:r.top+r.height/2};updateStick(e);});
stickZone.addEventListener('pointermove',e=>{if(e.pointerId===stickId)updateStick(e);});function updateStick(e){if(!stickCenter)return;let dx=e.clientX-stickCenter.x,dy=e.clientY-stickCenter.y;const d=Math.hypot(dx,dy),max=47;if(d>max){dx*=max/d;dy*=max/d;}stickKnob.style.transform=`translate(${dx}px,${dy}px)`;moveX=dx/max;moveY=-dy/max;}
function releaseStick(){stickId=null;stickCenter=null;moveX=moveY=0;stickKnob.style.transform='';}stickZone.addEventListener('pointerup',releaseStick);stickZone.addEventListener('pointercancel',releaseStick);
$('#touch-fire').addEventListener('pointerdown',e=>{e.preventDefault();fire();});$('#touch-fire').addEventListener('pointerdown',()=>{keys.Space=true;});$('#touch-fire').addEventListener('pointerup',()=>keys.Space=false);$('#touch-fire').addEventListener('pointercancel',()=>keys.Space=false);$('#touch-reload').addEventListener('pointerdown',e=>{e.preventDefault();reload();});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));});
render();

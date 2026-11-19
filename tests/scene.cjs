// Run with Node and @napi-rs/canvas installed. Builds real Three.js geometry;
// this does not replace a browser render or a listening review.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const {createCanvas} = require('@napi-rs/canvas');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
global.window = global; global.addEventListener = () => {}; global.document = {createElement: () => createCanvas(1, 1)};
global.THREE = require(path.join(root, 'vendor/three.min.js'));
for (const name of ['core','textures','layout','navigation','base','store','interior-lighting','interior-products','interior','street','buildings','details','people','bus','effects','interior-interactions','night-stock'])
  vm.runInThisContext(fs.readFileSync(path.join(root, 'src',name+'.js'),'utf8'));
S.gradientMap = new THREE.DataTexture(new Uint8Array([72,128,190,255]),4,1,THREE.LuminanceFormat);
S.scene = new THREE.Scene(); S.world = new THREE.Group(); S.scene.add(S.world);
for (const name of ['Base','Store','Interior','Street','Neighborhood','Details','People','Bus','Effects']) S['build'+name]();
let meshes=0, instances=0;
const geometries=new Set();
S.world.traverse(o=>{
  if(!o.isMesh) return;
  meshes++;
  if(o.isInstancedMesh) instances+=o.count;
  geometries.add(o.geometry);
  for(const n of o.geometry.attributes.position.array) assert(Number.isFinite(n));
});
assert.equal(S.rainFloor(12.3, 6.1), 3.1);
assert.equal(S.rainFloor(11.7, 6.1), .04);
let scans = 0, boardingFrames = 0, emptyFrames = 0;
S.playSceneSound = name => { if (name === 'scan') scans++; };
const visited = S.people.map(()=>new Set());
for(let frame=0;frame<7200;frame++) {
  let t=frame/30; S.updateTraffic(t); for(const update of S.updaters) update(t,1/30);
  if (!S.stock.available && S.people[0].hasBag) { emptyFrames++; assert.equal(S.displayMeal.visible,false,'Sold stock reappeared before restocking'); }
  if (S.bus.phase !== 'away' && S.bus.z + 2.29 >= 1.375 && S.bus.z - 2.29 <= 2.925) {
    assert.equal(S.traffic.vehicleLight, 2, 'Bus crossing outside vehicle green');
  }
  if (S.passenger.boarded) {
    boardingFrames++;
    assert.equal(S.passenger.group.visible, false);
  }
  if (S.bus.canBoard) assert.equal(S.bus.phase, 'stop');
  assert(!(S.traffic.pedestrianGreen && S.traffic.vehicleLight!==0));
  S.people.forEach((p,i)=>{
    if(p.staff){
      const {x,z}=p.group.position;
      assert(!S.fixtureBlocks(x,z,.14,true),'Staff intersects public fixtures');
    }
    if(i === 0 && p.group.position.z < -1.82) {
      const x=p.group.position.x,z=p.group.position.z;
      assert(!S.walkObstacles.some(b=>x>b[0]-.15 && x<b[1]+.15 && z>b[2]-.15 && z<b[3]+.15),'Shopper intersects fixture');
    }
    visited[i].add(p.next); assert(Number.isFinite(p.group.position.y));
    if(p.group.position.z>5 && p.group.position.x>11.5 && !p.staff)
      assert(p.group.position.x+.3 < 13.12, 'Person intersects shelter bench');
  });
}
S.people.forEach((p,i)=>{if(!p.staff) assert.equal(visited[i].size,p.route.length,'Incomplete pedestrian route '+i);});
assert(scans >= 2, 'Checkout sequence did not repeat');
assert(boardingFrames > 0 && S.bus.cycles >= 2, 'Bus service did not board and repeat');
console.log(JSON.stringify({meshes, instances, sharedGeometries:geometries.size, scans, boardingFrames, busCycles:S.bus.cycles,simulationSeconds:240,routeWaypoints:visited.map(s=>s.size),shelterAndSignals:'pass'}));
assert(emptyFrames > 30, 'Sold shelf slot must remain empty');
assert(S.stock.restocks >= 2, 'Clerk must replenish stock between trips');
assert.equal(S.stock.scans, scans, 'Scan count and sound must agree');
S.camera = new THREE.PerspectiveCamera(); S.scene.fog = {density:.01};
for (const size of [[1440,900],[390,844]]) {
  global.innerWidth=size[0]; global.innerHeight=size[1]; S.camera.aspect=size[0]/size[1];
  for (const [view, targets] of Object.entries({bento:[S.layout.interior.meal], checkout:[S.layout.interior.scanner], drinks:[[-1.6,1.1,-8.14]]})) {
    S.setView(view); S.camera.updateMatrixWorld(true);
    for (const target of targets) {
      const projected = new THREE.Vector3(...target).project(S.camera);
      assert(Math.abs(projected.x)<.95 && projected.y>-.62 && projected.y<.92, `${view} target outside usable frame ${size}: ${projected.toArray()}`);
    }
  }
}
console.log('PASS: restocking, scan consistency, desktop and portrait detail framing');

// A customer can approach the cooler, and the doors swing into the aisle
// without losing the interaction target once open.
S.setView('entrance');
assert.equal(S.nearbyColdDoor(),null);
S.setView('drinks');
const coldDoor=S.nearbyColdDoor();
assert(coldDoor,'The cooler preset must be within reach');
const edge=new THREE.Vector3(-coldDoor.side*1.08,0,0);
const closedZ=coldDoor.hinge.localToWorld(edge.clone()).z;
S.toggleColdDoor();
for(let i=0;i<45;i++) S.updaters.forEach(update=>update(241+i/30,1/30));
const openEdge=coldDoor.hinge.localToWorld(edge.clone());
assert(openEdge.z>closedZ+.5,'Door must swing out toward the customer');
assert(S.coldDoorBlocks(coldDoor,openEdge.x,openEdge.z),'The open leaf must block traversal at the edge');
assert.equal(S.nearbyColdDoor(),coldDoor);
S.toggleColdDoor();
for(let i=0;i<45;i++) S.updaters.forEach(update=>update(243+i/30,1/30));
assert(Math.abs(coldDoor.angle)<.06,'Door must close from the same standing position');
console.log('PASS: cooler proximity, outward swing, and door collision');

// Layout clearance and automatic entrance from the actual player camera.
const fixture=S.layout.interior.fixtures;
assert(fixture.shelfRight.bounds[0]-fixture.shelfLeft.bounds[1]>=1.2);
assert(fixture.freezer.bounds[0]-fixture.shelfRight.bounds[1]>=.9);
assert(fixture.shelfLeft.bounds[0]-fixture.checkout.bounds[1]>=.9);
for(const name of ['interior','aisle','bento','drinks','checkout']){
  S.setView(name);
  assert(S.isWalkPosition(S.camera.position.x,S.camera.position.z),name+' starts inside a collider');
}
S.setView('interior');
S.door.open=0;
assert(!S.isWalkPosition(-.8,-1.6),'Closed threshold must block a player');
assert(S.cameraAtDoor(),'Player must activate entrance sensor');
for(let i=0;i<50;i++) S.updaters.forEach(update=>update(245+i/30,1/30));
assert(S.door.open>.88);
assert(S.isWalkPosition(-.8,-1.6),'Open threshold must be traversable');
assert(!S.isWalkPosition(.57,-1.6),'Facade must remain solid beside the door');
const interiorZ=S.camera.position.z;
S.walkStep(0,.82);
assert(S.camera.position.z>interiorZ+.4,'Player can walk through the doorway');
assert(!S.isWalkPosition(fixture.shelfLeft.x,fixture.shelfLeft.z),'Shelf must remain solid');
console.log('PASS: aisle widths, camera spawn positions and player-triggered entrance');

const kinds=Object.values(S.products);
assert(kinds.length>=20 && kinds.every(item=>item.positions.length>0),'Every catalog item must be stocked');
assert(new Set(kinds.map(item=>item.geometry.attributes.position.array.join(','))).size>=24,'Distinct package constructions preserved');
assert.equal(new Set(kinds.map(item=>item.geometry.attributes.uv.array.join(','))).size,kinds.length,'Each fallback SKU has its own label UVs');
assert.equal(new Set(kinds.map(item=>item.material.map)).size,1,'Labels must share the packaging atlas');
const controls={};
global.document.getElementById=id=>controls[id]??={hidden:true};
global.document.body={classList:{contains:()=>false,add(){},remove(){}}};
S.installShopInteractions();
S.setView('aisle');
S.world.updateMatrixWorld(true);
const selected=Object.values(S.products).flatMap(item=>item.positions.map(p=>({item,p})))
  .find(({p})=>p[0]<.02 && p[0]>-.3 && p[2]<-4.2 && p[2]>-5.45);
assert(selected,'Aisle must contain sample products');
S.camera.position.set(-1.18,1.32,selected.p[2]);
S.camera.lookAt(selected.p[0], selected.p[1]+selected.item.h*.54,selected.p[2]);
const hit=S.pickProduct(0,0);
assert(hit && hit.product.id===selected.item.id,'A customer can inspect the visible item');
const before=new THREE.Matrix4();
hit.mesh.getMatrixAt(hit.index,before);
S.inspectProduct(0,0);
assert.equal(controls['product-card'].hidden,false);
controls['take-product'].onclick();
assert.equal(S.camera.children.length,1);
controls['take-product'].onclick();
assert.equal(S.camera.children.length,0);
const after=new THREE.Matrix4();
hit.mesh.getMatrixAt(hit.index,after);
assert.deepEqual(after.elements,before.elements);
assert.equal(controls['product-card'].hidden,true);
assert.equal(document.getElementById('product-title').textContent.includes(selected.item.type),true);
console.log('PASS: 32 stocked models, single packaging atlas and reversible product pickup');

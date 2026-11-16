// Run with Node and @napi-rs/canvas installed. Builds real Three.js geometry;
// this does not replace a browser render or a listening review.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const {createCanvas} = require('@napi-rs/canvas');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
global.window = global; global.addEventListener = () => {}; global.document = {createElement: () => createCanvas(1, 1)};
global.THREE = require(path.join(root, 'vendor/three.min.js'));
for (const name of ['core','textures','layout','base','store','interior','street','buildings','details','people','bus','effects'])
  vm.runInThisContext(fs.readFileSync(path.join(root, 'src',name+'.js'),'utf8'));
S.gradientMap = new THREE.DataTexture(new Uint8Array([72,128,190,255]),4,1,THREE.LuminanceFormat);
S.scene = new THREE.Scene(); S.world = new THREE.Group(); S.scene.add(S.world);
for (const name of ['Base','Store','Interior','Street','Neighborhood','Details','People','Bus','Effects']) S['build'+name]();
let meshes = 0; S.world.traverse(o=>{ if(o.isMesh){ meshes++; for(const n of o.geometry.attributes.position.array) assert(Number.isFinite(n)); }});
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
console.log(JSON.stringify({meshes, scans, boardingFrames, busCycles:S.bus.cycles,simulationSeconds:240,routeWaypoints:visited.map(s=>s.size),shelterAndSignals:'pass'}));
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

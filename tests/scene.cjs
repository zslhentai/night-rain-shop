// Run with Node and @napi-rs/canvas installed. Builds real Three.js geometry;
// this does not replace a browser render or a listening review.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const {createCanvas} = require('@napi-rs/canvas');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
global.window = global; global.document = {createElement: () => createCanvas(1, 1)};
global.THREE = require(path.join(root, 'vendor/three.min.js'));
for (const name of ['core','textures','layout','base','store','interior','street','buildings','details','people','effects'])
  vm.runInThisContext(fs.readFileSync(path.join(root, 'src',name+'.js'),'utf8'));
S.gradientMap = new THREE.DataTexture(new Uint8Array([72,128,190,255]),4,1,THREE.LuminanceFormat);
S.scene = new THREE.Scene(); S.world = new THREE.Group(); S.scene.add(S.world);
for (const name of ['Base','Store','Interior','Street','Neighborhood','Details','People','Effects']) S['build'+name]();
let meshes = 0; S.world.traverse(o=>{ if(o.isMesh){ meshes++; for(const n of o.geometry.attributes.position.array) assert(Number.isFinite(n)); }});
assert.equal(S.rainFloor(12.3, 6.1), 3.1);
assert.equal(S.rainFloor(11.7, 6.1), .04);
const visited = S.people.map(()=>new Set());
for(let frame=0;frame<7200;frame++) {
  let t=frame/30; S.updateTraffic(t); for(const update of S.updaters) update(t,1/30);
  assert(!(S.traffic.pedestrianGreen && S.traffic.vehicleLight!==0));
  S.people.forEach((p,i)=>{
    visited[i].add(p.next); assert(Number.isFinite(p.group.position.y));
    if(p.group.position.z>5 && p.group.position.x>11.5 && !p.staff)
      assert(p.group.position.x+.3 < 13.12, 'Person intersects shelter bench');
  });
}
S.people.forEach((p,i)=>{if(!p.staff) assert.equal(visited[i].size,p.route.length,'Incomplete pedestrian route '+i);});
console.log(JSON.stringify({meshes,simulationSeconds:240,routeWaypoints:visited.map(s=>s.size),shelterAndSignals:'pass'}));

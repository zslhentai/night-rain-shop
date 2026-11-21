const assert = require('node:assert/strict');
require('./scene.cjs');

S.setView('street-walk');
assert.deepEqual([S.camera.position.x,S.camera.position.z], S.layout.streetWalk.spawn);
assert(S.isWalkView(S.view));
assert(!S.isStoreView(S.view));
S.bus.phase='away';

function walkTo(x,z) {
  const p=S.camera.position;
  S.camera.lookAt(x,p.y,z);
  for(let i=0;i<220 && Math.hypot(x-p.x,z-p.z)>.035;i++){
    S.walkStep(0,-Math.min(.06,Math.hypot(x-p.x,z-p.z)));
  }
}
function reached(x,z){
  assert(Math.hypot(x-S.camera.position.x,z-S.camera.position.z)<.08,
    'Could not reach '+[x,z]+' from '+S.camera.position.toArray());
}

walkTo(12.18,2.15);
reached(12.18,2.15);
S.updateTraffic(5);
walkTo(9,2.15);
assert(S.camera.position.x>10.63,'The red light must hold pedestrians off the carriageway');
S.updateTraffic(14);
walkTo(8,2.15);
reached(8,2.15);
S.updateTraffic(18);
walkTo(3.83,2.15);
reached(3.83,2.15);
walkTo(3.83,.32);
reached(3.83,.32);
walkTo(-.8,.32);
reached(-.8,.32);
S.door.open=0;
walkTo(-.8,-2.35);
assert(S.camera.position.z> -1.49,'Player passed a closed entrance');
assert(S.cameraAtDoor());
for(let i=0;i<45;i++) S.updaters.forEach(update=>update(300+i/30,1/30));
assert(S.door.open>.88);
walkTo(-.8,-2.35);
reached(-.8,-2.35);
assert(S.isStoreView(S.view),'Inspecting and shopping should be available naturally after entry');
assert(!S.isWalkPosition(S.layout.interior.fixtures.shelfLeft.x,S.layout.interior.fixtures.shelfLeft.z));
assert(!S.isWalkPosition(1.65,-1.60));
walkTo(-.8,.32);
reached(-.8,.32);
assert(!S.isStoreView(S.view));
walkTo(-7.95,.32);
walkTo(-7.95,-6.25);
reached(-7.95,-6.25);
walkTo(-7.95,.32);
walkTo(-11.8,.32);
walkTo(-11.8,-4.04);
reached(-11.8,-4.04);
assert(!S.isWalkPosition(13.36,7.60),'Shelter bench must block the player');
assert(!S.isWalkPosition(6,6),'Central traffic lane stays outside the pedestrian route');
console.log('PASS: bus stop, signal-gated crossing, shop entry and return, alley and restaurant linkage');

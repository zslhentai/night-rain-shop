/* Use the vendored r128 loader with decoded raster images; no GPU required. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadImage } = require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');

require('./scene.cjs');
global.self=global;
global.createImageBitmap=async blob=>loadImage(Buffer.from(await blob.arrayBuffer()));
for(const file of ['vendor/GLTFLoader-r128.js','src/cooler-sample.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
}

async function verify(){
  const legacy=process.env.COOLER_LEGACY==='1';
  S.legacyTuning=legacy;
  const source=fs.readFileSync(path.join(root,'assets/models/yomachi-cooler.glb'));
  assert(source.length<900*1024,'Asset must be under the 900 KiB transfer budget');
  const raw=JSON.parse(source.subarray(20,20+source.readUInt32LE(12)).toString('utf8'));
  assert.equal(raw.asset.version,'2.0');
  assert.equal((raw.extensionsRequired||[]).length,0,'No runtime decoder should be required');
  assert.equal(raw.images.length,1,'The product labels and prices share a single atlas');
  const triangles=raw.nodes.reduce((total,node)=>total+(node.mesh===undefined?0:raw.meshes[node.mesh].primitives.reduce(
    (sum,primitive)=>sum+raw.accessors[primitive.indices].count/3,0)),0);
  assert(triangles<30000,'Mobile triangle budget');
  const result=await new Promise((resolve,reject)=>S.createCoolerLoader().parse(
    source.buffer.slice(source.byteOffset,source.byteOffset+source.byteLength),'',resolve,reject));
  const stock=result.scene.getObjectByName('Stock');
  assert(stock && stock.children.length>=50);
  const runtimeTextures=new Set();
  result.scene.traverse(object=>{if(object.material?.map) runtimeTextures.add(object.material.map);});
  assert.equal(runtimeTextures.size,legacy?3:1,'Equivalent GLB atlas slots must share one runtime texture');
  const bank=S.coolerFallback;
  let originalCabinetDrawables=0;
  [...bank.body,...bank.doors].forEach(root=>root.traverseVisible(
    object=>{if(object.isMesh || object.isSprite || object.isLine) originalCabinetDrawables++;}));
  global.location={search:'?cooler=original'};
  assert.equal(await S.loadCoolerSample(),false);
  assert.equal(S.coolerSampleState,'original');
  assert.throws(()=>S.mountCoolerSample(new THREE.Group(),bank),/Missing cabinet/);
  assert(bank.body.every(object=>object.visible),'An invalid asset must leave the original cabinet visible');
  const [left,right]=S.coldDoors.slice(2);
  const callbacks=S.updaters.length;
  const fallbackMount=right.hinge;
  S.world.updateMatrixWorld(true);
  const rightHinge=right.hinge.getWorldPosition(new THREE.Vector3());
  const before=Object.values(S.productBatches).reduce((sum,mesh)=>sum+mesh.count,0);
  const beforeTriangles=Object.values(S.productBatches).reduce(
    (sum,mesh)=>sum+(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3*mesh.count,0);
  result.scene.updateMatrixWorld(true);
  for(const [name,door] of [['Door_R',right],['Door_L',left]]){
    const authored=result.scene.getObjectByName(name).getWorldPosition(new THREE.Vector3());
    authored.add(new THREE.Vector3().fromArray(bank.location));
    assert(authored.distanceTo(door.hinge.getWorldPosition(new THREE.Vector3()))<.001,'Asset pivots must match live hinges');
  }
  const mount=S.mountCoolerSample(result.scene,bank);
  assert.equal(S.updaters.length,callbacks);
  assert.equal(right.hinge,fallbackMount);
  assert(right.hinge.getWorldPosition(new THREE.Vector3()).distanceTo(rightHinge)<1e-5);
  assert(bank.body.every(object=>object.visible===false));
  assert(S.coldDoors.slice(0,2).every(door=>door.hinge.children.every(obj=>obj.visible)),'Left cabinet is retained');
  const hidden=new THREE.Matrix4();
  const oldBatches=Object.entries(S.productBatches).filter(([id])=>!id.startsWith('cooler:')).map(([,mesh])=>mesh);
  const remaining=oldBatches.reduce((sum,mesh)=>sum+mesh.count,0);
  const remainingTriangles=oldBatches.reduce(
    (sum,mesh)=>sum+(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3*mesh.count,0);
  assert.equal(before-remaining,legacy?0:bank.stock.length);
  let batches=0,products=0,opaqueParts=0;
  mount.traverse(o=>{
    if(o.isInstancedMesh){batches++;products+=o.count;}
    else if(o.isMesh) opaqueParts++;
  });
  assert.equal(batches,8);
  assert.equal(products,stock.children.length);
  global.devicePixelRatio=3;
  S.mobileGraphics=true;
  global.innerWidth=390;
  global.innerHeight=844;
  assert.equal(S.renderPixelRatio('high'),legacy?2:1.6);
  assert.equal(S.renderPixelRatio('low'),1);
  for(const [width,height] of [[1440,900],[390,844]]){
    global.innerWidth=width;
    global.innerHeight=height;
    S.camera.aspect=width/height;
    S.setView('cooler-art');
    S.camera.updateMatrixWorld();
    assert(S.isWalkPosition(S.camera.position.x,S.camera.position.z));
    for(const corner of [[-1.345,.10],[.545,.10],[-1.345,2.44],[.545,2.44]]){
      const projected=new THREE.Vector3(corner[0],corner[1],-7.88).project(S.camera);
      assert(Math.abs(projected.x)<.96 && Math.abs(projected.y)<.96,'Complete cabinet fits the comparison frame');
    }
    for(let step=0;step<12 && !S.nearbyColdDoor();step++) S.walkStep(0,-.25);
    assert(bank.doors.includes(S.nearbyColdDoor()?.hinge),'Forward movement from the preset reaches the same cabinet');
  }
  S.camera.position.set(-.39,1.62,-6.64);
  S.camera.lookAt(-.39,1.22,-8.06);
  const door=S.nearbyColdDoor();
  assert(S.coldDoors.slice(2).includes(door),'Sample must keep the original nearby hinge');
  S.toggleColdDoor();
  for(let i=0;i<60;i++) S.updaters.forEach(update=>update(248+i/30,1/30));
  assert(Math.abs(door.angle)>1);
  const edge=door.hinge.localToWorld(new THREE.Vector3(-door.side*1.08,0,0));
  assert(!S.isWalkPosition(edge.x,edge.z),'Sample door must block the player as it swings into the aisle');
  const sample=S.productBatches['cooler:water'];
  S.world.updateMatrixWorld(true);
  sample.getMatrixAt(0,hidden);
  const bottle=sample.localToWorld(new THREE.Vector3().setFromMatrixPosition(hidden));
  S.camera.position.set(bottle.x,1.68,-6.91);
  S.camera.lookAt(bottle.x,bottle.y+.13,bottle.z);
  const selection=S.pickProduct(0,0);
  assert(selection && selection.mesh.name.startsWith('Blender SKU'),'Inspect must resolve imported products');
  assert.equal(selection.product.title,'天然水');
  assert.equal(selection.product.price,118);
  const original=new THREE.Matrix4();
  selection.mesh.getMatrixAt(selection.index,original);
  S.inspectProduct(0,0);
  const take=document.getElementById('take-product');
  for(let i=0;i<30;i++){
    S.inspectProduct(0,0);
    take.onclick();
    assert.equal(S.camera.children[0]?.geometry,selection.mesh.geometry,'Pickup uses the authored geometry');
    take.onclick();
    assert.equal(S.camera.children.length,0,'Returning removes the temporary held model');
  }
  selection.mesh.getMatrixAt(selection.index,hidden);
  assert.deepEqual(hidden.elements,original.elements,'Returning a drink restores its position');
  console.log(JSON.stringify({legacy,bytes:source.length,triangles,products,batches,runtimeTextures:runtimeTextures.size,opaqueParts,originalCabinetDrawables,retiredInstances:before-remaining,
    retiredTriangles:beforeTriangles-remainingTriangles,retainedDoors:S.coldDoors.length}));
}

verify().catch(error=>{ console.error(error);process.exitCode=1; });

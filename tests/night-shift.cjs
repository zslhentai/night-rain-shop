// Parse the shipping assets with Three r128, then exercise shared customer inventory.
const assert=require('node:assert/strict');
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const {loadImage}=require('@napi-rs/canvas');
require('./scene.cjs');
const root=path.resolve(__dirname,'..');
global.self=global;
global.createImageBitmap=async blob=>loadImage(Buffer.from(await blob.arrayBuffer()));
for(const file of ['vendor/GLTFLoader-r128.js','src/night-shopping.js'])
  vm.runInThisContext(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
async function run(){
  for(const [group,num] of [['aisle',16],['fresh',3]]){
    const buffer=fs.readFileSync(path.join(root,'assets/models/night-'+group+'.glb'));
    const glb=await new Promise((resolve,reject)=>new THREE.GLTFLoader().parse(buffer.buffer.slice(
      buffer.byteOffset,buffer.byteOffset+buffer.length),'',resolve,reject));
    S.mountStockArt(group,glb.scene);
    const materials=new Set();
    let count=0;
    glb.scene.traverse(node=>{
      if(!node.isMesh) return;
      const id=node.name.slice('product_'.length);
      assert.equal(S.productBatches[id].geometry,node.geometry);
      assert.equal(S.products[id].material,node.material);
      node.geometry.computeBoundingBox();
      assert(Math.abs(node.geometry.boundingBox.min.y)<.002,'Product rests on its shelf');
      materials.add(node.material);count++;
    });
    assert.equal(materials.size,1);assert.equal(count,num);
  }
  assert(S.mealVisuals.every(group=>group.children.length===1 && group.children[0].geometry===S.products.bento.geometry));
  const button=id=>document.getElementById(id);
  const advance=(start,n)=>{for(let i=0;i<n;i++)for(const update of S.updaters)update(start+i/30,1/30);};
  S.installNightShopping(); S.setView('bento');
  button('errand-start').onclick();
  const fresh=S.productBatches.bento, water=S.productBatches.water;
  function add(mesh,item,index){
    const ticket=S.reserveSlot(mesh,index);
    assert(ticket);assert.equal(S.reserveSlot(mesh,index),null);
    S.addBasket(ticket,item);
  }
  add(fresh,S.products.bento,0);
  assert.equal(S.canBasket(S.products.onigiri),false);
  button('errand-undo').onclick();assert(!S.slotBusy(fresh,0));
  add(fresh,S.products.bento,0);add(water,S.products.water,0);
  S.setView('checkout');S.registerStaffAvailable=true;
  for(let i=0;i<2;i++)button('errand-next').onclick();
  assert.equal(button('errand-next').textContent,'付款 ¥658');
  button('errand-next').onclick();assert(S.receipt.visible);assert(S.hasPurchasedStock());
  button('errand-next').onclick();assert(!S.checkoutClaimed);
  assert(S.slotBusy(water,0) && S.slotBusy(fresh,0),'Paid goods remain absent');
  S.leaveNightShopping();
  advance(260,240*30);
  assert(!S.hasPurchasedStock() && !S.slotBusy(water,0),'Clerk replenished sold drink and meal');
  button('errand-start').onclick();
  add(water,S.products.water,0);
  button('errand-exit').onclick();
  assert(!S.slotBusy(water,0),'Cancellation returns original slot');
  console.log('PASS: 19 packed Blender assets, shared food visuals, exclusive reservations, undo, checkout, exact receipt, bag, cancellation and physical restock route');
}
run().catch(e=>{console.error(e);process.exitCode=1;});

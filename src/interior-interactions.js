/* Local, reversible product inspection; shop inventory remains owned by the NPCs. */
(function(S){
  var T=THREE;
  var ray=new T.Raycaster(), pointer=new T.Vector2();
  var saved=new T.Matrix4(), hidden=new T.Matrix4().makeScale(0.00001,0.00001,0.00001);
  var active=null, held=null, panel, title, note, action, blockers=[];
  var itemPosition=new T.Vector3(), instanceTransform=new T.Matrix4();
  var visibleBlockers=[], blockerHits=[], productHits=[];

  S.pickProduct=function(x,y){
    if(!S.isStoreView(S.view) || !S.inShop(S.camera.position)) return null;
    S.camera.updateMatrixWorld();
    S.world.updateMatrixWorld(true);
    pointer.set(x,y);
    ray.setFromCamera(pointer,S.camera);
    ray.far=1.70;
    productHits.length=0;
    var hit=ray.intersectObjects(Object.values(S.productBatches),false,productHits)[0];
    if(!hit) return null;
    visibleBlockers.length=0;
    for(var i=0;i<blockers.length;i++){
      var parent=blockers[i];
      while(parent && parent.visible) parent=parent.parent;
      if(!parent) visibleBlockers.push(blockers[i]);
    }
    ray.far=hit.distance-.015;
    blockerHits.length=0;
    if(ray.intersectObjects(visibleBlockers,false,blockerHits).length) return null;
    var meta=hit.object.userData;
    return {mesh:hit.object,index:hit.instanceId,product:meta.product||S.products[meta.productId]};
  };

  function showInfo(selection){
    active=selection;
    panel.hidden=!selection;
    if(!selection) return;
    var info=selection.product;
    title.textContent=info.type+'  ·  ¥'+info.price;
    note.textContent=info.title;
    action.textContent=held?'归位':'拿起来';
  }
  function returnProduct(fromButton){
    if(held){
      if(fromButton && S.perf) S.perf.interaction('商品归位');
      held.mesh.setMatrixAt(held.index,saved);
      held.mesh.instanceMatrix.needsUpdate=true;
      S.camera.remove(held.model);
      held=null;
    }
    if(panel) showInfo(null);
  }
  S.returnProduct=returnProduct;
  S.inspectProduct=function(x,y){
    if(!panel || document.body.classList.contains('photo')) return;
    if(held) return;
    if(S.perf) S.perf.interaction('查看商品');
    showInfo(S.pickProduct(x,y));
  };
  function takeProduct(){
    if(!active || held) { returnProduct(true); return; }
    if(S.perf) S.perf.interaction('拿取商品');
    active.mesh.getMatrixAt(active.index,saved);
    active.mesh.setMatrixAt(active.index,hidden);
    active.mesh.instanceMatrix.needsUpdate=true;
    var model=new T.Mesh(active.mesh.geometry,active.mesh.material);
    model.position.set(.19,-.26,-.53);
    model.rotation.set(-.15,-.27,.13);
    S.camera.add(model);
    held=Object.assign({model:model},active);
    showInfo(held);
  }
  S.installShopInteractions=function(){
    panel=document.getElementById('product-card');
    title=document.getElementById('product-title');
    note=document.getElementById('product-note');
    action=document.getElementById('take-product');
    action.onclick=takeProduct;
    document.getElementById('close-product').onclick=function(){returnProduct(true);};
    document.getElementById('inspect-product').onclick=function(){S.inspectProduct(0,0);};
    S.addShopBlockers(S.world);
    S.scene.add(S.camera);
    S.addUpdate(function(){
      if(active&&!held){
        active.mesh.getMatrixAt(active.index,instanceTransform);
        itemPosition.setFromMatrixPosition(instanceTransform);
        active.mesh.localToWorld(itemPosition);
        var eye=S.camera.position;
        if(Math.hypot(itemPosition.x-eye.x,itemPosition.z-eye.z)>1.85) showInfo(null);
      }
    });
  };

  S.addShopBlockers=function(root){
    root.traverse(function(object){
      if(object.isMesh && object.visible && !object.isInstancedMesh && !object.material.transparent){
        blockers.push(object);
      }
    });
  };
  S.inShop=function(position){
    var room=S.SHOP;
    return position.x>room.x0 && position.x<room.x1 && position.z>room.z0 && position.z<room.z1;
  };
})(window.S);

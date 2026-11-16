/* Local, reversible product inspection; shop inventory remains owned by the NPCs. */
(function(S){
  var T=THREE;
  var ray=new T.Raycaster(), pointer=new T.Vector2();
  var saved=new T.Matrix4(), hidden=new T.Matrix4().makeScale(0.00001,0.00001,0.00001);
  var active=null, held=null, panel, title, note, action, blockers;

  S.pickProduct=function(x,y){
    if(!S.isStoreView(S.view) || !S.inShop(S.camera.position)) return null;
    S.camera.updateMatrixWorld();
    S.world.updateMatrixWorld(true);
    pointer.set(x,y);
    ray.setFromCamera(pointer,S.camera);
    ray.far=1.70;
    var hit=ray.intersectObjects(Object.values(S.productBatches),false)[0];
    if(!hit) return null;
    var occlusion=ray.intersectObjects(blockers,false).find(function(other){
      return other.object.visible && other.distance<hit.distance-.015;
    });
    if(occlusion) return null;
    return {mesh:hit.object,index:hit.instanceId,product:S.products[hit.object.userData.productId]};
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
  S.returnProduct=function(){
    if(held){
      held.mesh.setMatrixAt(held.index,saved);
      held.mesh.instanceMatrix.needsUpdate=true;
      S.camera.remove(held.model);
      held=null;
    }
    if(panel) showInfo(null);
  };
  S.inspectProduct=function(x,y){
    if(!panel || document.body.classList.contains('photo')) return;
    if(held) return;
    showInfo(S.pickProduct(x,y));
  };
  function takeProduct(){
    if(!active || held) { S.returnProduct(); return; }
    active.mesh.getMatrixAt(active.index,saved);
    active.mesh.setMatrixAt(active.index,hidden);
    active.mesh.instanceMatrix.needsUpdate=true;
    var model=new T.Mesh(active.product.geometry,active.product.material);
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
    document.getElementById('close-product').onclick=S.returnProduct;
    document.getElementById('inspect-product').onclick=function(){S.inspectProduct(0,0);};
    blockers=[];
    S.world.traverse(function(object){
      if(object.isMesh && object.visible && !object.isInstancedMesh && !object.material.transparent){
        blockers.push(object);
      }
    });
    S.scene.add(S.camera);
    S.addUpdate(function(){
      if(active&&!held){
        var p=active.product.positions[active.index],eye=S.camera.position;
        if(Math.hypot(p[0]-eye.x,p[2]-eye.z)>1.85) showInfo(null);
      }
    });
  };

  S.inShop=function(position){
    var room=S.SHOP;
    return position.x>room.x0 && position.x<room.x1 && position.z>room.z0 && position.z<room.z1;
  };
})(window.S);

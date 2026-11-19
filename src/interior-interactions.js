/* World-space partitions are built once. Dynamic door leaves also cover their sweep. */
(function(S){
  var T=THREE, ray=new T.Raycaster(), pointer=new T.Vector2(), cells=new Map();
  var productHits=[], blockerHits=[], active=null, held=null, panel,title,note,action,basket;
  var matrix=new T.Matrix4(), point=new T.Vector3();
  var cellSize=2, reach=1.7;
  var stockBounds=new Map(), frustum=new T.Frustum(), clip=new T.Matrix4(), lastClip=new T.Matrix4();
  var boundsChanged=true;
  // r128 does not cull InstancedMesh. Preserve slot transforms and the local
  // geometry bounds used by raycasts and by individual items held in the hand.
  S.cullStockBatches=function(){
    S.camera.updateMatrixWorld();
    clip.multiplyMatrices(S.camera.projectionMatrix,S.camera.matrixWorldInverse);
    if(!boundsChanged && clip.equals(lastClip)) return;
    boundsChanged=false;lastClip.copy(clip);
    frustum.setFromProjectionMatrix(clip);
    stockBounds.forEach(function(box,mesh){mesh.visible=mesh.count>0 && frustum.intersectsBox(box);});
  };
  function key(x,z){return Math.floor(x/cellSize)+','+Math.floor(z/cellSize);}
  function index(object,products,x0,x1,z0,z1){
    var room=S.SHOP;
    for(var x=Math.floor(Math.max(room.x0-2,x0-reach)/cellSize);x<=Math.floor(Math.min(room.x1+2,x1+reach)/cellSize);x++)
      for(var z=Math.floor(Math.max(room.z0-2,z0-reach)/cellSize);z<=Math.floor(Math.min(room.z1+2,z1+reach)/cellSize);z++){
        var id=x+','+z, cell=cells.get(id);
        if(!cell){cell={products:new Set(),blockers:new Set()};cells.set(id,cell);}
        (products?cell.products:cell.blockers).add(object);
      }
  }
  S.addShopBlockers=function(root){
    root.updateWorldMatrix(true,true);
    var bounds=new T.Box3();
    root.traverseVisible(function(object){
      if(!object.isMesh) return;
      if(object.isInstancedMesh){
        if(!object.userData.productId && !object.userData.product) return;
        var slotBounds=new T.Box3();
        for(var i=0;i<object.count;i++){
          object.getMatrixAt(i,matrix);
          point.setFromMatrixPosition(matrix).applyMatrix4(object.matrixWorld);
          slotBounds.expandByPoint(point);
          index(object,true,point.x-.22,point.x+.22,point.z-.22,point.z+.22);
        }
        // Authored items and fallback packages fit within 0.5m of their shelf slot.
        if(!slotBounds.isEmpty()){
          stockBounds.set(object,slotBounds.expandByScalar(.5));
          boundsChanged=true;
        }
        return;
      }

      // Only this mesh, not its descendants. Door positions can vary by one leaf width.
      if(!object.geometry.boundingBox) object.geometry.computeBoundingBox();
      bounds.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld);
      var parent=object, sweep=0;
      while(parent){
        if(S.coldDoors?.some(function(door){return door.hinge===parent;})) sweep=1.3;
        if(S.mealVisuals.includes(parent) || S.people.some(function(p){return p.group===parent;})) return;
        parent=parent.parent;
      }
      if(object.material.transparent && !sweep) return;
      index(object,false,bounds.min.x-sweep,bounds.max.x+sweep,bounds.min.z-sweep,bounds.max.z+sweep);
    });
  };
  function visible(object){
    for(var parent=object;parent;parent=parent.parent) if(!parent.visible) return false;
    return true;
  }
  S.pickProduct=function(x,y){
    if(!S.isStoreView(S.view) || !S.inShop(S.camera.position)) return null;
    var cell=cells.get(key(S.camera.position.x,S.camera.position.z));
    if(!cell) return null;
    S.cullStockBatches();
    ray.setFromCamera(pointer.set(x,y),S.camera);
    ray.far=reach; productHits.length=0;
    cell.products.forEach(function(mesh){
      if(visible(mesh)) ray.intersectObject(mesh,false,productHits);
    });
    var hit=productHits.sort(function(a,b){return a.distance-b.distance;}).find(function(h){
      return !S.slotBusy(h.object,h.instanceId);
    });
    if(!hit) return null;
    ray.far=hit.distance-.015; blockerHits.length=0;
    cell.blockers.forEach(function(mesh){
      if(visible(mesh)) ray.intersectObject(mesh,false,blockerHits);
    });
    if(blockerHits.some(h=>!h.object.material.transparent)) return null;
    return {behindGlass:blockerHits.length>0,mesh:hit.object,index:hit.instanceId,product:hit.object.userData.product || S.products[hit.object.userData.productId]};
  };

  function show(selection){
    active=selection;
    panel.hidden=!selection;
    if(!selection) return;
    var item=selection.product;
    title.textContent=item.type+' · ¥'+item.price; note.textContent=item.title;
    action.disabled=!!selection.behindGlass;
    action.textContent=held?'归位':selection.behindGlass?'请先打开柜门':'拿起来';
    basket.hidden=selection.behindGlass || !S.canBasket?.(item);
  }
  function putBack(fromButton){
    if(held){
      if(fromButton && S.perf) S.perf.interaction('商品归位');
      S.releaseSlot(held.ticket);
      S.camera.remove(held.model);
      held=null;
      document.body.classList.remove('inspecting');
    }
    if(panel) show(null);
  }
  S.returnProduct=putBack;
  S.inspectProduct=function(x,y){
    if(!panel || held || document.body.classList.contains('photo')) return;
    if(S.perf) S.perf.interaction('查看商品');
    show(S.pickProduct(x,y));
  };
  S.rotateHeld=function(dx,dy){
    if(!held) return false;
    held.model.rotation.y+=dx*.012;
    held.model.rotation.x=S.clamp(held.model.rotation.x+dy*.009,-1.48,1.48);
    return true;
  };
  S.refreshHeldArt=function(mesh){
    if(held && held.ticket.mesh===mesh){
      held.model.geometry=mesh.geometry;
      held.model.material=mesh.material;
    }
  };
  function take(){
    if(held || !active){putBack(true);return;}
    if(active.behindGlass) return;
    var ticket=S.reserveSlot(active.mesh,active.index);
    if(!ticket){show(null);return;}
    var item=active.product;
    var model=new T.Mesh(active.mesh.geometry,active.mesh.material);
    var measured=S.products[item.id], extent=Math.max(measured.w,measured.h,measured.d);
    model.scale.setScalar(.29/extent);
    model.position.set(0,-measured.h*model.scale.y*.45,-.53);
    model.rotation.set(.13,-.17,0);
    S.camera.add(model);
    held={ticket:ticket,model:model};
    S.resetWalkInput();
    document.body.classList.add('inspecting');
    if(S.perf) S.perf.interaction('拿取商品');
    show(active);
  }
  S.holdingProduct=function(){return !!held;};
  S.installShopInteractions=function(){
    panel=document.getElementById('product-card'); title=document.getElementById('product-title');
    note=document.getElementById('product-note'); action=document.getElementById('take-product');
    basket=document.getElementById('basket-add');
    action.onclick=take;
    basket.onclick=function(){
      if(!active || active.behindGlass || !S.canBasket(active.product)) return;
      var ticket=held?held.ticket:S.reserveSlot(active.mesh,active.index);
      if(!ticket){show(null);return;}
      if(held){S.camera.remove(held.model);held=null;document.body.classList.remove('inspecting');}
      S.addBasket(ticket,active.product); show(null);
    };
    document.getElementById('close-product').onclick=function(){putBack(true);};
    document.getElementById('inspect-product').onclick=function(){S.inspectProduct(0,0);};
    S.addShopBlockers(S.world);
    S.scene.add(S.camera);
    S.addUpdate(function(){
      if(!active || held) return;
      active.mesh.getMatrixAt(active.index,matrix);
      point.setFromMatrixPosition(matrix).applyMatrix4(active.mesh.matrixWorld);
      if(S.slotBusy(active.mesh,active.index) || point.distanceTo(S.camera.position)>2.1) show(null);
    });
  };
  S.inShop=function(p){var room=S.SHOP;return p.x>room.x0 && p.x<room.x1 && p.z>room.z0 && p.z<room.z1;};
})(window.S);

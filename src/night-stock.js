/* Stock tickets stay attached to an instance, including while its artwork changes. */
(function(S){
  var occupied=new WeakMap(), sold=[];
  var invisible=new THREE.Matrix4().makeScale(0,0,0);
  S.slotBusy=function(mesh,index){ return occupied.get(mesh)?.has(index) || false; };
  S.reserveSlot=function(mesh,index){
    if(index<0 || index>=mesh.count || S.slotBusy(mesh,index)) return null;
    var slots=occupied.get(mesh);
    if(!slots){slots=new Map(); occupied.set(mesh,slots);}
    var matrix=new THREE.Matrix4();
    mesh.getMatrixAt(index,matrix);
    var ticket={mesh:mesh,index:index,matrix:matrix};
    slots.set(index,ticket);
    mesh.setMatrixAt(index,invisible);
    mesh.instanceMatrix.needsUpdate=true;
    return ticket;
  };
  S.releaseSlot=function(ticket){
    if(!ticket || occupied.get(ticket.mesh)?.get(ticket.index)!==ticket) return;
    ticket.mesh.setMatrixAt(ticket.index,ticket.matrix);
    ticket.mesh.instanceMatrix.needsUpdate=true;
    occupied.get(ticket.mesh).delete(ticket.index);
  };
  S.hasPurchasedStock=function(){return sold.length>0;};
  S.markPurchased=function(ticket,category){sold.push({ticket:ticket,category:category});};
  S.restockPurchases=function(category){
    for(var i=sold.length-1;i>=0;i--){
      if(sold[i].category!==category) continue;
      S.releaseSlot(sold[i].ticket);
      sold.splice(i,1);
    }
  };
  S.nextMealSlot=function(){
    var mesh=S.productBatches.bento, center=Math.floor(mesh.count/2);
    for(var n=0;n<mesh.count;n++){
      var index=(center+n)%mesh.count;
      if(!S.slotBusy(mesh,index)) return index;
    }
    return -1;
  };

  var catalogues={
    aisle:{file:'night-aisle',ids:['chips','crackers','candy','biscuits','cup','bowl','noodles','tissue',
      'seaweedChips','sesameRice','citrusCandy','cocoaBiscuits','misoCup','sobaBowl','spicyNoodles','softTissue']},
    fresh:{file:'night-fresh',ids:['bento','onigiri','sandwich']}
  };
  S.stockArtState={aisle:'idle',fresh:'idle'};
  S.mountStockArt=function(zone,root){
    var entries=catalogues[zone].ids.map(function(id){
      var source=root.getObjectByName('product_'+id);
      if(!source?.isMesh || !source.material.map || !S.productBatches[id]) throw new Error('Missing stock artwork: '+id);
      return {id:id,source:source};
    });
    entries.forEach(function(entry){
      var item=S.products[entry.id], mesh=S.productBatches[item.id];
      var old=mesh.geometry, art=entry.source;
      mesh.geometry=item.geometry=art.geometry;
      mesh.material=item.material=art.material;
      // Shelf bounce; use the original packaging colours even beneath an upper deck.
      art.material.emissive.setHex(0xffffff);
      art.material.emissiveMap=art.material.map;
      art.material.emissiveIntensity=.16;
      if(S.refreshHeldArt) S.refreshHeldArt(mesh);
      old.dispose();
      if(item.id==='bento'){
        S.mealVisuals.forEach(function(group){
          group.clear();
          group.add(new THREE.Mesh(item.geometry,item.material));
        });
      }
    });
  };
  var loading=false;
  S.queueNightStock=function(){
    if(loading || !THREE.GLTFLoader || !S.isStoreView(S.view)) return;
    var rear=S.camera.position.z < -6.1 || S.view==='bento';
    var order=rear?['fresh','aisle']:['aisle','fresh'];
    var zone=order.find(function(name){return S.stockArtState[name]==='idle';});
    if(!zone) return;
    loading=true;
    S.stockArtState[zone]='loading';
    if(S.perf) S.perf.mark(zone+' 资源请求');
    new THREE.GLTFLoader().load('assets/models/'+catalogues[zone].file+'.glb',function(result){
      try{
        S.mountStockArt(zone,result.scene);
        S.stockArtState[zone]='ready';
        if(S.perf) S.perf.mark(zone+' 装配完成');
      }catch(error){failed(error);}
      loading=false;
    },undefined,failed);
    function failed(error){
      loading=false; S.stockArtState[zone]='fallback';
      var status=document.getElementById('asset-notice');
      status.hidden=false;
      status.textContent=(zone==='fresh'?'鲜食':'货架')+'高清资源加载失败，已使用基础陈列。';
      console.warn('Night stock artwork unavailable',zone,error);
    }
  };
})(window.S);

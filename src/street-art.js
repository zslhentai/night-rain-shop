/* Mount one small, untextured Blender asset without blocking the first frame. */
(function(S){
  var slots=new Map();
  S.streetArtSlot=function(name,fallback,parent,position){
    slots.set(name,{fallback:fallback,parent:parent,position:position});
  };
  S.streetArtState='pending';
  S.loadStreetArt=function(){
    if(S.streetArtState!=='pending') return;
    if(!THREE.GLTFLoader){S.streetArtState='fallback';return;}
    S.streetArtState='loading';
    if(S.perf) S.perf.mark('外景模型开始加载');
    function fail(error){
      S.streetArtState='fallback';
      console.warn('外景 GLB 加载失败，使用基础模型',error);
    }
    new THREE.GLTFLoader().load('assets/models/yomachi-street.glb',function(result){
      var parts=new Map();
      slots.forEach(function(slot,name){
        var model=result.scene.getObjectByName(name);
        if(model) parts.set(name,model);
      });
      if(parts.size!==slots.size){fail(new Error('Missing exterior fixture'));return;}
      parts.forEach(function(model,name){
        var slot=slots.get(name);
        model.position.fromArray(slot.position);
        model.traverse(function(node){if(node.isMesh) node.receiveShadow=true;});
        slot.parent.add(model);
        slot.fallback.parent.remove(slot.fallback);
      });
      S.streetArtState='ready';
      if(S.perf) S.perf.mark('外景模型加载完成');
    },undefined,fail);
  };
})(window.S);

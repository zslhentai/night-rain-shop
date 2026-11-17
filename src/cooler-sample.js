/* Optional Blender asset. The original cabinet remains a complete fallback. */
(function(S){
  var T=THREE;
  var initial=new T.Matrix4().makeScale(0.00001,0.00001,0.00001);

  S.createCoolerLoader=function(){
    var loader=new T.GLTFLoader();
    if(S.legacyTuning) return loader;
    loader.register(function(parser){
      return {
        name:'SharedCoolerAtlas',
        beforeRoot:function(){
          var textures=parser.json.textures, atlas=textures && textures[0];
          if(!atlas || atlas.extensions) return;
          // Blender exports separate slots for the same atlas and sampler.
          // Remap those slots before r128 decodes each into a GPU texture.
          parser.json.materials.forEach(function(material){
            var ref=material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture;
            if(!ref || ref.extensions) return;
            var texture=textures[ref.index];
            if(texture && !texture.extensions && texture.source===atlas.source && texture.sampler===atlas.sampler){
              ref.index=0;
            }
          });
        }
      };
    });
    return loader;
  };

  S.mountCoolerSample=function(model,fallback){
    var cabinet=model.getObjectByName('Cabinet');
    var stock=model.getObjectByName('Stock');
    var leaves=[model.getObjectByName('Door_L'),model.getObjectByName('Door_R')];
    if(!cabinet || !stock || leaves.some(function(leaf){return !leaf;})) throw new Error('Missing cabinet or hinge nodes');
    if(!fallback || fallback.doors.length!==2) throw new Error('Original hinges unavailable');

    model.updateMatrixWorld(true);
    var pools=Object.create(null);
    stock.traverse(function(object){
      if(!object.isMesh) return;
      var sku=object.userData.sku, id=object.userData.productId;
      if(!sku || !S.products[id]) throw new Error('Unrecognized drink: '+id);
      var product={
        id:id,
        title:object.userData.productTitle,
        price:object.userData.productPrice,
        type:S.products[id].type
      };
      if(!product.title || !Number.isFinite(product.price)) throw new Error('Missing drink label: '+sku);
      var pool=pools[sku] || (pools[sku]={product:product,geometry:object.geometry,material:object.material,matrices:[]});
      if(pool.geometry!==object.geometry || pool.material!==object.material) throw new Error('SKU meshes must share geometry and material');
      pool.matrices.push(object.matrixWorld.clone());
    });
    if(Object.keys(pools).length<6) throw new Error('Incomplete drink asset');

    var position=fallback.location;
    var assembly=new T.Group();
    assembly.name='Blender cooler sample';
    assembly.position.fromArray(position);
    cabinet.traverse(function(node){
      if(!node.isMesh) return;
      node.receiveShadow=true;
      if(!S.legacyTuning && node.material.name==='Baked cool bounce'){
        node.material.color.setRGB(.42,.47,.45);
        node.material.emissive.setRGB(.42,.45,.42);
      }
    });
    assembly.add(cabinet);

    var mounted=Object.create(null);
    Object.keys(pools).forEach(function(sku){
      var pool=pools[sku];
      var instance=new T.InstancedMesh(pool.geometry,pool.material,pool.matrices.length);
      instance.name='Blender SKU '+sku;
      instance.userData.product=pool.product;
      pool.matrices.forEach(function(matrix,index){instance.setMatrixAt(index,matrix);});
      instance.instanceMatrix.needsUpdate=true;
      // PBR goods get a little baked shelf bounce from their own packaging map.
      pool.material.emissive.setHex(0xffffff);
      pool.material.emissiveMap=pool.material.map;
      pool.material.emissiveIntensity=.105;
      mounted['cooler:'+sku]=instance;
      assembly.add(instance);
    });
    var leafVisuals=leaves.map(function(leaf,index){
      var visual=new T.Group();
      visual.name=leaf.name+' Blender finish';
      // The parent of the old hinge carries the historical X scale.
      visual.scale.x=1/fallback.widthScale;
      leaf.children.slice().forEach(function(child){visual.add(child);});
      visual.traverse(function(node){
        if(node.isMesh && node.material.transparent){
          // One thin pane per leaf, with stable sorting and visible interiors.
          node.material.depthWrite=false;
          node.material.side=T.DoubleSide;
          node.renderOrder=2;
          if(!S.legacyTuning){
            node.material.opacity*=.79;
            node.material.color.lerp(new T.Color(0xf2f7f4),.4);
          }
        }
      });
      return {hinge:fallback.doors[index],visual:visual};
    });

    // Do not touch the old scene until the entire authored asset is ready.
    if(S.returnProduct) S.returnProduct();
    fallback.body.forEach(function(object){object.visible=false;});
    leafVisuals.forEach(function(item){
      item.hinge.children.slice().forEach(function(old){old.visible=false;});
      item.hinge.add(item.visual);
      if(S.addShopBlockers) S.addShopBlockers(item.visual);
    });
    if(S.legacyTuning){
      fallback.stock.forEach(function(entry){
        var instance=S.productBatches[entry.id];
        if(instance) {instance.setMatrixAt(entry.index,initial);instance.instanceMatrix.needsUpdate=true;}
      });
    }else{
      S.removeStockInstances(fallback.stock);
    }
    Object.keys(mounted).forEach(function(key){S.productBatches[key]=mounted[key];});
    S.world.add(assembly);
    if(S.addShopBlockers) S.addShopBlockers(assembly);
    if(!S.legacyTuning) assembly.updateMatrixWorld(true);

    return assembly;
  };

  S.loadCoolerSample=function(){
    function state(value){
      S.coolerSampleState=value;
      if(window.rainPreview) window.rainPreview.cooler(value);
    }
    if(new URLSearchParams(location.search).get('cooler')==='original'){
      state('original');
      return Promise.resolve(false);
    }
    if(!T.GLTFLoader) {
      state('fallback');
      return Promise.resolve(false);
    }
    state('loading');
    if(S.perf) S.perf.mark('GLB 请求');
    return new Promise(function(resolve){
      var timeout=setTimeout(function(){fallback(new Error('Cooler asset timed out'));},18000);
      function fallback(error){
        if(S.coolerSampleState!=='loading') return;
        clearTimeout(timeout);
        state('fallback');
        console.warn('Blender cooler asset unavailable. Original cabinet retained.',error);
        resolve(false);
      }
      var loader=S.createCoolerLoader();
      var request=new T.FileLoader(loader.manager).setResponseType('arraybuffer');
      request.load('assets/models/yomachi-cooler.glb',function(bytes){
        if(S.coolerSampleState!=='loading') return;
        if(S.perf) S.perf.mark('GLB 到达');
        try {loader.parse(bytes,'',mount,fallback);}
        catch(error){fallback(error);}
      },undefined,fallback);
      function mount(result){
        if(S.coolerSampleState!=='loading') return;
        try {
          if(S.perf) S.perf.mark('GLB 解码完成');
          S.mountCoolerSample(result.scene,S.coolerFallback);
          clearTimeout(timeout);
          state('ready');
          if(S.perf) S.perf.mark('GLB 装配完成');
          resolve(true);
        }catch(error){fallback(error);}
      }
    });
  };
})(window.S);

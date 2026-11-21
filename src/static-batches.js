/* Bake static toon primitives while preserving material, picks and shadow flags. */
(function(S){
  var T=THREE;

  S.batchStaticScenery=function(){
    var buckets=new Map();
    var world=S.world;
    world.updateMatrixWorld(true);
    var inverse=new T.Matrix4().copy(world.matrixWorld).invert();
    var candidateCount=0;
    var dynamic=new Set(S.coolerFallback?.body || []);

    function collect(node,area) {
      var material=node.material, geo=node.geometry;
      if(dynamic.has(node) || !node.isMesh || node.isInstancedMesh || !node.visible || node.name || !geo ||
         !material || !material.isMeshToonMaterial || material.transparent ||
         material.vertexColors || material.side!==T.FrontSide || material.alphaTest>0 ||
         !geo.attributes.position || !geo.attributes.normal || !geo.attributes.uv ||
         node.children.some(function(child){return !child.isLineSegments;})) return;
      var matrix=new T.Matrix4().multiplyMatrices(inverse,node.matrixWorld);
      var e=matrix.elements;
      var cell=area || Math.floor((e[12]+3)/6)+'/'+Math.floor((e[14]+2)/6);
      var key=[cell,material.map?.id || 0,material.gradientMap?.id || 0,material.fog,
        material.emissive.getHex(),material.emissiveIntensity,material.toneMapped,
        node.castShadow,node.receiveShadow,node.renderOrder].join(':');
      if(!buckets.has(key)) buckets.set(key,[]);
      buckets.get(key).push({node:node,matrix:matrix});
      candidateCount++;
    }

    world.children.slice().forEach(function(node){
      collect(node,null);
      // Fixture groups are already spatially bounded. Their movable doors have
      // a separate nested transform and their labels retain normal drawables.
      if(S.layout.interior.fixtures[node.name] || node.userData.staticScenery){
        node.children.slice().forEach(function(child){collect(child,node.uuid);});
      }
    });

    var count=0, sourceMeshes=0;
    var normalMatrix=new T.Matrix3(), vector=new T.Vector3();
    buckets.forEach(function(group){
      if(group.length<3) return;
      var vertices=0, elements=0;
      group.forEach(function(entry){
        var g=entry.node.geometry;
        vertices+=g.attributes.position.count;
        elements+=g.index?g.index.count:g.attributes.position.count;
      });
      var positions=new Float32Array(vertices*3), normals=new Float32Array(vertices*3);
      var colors=new Float32Array(vertices*3), uvs=new Float32Array(vertices*2);
      var indices=vertices>65535?new Uint32Array(elements):new Uint16Array(elements);
      var offset=0, write=0;
      group.forEach(function(entry){
        var node=entry.node, geo=node.geometry, attrs=geo.attributes;
        var color=node.material.color;
        normalMatrix.getNormalMatrix(entry.matrix);
        for(var i=0;i<attrs.position.count;i++){
          var index=offset+i;
          vector.fromBufferAttribute(attrs.position,i).applyMatrix4(entry.matrix).toArray(positions,index*3);
          vector.fromBufferAttribute(attrs.normal,i).applyNormalMatrix(normalMatrix).toArray(normals,index*3);
          colors[index*3]=color.r;colors[index*3+1]=color.g;colors[index*3+2]=color.b;
          uvs[index*2]=attrs.uv.getX(i);uvs[index*2+1]=attrs.uv.getY(i);
        }
        if(geo.index){
          for(var j=0;j<geo.index.count;j++) indices[write++]=geo.index.getX(j)+offset;
        }else{
          for(var j=0;j<attrs.position.count;j++) indices[write++]=j+offset;
        }
        offset+=attrs.position.count;
        node.children.slice().forEach(function(line){world.attach(line);});
        node.parent.remove(node);
      });
      var g=new T.BufferGeometry();
      g.setAttribute('position',new T.BufferAttribute(positions,3));
      g.setAttribute('normal',new T.BufferAttribute(normals,3));
      g.setAttribute('uv',new T.BufferAttribute(uvs,2));
      g.setAttribute('color',new T.BufferAttribute(colors,3));
      g.setIndex(new T.BufferAttribute(indices,1));
      g.computeBoundingSphere();
      var first=group[0].node;
      var material=first.material.clone();
      material.color.setHex(0xffffff);material.vertexColors=true;
      var batch=new T.Mesh(g,material);
      batch.name='Static street and fixtures';
      batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;
      batch.renderOrder=first.renderOrder;
      world.add(batch);
      sourceMeshes+=group.length;count++;
    });

    // Outlines share a colour and opacity, but must keep their original
    // spatial bounds for the street-level camera.
    var outlines=new Map();
    world.children.forEach(function(line){
      if(!line.isLineSegments || !line.material.isLineBasicMaterial || line.material.depthWrite ||
         !line.visible || line.geometry.attributes.color) return;
      line.updateMatrixWorld();
      var p=line.matrixWorld.elements, mat=line.material;
      var key=[Math.floor(p[12]/6),Math.floor(p[14]/6),mat.color.getHex(),mat.opacity].join(':');
      if(!outlines.has(key)) outlines.set(key,[]);
      outlines.get(key).push(line);
    });
    outlines.forEach(function(lines){
      if(lines.length<3) return;
      var positions=[];
      lines.forEach(function(line){
        var matrix=new T.Matrix4().multiplyMatrices(inverse,line.matrixWorld);
        var vertices=line.geometry.attributes.position;
        for(var i=0;i<vertices.count;i++){
          vector.fromBufferAttribute(vertices,i).applyMatrix4(matrix);
          positions.push(vector.x,vector.y,vector.z);
        }
        world.remove(line);
      });
      var g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
      world.add(new T.LineSegments(g,lines[0].material));
      sourceMeshes+=lines.length;count++;
    });
    S.staticSceneryStats={candidates:candidateCount,sourceMeshes:sourceMeshes,batches:count};
  };
})(window.S);

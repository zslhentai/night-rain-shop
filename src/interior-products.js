/* Original packaging, reusable product meshes and one instance batch per SKU. */
(function(S){
  var T=THREE;
  var rows=[
    ['water','天然水','矿泉水','bottle',.105,.29,.105,0x7caec1,118],
    ['tea','深蒸し茶','绿茶饮料','tea',.117,.27,.117,0x709849,148],
    ['soda','ソーダ','汽水','soda',.125,.30,.125,0x6f99bd,158],
    ['can','レモン','罐装饮料','can',.105,.17,.105,0xe3bb50,138],
    ['coffee','珈琲','瓶装咖啡','short',.112,.18,.112,0xa87b57,168],
    ['milk','牛乳','牛奶盒','carton',.12,.24,.092,0x7d9ab9,198],
    ['juice','りんご','果汁盒','juice',.10,.16,.075,0xc98a53,128],
    ['chips','うすしお','袋装薯片','bag',.17,.23,.075,0xd99349,178],
    ['crackers','おかき','米果','widebag',.18,.16,.09,0x99a66a,148],
    ['candy','フルーツ','水果糖','pouch',.115,.16,.063,0xb66d88,138],
    ['biscuits','ビスケット','饼干盒','box',.155,.145,.09,0xb87956,188],
    ['cup','醤油ラーメン','杯面','cup',.155,.148,.155,0xcb7656,248],
    ['bowl','うどん','碗面','bowl',.185,.105,.185,0x9b8e57,258],
    ['noodles','焼そば','袋装速食','flat',.191,.136,.035,0xa45845,168],
    ['onigiri','鮭おにぎり','三角饭团','triangle',.15,.16,.073,0x749761,178],
    ['sandwich','たまごサンド','三明治','sandwich',.172,.146,.096,0xc69750,288],
    ['bento','鮭弁当','便当','tray',.245,.065,.17,0xd3965c,540],
    ['bread','ミルクパン','袋装面包','bread',.178,.106,.111,0xd0a873,158],
    ['tissue','ティッシュ','抽纸盒','tissue',.21,.105,.116,0x769d8b,248],
    ['paper','ペーパー','纸巾卷','roll',.13,.135,.13,0x6ea0a7,208],
    ['soap','ハンドソープ','洗手液','pump',.108,.228,.082,0x8fa3ab,398],
    ['care','歯みがき','牙膏盒','slim',.084,.215,.061,0x61918c,238],
    ['gum','ミント','薄荷口香糖','gum',.084,.093,.042,0x6aa188,128],
    ['paperCup','ホット珈琲','咖啡纸杯','paperCup',.12,.149,.12,0xb38862,118]
  ];
  var catalog={}, batches={}, atlas, material, matte;
  S.products=catalog;
  S.productBatches=batches;
  rows.forEach(function(row,index){
    var [id,title,type,shape,w,h,d,color,price]=row;
    catalog[id]={id:id,title:title,type:type,shape:shape,w:w,h:h,d:d,color:color,price:price,index:index,positions:[]};
  });

  function art(){
    atlas=S.makeTex(1536,1024,function(ctx,w,h){
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h);
      rows.forEach(function(row,index){
        var item=catalog[row[0]];
        var x=index%6*256, y=Math.floor(index/6)*204;
        ctx.fillStyle='#eae5d4'; ctx.fillRect(x+4,y+4,248,193);
        ctx.fillStyle='#'+item.color.toString(16).padStart(6,'0');
        ctx.fillRect(x+10,y+10,236,65);
        ctx.fillRect(x+10,y+152,236,40);
        ctx.fillStyle='#ffffea';
        ctx.font='700 20px system-ui'; ctx.fillText('夜町  ·  YOMACHI',x+18,y+47);
        ctx.fillStyle='#253532'; ctx.font='700 30px '+S.FONT;
        ctx.fillText(item.title,x+18,y+115,220);
        ctx.lineWidth=3; ctx.strokeStyle='#46554e';
        ctx.beginPath();ctx.moveTo(x+19,y+128);ctx.lineTo(x+232,y+128);ctx.stroke();
        ctx.fillStyle='#24322c';ctx.font='600 20px system-ui';
        ctx.fillText(['DAILY SELECT','FRESH STOCK','CORNER MARKET'][index%3],x+18,y+178);
      });
    });
    material=S.shopMaterial(0xffffff,{map:atlas,vertexColors:true,emissive:0x69645a,emissiveIntensity:.055,shininess:22});
    matte=S.shopMaterial(0xffffff,{map:atlas,vertexColors:true,emissive:0x69645a,emissiveIntensity:.055,shininess:5,specular:0x121212});
  }

  function geometry(item){
    if(item.geometry) return item.geometry;
    if(!atlas) art();
    var {w,h,d,shape,color,index}=item;
    var pos=[], norm=[], uv=[], colors=[];
    function add(g,y,tint,label,x,z){
      g.translate(x||0,y,z||0);
      var flat=g.index?g.toNonIndexed():g;
      var a=flat.attributes, shade=new T.Color(tint);
      var lx=index%6*256, ly=Math.floor(index/6)*204;
      for(var i=0;i<a.position.count;i++){
        pos.push(a.position.getX(i),a.position.getY(i),a.position.getZ(i));
        norm.push(a.normal.getX(i),a.normal.getY(i),a.normal.getZ(i));
        uv.push(label?(lx+9+a.uv.getX(i)*238)/1536: .998,
          label?1-(ly+191-a.uv.getY(i)*181)/1024:.008);
        colors.push(shade.r,shade.g,shade.b);
      }
      if(flat!==g) flat.dispose();
      g.dispose();
    }
    function box(wd,ht,dp,y,t,x,z){ add(new T.BoxGeometry(wd,ht,dp),y,t,false,x,z); }
    function cylinder(top,bottom,ht,y,t){ add(new T.CylinderGeometry(top,bottom,ht,12),y,t); }
    function triangle(wd,ht,depth,t){
      var form=new T.Shape();
      form.moveTo(-wd/2,0);form.lineTo(wd/2,0);form.lineTo(0,ht);form.lineTo(-wd/2,0);
      var prism=new T.ExtrudeGeometry(form,{depth:depth,bevelEnabled:false});
      add(prism,0,t,false,0,-depth/2);
    }

    switch(shape){
      case 'bottle': case 'tea': case 'soda': case 'short': {
        var shoulder=shape==='tea'?.66:shape==='soda'?.74:.79;
        var profile=[[0,0],[.43,.015],[.50,.09],[shape==='soda'?.37:.50,.40],[.50,.58],[.46,shoulder],[.22,.87],[.21,.95],[0,.95]];
        add(new T.LatheGeometry(profile.map(p=>new T.Vector2(p[0]*w,p[1]*h)),14),0,color);
        cylinder(w*.23,w*.245,h*.10,h*.95,shape==='water'?0xf5f2de:color);
        break;
      }
      case 'can': case 'roll':
        cylinder(w*.48,w*.48,h*.94,h*.49,color);
        cylinder(w*.51,w*.48,.006,h-.006,0xc3c7bb);
        if(shape==='can') box(.024,.004,.017,h-.001,0x726f61);
        break;
      case 'cup': case 'bowl': case 'paperCup':
        cylinder(w*.48,w*(shape==='bowl'?.33:.31),h*.94,h*.47,color);
        cylinder(w*.52,w*.48,.012,h-.006,0xe8e2ce);
        break;
      case 'bag': case 'widebag': case 'pouch': case 'flat': case 'bread': {
        var body=new T.BoxGeometry(w,h,d,3,3,2), vertices=body.attributes.position;
        for(var v=0;v<vertices.count;v++){
          var yy=vertices.getY(v)/h, taper=1-Math.abs(yy)*.20;
          vertices.setXYZ(v,vertices.getX(v)*taper,vertices.getY(v),vertices.getZ(v)*(1-Math.abs(yy)*1.34));
        }
        body.computeVertexNormals();
        add(body,h/2,color);
        box(w*.88,.009,d*.35,h-.004,0xe4d5aa);
        box(w*.88,.009,d*.35,.004,color);
        break;
      }
      case 'carton': case 'juice':
        box(w,h*.86,d,h*.43,color);
        box(w*.94,h*.14,d*.67,h*.93,0xe4e5d4);
        if(shape==='juice') box(.014,h*.53,.010,h*.60,0xf1e3cf,w*.35,d*.52);
        break;
      case 'triangle': case 'sandwich':
        triangle(w,h,d,0xece4ca);
        if(shape==='triangle') box(w*.41,h*.42,.008,h*.23,0x405749,0,d/2+.002);
        else {box(w*.52,.018,d+.002,h*.22,0xc8ad55);box(w*.39,.012,d+.003,h*.34,0x77a063);}
        break;
      case 'tray':
        box(w,h*.65,d,h*.32,0x343d38);
        box(w*.93,h*.28,d*.91,h*.80,0xc4b38c);
        box(w*.28,.009,d*.98,h-.004,color);
        break;
      case 'pump':
        box(w,h*.72,d,h*.36,color);
        cylinder(.017,.018,h*.21,h*.82,0xe3dfd0);
        box(w*.62,.013,.031,h-.009,0xf1eddf,w*.13,0);
        break;
      default:
        box(w,h,d,h/2,color);
        if(shape==='tissue'){
          box(.04,.021,d*.41,h+.007,0xf1e9d0);
        }else if(shape==='gum'){
          box(w*.94,.009,d+.005,h-.005,0xe1ecd9);
        }
    }
    var triangular=shape==='triangle'||shape==='sandwich';
    if(shape==='tray'){
      var lid=new T.PlaneGeometry(w*.40,d*.82);
      lid.rotateX(-Math.PI/2);
      add(lid,h+.002,0xffffff,true);
    }else{
      add(new T.PlaneGeometry(w*(triangular?.49:.87),h*(triangular?.27:.43)),h*(triangular?.38:.43),0xffffff,true,0,d*.5+.003);
    }
    var g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    g.computeBoundingSphere();
    item.geometry=g;
    item.material=/bag|flat|pouch|bread|box|slim|carton|tissue/.test(shape)?matte:material;
    return g;
  }

  S.stockProduct=function(id,x,y,z,angle){
    catalog[id].positions.push([x,y,z,angle||0]);
  };
  S.buildProductBatches=function(){
    var transform=new T.Object3D();
    Object.keys(catalog).forEach(function(id){
      var item=catalog[id];
      if(!item.positions.length) return;
      var g=geometry(item);
      var mesh=new T.InstancedMesh(g,item.material,item.positions.length);
      mesh.name='Product: '+item.title;
      item.positions.forEach(function(p,i){
        transform.position.set(p[0],p[1],p[2]);transform.rotation.y=p[3];
        transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;
      mesh.userData.productId=id;
      S.world.add(mesh);
      batches[id]=mesh;
    });
  };
})(window.S);

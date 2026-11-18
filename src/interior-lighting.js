/* Fixture-aligned light, with baked contact shading to keep the shop cheap to render. */
(function(S){
  var T=THREE;
  S.shopMaterial=function(color,options){
    return S.phong(color,Object.assign({shininess:11,emissive:color,emissiveIntensity:.12},options));
  };

  S.buildShopLighting=function(){
    var shell=S.toon(0xd9dfd8);
    var lens=S.basic(0xf2ead8);
    var floor=S.SHOP.floor;
    var plan=S.layout.interior;
    var fixtures=plan.fixtures;

    function beam(from,to,color,power,reach,angle){
      var light=new T.SpotLight(color,power,reach,angle,.64,2);
      light.position.fromArray(from);
      light.target.position.fromArray(to);
      S.world.add(light, light.target);
    }

    // Six physical diffusers share three broad beams. Aim across the shelf
    // fronts so labels catch light even when the viewer steps underneath.
    [fixtures.shelfLeft.x-.81,plan.aisleX,fixtures.shelfRight.x+.92].forEach(function(x,index){
      [-3.46,-5.76].forEach(function(z){
        S.box(.23,.048,1.59,shell,x,3.205,z,{});
        S.box(.159,.017,1.51,lens,x,3.173,z,{});
      });
      var aim=[fixtures.shelfLeft.x-.3,fixtures.shelfRight.x-.33,fixtures.shelfRight.x+.30][index];
      beam([x,3.13,-4.60],[aim,.91,-4.72],0xfff3df,1.45,6.7,1.01);
    });

    var drinks=fixtures.drinks, fresh=fixtures.bento, checkout=fixtures.checkout;
    beam([drinks.x,2.98,-6.75],[drinks.x,1.07,drinks.z],0xf1faf4,1.02,4.85,.97);
    beam([fresh.x,2.83,-6.72],[fresh.x,1.08,fresh.z],0xffeed3,1.13,4.85,.80);
    beam([checkout.x+1.08,2.96,checkout.z+.2],[checkout.x-.24,1.17,checkout.z-.14],0xffeacb,1.02,5.04,.88);

    // Contact shadows are baked onto one shop-sized transparent plane.
    var mask=S.makeTex(512,384,function(ctx,w,h){
      var shop=S.SHOP;
      Object.keys(fixtures).forEach(function(name){
        if(name==='stockroom') return;
        var b=fixtures[name].bounds;
        var width=(b[1]-b[0])*w/9, depth=(b[3]-b[2])*h/7;
        var x=(b[0]-shop.x0)*w/9, y=(b[2]-shop.z0)*h/7;
        for(var i=10;i>=0;i--){
          ctx.fillStyle='rgba(41,49,46,'+(i===0?.17:.023)+')';
          ctx.fillRect(x-i,y-i,width+2*i,depth+2*i);
        }
      });
    });
    S.groundPlane(9,7,S.basic(0xffffff,{map:mask,transparent:true,depthWrite:false}),-1.7,floor+.001,-5.1);

    // Visible wall and ceiling finish keep colour without blue ambient clipping.
    // Static indirect illumination: white near the ceiling, warmer through the
    // selling zone, and quiet at the skirting. The same map is reused on both walls.
    var wallMap=S.makeTex(128,256,function(ctx,w,h){
      var wash=ctx.createLinearGradient(0,0,0,h);
      wash.addColorStop(0,'#fffbed');wash.addColorStop(.34,'#f7edda');
      wash.addColorStop(.77,'#e8decc');wash.addColorStop(1,'#bdbead');
      ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);
    });
    var wall=S.shopMaterial(0xf4ebd8,{map:wallMap,emissiveMap:wallMap,emissive:0xf3e5c7,emissiveIntensity:.36});
    S.box(8.72,2.94,.015,wall,-1.7,1.59,-8.498,{});
    S.box(.016,2.94,6.75,wall,-6.102,1.59,-5.12,{});
    var ceiling=S.shopMaterial(0xe9e5d8,{emissiveIntensity:.28});
    S.box(8.82,.025,6.78,ceiling,-1.7,3.233,-5.1,{});
    var seam=S.toon(0xbdc7bc);
    for(var v=0;v<7;v++) S.box(.013,.007,6.65,seam,-5.60+v*1.26,3.218,-5.12,{});
    for(var u=0;u<5;u++) S.box(8.72,.007,.012,seam,-1.7,3.218,-7.97+u*1.39,{});
  };
})(window.S);

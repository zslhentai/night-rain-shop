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

    // 4,000–4,500 K appearance; split rows cover both vertical shelf faces.
    [fixtures.shelfLeft.x-.67,plan.aisleX,fixtures.shelfRight.x+1.03].forEach(function(x,index){
      [-3.19,-5.30].forEach(function(z){
        S.box(.24,.06,1.53,shell,x,3.216,z,{});
        S.box(.165,.021,1.45,lens,x,3.174,z,{});
        var facing=x+(index===0?.62:index===2?-.68:.05);
        beam([x,3.13,z],[facing,.85,z-.28],0xfff0dc,.60,4.60,.87);
      });
    });

    var drinks=fixtures.drinks, fresh=fixtures.bento, checkout=fixtures.checkout;
    beam([drinks.x,3.03,-6.98],[drinks.x,1.05,drinks.z],0xecfaff,.62,3.9,.92);
    beam([fresh.x,2.85,-6.80],[fresh.x,1.14,fresh.z],0xfff1d9,.66,3.65,.78);
    beam([checkout.x+.92,2.92,checkout.z+.12],[checkout.x-.35,1.25,checkout.z],0xffe7c8,.52,3.65,.82);
    beam([-.8,3.08,-2.18],[-.8,.22,-.86],0xfff0d8,.39,3.5,.50);

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
    var wall=S.shopMaterial(0xe1dbcb,{emissiveIntensity:.22});
    S.box(8.72,2.94,.015,wall,-1.7,1.59,-8.498,{});
    S.box(.016,2.94,6.75,wall,-6.102,1.59,-5.12,{});
    var ceiling=S.shopMaterial(0xe9e5d8,{emissiveIntensity:.28});
    S.box(8.82,.025,6.78,ceiling,-1.7,3.233,-5.1,{});
    var seam=S.toon(0xbdc7bc);
    for(var v=0;v<7;v++) S.box(.013,.007,6.65,seam,-5.60+v*1.26,3.218,-5.12,{});
    for(var u=0;u<5;u++) S.box(8.72,.007,.012,seam,-1.7,3.218,-7.97+u*1.39,{});
  };
})(window.S);

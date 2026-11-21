/* Continuation of the existing block beyond the walkable streets. */
(function(S){
  var T=THREE;
  S.buildDistrict=function(){
    var pavement=S.toon(0x6f7775,{map:S.tex.pavement()});
    var wall=S.toon(0x454b50), lowWall=S.toon(0x545c5e);
    S.groundPlane(29,2.58,pavement,-24.0,.062,-.48);
    S.groundPlane(2.9,21.5,pavement,3.2,.059,-19.18);
    S.box(.14,.106,20.5,lowWall,4.55,.039,-18.9,{});
    S.box(29,.106,.14,lowWall,-24.5,.039,.78,{});
    S.box(24,.115,.16,lowWall,-22,.039,10.72,{});

    var white=S.basic(0xa5a59d,{transparent:true,opacity:.56,depthWrite:false});
    [[-27,5.25,14,.07],[-17.2,5.25,3.1,.07],[7.15,-13,.075,10],
     [7.15,14,.075,6],[7.15,21,.075,3],[10.89,-11.5,.085,18]
    ].forEach(function(p){S.groundPlane(p[2],p[3],white,p[0],.019,p[1]);});

    // Three setbacks keep distant, unlit blocks subordinate to the real street.
    var walls=[wall,S.toon(0x383e47),S.toon(0x3c4549)];
    var roofs=S.toon(0x313843);
    var entries=[
      [-21,-6.3,7.6,7.8,5.1],[-16.8,-14.2,5.6,6.1,8.6],[-10.4,-18.2,6.6,5.6,7.2],
      [-2.6,-20.8,7.1,7.0,10.8],[5.3,-19.9,5.5,6.8,8.9],[16.8,-12.9,4.5,6.1,5.5],
      [18.1,-21,6.4,6.6,7.1],[-16,-27.9,8,7.2,12.6],[-5.9,-33.2,10.3,8.0,14.3],
      [5.4,-32.1,7.8,8,12.4],[15.6,-33.8,9.2,6.6,10.5],[24,-28,7.7,6.4,9.8],
      [-27,-12,6.2,9.2,7.4],[24,-10.1,6.5,6.6,7.3]
    ];
    var lit=[], dark=[];
    entries.forEach(function(b,i){
      var x=b[0],z=b[1],w=b[2],d=b[3],h=b[4];
      S.box(w,h,d,walls[i%walls.length],x,h/2,z,{});
      S.box(w+.14,.11,d+.14,roofs,x,h,z,{});
      if(i%3!==0) S.box(w*.3,.66,d*.4,roofs,x-w*.17,h+.33,z-.55,{});
      var rows=Math.floor(h/2.35), columns=Math.floor(w/1.62);
      for(var y=0;y<rows;y++) for(var a=0;a<columns;a++){
        var px=x-w/2+(a+.5)*w/columns;
        var py=1.24+y*2.04;
        var window=[px,py,z+d/2+.012];
        ((a*13+y*7+i*17)%19<2 ? lit : dark).push(window);
      }
    });
    function windows(points,color){
      var panes=new T.InstancedMesh(new T.PlaneGeometry(.76,.83),S.basic(color),points.length);
      var matrix=new T.Matrix4();
      points.forEach(function(p,i){panes.setMatrixAt(i,matrix.makeTranslation(p[0],p[1],p[2]));});
      panes.frustumCulled=false;S.world.add(panes);
    }
    windows(dark,0x252e38); windows(lit,0x7b7258);
    // Recessed rear service entrance for the existing side alley.
    S.box(.86,1.91,.06,S.toon(0x586468),-8.49,.96,-8.32,{});
    S.box(.085,.13,.048,S.phong(0xa1a7a0),-8.18,.96,-8.28,{});
    S.plane(.51,.165,S.basic(0xffffff,{map:S.tex.label('関係者専用','','#44463d','#d8d2b3')}),-8.49,1.71,-8.279,{});
    S.box(.65,.09,.23,wall,-8.49,2.14,-8.25,{});
    S.box(.53,.021,.16,S.basic(0xead0aa),-8.49,2.086,-8.22,{});
  };
  S.buildDistrictLighting=function(){
    var falloff=S.makeTex(128,128,function(ctx,w,h){
      var g=ctx.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2);
      g.addColorStop(0,'rgba(255,255,255,1)');
      g.addColorStop(.36,'rgba(255,255,255,.64)');
      g.addColorStop(.78,'rgba(255,255,255,.10)');
      g.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    });
    function light(x,z,w,d,h,color,opacity){
      return S.groundPlane(w,d,S.basic(color,{map:falloff,opacity:opacity,transparent:true,
        blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}),x,h,z);
    }
    light(-1.56,-.37,9.6,2.05,.088,0xe0be94,.39);
    light(-.95,.18,4.35,1.25,.092,0xc4ba9d,.16);
    light(6.4,1.4,5.3,5.3,.016,0x829ba7,.29);
    light(12.70,4.47,2.5,5.5,.095,0x8bacbe,.18);
    light(12.71,6.55,2.4,3.6,.094,0xd2bfa0,.28);
    light(-12.4,-3.75,2.8,2.1,.073,0xe4ae72,.39);
    light(-8.05,-1.43,2.4,1.75,.035,0xd3a477,.27);
    light(-8.44,-7.48,2.1,1.85,.035,0xc9a883,.24);
    light(3.44,-.33,2.8,.95,.074,0xb2cfb2,.23);
    S.dinerGroundLight=light(-12.98,-4.06,2.2,1.62,.078,0xffb569,.24);
    S.addUpdate(function(t){
      var p=t%120;
      var closed=S.clamp(Math.min((p-78)/4,(118-p)/4),0,1);
      S.dinerGroundLight.material.opacity=.24*(1-closed);
    });
  };
})(window.S);

/* A walkable neighborhood around the original shop. */
(function (S) {
  var T = THREE;
  function label(text, w, h, x, y, z, bg, fg, parent) {
    return S.plane(w, h, S.basic(0xffffff, { map: S.tex.label(text, '', bg, fg) }), x, y, z, { parent: parent });
  }
  function wallFinish(style) {
    return S.makeTex(512,768,function(ctx,w,h){
      var rng=style*2053+31;
      function next(){rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;}
      var wash=ctx.createLinearGradient(0,0,0,h);
      wash.addColorStop(0,'#a6abae');wash.addColorStop(.48,'#919da3');wash.addColorStop(.88,'#a3a6a6');wash.addColorStop(1,'#737e86');
      ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);
      var tileH=[26,68,37,30][style], tileW=[72,155,34,105][style];
      for(var y=0;y<h;y+=tileH){
        for(var x=-(y/tileH%2)*tileW*.5;x<w;x+=tileW){
          ctx.fillStyle=next()<.5?'rgba(30,42,49,.10)':'rgba(245,237,215,.08)';
          ctx.fillRect(x,y,tileW-2,tileH-2);
        }
        ctx.fillStyle='rgba(41,54,61,.18)';ctx.fillRect(0,y,w,1);
      }
      for(var drip=0;drip<60;drip++){
        var x0=next()*w,y0=next()*h,length=8+next()*75;
        var stain=ctx.createLinearGradient(x0,y0,x0,y0+length);
        stain.addColorStop(0,'rgba(33,45,47,.13)');stain.addColorStop(1,'rgba(33,45,47,0)');
        ctx.fillStyle=stain;ctx.fillRect(x0,y0,2+next()*9,length);
      }
    });
  }
  function building(x, z, w, d, h, color, name, style) {
    var g = S.group(); g.position.set(x, 0, z); g.userData.staticScenery=true;
    var wall = S.phong(color,{map:wallFinish(style),shininess:4});
    var trim = S.toon(0x27333c), frame = S.toon(0x5d6b70), roof=S.toon(0x303d49);
    S.box(w, h, d, wall, 0, h / 2, 0, { parent:g, cast:true });
    S.box(w+.14,.16,d+.14,roof,0,h+.055,0,{parent:g});
    S.box(w+.07,.23,.085,trim,0,h+.24,d/2,{parent:g});
    S.box(w+.07,.23,.085,trim,0,h+.24,-d/2,{parent:g});
    [-1,1].forEach(function(side){
      S.box(.085,.23,d,trim,side*w/2,h+.24,0,{parent:g});
    });
    S.box(w,.24,.10,trim,0,.18,d/2+.02,{parent:g});
    for (var row=0;row<Math.floor(h/2);row++) {
      var wy=1.16+row*1.83;
      if(row>0) S.box(w+.05,.075,.11,trim,0,wy-.67,d/2+.025,{parent:g});
      for (var col=0;col<3;col++) {
        if(row===0 && col===0) continue;
        var wx=(col-1)*w/3.5;
        var width=style===1 ? 1.02 : style===2 ? .69 : .83;
        var warm=(row*3+col+style)%7===2;
        S.box(width+.14,1.04,.09,trim,wx,wy,d/2+.035,{parent:g});
        S.plane(width,.88,S.basic(warm ? 0x9c875f : 0x283747),wx,wy,d/2+.087,{parent:g});
        S.box(.026,.89,.025,frame,wx,wy,d/2+.102,{parent:g});
        S.box(width+.20,.065,.16,frame,wx,wy-.50,d/2+.065,{parent:g});
        if(warm) S.box(width*.29,.88,.02,S.toon(0x706959),wx-width*.346,wy,d/2+.097,{parent:g});
      }
    }
    var door=-w*.33;
    S.box(.89,1.77,.1,trim,door,.94,d/2+.06,{parent:g});
    S.box(.62,.55,.014,S.basic(0x536171),door,1.24,d/2+.115,{parent:g});
    S.box(.035,.22,.04,frame,door+.26,.90,d/2+.14,{parent:g});
    S.box(1.10,.11,.53,roof,door,1.94,d/2+.24,{parent:g});
    S.box(.62,.30,.07,frame,door+.89,.94,d/2+.052,{parent:g});
    S.box(.49,.021,.018,trim,door+.89,1.02,d/2+.093,{parent:g});
    label(name,Math.min(1.28,w*.34),.15,door,1.79,d/2+.12,'#343e44','#aab3ab',g);
    S.layout.shelters.push({ x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,height:h+.36 });
    return g;
  }
  function lamp(x, z) {
    var steel = S.toon(0x526478);
    S.cyl(.055, .09, 3.4, 8, steel, x, 1.7, z, {});
    S.box(.42, .1, .55, steel, x, 3.42, z, {});
    S.plane(.32, .4, S.basic(0xc7dfe9), x, 3.36, z, { rx: Math.PI / 2 });
    S.glow(x, 3.35, z, 0xb5d7e6, 1.7, .2);
    var light = new T.PointLight(0xb5d7e6, .35, 5, 2);
    light.position.set(x, 3.3, z); S.scene.add(light);
    S.groundPlane(1.2, 3, S.basic(0xffffff, { map: S.tex.reflection('#9dc4db'), transparent: true, opacity: .23, depthWrite: false, blending: T.AdditiveBlending }), x, .038, z + 1);
  }
  function car() {
    var g = S.group(); g.position.set(-7.4, .008, 7.0); g.userData.staticScenery=true;
    var paint = S.toon(0x6b878b), glass = S.phong(0x233b50), rubber = S.toon(0x121c29);
    S.box(1.65, .55, 2.9, paint, 0, .55, 0, { parent: g, cast: true });
    S.box(1.42, .65, 1.65, glass, 0, 1.12, -.05, { parent: g });
    S.box(1.55, .1, 1.8, paint, 0, 1.48, -.05, { parent: g });
    [-.71, .71].forEach(function (x) { S.box(.08, .65, 1.7, paint, x, 1.12, -.05, { parent: g }); });
    [-.84, .84].forEach(function (x) { [-.9, .9].forEach(function (z) { S.cyl(.29, .29, .16, 12, rubber, x, .29, z, { rz: Math.PI / 2, parent: g }); }); });
    var bumper=S.toon(0x35434a), lens=S.phong(0xa99e7b,{shininess:26});
    [-1,1].forEach(function (side) {
      S.box(1.60,.14,.12,bumper,0,.39,side*1.49,{parent:g});
      S.box(.43,.137,.02,S.basic(0xc9cfba),0,.51,side*1.56,{parent:g});
      [-.55,.55].forEach(function(x){
        S.box(.34,.17,.035,side>0?lens:S.phong(0x984f49),x,.62,side*1.48,{parent:g});
      });
      S.box(.22,.14,.27,paint,side*.84,1.16,.64,{parent:g});
      S.box(.018,.055,.22,bumper,side*.836,1.02,.23,{parent:g});
    });
  }
  S.buildNeighborhood = function () {
    var pavement = S.toon(0xffffff, { map: S.tex.pavement() });
    var curb = S.toon(0x748494);
    // New outer sidewalks connect the crossing to both sides of the block.
    S.box(2.4, .12, 62, curb, 12.7, .02, 0, {});
    S.groundPlane(2.4, 62, pavement, 12.7, .085, 0);
    S.box(46, .12, 2.3, curb, -11.5, .02, 11.85, {});
    S.groundPlane(46, 2.2, pavement, -11.5, .085, 11.85);
    S.groundPlane(3.8, 15, pavement, -11.9, .06, -5.5);
    function ramp(x0, x1, h0, h1) {
      var geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute([
        x0,h0,1.35, x0,h0,2.95, x1,h1,2.95,
        x0,h0,1.35, x1,h1,2.95, x1,h1,1.35
      ], 3));
      geometry.computeVertexNormals();
      S.world.add(new T.Mesh(geometry, curb));
    }
    ramp(3.4,4.7,.06,.009); ramp(10.6,11.5,.009,.085);
    building(-11.8, -7.6, 3.4, 5.8, 5.3, 0x53605b, '夜灯食堂', 0);
    var diner = S.group(); diner.position.set(-11.8, 0, -4.65);
    S.box(3.7, 1.8, .08, S.toon(0x293343), 0, 1, 0, { parent: diner });
    label('夜灯食堂', 3.3, .55, 0, 2.45, .1, '#554533', '#e6bd83', diner);
    S.box(4.2, .15, 1.1, S.toon(0x4c655d), 0, 2.15, .4, { parent: diner });
    var cloth = S.toon(0x846248), stripe = S.toon(0xd4a77b);
    for (var c = 0; c < 5; c++) {
      var panel = S.group(diner);
      panel.position.set((c - 2) * .65, 2.10, .85);
      S.box(.58, .53, .035, cloth, 0, -.265, 0, { parent: panel });
      S.box(.58, .025, .040, stripe, 0, -.50, 0, { parent: panel });
      label(c === 2 ? '食堂' : '夜灯', .37, .18, 0, -.28, .020, '#846248', '#e0c6a1', panel);
      (function (curtain, offset) {
        S.addUpdate(function (t) { curtain.rotation.x = .07 * S.rainIntensity * Math.sin(t * 2 + offset); });
      })(panel, c * .7);
    }
    S.layout.shelters.push({ x0: -14, x1: -9.6, z0: -4.7, z1: -3.6, height: 2.3 });
    building(-6.3, -11.2, 5.1, 3.2, 5.9, 0x3d4c56, '月見ハイツ', 1);
    building(.2, -11.3, 5, 3, 7.3, 0x4c514f, '夜灯', 2);
    building(6.7, -11.4, 5.2, 2.8, 5.5, 0x45545b, '二丁目', 3);
    // Complete the existing residence entrance and mailboxes.
    S.box(1.4, .1, .8, curb, 6.6, .08, -5.05, {});
    S.box(1.5, .12, .9, S.toon(0x566779), 6.6, 2.05, -5.15, {});
    for (var m = 0; m < 3; m++) {
      S.box(.3, .32, .16, S.toon(0x8c9291), 7.5 + m * .34, .95, -5.32, {});
      S.box(.2, .025, .02, S.basic(0x243040), 7.5 + m * .34, 1, -5.22, {});
    }
    // Low street-facing facades keep the main shop visible from the default camera.
    var kiosk = S.group(); kiosk.position.set(-11.4, 0, 11.8); kiosk.userData.staticScenery=true; kiosk.rotation.y = Math.PI;
    S.box(4.7, 2.25, 1.8, S.toon(0x465361), 0, 1.18, 0, { parent: kiosk });
    S.box(4.9, .15, 2, S.toon(0x2d394b), 0, 2.4, 0, { parent: kiosk });
    S.box(3.9, 1.65, .08, S.toon(0x657078), 0, 1, .94, { parent: kiosk });
    for (var slat = 0; slat < 12; slat++) S.box(3.9, .025, .035, S.toon(0x424e5c), 0, .25 + slat * .13, 1, { parent: kiosk });
    label('花と暮らし', 3.8, .4, 0, 2.08, .97, '#3a4c4c', '#bfc7b6', kiosk);
    // Dress the rear facade visible from the default viewing direction.
    S.box(.85, 1.7, .06, S.toon(0x344452), -1.2, .9, -.94, { parent: kiosk });
    S.box(.06, .1, .04, S.toon(0xa3adb1), -.92, .9, -.99, { parent: kiosk });
    var rearSign = label('花と暮らし', 2.4, .45, .6, 1.8, -.96, '#425952', '#d3dbbc', kiosk);
    rearSign.rotation.y = Math.PI;
    for (var pot = 0; pot < 3; pot++) {
      S.cyl(.17, .13, .28, 8, S.toon(0x846e59), -.1 + pot * .55, .23, -1.2, { parent: kiosk });
      S.sphere(.24, S.toon(0x557b63), -.1 + pot * .55, .55, -1.2, { parent: kiosk });
    }
    S.layout.shelters.push({ x0: -13.8, x1: -9, z0: 10.8, z1: 12.8, height: 2.5 });
    // Bus stop on the opposite pavement, outside the crossing.
    var metal = S.toon(0x647a87);
    S.cyl(.045, .045, 2.7, 8, metal, 13.25, 1.435, 5.45, {});
    label('夜灯二丁目', .7, .8, 13.25, 2.385, 5.50, '#385964', '#dce8db');
    // Detailed bench and shelter are assembled in details.js.
    lamp(12.6, 4.4); lamp(-11.8, 1.6); lamp(-3.7, 11.7);
    car();
    // Pedestrian lamps share one phase with the road signal.
    var pedestrianLights = [];
    [[3.8, 3.2, Math.PI / 2], [11.8, 1.1, -Math.PI / 2]].forEach(function (p) {
      S.cyl(.035, .05, 2.4, 8, metal, p[0], 1.2, p[1], {});
      S.box(.32, .65, .22, S.toon(0x202d3c), p[0], 2.25, p[1], {});
      var red = S.basic(0xd95e55), green = S.basic(0x233a35);
      S.plane(.19, .22, red, p[0] + Math.sin(p[2]) * .12, 2.4, p[1], { ry: p[2] });
      S.plane(.19, .22, green, p[0] + Math.sin(p[2]) * .12, 2.1, p[1], { ry: p[2] });
      pedestrianLights.push({ red: red, green: green });
    });
    S.addUpdate(function (t) {

      pedestrianLights.forEach(function (light) {
        light.red.color.setHex(S.traffic.pedestrianGreen ? 0x362b31 : 0xe88877);
        var green=S.traffic.pedestrianGreen && (S.traffic.canEnter || Math.floor(t*3)%2===0);
        light.green.color.setHex(green ? 0x8ed6b3 : 0x233a35);
      });
    });
  };
})(window.S);

/* ============================================================
   store.js — corner convenience store shell, signage, glass, awning
   ============================================================ */
(function (S) {
  var T = THREE;
  S.door = null;
  S.signMaterials = [];
  S.eaveDripPoints = [];

  S.buildStore = function () {
    var x0 = S.SHOP.x0, x1 = S.SHOP.x1, z0 = S.SHOP.z0, z1 = S.SHOP.z1;
    var W = x1 - x0, D = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;

    var wall = S.toon(0xd6d2c6);
    var wallIn = S.toon(0xdcd9cf);
    var frame = S.toon(0x2a403e);
    var frameHi = S.toon(0x63847b);
    var roofMat = S.toon(0x34485a);
    var awning = S.toon(0x364c52);
    var dark = S.toon(0x1d2a3c);
    var teal = S.toon(0x234f49);
    var steel = S.toon(0x9aa9b6);
    var warmLight = S.basic(0xffdca2);
    var enamel = S.shopMaterial(0x317468,{emissiveIntensity:.24});

    var floorMap = S.tex.shopFloor();
    /* ---------- interior floor / ceiling / solid walls ---------- */
    // A low-resolution irradiance map provides fixture-aligned diffuse bounce.
    // UV2 covers the room once; UV0 retains the repeating tile texture.
    var floorBounce=S.makeTex(192,144,function(ctx,w,h){
      ctx.fillStyle='#252527';ctx.fillRect(0,0,w,h);
      var f=S.layout.interior.fixtures;
      [[f.shelfLeft.x-.80,-4.60],[S.layout.interior.aisleX,-4.60],[f.shelfRight.x+.92,-4.60],
       [f.bento.x,-6.90],[f.checkout.x+.75,f.checkout.z]].forEach(function(point){
        var u=(point[0]-x0)/W*w,v=(point[1]-z0)/D*h;
        var light=ctx.createRadialGradient(u,v,2,u,v,40);
        light.addColorStop(0,'rgba(184,160,109,.62)');light.addColorStop(1,'rgba(184,160,109,0)');
        ctx.fillStyle=light;ctx.fillRect(u-40,v-40,80,80);
      });
    });
    var floorMaterial=S.shopMaterial(0xe3dfd0,{map:floorMap,emissiveMap:floorMap,emissiveIntensity:.14,
      shininess:22,specular:0x29241f,lightMap:floorBounce,lightMapIntensity:.49});
    var tiles=S.plane(W,D,floorMaterial,cx,S.SHOP.floor,cz,{rx:-Math.PI/2});
    tiles.geometry.setAttribute('uv2',tiles.geometry.attributes.uv);
    S.box(W, 0.10, D, wallIn, cx, 3.30, cz, {});
    /* back + left solid walls (double sided via box) */
    S.box(W, 3.28, 0.18, wall, cx, 1.74, z0, { cast: true, outline: true, outlineOpacity: .35 });
    S.box(0.18, 3.28, D, wall, x0, 1.74, cz, { cast: true, outline: true, outlineOpacity: .35 });
    /* right wall: solid at the rear, glass toward the corner */
    S.box(0.18, 3.28, 2.05, wall, x1, 1.74, -7.58, { cast: true, outline: true, outlineOpacity: .35 });
    /* skirting */
    S.box(W, 0.12, 0.05, S.toon(0xbdb6a4), cx, 0.16, z0 + 0.11, {});
    S.box(0.05, 0.12, D, S.toon(0xbdb6a4), x0 + 0.11, 0.16, cz, {});

    /* ---------- roof slab + parapet + rooftop equipment ---------- */
    S.box(W + 0.55, 0.24, D + 0.55, roofMat, cx, 3.48, cz, { cast: true, outline: true, outlineOpacity: .4 });
    S.box(W + 0.62, 0.14, 0.10, S.toon(0x63748a), cx, 3.66, z1 + 0.29, {});
    S.box(0.10, 0.14, D + 0.62, S.toon(0x63748a), x1 + 0.29, 3.66, cz, {});
    S.box(W + 0.62, 0.14, 0.10, S.toon(0x63748a), cx, 3.66, z0 - 0.29, {});
    /* waterproof-sheet seams + service hatches keep the roof from reading as a blank slab */
    var seam = S.basic(0x8fa4b8, { transparent: true, opacity: .30, depthWrite: false });
    for (var rs = 0; rs < 5; rs++) {
      S.plane(W + 0.4, 0.02, seam, cx, 3.606, z0 - 0.1 + rs * 1.45, { rx: -Math.PI / 2 });
    }
    for (var rs2 = 0; rs2 < 4; rs2++) {
      S.plane(0.02, D + 0.4, seam, x0 + 0.4 + rs2 * 2.35, 3.607, cz, { rx: -Math.PI / 2 });
    }
    S.box(0.85, 0.05, 0.70, S.toon(0x5d6f83), -0.9, 3.63, -3.4, { outline: true, outlineOpacity: .3 });
    S.box(0.55, 0.05, 0.55, S.toon(0x5d6f83), 1.9, 3.63, -5.5, { outline: true, outlineOpacity: .3 });
    /* water tank + ducts */
    S.box(0.16, 0.45, 0.16, steel, 0.9, 3.82, -7.3, {});
    S.box(0.16, 0.45, 0.16, steel, 1.55, 3.82, -7.3, {});
    S.cyl(0.48, 0.48, 0.72, 12, steel, 1.22, 4.27, -7.3, {});
    S.cyl(0.50, 0.50, 0.08, 12, S.toon(0x8e9ba8), 1.22, 4.66, -7.3, {});
    S.box(1.1, 0.38, 0.72, S.toon(0x9facb6), -4.4, 3.78, -7.5, { outline: true, outlineOpacity: .3 });
    S.cyl(0.24, 0.24, 0.38, 10, S.toon(0x8795a2), -4.4, 4.12, -7.5, {});
    S.cyl(0.30, 0.30, 0.06, 10, S.toon(0x6e7c8a), -4.4, 4.34, -7.5, {});
    S.box(0.7, 0.24, 0.5, S.toon(0x9facb6), -2.4, 3.72, -6.9, {});

    /* ---------- glass facade frames ---------- */
    var zf = z1 + 0.02, xf = x1 + 0.02;
    var glassMat = S.glass(0xe6ede7, 0.045);
    var glassShade = S.basic(0xffffff, {
      map: S.tex.windowShade(), transparent: true, opacity: .045,
      blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
    });
    var glassH = 2.76, glassY = 1.52;

    function frontGlass(a, b) {
      var w = b - a, c = (a + b) / 2;
      S.plane(w, glassH, glassMat, c, glassY, zf, {});
      S.plane(w, glassH, glassShade, c, glassY, zf + 0.012, {});
    }
    frontGlass(x0 + 0.07, -2.24);
    frontGlass(0.64, x1 - 0.07);

    /* right facade glass, from z=-6.55 to the corner */
    var rgA = -6.55, rgB = z1 - 0.07, rgW = rgB - rgA, rgC = (rgA + rgB) / 2;
    S.plane(rgW, glassH, glassMat, xf, glassY, rgC, { ry: Math.PI / 2 });
    S.plane(rgW, glassH, glassShade, xf + 0.012, glassY, rgC, { ry: Math.PI / 2 });

    /* mullions */
    function fMullion(x) { S.box(0.065, glassH + 0.1, 0.10, frame, x, glassY, zf + 0.01, { outline: true, outlineOpacity: .28 }); }
    [-6.13, -5.20, -4.27, -3.34, -2.42, -2.22, 0.62, 1.68, 2.73].forEach(fMullion);
    for (var mz = -6.5; mz < -1.6; mz += 1.02) {
      S.box(0.10, glassH + 0.1, 0.065, frame, xf + 0.01, glassY, mz, { outline: true, outlineOpacity: .28 });
    }
    /* header / sill */
    S.box(W, 0.12, 0.14, frame, cx, 2.90, z1, {});
    S.box(W, 0.10, 0.14, frameHi, cx, 0.16, z1, {});
    S.box(0.14, 0.12, D, frame, x1, 2.90, cz, {});
    S.box(0.14, 0.10, D, frameHi, x1, 0.16, cz, {});
    S.box(W, 0.38, 0.16, wall, cx, 3.10, z1, { outline: true, outlineOpacity: .3 });
    S.box(0.16, 0.38, D, wall, x1, 3.10, cz, { outline: true, outlineOpacity: .3 });

    /* corner column with a neon edge */
    S.box(0.26, 3.30, 0.26, frame, x1, 1.75, z1, { cast: true, outline: true, outlineOpacity: .5 });
    S.box(0.045, 2.95, 0.045, enamel, x1 + 0.145, 1.62, z1 + 0.145, {});
    S.glow(x1 + 0.16, 2.2, z1 + 0.16, 0xaac5ad, 1.25, .11);

    /* ---------- automatic sliding door ---------- */
    var doorZ = zf + 0.05;
    var doorGlass = S.glass(0xe3eded, 0.06);
    function leaf(px, isLeft) {
      var g = S.group();
      g.position.set(px, 0, doorZ);
      S.plane(1.36, 2.55, doorGlass, 0, 1.43, 0, { parent: g });
      S.plane(1.36, 2.55, glassShade, 0, 1.43, 0.014, { parent: g });
      S.box(0.06, 2.62, 0.09, frameHi, -0.68, 1.43, 0, { parent: g });
      S.box(0.06, 2.62, 0.09, frameHi, 0.68, 1.43, 0, { parent: g });
      S.box(1.4, 0.06, 0.09, frameHi, 0, 2.74, 0, { parent: g });
      S.box(1.4, 0.07, 0.09, frameHi, 0, 0.16, 0, { parent: g });
      S.box(0.05, 0.74, 0.055, S.toon(0x9fb0bf), isLeft ? 0.54 : -0.54, 1.42, 0.06, { parent: g });
      /* small "auto door" stickers */
      S.plane(0.20, 0.20, S.basic(0xffffff, { map: S.tex.label('自', '動', '#ffffff', '#3c6a72'), transparent: true }), isLeft ? 0.28 : -0.28, 1.72, 0.02, { parent: g });
      return g;
    }
    var leftLeaf = leaf(-1.50, true), rightLeaf = leaf(-0.10, false);
    S.door = { left: leftLeaf, right: rightLeaf, closedL: -1.50, closedR: -0.10, open: 0 };
    /* door rail + sensor */
    S.box(3.0, 0.035, 0.10, frameHi, -0.8, 0.11, doorZ + 0.03, {});
    S.box(0.52, 0.14, 0.18, frame, -0.8, 2.82, doorZ - 0.02, {});
    S.sphere(0.035, S.basic(0xff8b6b), -0.8, 2.79, doorZ + 0.08, {});
    S.glow(-0.8, 2.79, doorZ + 0.12, 0xff8b6b, 0.5, .35);

    /* ---------- awning (L shape) ---------- */
    S.box(W + 0.85, 0.11, 1.10, awning, cx, 3.23, z1 + 0.50, { cast: true, outline: true, outlineOpacity: .45 });
    S.box(1.10, 0.11, D + 0.85, awning, x1 + 0.50, 3.23, cz, { cast: true, outline: true, outlineOpacity: .45 });
    S.box(W + 0.85, 0.045, 0.06, frameHi, cx, 3.16, z1 + 1.03, {});
    S.box(0.06, 0.045, D + 0.85, frameHi, x1 + 1.03, 3.16, cz, {});
    /* warm strip lights under the awning */
    S.box(W + 0.4, 0.035, 0.055, warmLight, cx, 3.15, z1 + 0.82, {});
    S.box(0.055, 0.035, D + 0.4, warmLight, x1 + 0.82, 3.15, cz, {});
    for (var gl = 0; gl < 5; gl++) S.glow(-5.5 + gl * 2.2, 3.12, z1 + 0.85, 0xffdfa6, .95, .085);
    for (var gr = 0; gr < 3; gr++) S.glow(x1 + 0.85, 3.12, -7.2 + gr * 2.4, 0xffdfa6, .95, .085);
    // Reflected warm window light starts at the wet lip of the canopy.
    // Broken parallel strokes preserve the dry mat and read as wet pavement.
    var wetLight=S.makeTex(256,192,function(ctx,w,h){
      for(var row=0;row<60;row++){
        var v=row/60,spread=15+v*23, y=6+row*3;
        var fade=Math.sin(Math.PI*Math.sqrt(v))*(1-v);
        var offset=8*Math.sin(row*2.6)+2*Math.sin(row*.7);
        for(var pane=0;pane<3;pane++){
          var u=65+60*pane+offset;
          var stroke=ctx.createLinearGradient(u-spread,0,u+spread,0);
          stroke.addColorStop(0,'rgba(234,216,170,0)');
          stroke.addColorStop(.5,'rgba(234,216,170,'+fade+')');
          stroke.addColorStop(1,'rgba(234,216,170,0)');
          ctx.fillStyle=stroke;ctx.fillRect(u-spread,y,spread*2,2);
        }
      }
    });
    var doorwayReflection=S.basic(0xffffff,{map:wetLight,transparent:true,opacity:.38,
      blending:T.AdditiveBlending,depthWrite:false});
    S.groundPlane(3.1,1.70,doorwayReflection,-.8,.073,.18);
    var spill = S.makeTex(256,96,function(ctx,w,h){
      var wash = ctx.createRadialGradient(w*.5,h*.39,6,w*.5,h*.39,w*.5);
      wash.addColorStop(0,'rgba(255,187,104,.72)');
      wash.addColorStop(.68,'rgba(255,193,117,.43)');
      wash.addColorStop(1,'rgba(255,196,129,0)');
      ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);
      ctx.globalCompositeOperation='destination-in';
      var depth=ctx.createLinearGradient(0,0,0,h);
      depth.addColorStop(0,'rgba(255,255,255,0)');
      depth.addColorStop(.26,'rgba(255,255,255,1)');
      depth.addColorStop(.85,'rgba(255,255,255,.78)');
      depth.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=depth;ctx.fillRect(0,0,w,h);
    });
    var spillMat=S.basic(0xffffff,{map:spill,transparent:true,opacity:.52,
      blending:T.AdditiveBlending,depthWrite:false});
    S.groundPlane(W+1.1,2.30,spillMat,cx,.0615,-.50);
    /* awning posts + gutter */
    [[-5.95, z1 + 0.98], [2.62, z1 + 0.98], [x1 + 0.98, -7.9]].forEach(function (p) {
      S.cyl(0.045, 0.05, 3.05, 8, steel, p[0], 1.60, p[1], {});
      S.cyl(0.11, 0.11, 0.05, 10, frameHi, p[0], 0.10, p[1], {});
    });
    S.box(W + 0.85, 0.06, 0.10, S.toon(0x8a9aab), cx, 3.19, z1 + 1.06, {});
    /* drip points along the awning edge */
    for (var dp = 0; dp < 9; dp++) S.eaveDripPoints.push([-5.7 + dp * 1.08, 3.15, z1 + 1.07]);
    for (var dp2 = 0; dp2 < 5; dp2++) S.eaveDripPoints.push([x1 + 1.07, 3.15, -7.7 + dp2 * 1.4]);
    /* downpipe */
    S.tube([[x0 - 0.05, 3.18, z1 + 0.9], [x0 - 0.18, 2.4, z1 + 0.9], [x0 - 0.18, 0.2, z1 + 0.9], [x0 - 0.18, 0.08, z1 + 0.55]], 0.055, S.toon(0x8e9cac));

    /* ---------- warm backlit signage and painted bands ---------- */
    var signMatFront = S.basic(0xffffff, { map: S.tex.brandWide() });
    var signMatRight = S.basic(0xffffff, { map: S.tex.brandShort() });
    S.signMaterials.push(signMatFront, signMatRight);
    S.box(W + 0.75, 0.80, 0.14, teal, cx, 3.94, z1 + 0.08, { cast: true, outline: true, outlineOpacity: .5 });
    S.box(0.14, 0.80, D + 0.62, teal, x1 + 0.08, 3.94, cz, { cast: true, outline: true, outlineOpacity: .5 });
    var frontFascia = S.plane(W + 0.62, 0.72, signMatFront, cx, 3.94, z1 + 0.16, {});
    var sideFascia = S.plane(D + 0.48, 0.72, signMatRight, x1 + 0.16, 3.94, cz, { ry: Math.PI / 2 });
    S.wetShop = { x0:x0, x1:x1, z1:z1, fascia:[frontFascia,sideFascia] };
    S.box(W + 0.75, 0.058, 0.05, enamel, cx, 4.35, z1 + 0.16, {});
    S.box(W + 0.75, 0.058, 0.05, enamel, cx, 3.53, z1 + 0.16, {});
    S.box(0.05, 0.058, D + 0.62, enamel, x1 + 0.16, 4.35, cz, {});
    S.box(0.05, 0.058, D + 0.62, enamel, x1 + 0.16, 3.53, cz, {});
    S.box(W + 0.80, 0.10, 0.07, enamel, cx, 3.25, z1 + 1.06, {});
    S.box(0.07, 0.10, D + 0.80, enamel, x1 + 1.06, 3.25, cz, {});
    for (var sg = 0; sg < 3; sg++) S.glow(-4.8 + sg * 3.2, 3.92, z1 + 0.23, 0xffde9d, 1.9, .08);
    S.glow(x1 + 0.24, 3.91, z1 - 2.1, 0xffde9d, 1.75, .08);

    /* ---------- pylon sign on the left of the forecourt ---------- */
    S.box(1.25, 0.16, 0.85, dark, -8.75, 0.14, -0.55, { outline: true, outlineOpacity: .4 });
    S.box(0.24, 3.5, 0.24, S.toon(0x4b5c70), -8.75, 1.9, -0.55, {});
    var py = S.basic(0xffffff, { map: S.tex.label('夜町マート','24H','#f2dfb3','#28544a') });
    S.signMaterials.push(py);
    S.box(1.05, 2.55, 0.12, teal, -8.75, 3.05, -0.55, { outline: true, outlineOpacity: .5 });
    S.plane(0.96, 2.44, py, -8.75, 3.05, -0.48, {});
    S.box(1.05, 0.06, 0.08, enamel, -8.75, 4.36, -0.48, {});
    S.glow(-8.75, 3.1, -0.4, 0xffdfaa, 2.9, .13);

    /* ---------- entrance mat + small forecourt details ---------- */
    S.plane(2.95, 1.10, S.basic(0xffffff, { map: S.tex.mat(), transparent: true }), -0.8, 0.078, -1.02, { rx: -Math.PI / 2 });
    S.box(2.95, 0.012, 1.10, S.toon(0x4b3232), -0.8, 0.070, -1.02, {});
    /* floor guidance arrows inside the doorway */
    var arrow = S.makeTex(128, 128, function (x, w, h) {
      x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(90,175,150,.55)';
      x.beginPath(); x.moveTo(64, 16); x.lineTo(108, 66); x.lineTo(80, 66); x.lineTo(80, 112);
      x.lineTo(48, 112); x.lineTo(48, 66); x.lineTo(20, 66); x.closePath(); x.fill();
    });
    S.plane(0.55, 0.55, S.basic(0xffffff, { map: arrow, transparent: true, depthWrite: false }), -0.8, 0.112, -2.0, { rx: -Math.PI / 2 });

    /* ---------- outdoor AC unit on the rear right wall ---------- */
    S.box(0.72, 0.78, 1.02, S.toon(0xd9dfe2), 3.22, 1.55, -7.35, { outline: true, outlineOpacity: .35 });
    S.box(0.04, 0.60, 0.84, S.toon(0xaab6bd), 3.60, 1.55, -7.35, {});
    S.torus(0.28, 0.025, S.toon(0x8e9ba5), 3.63, 1.55, -7.35, { ry: Math.PI / 2 });
    for (var f = 0; f < 4; f++) {
      S.box(0.02, 0.46, 0.035, S.toon(0x7c8993), 3.63, 1.55, -7.35, { rx: f * Math.PI / 4 });
    }
    for (var v = 0; v < 6; v++) S.box(0.02, 0.02, 0.82, S.toon(0x94a2ab), 3.62, 1.28 + v * 0.11, -7.35, {});
    S.tube([[3.22, 1.95, -7.0], [3.22, 2.6, -7.0], [3.02, 3.1, -7.0], [2.95, 3.55, -7.0]], 0.045, S.toon(0xb0bac0));
  };
})(window.S);

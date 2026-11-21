/* ============================================================
   base.js — wet L-shaped street corner and connected sidewalks
   ============================================================ */
(function (S) {
  var T = THREE;
  S.reflections = [];
  S.puddles = [];

  function groundPlane(w, h, mat, x, y, z, ry) {
    var m = S.plane(w, h, mat, x, y, z, { rx: -Math.PI / 2, ry: ry || 0, receive: true });
    return m;
  }
  S.groundPlane = groundPlane;

  S.buildBase = function () {
    var curb = S.toon(0x8b95a6);
    var white = S.basic(0xdfe9e2, { transparent:true, opacity:.86 });
    var crossingPaint=S.makeTex(64,192,function(ctx,w,h){
      ctx.fillStyle='#d9d9cc';ctx.fillRect(0,0,w,h);
      var seed=64697;
      function next(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
      for(var i=0;i<340;i++){
        var x=next()*w, y=next()*h, tone=next();
        var edge=Math.min(x,w-x,y,h-y)<3;
        ctx.fillStyle='rgba(23,33,41,'+(edge?.55:.08+tone*.43)+')';
        ctx.fillRect(x,y,1+next()*1.8,.65+next()*3.4);
      }
    });
    var stripe=S.basic(0xffffff,{map:crossingPaint,transparent:true,opacity:.87,depthWrite:false});

    /* ---- asphalt ---- */
    var asphalt = S.toon(0xd2d9d6, { map: S.tex.asphalt() });
    groundPlane(28, 26, asphalt, 0, 0.008, 0);
    var roadMap=asphalt.map.clone();
    roadMap.wrapS=roadMap.wrapT=T.RepeatWrapping;
    roadMap.repeat.set(4,4);roadMap.needsUpdate=true;
    groundPlane(112,104,S.toon(0xd2d9d6,{map:roadMap}),0,.003,0);

    /* ---- L-shaped sidewalk ---- */
    var pave = S.toon(0xffffff, { map: S.tex.pavement() });
    groundPlane(13.5, 2.4, pave, -2.85, 0.06, -0.48);   // front band
    groundPlane(1.55, 8.1, pave, 3.55, 0.06, -4.72);    // right band down the corner
    /* sidewalk seams */
    for (var i = 0; i < 11; i++) {
      var sx = -9.5 + i * 1.22;
      groundPlane(0.025, 2.36, S.basic(0x2b3545, { transparent: true, opacity: .55 }), sx, 0.064, -0.48);
    }
    for (var j = 0; j < 7; j++) {
      var sz = -8.5 + j * 1.18;
      groundPlane(1.5, 0.025, S.basic(0x2b3545, { transparent: true, opacity: .5 }), 3.55, 0.064, sz);
    }

    /* ---- curbs ---- */
    S.box(12.6, 0.095, 0.20, curb, -3.54, 0.034, 0.74, {});
    S.box(0.20, 0.095, 9.64, curb, 4.36, 0.034, -3.65, {});
    /* wet highlight along curb tops */
    var curbGlint=S.basic(0xaabcc1,{transparent:true,opacity:.36});
    S.box(12.6, .008, .036, curbGlint, -3.54, .085, .70, {});
    S.box(.036, .008, 9.64, curbGlint, 4.32, .085, -3.65, {});
    groundPlane(1.50,1.52,pave,3.55,.060,1.10);
    var approach=S.toon(0x968964,{map:S.tex.tactile()});
    groundPlane(.92,.35,approach,3.82,.065,1.55);
    groundPlane(.43,1.28,approach,11.92,.090,2.16);

    /* ---- alley floor (left of the shop) ---- */
    groundPlane(3.35, 7.1, S.toon(0x2b3547, { map: S.tex.asphalt() }), -7.85, 0.015, -5.1);
    groundPlane(3.0, 6.6, S.basic(0x132238, { transparent: true, opacity: .35, depthWrite: false }), -7.85, 0.018, -5.1);

    /* ---- drainage grates ---- */
    var drainMat = S.basic(0xffffff, { map: S.tex.drain(), transparent: true, opacity: 0.95 });
    groundPlane(13.8, 0.28, drainMat, -2.7, 0.068, 0.57, 0);
    groundPlane(0.28, 8.2, drainMat, 4.14, 0.068, -4.3, Math.PI / 2);
    /* corner catch basin + manhole */
    var mh = S.cyl(0.44, 0.44, 0.02, 20, S.toon(0x374456), 3.15, 0.026, 0.62, {});
    S.torus(0.39, 0.025, S.toon(0x6a7a8c), 3.15, 0.038, 0.62, { rx: Math.PI / 2 });
    for (var q = 0; q < 6; q++) {
      groundPlane(0.58, 0.025, S.basic(0x5b6c80, { transparent: true, opacity: .8 }), 3.15, 0.042, 0.62 + (q - 2.5) * 0.11, 0);
    }

    /* ---- lane markings ---- */
    var lineMat = S.basic(0xd9e6ee, { transparent: true, opacity: .72 });
    var yellow = S.basic(0xe3c477, { transparent: true, opacity: .7 });
    for (var k = 0; k < 7; k++) groundPlane(1.1, 0.075, yellow, -8.3 + k * 2.6, 0.02, 5.25, 0);
    for (var k2 = 0; k2 < 4; k2++) groundPlane(0.075, 1.1, yellow, 7.15, 0.02, 1.8 + k2 * 2.3, 0);

    /* zebra crossing across the corner road */
    for (var z = 0; z < 12; z++) {
      var cx = 4.9 + z * 0.48;
      groundPlane(0.34, 1.55, stripe, cx, 0.024, 2.15, z%2?0:Math.PI);
      groundPlane(0.34, 1.55, S.basic(0x8fbce8, { transparent: true, opacity: .065, blending: T.AdditiveBlending, depthWrite: false }), cx, 0.027, 2.15, 0);
    }
    /* stop line + painted characters */
    groundPlane(4.9, 0.13, white, 7.6, 0.023, 3.35, 0);
    var stopTex = S.makeTex(512, 128, function (x, w, h) {
      x.clearRect(0, 0, w, h);
      x.font = '800 78px ' + S.FONT; x.fillStyle = 'rgba(230,242,250,.82)';
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('止まれ', w / 2, h / 2);
    });
    groundPlane(2.6, 0.65, S.basic(0xffffff, { map: stopTex, transparent: true, depthWrite: false }), 7.6, 0.028, 4.1, 0);

    /* ---- parking bays ---- */
    var bay = S.basic(0xd9e6ee, { transparent: true, opacity: .62 });
    for (var b = 0; b < 3; b++) {
      var px = -7.4 + b * 2.5;
      groundPlane(0.07, 2.6, bay, px - 1.15, 0.022, 7.35, 0);
      groundPlane(2.35, 0.07, bay, px, 0.022, 8.62, 0);
      // Parking bays open onto the access aisle.
      S.box(0.9, 0.14, 0.16, S.toon(0xd0b06a), px, 0.07, 8.4, {});
      groundPlane(0.5, 0.5, S.basic(0xffffff, {
        map: S.tex.label('P', '', '#25303f', '#e8f2f8'), transparent: true, opacity: .55, depthWrite: false
      }), px, 0.024, 7.35, 0);
    }

    /* ---- puddles ---- */
    var puddleTex = S.tex.puddle();
    var spots = [
      [-5.08,1.25,1.98,.61,0], [1.98,1.31,1.68,.58,-.1], [5.04,3.20,1.45,.73,.13],
      [10.93,3.56,.78,1.62,0], [11.09,7.78,.67,2.51,0],
      [-7.9,-5.93,.83,1.57,-.1], [-12.9,-2.51,1.11,.48,0]
    ];
    spots.forEach(function (p) {
      var mat=S.basic(0xffffff,{map:puddleTex,transparent:true,depthWrite:false,opacity:.23,blending:T.AdditiveBlending});
      var m=groundPlane(p[2],p[3],mat,p[0],S.groundHeight(p[0],p[1])+.014,p[1],p[4]);
      S.puddles.push({x:p[0],z:p[1],r:Math.min(p[2],p[3])*.42,mesh:m});
    });

    /* ---- elongated light reflections on wet asphalt ---- */
    function refl(x, z, w, len, color, op, ry) {
      var mat = S.basic(0xffffff, {
        map: S.tex.reflection(color), transparent: true, opacity: op,
        blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
      });
      var m = groundPlane(w, len, mat, x, 0.037, z, ry || 0);
      S.reflections.push({ mesh: m, base: op, phase: S.range(0, 6.28) });
      return m;
    }
    refl(-1.6, 2.4, 1.5, 4.4, '#a3cdb8', .12);
    refl(0.9, 2.2, 1.3, 4.0, '#99c0b1', .10);
    refl(-3.4, 1.9, 1.6, 3.6, '#ffcf8c', .24);
    refl(-0.2, 2.0, 1.3, 3.4, '#ffcf8c', .20);
    refl(3.2, 2.3, 1.1, 3.8, '#ff987e', .15);
    refl(4.0, 1.9, 0.8, 3.0, '#ffc192', .16);
    refl(6.4, 2.35, 1.21, 2.8, '#b0c7cc', .24);
  };
})(window.S);

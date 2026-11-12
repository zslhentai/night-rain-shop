/* ============================================================
   base.js — square display plinth, wet L-shaped street corner
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
    var dark = S.toon(0x1a2334);
    var side = S.toon(0x2b364b);
    var trim = S.toon(0x4a5b78);
    var curb = S.toon(0x8b95a6);
    var white = S.basic(0xdfe9f2, { transparent: true, opacity: 0.86 });

    /* ---- plinth ---- */
    var slab = S.box(28, 0.9, 26, side, 0, -0.45, 0, { cast: true, outline: true, outlineColor: 0x0b1322, outlineOpacity: 0.8 });
    S.box(27.6, 0.06, 25.6, S.toon(0x222d40), 0, -0.88, 0, {});
    /* floating shadow halo under the model */
    var haloTex = S.makeTex(256, 256, function (x, w, h) {
      var g = x.createRadialGradient(128, 128, 10, 128, 128, 126);
      g.addColorStop(0, 'rgba(4,8,16,.75)'); g.addColorStop(0.7, 'rgba(4,8,16,.28)'); g.addColorStop(1, 'rgba(4,8,16,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    });
    groundPlane(26, 26, S.basic(0xffffff, { map: haloTex, transparent: true, depthWrite: false, opacity: 0.9 }), 0, -0.97, 0);

    /* ---- asphalt ---- */
    var asphalt = S.toon(0xffffff, { map: S.tex.asphalt(), color: 0xffffff });
    groundPlane(28, 26, asphalt, 0, 0.008, 0);

    /* a cool ambient wash over the whole road */
    groundPlane(28, 26, S.basic(0x3d5e8c, { transparent: true, opacity: 0.09, depthWrite: false }), 0, 0.011, 0);

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
    S.box(14.0, 0.11, 0.20, curb, -2.7, 0.085, 0.74, { outline: true, outlineOpacity: .3 });
    S.box(0.20, 0.11, 8.6, curb, 4.36, 0.085, -4.3, { outline: true, outlineOpacity: .3 });
    /* wet highlight along curb tops */
    S.box(14.0, 0.012, 0.05, S.basic(0x9fc7e8, { transparent: true, opacity: .55 }), -2.7, 0.143, 0.70, {});
    S.box(0.05, 0.012, 8.6, S.basic(0x9fc7e8, { transparent: true, opacity: .55 }), 4.32, 0.143, -4.3, {});

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
      groundPlane(0.34, 1.55, white, cx, 0.024, 2.15, 0);
      groundPlane(0.34, 1.55, S.basic(0x8fbce8, { transparent: true, opacity: .20, blending: T.AdditiveBlending, depthWrite: false }), cx, 0.027, 2.15, 0);
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
      [-5.4, 3.3, 3.5, 2.1, .2], [1.0, 6.0, 3.0, 1.7, -.3], [6.6, 5.1, 3.2, 2.2, .5],
      [3.0, 8.0, 2.6, 1.5, -.2], [-1.7, 1.9, 2.1, 1.2, .4], [8.2, 1.1, 2.2, 1.4, -.4],
      [-7.9, -3.1, 1.9, 2.4, .1], [5.0, -6.2, 1.8, 1.3, .8]
    ];
    spots.forEach(function (p) {
      var mat = S.basic(0xffffff, { map: puddleTex, transparent: true, depthWrite: false, opacity: .58, blending: T.AdditiveBlending });
      var m = groundPlane(p[2], p[3], mat, p[0], 0.031, p[1], p[4]);
      S.puddles.push({ x: p[0], z: p[1], r: Math.min(p[2], p[3]) * 0.42, mesh: m });
      /* a crisp specular rim */
      groundPlane(p[2] * 0.72, 0.025, S.basic(0xb9ddf6, { transparent: true, opacity: .16, blending: T.AdditiveBlending, depthWrite: false }), p[0], 0.033, p[1] - p[3] * 0.22, p[4]);
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
    refl(-1.6, 2.4, 1.5, 4.4, '#66f0cf', .42);
    refl(0.9, 2.2, 1.3, 4.0, '#66f0cf', .30);
    refl(-3.4, 1.9, 1.6, 3.6, '#ffcf8c', .40);
    refl(-0.2, 2.0, 1.3, 3.4, '#ffcf8c', .30);
    refl(3.2, 2.3, 1.1, 3.8, '#ff86a8', .36);
    refl(4.0, 1.9, 0.8, 3.0, '#ff86a8', .22);
    refl(6.4, 3.6, 1.7, 5.0, '#a9d6ff', .34);
    refl(7.3, 4.1, 0.9, 4.2, '#a9d6ff', .18);
    refl(-7.7, -0.7, 1.2, 3.0, '#ffb77a', .32);
    refl(-7.9, -4.4, 0.9, 2.6, '#ffb77a', .20);
    refl(6.9, 7.0, 0.8, 2.6, '#ff7676', .20);

    /* light pools directly under lamps / doorway */
    function pool(x, z, r, color, op) {
      var t = S.makeTex(128, 128, function (cx, w, h) {
        var g = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
        cx.fillStyle = g; cx.fillRect(0, 0, w, h);
      });
      groundPlane(r * 2, r * 2, S.basic(0xffffff, { map: t, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false }), x, 0.03, z, 0);
    }
    pool(-1.5, -0.9, 3.0, 'rgba(255,196,126,.62)', .72);
    pool(6.4, 1.4, 3.2, 'rgba(160,205,255,.45)', .42);
    pool(3.3, -0.7, 1.7, 'rgba(255,130,170,.42)', .42);
    pool(-7.7, -6.8, 2.0, 'rgba(255,185,120,.40)', .40);
  };
})(window.S);

/* ============================================================
   interior.js — warm, fully stocked convenience store interior
   ============================================================ */
(function (S) {
  var T = THREE;
  S.interiorGlows = [];

  S.buildInterior = function () {
    var f = S.SHOP.floor;
    var cream = S.toon(0xf6e7ca);
    var white = S.toon(0xeadcc2);
    var wood = S.toon(0xb08a67);
    var metal = S.toon(0xc0b39e);
    var frame = S.toon(0x55697c);
    var lamp = S.basic(0xffd49a);
    var lampSoft = S.basic(0xffc07d, { transparent: true, opacity: .55 });
    var bottleColors = [0x7fc3d8, 0xf0cf82, 0xe58f92, 0xa5cf96, 0xd7a6e0, 0xeab07c, 0xf3efe0];

    /* ---------- ceiling light rows ---------- */
    [-7.35, -5.55, -3.75, -2.15].forEach(function (z) {
      S.box(8.2, 0.10, 0.30, white, -1.7, 3.19, z, {});
      S.box(7.9, 0.035, 0.20, lamp, -1.7, 3.13, z, {});
      S.box(7.9, 0.02, 0.24, lampSoft, -1.7, 3.115, z, {});
      S.glow(-4.9, 3.05, z, 0xffa85c, 3.0, .22);
      S.glow(-1.7, 3.05, z, 0xffa85c, 3.0, .22);
      S.glow(1.5, 3.05, z, 0xffa85c, 3.0, .22);
    });
    /* hanging promo flags */
    ['#f4c95d', '#e88b8b', '#8bc4a6', '#8fb0dc'].forEach(function (c, i) {
      var z = -6.6 + i * 1.5;
      S.box(0.012, 0.34, 0.012, frame, -0.9, 2.98, z, {});
      S.box(0.012, 0.34, 0.012, frame, 0.5, 2.98, z, {});
      S.plane(1.4, 0.36, S.basic(0xffffff, { map: S.tex.priceTag('おすすめ', '#ffe9a8'), transparent: true, side: T.DoubleSide }), -0.2, 2.78, z, {});
      S.glow(-0.2, 2.78, z + 0.02, 0xffdca0, 1.2, .08);
    });

    /* ---------- back wall light boxes ---------- */
    S.box(4.3, 0.72, 0.10, frame, -1.7, 2.72, -8.47, {});
    S.plane(4.15, 0.60, S.basic(0xffffff, { map: S.tex.adPanel('挽きたて コーヒー', 'HOT COFFEE  ¥100', '#fff2d6') }), -1.7, 2.72, -8.40, {});
    S.glow(-1.7, 2.72, -8.32, 0xffb774, 4.4, .22);
    S.box(1.5, 0.55, 0.09, frame, 1.9, 2.62, -8.47, {});
    S.plane(1.4, 0.46, S.basic(0xffffff, { map: S.tex.adPanel('お弁当', 'できたて', '#ffe8b9') }), 1.9, 2.62, -8.40, {});

    /* ---------- refrigerated drink cabinets along the back wall ---------- */
    function drinkCabinet(bx) {
      S.box(2.35, 2.22, 0.62, white, bx, 1.22, -8.22, { outline: true, outlineOpacity: .3 });
      S.box(2.12, 1.92, 0.04, S.basic(0xffe6c6), bx, 1.20, -7.93, {});
      for (var row = 0; row < 3; row++) {
        var yy = 0.48 + row * 0.56;
        S.box(2.12, 0.035, 0.50, metal, bx, yy - 0.17, -8.20, {});
        for (var c = 0; c < 8; c++) {
          var col = bottleColors[(c + row * 3 + (bx > -3 ? 2 : 0)) % bottleColors.length];
          S.box(0.17, 0.33, 0.16, S.toon(col), bx - 0.90 + c * 0.255, yy + 0.01, -8.14, {});
          S.box(0.13, 0.06, 0.02, S.basic(0xf7f4e8), bx - 0.90 + c * 0.255, yy + 0.06, -8.05, {});
        }
      }
      /* glass doors */
      S.plane(2.20, 1.98, S.glass(0xdff2ff, 0.17), bx, 1.22, -7.88, {});
      S.box(0.055, 1.98, 0.06, frame, bx, 1.22, -7.87, {});
      [-0.55, 0.55].forEach(function (o) { S.box(0.035, 0.42, 0.05, metal, bx + o, 1.25, -7.83, {}); });
      S.box(2.35, 0.16, 0.66, frame, bx, 2.36, -8.22, {});
      S.plane(0.72, 0.22, S.basic(0xffffff, { map: S.tex.priceTag('¥130', '#ffdf62') }), bx, 2.36, -7.87, {});
      S.glow(bx, 1.5, -7.85, 0xffe6b8, 2.4, .12);
    }
    drinkCabinet(-4.72);
    drinkCabinet(-1.72);

    /* ---------- staff door + lockers ---------- */
    S.box(0.06, 2.05, 1.05, S.toon(0xa9a394), -6.06, 1.15, -7.55, {});
    S.plane(0.92, 1.90, S.basic(0xffffff, { map: S.tex.staffDoor() }), -6.02, 1.15, -7.55, { ry: Math.PI / 2 });
    S.cyl(0.045, 0.045, 0.09, 8, metal, -5.96, 1.10, -7.12, { rx: Math.PI / 2 });
    /* locker bank */
    S.box(1.80, 2.05, 0.55, S.toon(0xc9d0d0), 1.85, 1.13, -8.28, { outline: true, outlineOpacity: .3 });
    for (var l = 0; l < 3; l++) {
      S.box(0.54, 0.90, 0.02, S.toon(0xdde3e2), 1.30 + l * 0.56, 1.55, -7.99, {});
      S.box(0.54, 0.90, 0.02, S.toon(0xdde3e2), 1.30 + l * 0.56, 0.60, -7.99, {});
      S.box(0.12, 0.03, 0.03, metal, 1.48 + l * 0.56, 1.55, -7.97, {});
    }

    /* ---------- three long gondola shelves ---------- */
    var goods0 = S.tex.shelfGoods(0), goods1 = S.tex.shelfGoods(1);
    function gondola(sx, variant) {
      var goods = variant % 2 ? goods1 : goods0;
      S.box(0.90, 1.38, 4.20, cream, sx, 0.79, -5.25, { outline: true, outlineOpacity: .32 });
      S.box(0.94, 0.08, 4.24, S.toon(0xb9b3a3), sx, 1.49, -5.25, {});
      for (var lv = 0; lv < 3; lv++) {
        var yy = 0.36 + lv * 0.44;
        S.box(0.96, 0.045, 4.22, S.toon(0xc3bdae), sx, yy - 0.16, -5.25, {});
        [-1, 1].forEach(function (s) {
          var m = S.basic(0xffffff, { map: goods, transparent: true, side: T.DoubleSide });
          S.plane(4.10, 0.34, m, sx + s * 0.475, yy + 0.02, -5.25, { ry: s * Math.PI / 2 });
        });
      }
      /* shelf-end promo card */
      S.plane(0.60, 0.24, S.basic(0xffffff, { map: S.tex.priceTag(['¥100', '¥150', '¥120'][variant % 3], '#ffe06a'), transparent: true, side: T.DoubleSide }), sx, 1.72, -3.10, {});
      S.box(0.02, 0.30, 0.02, metal, sx, 1.55, -3.10, {});
      /* category label on top edge */
      S.plane(0.36, 0.18, S.basic(0xffffff, { map: S.tex.label(['お菓子', '飲料', '日用'][variant % 3], '', '#ffffff', '#4d6b63'), transparent: true, side: T.DoubleSide }), sx, 1.55, -7.39, {});
    }
    gondola(-4.85, 0);
    gondola(-2.15, 1);
    gondola(0.55, 2);

    /* rice balls + snacks on the shelf ends */
    for (var rb = 0; rb < 6; rb++) {
      var rx = -4.85 + (rb % 3) * 0.28, rz = -3.02 + Math.floor(rb / 3) * 0.30;
      S.cyl(0.15, 0.15, 0.10, 3, S.toon(0xfaf6e9), rx, 1.56, rz, { ry: 0.5 });
      S.box(0.10, 0.02, 0.09, S.toon(0x33403c), rx, 1.51, rz, {});
    }
    var snackColors = [0xf0c96c, 0xe4938e, 0x8fc0b4, 0xb6a3d8, 0xe8a878];
    for (var sn = 0; sn < 10; sn++) {
      S.box(0.16, 0.26, 0.10, S.toon(snackColors[sn % snackColors.length]),
        -2.15 - 0.28 + (sn % 5) * 0.14, 1.65 + Math.floor(sn / 5) * 0.02, -3.06 + Math.floor(sn / 5) * 0.16, { rz: S.range(-.15, .15) });
    }

    /* ---------- bento cold case ---------- */
    S.box(1.15, 0.86, 2.00, white, 1.75, 0.53, -4.15, { outline: true, outlineOpacity: .3 });
    S.box(1.05, 0.05, 1.88, S.basic(0xfff2da), 1.75, 0.92, -4.15, {});
    var bentoColors = [0xe8b46a, 0x9ec58a, 0xe48d7c, 0x8faed4, 0xf0d595, 0xbfa4cf];
    for (var bb = 0; bb < 12; bb++) {
      S.box(0.28, 0.075, 0.26, S.toon(bentoColors[bb % bentoColors.length]),
        1.75 - 0.36 + (bb % 3) * 0.36, 0.98, -4.15 - 0.65 + Math.floor(bb / 3) * 0.43, {});
      S.box(0.16, 0.012, 0.10, S.basic(0xfff8e6), 1.75 - 0.36 + (bb % 3) * 0.36, 1.023, -4.15 - 0.65 + Math.floor(bb / 3) * 0.43, {});
    }
    S.plane(1.10, 1.92, S.glass(0xe5f6ff, 0.16), 1.75, 1.00, -4.15, { rx: -Math.PI / 2 });
    S.plane(0.72, 0.24, S.basic(0xffffff, { map: S.tex.priceTag('お弁当', '#ffd97a'), transparent: true, side: T.DoubleSide }), 1.75, 1.30, -3.18, {});
    S.glow(1.75, 1.05, -4.15, 0xffe0ae, 2.2, .12);

    /* ---------- chest freezer near the entrance ---------- */
    S.box(1.60, 0.72, 0.92, white, -3.55, 0.46, -2.30, { outline: true, outlineOpacity: .3 });
    S.box(1.48, 0.05, 0.80, S.basic(0xdff1f7), -3.55, 0.84, -2.30, {});
    for (var ic = 0; ic < 10; ic++) {
      S.box(0.24, 0.10, 0.20, S.toon([0xf3a9bd, 0x9fc9e8, 0xf4d487, 0xb0d6a8, 0xcdb3e0][ic % 5]),
        -3.55 - 0.55 + (ic % 5) * 0.28, 0.90, -2.30 - 0.18 + Math.floor(ic / 5) * 0.34, {});
    }
    S.plane(1.52, 0.84, S.glass(0xe5f6ff, 0.20), -3.55, 0.90, -2.30, { rx: -Math.PI / 2 });
    S.plane(0.75, 0.24, S.basic(0xffffff, { map: S.tex.priceTag('アイス', '#bfe7f5'), transparent: true, side: T.DoubleSide }), -3.55, 1.12, -1.86, {});

    /* ---------- checkout counter ---------- */
    S.box(2.55, 0.94, 0.72, wood, 0.25, 0.57, -2.55, { outline: true, outlineOpacity: .32 });
    S.box(2.68, 0.06, 0.82, S.toon(0xd8c3a4), 0.25, 1.06, -2.55, {});
    S.box(0.86, 0.94, 0.68, wood, -1.32, 0.57, -2.92, {});
    S.box(0.92, 0.06, 0.74, S.toon(0xd8c3a4), -1.32, 1.06, -2.92, {});
    /* register */
    S.box(0.46, 0.26, 0.40, S.toon(0x4c5a66), -0.45, 1.22, -2.58, {});
    S.plane(0.34, 0.20, S.basic(0x7fd8e8), -0.45, 1.30, -2.37, { rx: -0.35 });
    S.box(0.42, 0.03, 0.16, S.toon(0xaab5bc), -0.45, 1.10, -2.32, {});
    /* customer facing display */
    S.box(0.55, 0.36, 0.06, frame, 0.95, 1.36, -2.20, {});
    S.plane(0.50, 0.30, S.basic(0xffffff, { map: S.tex.label('¥ 540', 'ありがとう', '#203a48', '#dff8ff'), transparent: true, opacity: .92 }), 0.95, 1.36, -2.16, {});
    /* baskets, bags, small goods */
    S.box(0.34, 0.20, 0.26, S.toon(0x3d6d9c), 1.28, 1.19, -2.60, {});
    S.box(0.30, 0.02, 0.22, S.toon(0x2d5580), 1.28, 1.30, -2.60, {});
    S.box(0.18, 0.24, 0.12, S.toon(0xf3e7c8), 0.55, 1.21, -2.78, {});
    S.box(0.18, 0.24, 0.12, S.toon(0xe9d9b4), 0.76, 1.21, -2.78, {});
    S.plane(0.66, 0.20, S.basic(0xffffff, { map: S.tex.priceTag('レジ', '#ffe8a0'), transparent: true, side: T.DoubleSide }), 0.25, 0.80, -2.17, {});

    /* ---------- oden counter ---------- */
    S.box(1.20, 0.94, 0.72, S.toon(0xb9c3c7), -2.75, 0.57, -2.62, { outline: true, outlineOpacity: .3 });
    S.box(1.26, 0.06, 0.78, metal, -2.75, 1.06, -2.62, {});
    S.box(0.98, 0.16, 0.58, S.toon(0x8e9ca4), -2.75, 1.15, -2.62, {});
    S.box(0.88, 0.02, 0.48, S.basic(0xe4a461), -2.75, 1.24, -2.62, {});
    for (var od = 0; od < 8; od++) {
      S.cyl(0.09, 0.09, 0.06, 8, S.toon([0xf0dfb5, 0xc79a68, 0xe8e2cd, 0xb98c60][od % 4]),
        -2.75 - 0.34 + (od % 4) * 0.22, 1.27, -2.62 - 0.13 + Math.floor(od / 4) * 0.26, {});
    }
    S.box(0.02, 0.02, 0.42, metal, -2.30, 1.31, -2.62, {});
    S.plane(0.50, 0.28, S.basic(0xffffff, { map: S.tex.priceTag('おでん', '#ffcf8a'), transparent: true, side: T.DoubleSide }), -2.75, 1.55, -2.98, {});
    S.box(0.02, 0.38, 0.02, metal, -2.75, 1.36, -2.98, {});
    S.glow(-2.75, 1.30, -2.62, 0xffbb7a, 1.4, .18);
    var steam = S.glow(-2.75, 1.55, -2.62, 0xfff0dd, 1.0, .10);
    S.interiorGlows.push(steam);

    /* ---------- coffee machine ---------- */
    S.box(0.70, 1.52, 0.92, S.toon(0x4a3a35), 2.30, 0.86, -6.15, { outline: true, outlineOpacity: .35 });
    S.box(0.60, 0.42, 0.06, S.basic(0x2b2220), 2.30, 1.18, -5.68, {});
    S.plane(0.50, 0.30, S.basic(0xffffff, { map: S.tex.adPanel('COFFEE', '¥100', '#f6e2bb') }), 2.30, 1.18, -5.64, {});
    [[2.10, 0.92], [2.50, 0.92], [2.10, 0.72], [2.50, 0.72]].forEach(function (p, i) {
      S.cyl(0.055, 0.055, 0.02, 10, S.basic([0xff9c6b, 0x8fd7b0, 0xffd67a, 0x9ec6f0][i]), p[0], p[1], -5.66, { rx: Math.PI / 2 });
    });
    S.box(0.40, 0.30, 0.30, S.toon(0x28201e), 2.30, 0.45, -5.72, {});
    S.cyl(0.09, 0.07, 0.16, 10, S.toon(0xf6f1e4), 2.30, 0.44, -5.56, {});
    S.box(0.74, 0.10, 0.94, S.toon(0x6a554c), 2.30, 1.66, -6.15, {});
    S.plane(0.60, 0.28, S.basic(0xffffff, { map: S.tex.priceTag('COFFEE', '#e6c18a'), transparent: true, side: T.DoubleSide }), 2.30, 1.86, -5.66, {});
    S.glow(2.30, 1.20, -5.62, 0xffc98a, 1.6, .18);

    /* ---------- magazine rack against the left wall ---------- */
    S.box(0.46, 1.70, 1.70, S.toon(0xb7a98f), -5.88, 0.95, -3.05, { outline: true, outlineOpacity: .3 });
    for (var mr = 0; mr < 3; mr++) {
      var my = 0.55 + mr * 0.52;
      S.box(0.50, 0.04, 1.64, S.toon(0xd6c8a9), -5.86, my, -3.05, {});
      for (var mg = 0; mg < 4; mg++) {
        S.plane(0.34, 0.44, S.basic(0xffffff, { map: S.tex.magazine(mr * 4 + mg), side: T.DoubleSide }),
          -5.62, my + 0.24, -3.05 - 0.58 + mg * 0.39, { ry: Math.PI / 2, rz: -0.08 });
      }
    }

    /* ---------- posters hanging inside the glass ---------- */
    [['sale', -5.15], ['onigiri', -3.55], ['bento', 1.85]].forEach(function (p) {
      S.plane(0.48, 0.72, S.basic(0xffffff, { map: S.tex.poster(p[0]), transparent: true, side: T.DoubleSide, depthWrite: false }), p[1], 2.42, -1.68, {});
      S.box(0.50, 0.02, 0.02, frame, p[1], 2.79, -1.68, {});
    });
    [['coffee', -3.10], ['pink', -4.55]].forEach(function (p) {
      S.plane(0.48, 0.72, S.basic(0xffffff, { map: S.tex.poster(p[0]), transparent: true, side: T.DoubleSide, depthWrite: false }), 2.72, 2.42, p[1], { ry: Math.PI / 2 });
    });

    /* ---------- floor guidance + small props ---------- */
    [['1', '飲料', -3.5, -6.6], ['2', 'お菓子', -0.8, -6.6], ['3', 'お弁当', -0.8, -3.5]].forEach(function (p) {
      S.plane(0.55, 0.28, S.basic(0xffffff, { map: S.tex.label(p[0], p[1], '#e8f1e4', '#4d7c6d'), transparent: true, opacity: .8, depthWrite: false, side: T.DoubleSide }),
        p[2], f + 0.005, p[3], { rx: -Math.PI / 2 });
    });
    /* shopping baskets stacked, a cardboard box, a small bin */
    S.box(0.42, 0.26, 0.34, S.toon(0x3d6d9c), -5.55, 0.23, -1.95, {});
    S.box(0.42, 0.26, 0.34, S.toon(0x3d6d9c), -5.55, 0.47, -1.95, {});
    S.box(0.50, 0.36, 0.44, S.toon(0xc9a877), 1.55, 0.28, -7.15, { outline: true, outlineOpacity: .3 });
    S.cyl(0.18, 0.15, 0.42, 10, S.toon(0x7f8d98), 2.35, 0.31, -3.00, {});
    S.cyl(0.19, 0.19, 0.03, 10, S.toon(0x596770), 2.35, 0.53, -3.00, {});
    /* fire extinguisher by the staff door */
    S.cyl(0.09, 0.09, 0.42, 8, S.toon(0xd3513f), -5.95, 0.31, -6.75, {});

    /* soft warm light suspended in the air inside the shop */
    [[-4.3, -6.2], [-1.6, -6.0], [0.9, -4.4], [-2.6, -2.9]].forEach(function (p, i) {
      S.glow(p[0], 1.75, p[1], 0xff9d52, 4.6, .095 + i * 0.006);
    });
  };
})(window.S);

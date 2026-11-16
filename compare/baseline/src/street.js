/* ============================================================
   street.js — corner props, alley, poles, wires, background block
   ============================================================ */
(function (S) {
  var T = THREE;
  S.trafficSignal = null;
  S.neonExtras = [];

  function mat(c) { return S.toon(c); }

  S.buildStreet = function () {
    backdrop();
    vendingMachines();
    bicycle();
    umbrellaStand();
    bins();
    streetLamp();
    polesAndWires();
    signsAndRails();
    alley();
    smallProps();
    trafficLight();
  };

  /* ---------- background apartment + tree ---------- */
  function backdrop() {
    var b = mat(0x38455d), b2 = mat(0x2d394e);
    S.box(3.65, 4.4, 3.75, b, 7.5, 2.2, -7.45, { cast: true, outline: true, outlineOpacity: .45 });
    S.box(3.85, 0.22, 3.95, b2, 7.5, 4.50, -7.45, { outline: true, outlineOpacity: .4 });
    S.box(3.9, 0.18, 0.10, mat(0x55627a), 7.5, 4.64, -5.58, {});
    /* windows: warm + cool, some dark */
    var wins = [[6.55, 3.35, 0xffd8a0], [8.35, 3.35, 0x33435c], [6.55, 1.75, 0x9fc4dd], [8.35, 1.75, 0xffd8a0]];
    wins.forEach(function (w) {
      S.box(0.95, 1.05, 0.05, mat(0x1d2738), w[0], w[1], -5.55, {});
      S.plane(0.82, 0.92, S.basic(w[2]), w[0], w[1], -5.51, {});
      S.box(0.05, 0.92, 0.05, mat(0x8b98a8), w[0], w[1], -5.48, {});
      S.box(0.82, 0.05, 0.05, mat(0x8b98a8), w[0], w[1], -5.48, {});
      if (w[2] === 0xffd8a0) S.glow(w[0], w[1], -5.44, 0xffcf90, 1.9, .16);
    });
    [[-6.8, 3.35, 0xffd8a0], [-8.3, 3.35, 0x33435c], [-6.8, 1.75, 0x9fc4dd], [-8.3, 1.75, 0xffd8a0]].forEach(function (w) {
      S.box(0.05, 1.05, 0.95, mat(0x1d2738), 9.36, w[1], w[0], {});
      S.plane(0.82, 0.92, S.basic(w[2]), 9.40, w[1], w[0], { ry: Math.PI / 2 });
    });
    /* balcony + rail */
    S.box(2.4, 0.09, 0.75, mat(0x6a7688), 7.5, 2.45, -5.20, {});
    for (var r = 0; r < 7; r++) S.box(0.035, 0.42, 0.035, mat(0x8d99a8), 6.45 + r * 0.35, 2.68, -4.86, {});
    S.box(2.4, 0.05, 0.05, mat(0x8d99a8), 7.5, 2.89, -4.86, {});
    /* ground floor door, meter box, rooftop antenna */
    S.box(1.0, 1.85, 0.06, mat(0x222c3e), 6.6, 0.93, -5.54, {});
    S.plane(0.72, 0.28, S.basic(0xffffff, { map: S.tex.label('夜灯荘', '', '#2c3a4c', '#dfeaf2'), transparent: true }), 7.5, 4.05, -5.55, {});
    S.cyl(0.02, 0.02, 1.5, 6, mat(0x8793a3), 8.7, 5.25, -8.0, {});
    S.box(0.5, 0.02, 0.02, mat(0x8793a3), 8.7, 5.85, -8.0, {});
    S.box(0.6, 0.5, 0.5, mat(0x8b98a6), 8.2, 4.85, -8.2, {});

    /* clipped street tree */
    S.cyl(0.09, 0.14, 1.55, 8, mat(0x6c5747), 8.55, 0.78, -2.85, {});
    S.sphere(0.68, mat(0x3f6f5b), 8.55, 1.92, -2.85, { scale: [1.15, .85, 1.1] });
    S.sphere(0.46, mat(0x4d7d64), 8.05, 2.35, -2.62, {});
    S.sphere(0.42, mat(0x4a7a61), 9.05, 2.30, -3.10, {});
    S.cyl(0.55, 0.62, 0.10, 10, mat(0x6b7169), 8.55, 0.06, -2.85, {});

    /* low wall + hedge continuing the block */
    S.box(3.9, 0.9, 0.22, mat(0x4a5668), 7.4, 0.45, -1.05, { outline: true, outlineOpacity: .35 });
    S.box(4.0, 0.10, 0.30, mat(0x7d8896), 7.4, 0.94, -1.05, {});
    S.box(0.22, 0.9, 2.5, mat(0x4a5668), 5.5, 0.45, -2.35, {});
    S.sphere(0.42, mat(0x3f6f5b), 6.0, 1.12, -2.0, { scale: [1, .75, 1] });
    S.sphere(0.40, mat(0x477a63), 6.9, 1.12, -2.1, { scale: [1, .75, 1] });
  }

  /* ---------- two glowing vending machines ---------- */
  function vendingMachines() {
    [[2.95, 0], [3.98, 1]].forEach(function (v, idx) {
      var x = v[0], z = -0.82, warm = v[1];
      var body = mat(warm ? 0xa8324c : 0x24538c);
      S.box(1.02, 2.05, 0.82, body, x, 1.08, z, { cast: true, outline: true, outlineOpacity: .45 });
      S.box(1.06, 0.12, 0.86, mat(0xd9e2e6), x, 2.14, z, {});
      /* lit product panel */
      S.box(0.86, 1.52, 0.04, S.basic(0xffffff), x - 0.04, 1.23, z + 0.43, {});
      S.plane(0.80, 1.44, S.basic(0xffffff, { map: S.tex.vmPanel(warm ? 'warm' : 'cold') }), x - 0.04, 1.23, z + 0.457, {});
      S.box(0.06, 1.52, 0.05, mat(0x2a3646), x + 0.42, 1.23, z + 0.45, {});
      /* buttons + coin slot */
      for (var b = 0; b < 4; b++) S.cyl(0.03, 0.03, 0.02, 8, S.basic(b === 0 ? 0xff9d8a : 0xc9d9e2), x + 0.42, 1.62 - b * 0.14, z + 0.48, { rx: Math.PI / 2 });
      S.box(0.12, 0.05, 0.03, mat(0x8d99a4), x + 0.42, 0.92, z + 0.48, {});
      /* delivery flap + base */
      S.box(0.60, 0.30, 0.05, mat(0x1b2634), x - 0.12, 0.35, z + 0.43, {});
      S.box(1.02, 0.10, 0.82, mat(0x2a3646), x, 0.06, z, {});
      /* top light box */
      S.plane(0.86, 0.10, S.basic(0xffffff, { map: S.tex.label(warm ? 'あたたかい' : 'つめたい', '', warm ? '#a8324c' : '#24538c', '#f4f9ff'), transparent: true }), x, 2.14, z + 0.44, {});
      var g = S.glow(x, 1.4, z + 0.55, warm ? 0xff8ba6 : 0x8dd0f5, 2.6, .28);
      S.neonExtras.push({ sprite: g, base: .28, phase: idx * 2.1 });
      S.glow(x, 2.14, z + 0.5, warm ? 0xff9ab0 : 0x9cd8ff, 1.5, .25);
    });
    /* bottle recycle bin */
    S.box(0.56, 0.72, 0.52, mat(0x3f6f7c), 4.55, 0.42, -1.15, { outline: true, outlineOpacity: .35 });
    S.cyl(0.09, 0.09, 0.02, 12, mat(0x243844), 4.45, 0.79, -1.15, {});
    S.cyl(0.09, 0.09, 0.02, 12, mat(0x243844), 4.68, 0.79, -1.15, {});
    S.plane(0.42, 0.16, S.basic(0xffffff, { map: S.tex.label('リサイクル', '', '#3f6f7c', '#e8f6f4'), transparent: true }), 4.55, 0.55, -0.88, {});
  }

  /* ---------- bicycle ---------- */
  function bicycle() {
    var g = S.group();
    g.position.set(-4.55, 0.07, -0.35);
    g.rotation.y = -0.30;
    var frame = mat(0x4a7fa0), dark = mat(0x2b3846), chrome = mat(0xc6d2d8);
    [-0.56, 0.56].forEach(function (wx) {
      S.torus(0.34, 0.032, dark, wx, 0.40, 0, { parent: g });
      S.torus(0.30, 0.012, chrome, wx, 0.40, 0, { parent: g });
      S.cyl(0.035, 0.035, 0.07, 8, chrome, wx, 0.40, 0, { rx: Math.PI / 2, parent: g });
      for (var sp = 0; sp < 6; sp++) {
        S.box(0.012, 0.60, 0.012, chrome, wx, 0.40, 0, { rz: sp * Math.PI / 6, parent: g });
      }
    });
    S.tube([[-0.56, 0.40, 0], [-0.24, 0.98, 0], [-0.05, 0.40, 0]], 0.028, frame, g);
    S.tube([[-0.05, 0.40, 0], [0.34, 0.94, 0], [0.56, 0.40, 0]], 0.028, frame, g);
    S.tube([[-0.24, 0.98, 0], [0.34, 0.94, 0]], 0.028, frame, g);
    S.tube([[0.34, 0.94, 0], [0.42, 1.14, 0]], 0.028, chrome, g);
    S.box(0.42, 0.035, 0.035, dark, 0.42, 1.14, 0, { parent: g });
    S.box(0.30, 0.07, 0.16, dark, -0.26, 1.03, 0, { parent: g });
    S.box(0.06, 0.20, 0.06, chrome, -0.26, 0.90, 0, { parent: g });
    /* front basket */
    S.box(0.38, 0.24, 0.30, mat(0x9aa9b2), 0.56, 0.98, 0, { parent: g });
    S.box(0.40, 0.02, 0.32, mat(0xbcc7cc), 0.56, 1.11, 0, { parent: g });
    /* rear rack, fenders, chain guard, kickstand */
    S.box(0.48, 0.03, 0.22, chrome, -0.60, 0.88, 0, { parent: g });
    S.tube([[-0.88, 0.40, 0], [-0.78, 0.68, 0], [-0.50, 0.74, 0]], 0.018, chrome, g);
    S.tube([[0.28, 0.74, 0], [0.56, 0.68, 0], [0.86, 0.40, 0]], 0.018, chrome, g);
    S.box(0.40, 0.10, 0.03, mat(0x6f8492), -0.30, 0.40, 0.05, { parent: g });
    S.box(0.02, 0.34, 0.02, chrome, -0.16, 0.20, 0.10, { rz: 0.35, parent: g });
    S.glow(0.62, 0.92, 0.04, 0xffe2ab, 0.7, .30, g);
    S.box(0.10, 0.08, 0.08, S.basic(0xffe9b8), 0.62, 0.92, 0.03, { parent: g });
  }

  /* ---------- umbrella stand ---------- */
  function umbrellaStand() {
    var x = -2.55, z = -1.02;
    S.cyl(0.30, 0.30, 0.05, 14, mat(0x39485a), x, 0.09, z, {});
    S.torus(0.27, 0.025, mat(0x8c9aa8), x, 0.62, z, { rx: Math.PI / 2 });
    for (var i = 0; i < 4; i++) S.cyl(0.015, 0.015, 0.55, 6, mat(0x74838f), x + (i % 2 ? 0.13 : -0.13), 0.34, z + (i < 2 ? 0.13 : -0.13), {});
    var cols = [0xe58fa6, 0x7fa9d6, 0xf0d18a, 0xa6cdb9];
    [[-0.13, 0.13], [0.13, 0.13], [-0.13, -0.13], [0.13, -0.13]].forEach(function (p, i) {
      var ux = x + p[0], uz = z + p[1];
      S.cyl(0.012, 0.012, 0.85, 6, mat(0x9aa7b0), ux, 0.72, uz, {});
      S.cyl(0.025, 0.21, 0.34, 9, mat(cols[i]), ux, 1.02, uz, {});
      S.sphere(0.035, mat(0xd8e0e4), ux, 1.20, uz, {});
      S.torus(0.045, 0.012, mat(0x4b5764), ux + 0.045, 0.30, uz, { ry: Math.PI / 2 });
    });
  }

  /* ---------- bins, A-board, plants ---------- */
  function bins() {
    [[1.65, 0x3f6f9c, '可燃'], [2.25, 0x4f8a6e, 'びん・かん']].forEach(function (b) {
      S.box(0.52, 0.78, 0.46, mat(b[1]), b[0], 0.45, -1.00, { outline: true, outlineOpacity: .35 });
      S.box(0.56, 0.07, 0.50, mat(0x2c3a49), b[0], 0.87, -1.00, {});
      S.plane(0.40, 0.20, S.basic(0xffffff, { map: S.tex.label(b[2], '', '#f4f8f6', b[1]), transparent: true }), b[0], 0.58, -0.76, {});
    });
    /* menu A-board */
    var ag = S.group(); ag.position.set(-3.35, 0, -0.72);
    [-1, 1].forEach(function (s) {
      S.plane(0.72, 0.96, S.basic(0xffffff, { map: S.tex.poster(s > 0 ? 'bento' : 'coffee'), side: T.DoubleSide, transparent: true }),
        0, 0.62, s * 0.18, { rx: s * 0.22, parent: ag });
      S.box(0.04, 1.10, 0.04, mat(0x6c5c4a), -0.34, 0.55, s * 0.18, { rz: -s * 0.22, parent: ag });
      S.box(0.04, 1.10, 0.04, mat(0x6c5c4a), 0.34, 0.55, s * 0.18, { rz: -s * 0.22, parent: ag });
    });
    /* potted plants */
    [[-5.85, -1.25], [2.55, -1.25]].forEach(function (p) {
      S.cyl(0.20, 0.16, 0.32, 10, mat(0x8c6a55), p[0], 0.22, p[1], {});
      S.sphere(0.26, mat(0x4c7c60), p[0], 0.55, p[1], { scale: [1, .8, 1] });
      S.sphere(0.18, mat(0x5c8c6c), p[0] + 0.12, 0.65, p[1] - 0.06, {});
    });
  }

  /* ---------- street lamp ---------- */
  function streetLamp() {
    var x = 6.45, z = 0.35;
    S.cyl(0.30, 0.34, 0.10, 12, mat(0x59677a), x, 0.11, z, {});
    S.cyl(0.075, 0.12, 4.9, 10, mat(0x8b9aab), x, 2.5, z, { cast: true });
    S.box(0.26, 0.30, 0.20, mat(0x4f5f70), x, 1.05, z + 0.10, {});
    S.tube([[x, 4.92, z], [x, 5.14, z + 0.35], [x, 5.16, z + 1.05], [x, 5.12, z + 1.32]], 0.055, mat(0x8b9aab));
    S.box(0.50, 0.12, 0.78, mat(0x5b6b7e), x, 5.06, z + 1.28, {});
    S.box(0.42, 0.025, 0.68, S.basic(0xdcefff), x, 4.99, z + 1.28, {});
    S.glow(x, 4.92, z + 1.28, 0xb9dcff, 3.6, .42);
    S.glow(x, 5.02, z + 1.28, 0xeaf6ff, 1.6, .32);
    S.plane(0.20, 0.28, S.basic(0xffffff, { map: S.tex.label('2-1', '', '#e8eef2', '#4b5a68'), transparent: true }), x, 2.10, z + 0.09, {});
  }

  /* ---------- utility poles + sagging wires ---------- */
  function polesAndWires() {
    var poleMat = mat(0x6a7684), wire = S.basic(0x39485c);
    [[-9.15, -3.55, 6.0], [9.25, -3.15, 6.3]].forEach(function (p, idx) {
      var x = p[0], z = p[1], h = p[2];
      S.cyl(0.09, 0.13, h, 9, poleMat, x, h / 2, z, { cast: true });
      S.box(1.5, 0.09, 0.11, mat(0x7d8893), x, h - 0.35, z, {});
      S.box(1.2, 0.07, 0.09, mat(0x7d8893), x, h - 1.05, z, {});
      [-0.62, 0, 0.62].forEach(function (o) {
        S.cyl(0.055, 0.055, 0.14, 8, mat(0xc4d0d6), x + o, h - 0.22, z, {});
      });
      S.box(0.34, 0.44, 0.30, mat(0x7b8792), x + (idx ? -0.22 : 0.22), h - 1.7, z, {});
      S.plane(0.30, 0.42, S.basic(0xffffff, { map: S.tex.label('注意', '', '#e9d98f', '#5a4a22'), transparent: true, side: T.DoubleSide }), x, 2.1, z + 0.10, {});
    });
    /* four catenary wires, with tiny hanging droplets */
    for (var w = 0; w < 4; w++) {
      var y = 5.55 + w * 0.22, sag = 0.55 + w * 0.06;
      var pts = [[-9.15, y, -3.55], [-6.0, y - sag * .8, -3.5], [-2.5, y - sag, -3.45], [1.5, y - sag * .95, -3.38], [5.5, y - sag * .7, -3.28], [9.25, y + 0.1, -3.15]];
      S.tube(pts, 0.012, wire);
      for (var d = 0; d < 3; d++) {
        var t = 0.25 + d * 0.25, px = -9.15 + t * 18.4, py = y - sag * Math.sin(Math.PI * t) - 0.02;
        S.sphere(0.024, S.basic(0xbcd8ea, { transparent: true, opacity: .8 }), px, py, -3.4 + t * 0.4, {});
      }
    }
    /* an extra wire running back along the alley */
    S.tube([[-9.15, 5.1, -3.55], [-9.2, 4.7, -5.6], [-9.2, 4.9, -8.3]], 0.011, wire);
  }

  /* ---------- road sign, guard rails, notice board ---------- */
  function signsAndRails() {
    var x = 4.62, z = 0.50;
    S.cyl(0.045, 0.055, 2.55, 8, mat(0x8b9aa8), x, 1.28, z, {});
    S.box(1.60, 0.46, 0.07, mat(0x1e6d78), x, 2.42, z + 0.04, { outline: true, outlineOpacity: .4 });
    S.plane(1.52, 0.40, S.basic(0xffffff, { map: S.tex.roadSign() }), x, 2.42, z + 0.081, {});
    S.box(0.90, 0.28, 0.06, mat(0xf0ead6), x, 1.92, z + 0.04, {});
    S.plane(0.84, 0.23, S.basic(0xffffff, { map: S.tex.label('夜灯 2丁目', '', '#f0ead6', '#3c5b62'), transparent: true }), x, 1.92, z + 0.075, {});
    S.glow(x, 2.42, z + 0.12, 0x7fd6cf, 1.8, .14);

    /* L-shaped corner guard rail */
    var rail = mat(0xa9b6c0), post = mat(0x8b99a6);
    for (var i = 0; i < 5; i++) {
      var rx = 4.8 + i * 1.15;
      S.cyl(0.035, 0.04, 0.88, 8, post, rx, 0.44, 0.78, {});
      S.box(0.09, 0.05, 0.05, S.basic(0xffd36b), rx, 0.72, 0.82, {});
    }
    S.box(5.0, 0.045, 0.045, rail, 7.1, 0.84, 0.78, {});
    S.box(5.0, 0.035, 0.035, rail, 7.1, 0.48, 0.78, {});
    // Leave the zebra crossing accessible from the shop sidewalk.
    [1.05, 3.25].forEach(function (rz) {
      S.cyl(.035, .04, .88, 8, post, 4.42, .44, rz, {});
    });

    /* community notice board */
    var nx = -8.15, nz = 0.42;
    S.box(1.60, 0.06, 0.50, mat(0x6b5a48), nx, 0.10, nz, {});
    S.box(0.06, 1.45, 0.06, mat(0x7d6a53), nx - 0.72, 0.80, nz, {});
    S.box(0.06, 1.45, 0.06, mat(0x7d6a53), nx + 0.72, 0.80, nz, {});
    S.box(1.55, 1.15, 0.08, mat(0x8a765d), nx, 1.25, nz, { outline: true, outlineOpacity: .4 });
    S.plane(1.40, 1.02, S.basic(0xffffff, { map: S.tex.notice() }), nx, 1.25, nz + 0.046, {});
    S.box(1.70, 0.07, 0.62, mat(0x4a5a68), nx, 1.90, nz, {});
    S.box(1.70, 0.03, 0.62, S.basic(0x9fb8c8, { transparent: true, opacity: .7 }), nx, 1.94, nz, {});
    S.glow(nx, 1.55, nz + 0.12, 0xffe6b6, 1.6, .12);
  }

  /* ---------- narrow alley ---------- */
  function alley() {
    var wall = mat(0x3f4b5e);
    S.box(0.30, 2.90, 6.85, wall, -9.45, 1.45, -5.05, { cast: true, outline: true, outlineOpacity: .4 });
    S.box(3.20, 2.90, 0.26, mat(0x303b4c), -7.90, 1.45, -8.48, {});
    S.box(0.30, 2.90, 0.30, mat(0x556478), -9.45, 1.45, -1.62, {});
    /* lintel sign */
    S.box(3.20, 0.42, 0.22, mat(0x5a4436), -7.90, 2.72, -1.55, {});
    S.plane(2.9, 0.34, S.basic(0xffffff, {
      map: S.makeTex(768, 96, function (x, w, h) {
        x.fillStyle = '#3d2e26'; x.fillRect(0, 0, w, h);
        x.strokeStyle = '#e9c58a'; x.lineWidth = 4; x.strokeRect(8, 8, w - 16, h - 16);
        x.font = '800 52px ' + S.FONT; x.fillStyle = '#ffe1ac'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('夜灯横丁 ・ YORU ALLEY', w / 2, h / 2);
      })
    }), -7.90, 2.72, -1.42, {});
    S.glow(-7.90, 2.45, -1.30, 0xffbb77, 2.6, .24);
    /* warm lanterns, posters, pipes */
    [-8.9, -7.0].forEach(function (lx, i) {
      S.box(0.05, 0.42, 0.05, mat(0x6c5a48), lx, 2.25, -1.55, {});
      S.cyl(0.16, 0.16, 0.34, 10, S.basic(0xffcf8e), lx, 1.96, -1.55, {});
      S.cyl(0.17, 0.17, 0.04, 10, mat(0x574536), lx, 2.14, -1.55, {});
      S.glow(lx, 1.96, -1.55, 0xffb469, 1.7, .38);
    });
    ['sale', 'blue', 'oden'].forEach(function (p, i) {
      S.plane(0.44, 0.66, S.basic(0xffffff, { map: S.tex.poster(p), transparent: true, side: T.DoubleSide }), -9.27, 1.55 - i * 0.15, -3.1 - i * 1.15, { ry: Math.PI / 2 });
    });
    S.tube([[-9.25, 2.5, -2.0], [-9.25, 2.5, -6.5], [-9.25, 0.2, -6.5]], 0.045, mat(0x8e9aa4));
    /* far-end vending machine & crates */
    S.box(0.90, 1.85, 0.55, mat(0x2e5b6d), -7.45, 0.98, -8.15, { outline: true, outlineOpacity: .3 });
    S.plane(0.72, 1.35, S.basic(0xffffff, { map: S.tex.vmPanel('cold') }), -7.45, 1.05, -7.86, {});
    S.glow(-7.45, 1.2, -7.80, 0x8dd0f5, 2.2, .30);
    S.box(0.55, 0.42, 0.48, mat(0xb39468), -8.75, 0.27, -7.35, {});
    S.box(0.50, 0.36, 0.44, mat(0xa98a62), -8.72, 0.66, -7.38, {});
    S.cyl(0.18, 0.16, 0.60, 10, mat(0x556674), -8.65, 0.36, -5.0, {});
    S.glow(-7.9, 1.5, -7.6, 0xffb877, 3.0, .16);
    /* hanging cables inside the alley */
    S.tube([[-9.25, 2.75, -2.2], [-8.2, 2.45, -3.6], [-6.3, 2.6, -5.4]], 0.012, S.basic(0x334054));
  }

  /* ---------- post box, cones, crates, extra details ---------- */
  function smallProps() {
    var px = -7.45, pz = -0.72;
    S.cyl(0.30, 0.32, 1.15, 12, mat(0xc9453f), px, 0.64, pz, { outline: true, outlineOpacity: .35 });
    S.sphere(0.30, mat(0xc9453f), px, 1.20, pz, { scale: [1, .45, 1] });
    S.box(0.34, 0.07, 0.05, mat(0x2c3038), px, 0.98, pz + 0.30, {});
    S.plane(0.24, 0.28, S.basic(0xffffff, { map: S.tex.label('〒', '', '#c9453f', '#fff2e0'), transparent: true }), px, 0.66, pz + 0.31, {});
    S.cyl(0.36, 0.36, 0.07, 12, mat(0x4b5663), px, 0.10, pz, {});
    S.glow(px, 1.0, pz + 0.3, 0xff9a80, 1.0, .12);

    /* parking cones + wheel stops + crates */
    [[-6.3, 8.9], [-3.8, 8.9]].forEach(function (p) {
      S.cyl(0.06, 0.20, 0.52, 10, mat(0xe8793f), p[0], 0.28, p[1], {});
      S.box(0.40, 0.05, 0.40, mat(0x3d4755), p[0], 0.03, p[1], {});
      S.cyl(0.13, 0.16, 0.06, 10, S.basic(0xf2eee4), p[0], 0.38, p[1], {});
    });
    S.box(0.62, 0.45, 0.55, mat(0xb39468), 8.75, 0.25, -0.55, { outline: true, outlineOpacity: .3 });
    S.box(0.52, 0.36, 0.48, mat(0xa98a62), 8.72, 0.65, -0.58, {});
    /* scattered wet leaves */
    var leaf = mat(0x8a7b52);
    for (var i = 0; i < 14; i++) {
      var lx = S.range(-9, 9), lz = S.range(0.9, 9);
      if (lx > -6.3 && lx < 3 && lz < 0.9) continue;
      S.plane(0.10, 0.05, leaf, lx, 0.04, lz, { rx: -Math.PI / 2, ry: S.range(0, 3) });
    }
  }

  /* ---------- distant traffic signal ---------- */
  function trafficLight() {
    var x = 12.0, z = 3.5, h = 3.20, ly = h - 0.10;
    S.cyl(0.20, 0.24, 0.08, 10, mat(0x4b5868), x, 0.06, z, {});
    S.cyl(0.055, 0.075, h, 8, mat(0x59677a), x, h / 2, z, {});
    S.tube([[x, h - 0.04, z], [x - 0.55, h - 0.04, z], [x - 1.18, h - 0.04, z]], 0.05, mat(0x59677a));
    S.box(0.84, 0.34, 0.24, mat(0x303b4a), x - 1.37, ly, z, { outline: true, outlineOpacity: .3 });
    var lights = [];
    [[x - 1.66, 0xff5548], [x - 1.37, 0xffc14d], [x - 1.08, 0x64d38b]].forEach(function (l) {
      var m = S.basic(l[1]);
      S.cyl(0.10, 0.10, 0.03, 12, m, l[0], ly, z + 0.135, { rx: Math.PI / 2 });
      S.box(0.22, 0.04, 0.16, mat(0x303b4a), l[0], ly + 0.14, z + 0.13, {});
      var g = S.glow(l[0], ly, z + 0.22, l[1], 1.1, .0);
      lights.push({ mat: m, glow: g, color: l[1] });
    });
    S.trafficSignal = { lights: lights, t: 0 };
  }
})(window.S);

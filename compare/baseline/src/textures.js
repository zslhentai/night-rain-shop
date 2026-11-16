/* ============================================================
   textures.js — all hand-drawn canvas textures for the diorama
   ============================================================ */
(function (S) {
  var T = THREE;
  var FONT = '"Yu Gothic UI", "Yu Gothic", Meiryo, "Microsoft YaHei", sans-serif';
  S.FONT = FONT;

  S.makeTex = function (w, h, draw, opt) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d');
    draw(x, w, h);
    var t = new T.CanvasTexture(c);
    t.anisotropy = 4;
    if (opt && opt.repeat) {
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.repeat.set(opt.repeat[0], opt.repeat[1]);
    }
    return t;
  };

  function rr(x, a, b, w, h, r, fill) {
    x.beginPath();
    x.moveTo(a + r, b);
    x.lineTo(a + w - r, b); x.quadraticCurveTo(a + w, b, a + w, b + r);
    x.lineTo(a + w, b + h - r); x.quadraticCurveTo(a + w, b + h, a + w - r, b + h);
    x.lineTo(a + r, b + h); x.quadraticCurveTo(a, b + h, a, b + h - r);
    x.lineTo(a, b + r); x.quadraticCurveTo(a, b, a + r, b);
    x.closePath();
    if (fill) { x.fillStyle = fill; x.fill(); }
  }
  function txt(x, s, a, b, size, color, weight, align) {
    x.font = (weight || '700') + ' ' + size + 'px ' + FONT;
    x.fillStyle = color; x.textAlign = align || 'left'; x.textBaseline = 'middle';
    x.fillText(s, a, b);
  }
  function grad(x, a, b, c, d, stops) {
    var g = x.createLinearGradient(a, b, c, d);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    return g;
  }
  S.rr = rr;

  var tex = S.tex = {};

  /* ---------- main store sign ---------- */
  tex.brandWide = function () {
    return S.makeTex(2048, 160, function (x, w, h) {
      x.fillStyle = grad(x, 0, 0, 0, h, [[0, '#13726a'], [0.5, '#0b4a4c'], [1, '#08313d']]);
      x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,.09)';
      for (var i = 0; i < 80; i++) x.fillRect(i * 26, 0, 2, h);
      x.strokeStyle = 'rgba(160,255,228,.85)'; x.lineWidth = 5;
      x.strokeRect(10, 10, w - 20, h - 20);
      x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 2;
      x.strokeRect(19, 19, w - 38, h - 38);

      /* crescent moon + little roof = original brand mark */
      x.beginPath(); x.arc(100, 78, 50, 0, Math.PI * 2);
      x.fillStyle = '#ffb26b'; x.fill();
      x.beginPath(); x.arc(80, 66, 46, 0, Math.PI * 2);
      x.fillStyle = '#0b4a4c'; x.fill();
      x.fillStyle = '#fff4d9'; x.fillRect(64, 116, 74, 8);
      x.beginPath(); x.moveTo(58, 116); x.lineTo(101, 96); x.lineTo(144, 116); x.closePath(); x.fill();

      txt(x, 'YORU MART', 186, 68, 82, '#f6fffb', '800');
      x.shadowColor = 'rgba(120,255,220,.85)'; x.shadowBlur = 20;
      txt(x, 'YORU MART', 186, 68, 82, 'rgba(215,255,244,.45)', '800');
      x.shadowBlur = 0;
      txt(x, 'よるのコンビニ ／ 24時間営業 ／ いつもの灯り', 192, 126, 25, '#a8e8d8', '600');

      rr(x, 1810, 26, 210, 108, 12, '#ff9d5c');
      txt(x, '24H', 1915, 68, 62, '#20323b', '800', 'center');
      txt(x, 'OPEN', 1915, 112, 24, '#20323b', '800', 'center');
    });
  };

  tex.brandShort = function () {
    return S.makeTex(1024, 100, function (x, w, h) {
      x.fillStyle = grad(x, 0, 0, 0, h, [[0, '#13726a'], [1, '#08313d']]);
      x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(160,255,228,.85)'; x.lineWidth = 4;
      x.strokeRect(8, 8, w - 16, h - 16);
      txt(x, 'YORU MART', 112, 50, 56, '#f6fffb', '800');
      txt(x, '24時間営業', 620, 52, 30, '#a8e8d8', '700');
      rr(x, 892, 18, 110, 64, 8, '#ff9d5c');
      txt(x, '24H', 947, 50, 38, '#20323b', '800', 'center');
    });
  };

  /* vertical neon sub-sign */
  tex.neonVertical = function (main, sub, bg) {
    return S.makeTex(256, 768, function (x, w, h) {
      x.fillStyle = bg || '#5b2c55'; x.fillRect(0, 0, w, h);
      x.fillStyle = grad(x, 0, 0, w, 0, [[0, 'rgba(255,255,255,.14)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,.10)']]);
      x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(255,220,245,.75)'; x.lineWidth = 7;
      x.strokeRect(18, 18, w - 36, h - 36);
      txt(x, main, w / 2, 300, 96, '#fff0fa', '800', 'center');
      txt(x, sub, w / 2, 430, 44, '#ffb7df', '700', 'center');
      x.fillStyle = '#ffd0ec';
      for (var i = 0; i < 3; i++) x.fillRect(48 + i * 62, 560, 34, 8);
      txt(x, '24H', w / 2, 660, 52, '#ffd0ec', '800', 'center');
    });
  };

  /* ---------- posters & paper goods ---------- */
  tex.poster = function (kind) {
    var sets = {
      sale: ['#ffcf3f', '#ff873f', '今週の', 'おすすめ', '¥120'],
      coffee: ['#5b3a29', '#a5704a', 'あたたかい', 'コーヒー', '¥100'],
      onigiri: ['#e9f1e0', '#8fb98a', 'おにぎり', '新登場', '¥130'],
      oden: ['#f08a5d', '#b4433a', 'おでん', 'はじまり', '¥90'],
      bento: ['#ffe6a6', '#e79b4c', 'お弁当', 'できたて', '¥398'],
      blue: ['#a9d7ee', '#4c86b8', '夏の', 'ドリンク', '¥150'],
      pink: ['#ffd3e2', '#d874a4', 'スイーツ', '新作', '¥180']
    };
    var s = sets[kind] || sets.sale;
    return S.makeTex(256, 384, function (x, w, h) {
      x.fillStyle = grad(x, 0, 0, 0, h, [[0, s[0]], [1, s[1]]]); x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,.28)';
      x.beginPath(); x.arc(200, 300, 110, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,.20)';
      x.beginPath(); x.arc(50, 340, 80, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 4;
      x.strokeRect(12, 12, w - 24, h - 24);
      txt(x, s[2], w / 2, 84, 42, '#fffdf5', '800', 'center');
      txt(x, s[3], w / 2, 150, 58, '#fffdf5', '800', 'center');
      rr(x, 48, 218, 160, 76, 12, 'rgba(255,255,255,.92)');
      txt(x, s[4], 128, 256, 46, '#c4472e', '800', 'center');
      txt(x, 'YORU MART', w / 2, 344, 24, 'rgba(255,255,255,.9)', '700', 'center');
    });
  };

  tex.magazine = function (i) {
    var colors = ['#e05c6e', '#4d7fc4', '#e8b64c', '#5aa88a', '#8c6bb1', '#e8875a'];
    var titles = ['週刊 夜', '街の本', 'café', '旅と雨', 'MONO', 'ごはん'];
    var c = colors[i % colors.length];
    return S.makeTex(192, 256, function (x, w, h) {
      x.fillStyle = c; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,.22)';
      x.fillRect(0, 0, w, 62);
      x.fillStyle = 'rgba(0,0,0,.12)';
      x.beginPath(); x.arc(150, 170, 78, 0, Math.PI * 2); x.fill();
      txt(x, titles[i % titles.length], 14, 34, 30, '#fffdf8', '800');
      txt(x, 'YORU  ' + (i + 1) + ' 月号', 14, 112, 20, 'rgba(255,255,255,.95)', '700');
      x.fillStyle = 'rgba(255,255,255,.85)';
      for (var k = 0; k < 5; k++) x.fillRect(14, 190 + k * 11, 110 - k * 9, 4);
    });
  };

  /* neatly lined-up packaged goods on a shelf face */
  tex.shelfGoods = function (variant) {
    var pal = variant === 0
      ? ['#e9a0a8', '#8fb6d8', '#e8cd77', '#9ccba2', '#c7a8dc', '#e6b07c']
      : ['#8fc4d8', '#e3a2b2', '#a8cf9a', '#f0cb75', '#b3a6dd', '#e0a179'];
    return S.makeTex(768, 64, function (x, w, h) {
      x.fillStyle = '#dfd9c9'; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 18; i++) {
        var a = i * 42 + 3, c = pal[(i + variant * 2) % pal.length];
        x.fillStyle = c; S.rr(x, a, 6, 36, 52, 3, c);
        x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(a + 3, 20, 30, 13);
        x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(a + 3, 9, 30, 4);
        x.fillStyle = 'rgba(60,60,70,.25)'; x.fillRect(a + 3, 40, 22, 4);
        x.fillStyle = '#faf6e9'; x.fillRect(a, 58, 36, 5);
      }
    });
  };

  /* ---------- vending machine illuminated panel ---------- */
  tex.vmPanel = function (variant) {
    var warm = variant === 'warm';
    return S.makeTex(384, 640, function (x, w, h) {
      x.fillStyle = warm ? '#7d2038' : '#123a68'; x.fillRect(0, 0, w, h);
      x.fillStyle = grad(x, 0, 0, 0, 130, [[0, warm ? '#ff7a86' : '#63c8f0'], [1, warm ? '#a82748' : '#17508c']]);
      x.fillRect(0, 0, w, 116);
      txt(x, warm ? 'あたたかい' : 'つめたい', 20, 42, 34, '#ffffff', '800');
      txt(x, warm ? 'HOT DRINKS' : 'COLD DRINKS', 20, 86, 22, 'rgba(255,255,255,.85)', '700');
      rr(x, 288, 22, 76, 72, 10, 'rgba(255,255,255,.9)');
      txt(x, '¥130', 326, 58, 26, warm ? '#a82748' : '#17508c', '800', 'center');

      var palette = warm
        ? ['#f2d5a0', '#d4644a', '#8a4a3a', '#e9a94e', '#c9c5b6', '#b9523f']
        : ['#6fd0e8', '#f0e7c2', '#e86f7a', '#9ce07a', '#f2c34e', '#8fa8e8'];
      for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 5; c++) {
          var bx = 18 + c * 72, by = 142 + r * 92;
          var col = palette[(r * 3 + c + (warm ? 2 : 0)) % palette.length];
          x.fillStyle = 'rgba(0,0,0,.28)'; rr(x, bx + 3, by + 5, 52, 72, 8, 'rgba(0,0,0,.25)');
          x.fillStyle = col; rr(x, bx, by, 52, 72, 8, col);
          x.fillStyle = 'rgba(255,255,255,.75)'; x.fillRect(bx + 2, by + 24, 48, 18);
          x.fillStyle = 'rgba(255,255,255,.30)'; x.fillRect(bx + 6, by + 4, 8, 64);
          x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(bx + 2, by + 58, 48, 4);
          x.fillStyle = '#f7f7ef'; x.fillRect(bx + 12, by + 80, 28, 10);
        }
      }
      x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(0, 510, w, 6);
      rr(x, 24, 536, 210, 76, 10, 'rgba(8,14,26,.55)');
      txt(x, 'とりだし口', 40, 574, 24, 'rgba(255,255,255,.85)', '700');
      x.fillStyle = warm ? '#ffd18a' : '#9fe0ff';
      x.beginPath(); x.arc(320, 566, 24, 0, Math.PI * 2); x.fill();
    });
  };

  /* ---------- floor / ground textures ---------- */
  tex.shopFloor = function () {
    return S.makeTex(512, 512, function (x, w, h) {
      x.fillStyle = '#f2e6cd'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#d8cbb0'; x.lineWidth = 3;
      for (var i = 0; i <= 8; i++) {
        x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.stroke();
        x.beginPath(); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke();
      }
      for (var k = 0; k < 900; k++) {
        x.fillStyle = 'rgba(120,110,95,' + (S.rand() * 0.05) + ')';
        x.fillRect(S.rand() * w, S.rand() * h, 2, 2);
      }
    }, { repeat: [3, 3] });
  };

  tex.asphalt = function () {
    return S.makeTex(512, 512, function (x, w, h) {
      x.fillStyle = '#202a3c'; x.fillRect(0, 0, w, h);
      for (var k = 0; k < 3200; k++) {
        var v = S.rand();
        x.fillStyle = v > 0.86 ? 'rgba(150,180,215,.10)' : 'rgba(5,9,18,.20)';
        x.fillRect(S.rand() * w, S.rand() * h, 1 + S.rand() * 2, 1 + S.rand() * 2);
      }
      for (var i = 0; i < 26; i++) {
        x.strokeStyle = 'rgba(140,170,205,.045)'; x.lineWidth = 1;
        x.beginPath(); var a = S.rand() * w, b = S.rand() * h;
        x.moveTo(a, b); x.lineTo(a + 30 + S.rand() * 90, b + S.rand() * 10 - 5); x.stroke();
      }
    }, { repeat: [4, 4] });
  };

  tex.pavement = function () {
    return S.makeTex(512, 512, function (x, w, h) {
      x.fillStyle = '#4d596b'; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(25,34,48,.65)'; x.lineWidth = 4;
      for (var i = 0; i <= 4; i++) {
        x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.stroke();
        x.beginPath(); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke();
      }
      for (var k = 0; k < 1500; k++) {
        x.fillStyle = 'rgba(210,225,245,' + (S.rand() * .055) + ')';
        x.fillRect(S.rand() * w, S.rand() * h, 2, 2);
      }
    }, { repeat: [3, 1] });
  };

  /* wet reflection: vertical falloff broken by horizontal ripples */
  tex.reflection = function (color) {
    return S.makeTex(128, 512, function (x, w, h) {
      x.fillStyle = grad(x, 0, 0, 0, h, [[0, color], [0.35, color], [1, 'rgba(0,0,0,0)']]);
      x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = 'destination-out';
      for (var i = 0; i < 90; i++) {
        var y = Math.pow(S.rand(), 0.7) * h;
        var hh = 1 + S.rand() * 4;
        x.fillStyle = 'rgba(0,0,0,' + (0.25 + S.rand() * 0.65) + ')';
        x.fillRect(S.rand() * 40, y, w * (0.3 + S.rand() * 0.7), hh);
      }
      x.globalCompositeOperation = 'source-over';
      x.fillStyle = grad(x, 0, 0, w, 0, [[0, 'rgba(0,0,0,1)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,1)']]);
      x.globalCompositeOperation = 'destination-out';
      x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = 'source-over';
    });
  };

  tex.puddle = function () {
    return S.makeTex(256, 256, function (x, w, h) {
      x.clearRect(0, 0, w, h);
      /* three overlapping soft lobes = an irregular but feathered wet patch */
      var lobes = [[112, 128, 104, 74], [156, 118, 78, 58], [88, 140, 62, 46]];
      lobes.forEach(function (l, i) {
        x.save();
        x.translate(l[0], l[1]); x.scale(1, l[3] / l[2]);
        var g = x.createRadialGradient(0, 0, l[2] * 0.15, 0, 0, l[2]);
        g.addColorStop(0, 'rgba(155,196,228,' + (0.15 - i * 0.02) + ')');
        g.addColorStop(0.55, 'rgba(120,168,208,' + (0.09 - i * 0.01) + ')');
        g.addColorStop(0.85, 'rgba(180,218,246,.045)');
        g.addColorStop(1, 'rgba(180,218,246,0)');
        x.fillStyle = g;
        x.beginPath(); x.arc(0, 0, l[2], 0, Math.PI * 2); x.fill();
        x.restore();
      });
      /* faint broken glints on the surface */
      x.strokeStyle = 'rgba(200,230,250,.10)'; x.lineWidth = 2;
      for (var k = 0; k < 7; k++) {
        x.beginPath();
        var yy = 96 + k * 11, off = (k % 3) * 20;
        x.moveTo(48 + off, yy); x.lineTo(170 - off, yy + 1); x.stroke();
      }
    });
  };

  tex.glassStreak = function () {
    return S.makeTex(24, 256, function (x, w, h) {
      x.fillStyle = grad(x, 0, 0, 0, h, [[0, 'rgba(220,245,255,0)'], [0.12, 'rgba(220,245,255,.6)'], [0.8, 'rgba(220,245,255,.22)'], [1, 'rgba(220,245,255,0)']]);
      rr(x, 8, 0, 8, h, 4, '#ffffff');
      x.globalCompositeOperation = 'destination-in';
      x.fillStyle = grad(x, 0, 0, 0, h, [[0, 'rgba(0,0,0,0)'], [0.12, 'rgba(0,0,0,1)'], [0.8, 'rgba(0,0,0,.45)'], [1, 'rgba(0,0,0,0)']]);
      x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = 'source-over';
      x.fillStyle = 'rgba(235,250,255,.85)';
      x.beginPath(); x.arc(12, 236, 6, 0, Math.PI * 2); x.fill();
    });
  };

  /* ---------- small labels ---------- */
  tex.label = function (main, sub, bg, fg) {
    return S.makeTex(256, 128, function (x, w, h) {
      x.fillStyle = bg || '#ffffff'; x.fillRect(0, 0, w, h);
      x.strokeStyle = fg || '#2a3340'; x.lineWidth = 6; x.strokeRect(8, 8, w - 16, h - 16);
      txt(x, main, w / 2, sub ? 52 : h / 2, 42, fg || '#2a3340', '800', 'center');
      if (sub) txt(x, sub, w / 2, 96, 24, fg || '#2a3340', '600', 'center');
    });
  };

  tex.roadSign = function () {
    return S.makeTex(512, 160, function (x, w, h) {
      x.fillStyle = '#1e6d78'; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20);
      txt(x, '夜灯どおり', 26, 60, 46, '#f4fffd', '800');
      txt(x, 'YORU-DORI  ·  2丁目', 28, 116, 26, 'rgba(225,255,250,.85)', '600');
      x.fillStyle = '#f4fffd';
      x.beginPath(); x.moveTo(430, 44); x.lineTo(478, 80); x.lineTo(430, 116); x.lineTo(430, 94); x.lineTo(382, 94); x.lineTo(382, 66); x.lineTo(430, 66); x.closePath(); x.fill();
    });
  };

  tex.mat = function () {
    return S.makeTex(512, 256, function (x, w, h) {
      x.fillStyle = '#7d3b3c'; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 200; i++) {
        x.fillStyle = 'rgba(0,0,0,.07)'; x.fillRect(S.rand() * w, S.rand() * h, 4, 4);
      }
      x.strokeStyle = 'rgba(255,220,180,.55)'; x.lineWidth = 8; x.strokeRect(20, 20, w - 40, h - 40);
      txt(x, 'いらっしゃいませ', w / 2, 96, 52, '#ffe9c9', '800', 'center');
      txt(x, 'WELCOME  ·  YORU MART', w / 2, 168, 28, 'rgba(255,233,201,.8)', '700', 'center');
    });
  };

  tex.priceTag = function (text, bg) {
    return S.makeTex(256, 96, function (x, w, h) {
      x.fillStyle = bg || '#ffdb45'; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(120,70,20,.5)'; x.lineWidth = 5; x.strokeRect(6, 6, w - 12, h - 12);
      txt(x, text, w / 2, h / 2, 42, '#7a3a1c', '800', 'center');
    });
  };

  tex.adPanel = function (title, sub, bg) {
    return S.makeTex(512, 256, function (x, w, h) {
      x.fillStyle = bg || '#fff6d8'; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,180,90,.35)';
      x.beginPath(); x.arc(420, 200, 120, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(190,110,50,.55)'; x.lineWidth = 6; x.strokeRect(12, 12, w - 24, h - 24);
      txt(x, title, 34, 100, 62, '#8a4526', '800');
      txt(x, sub, 36, 178, 30, '#b26a42', '700');
    });
  };

  tex.notice = function () {
    return S.makeTex(384, 512, function (x, w, h) {
      x.fillStyle = '#f3ecd9'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#b9a988'; x.lineWidth = 8; x.strokeRect(12, 12, w - 24, h - 24);
      txt(x, '地域のお知らせ', w / 2, 58, 38, '#5a5344', '800', 'center');
      x.fillStyle = '#cfd8c4'; x.fillRect(30, 100, w - 60, 150);
      txt(x, '夜灯町 掲示板', w / 2, 174, 30, '#6d7a60', '700', 'center');
      for (var i = 0; i < 7; i++) {
        x.fillStyle = i % 2 ? '#e7d9bb' : '#dce7e6';
        x.fillRect(30, 270 + i * 32, w - 60, 24);
      }
    });
  };

  tex.drain = function () {
    return S.makeTex(128, 512, function (x, w, h) {
      x.fillStyle = '#141b28'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#3b4759';
      for (var i = 0; i < 18; i++) x.fillRect(14, 8 + i * 28, 100, 14);
      x.fillStyle = 'rgba(170,200,230,.18)';
      for (var j = 0; j < 18; j++) x.fillRect(14, 8 + j * 28, 100, 2);
    }, { repeat: [1, 4] });
  };

  tex.windowShade = function () {
    return S.makeTex(256, 256, function (x, w, h) {
      x.fillStyle = grad(x, 0, 0, w, h, [[0, 'rgba(190,225,255,.16)'], [0.45, 'rgba(190,225,255,0)'], [0.6, 'rgba(255,255,255,.10)'], [1, 'rgba(160,205,245,0)']]);
      x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(255,255,255,.10)'; x.lineWidth = 12;
      x.beginPath(); x.moveTo(-20, h); x.lineTo(w, 40); x.stroke();
      x.beginPath(); x.moveTo(w * 0.45, h); x.lineTo(w + 20, h * 0.42); x.stroke();
    });
  };

  tex.staffDoor = function () {
    return S.makeTex(256, 512, function (x, w, h) {
      x.fillStyle = '#d8d2c0'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#a9a390'; x.lineWidth = 8; x.strokeRect(16, 16, w - 32, h - 32);
      rr(x, 40, 150, w - 80, 130, 8, '#fff7e6');
      txt(x, 'STAFF', w / 2, 196, 38, '#6a6352', '800', 'center');
      txt(x, 'ONLY', w / 2, 240, 30, '#6a6352', '700', 'center');
      x.fillStyle = '#8a8572'; x.fillRect(0, 400, w, 8);
    });
  };
})(window.S);

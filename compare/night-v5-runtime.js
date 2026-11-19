/* Frozen V5.0 published scene used for visual comparisons. Only preset coordinates match V6. */
/* ============================================================
   core.js — renderer / camera / orbit control / toon material kit
   ============================================================ */
window.S = window.S || {};
(function (S) {
  var T = THREE;
  var options = new URLSearchParams(window.location && window.location.search || '');
  S.legacyTuning = options.get('tuning') === 'legacy';
  var profileDpr = options.get('perf') === '1' && Number(options.get('dpr'));

  /* ---------- deterministic random (keeps the diorama identical) ---------- */
  var seed = 20261112;
  S.rand = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  S.range = function (a, b) { return a + (b - a) * S.rand(); };
  S.pick = function (a) { return a[Math.floor(S.rand() * a.length)]; };

  /* ---------- animation registry ---------- */
  S.updaters = [];
  S.addUpdate = function (fn) { S.updaters.push(fn); };

  /* ---------- boot ---------- */
  S.init = function () {
    var canvas = document.getElementById('scene');
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    S.mobileGraphics = window.matchMedia('(pointer: coarse)').matches;
    var requestedQuality=options.get('quality');
    S.initialQuality=requestedQuality==='high'||requestedQuality==='low' ? requestedQuality : (S.mobileGraphics?'low':'high');
    var initialRenderQuality=S.legacyTuning?'high':S.initialQuality;
    renderer.setPixelRatio(S.renderPixelRatio(initialRenderQuality));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    // A fixed shoulder preserves detail when looking through the shop windows.
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .96;
    renderer.shadowMap.enabled = initialRenderQuality==='high';
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    S.renderer = renderer;

    var scene = new T.Scene();
    scene.fog = new T.FogExp2(0x151e35, 0.0115);
    S.scene = scene;

    S.world = new T.Group();
    scene.add(S.world);

    var camera = new T.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 220);
    S.camera = camera;

    /* 4-step toon ramp — hard, clean anime shading */
    var ramp = new Uint8Array([72, 128, 190, 255]);
    var gradientMap = new T.DataTexture(ramp, 4, 1, T.LuminanceFormat);
    gradientMap.minFilter = T.NearestFilter;
    gradientMap.magFilter = T.NearestFilter;
    gradientMap.generateMipmaps = false;
    gradientMap.needsUpdate = true;
    S.gradientMap = gradientMap;

    setupLights(scene);
    setupControls(canvas);
    S.resetView();
    window.addEventListener('resize', onResize);
  };

  function setupLights(scene) {
    scene.add(new T.AmbientLight(0x5b6b94, 0.62));
    scene.add(new T.HemisphereLight(0x8298c8, 0x141a2a, 0.55));

    var moon = new T.DirectionalLight(0x9fb6e0, 0.72);
    moon.position.set(-11, 17, 9);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    moon.shadow.camera.left = -19; moon.shadow.camera.right = 19;
    moon.shadow.camera.top = 19; moon.shadow.camera.bottom = -19;
    moon.shadow.camera.near = 1; moon.shadow.camera.far = 48;
    moon.shadow.bias = -0.0008;
    scene.add(moon);
    scene.add(moon.target);

    var signGlow = new T.PointLight(0x86ddd0, 0.40, 6, 2);
    signGlow.position.set(-1.5, 4.15, -1.2);
    scene.add(signGlow);

    var vmLight = new T.PointLight(0xff84a8, 0.55, 6, 2);
    vmLight.position.set(3.4, 1.5, -0.6);
    scene.add(vmLight);

    var streetLamp = new T.PointLight(0xb7d8ff, 0.9, 11, 2);
    streetLamp.position.set(6.4, 5.0, 1.4);
    scene.add(streetLamp);
  }

  function onResize() {
    S.camera.aspect = window.innerWidth / window.innerHeight;
    S.camera.updateProjectionMatrix();
    var pixelRatio = S.renderPixelRatio(S.quality);
    if(S.renderer.getPixelRatio()!==pixelRatio) S.renderer.setPixelRatio(pixelRatio);
    S.renderer.setSize(window.innerWidth, window.innerHeight);
    var portrait = window.innerWidth < window.innerHeight;
    if (portrait !== S.portrait) S.setView(S.view);
  }

  /* ---------- orbit control: drag = rotate, wheel = zoom, right-drag = pan ---------- */
  S.renderPixelRatio = function(quality) {
    if(quality==='low') return 1;
    var native = window.devicePixelRatio || 1;
    if(profileDpr>=1 && profileDpr<=2) return Math.min(native, profileDpr);
    if(S.mobileGraphics && !S.legacyTuning) {
      var pixels = window.innerWidth * window.innerHeight;
      return Math.min(native, 1.6, Math.max(1,Math.sqrt(1050000/pixels)));
    }
    return Math.min(native,2);
  };
  S.setQuality = function (quality) {
    S.quality = quality;
    var pixelRatio = S.renderPixelRatio(quality);
    if(S.renderer.getPixelRatio()!==pixelRatio) S.renderer.setPixelRatio(pixelRatio);
    var shadows = quality !== 'low';
    if(!S.legacyTuning && S.renderer.shadowMap.enabled===shadows) return;
    S.renderer.shadowMap.enabled = shadows;
    var materials=new Set();
    S.scene.traverse(function(o){if(o.material) materials.add(o.material);});
    materials.forEach(function(material){material.needsUpdate=true;});
  };
  var views = {
    entrance: { eye: [1.4, 2.4, 3.5], target: [-1.3, 1.55, -1.42],
      portraitEye: [.65, 1.98, 4.8], portraitTarget: [-1.25, 1.52, -2.8], fov: 56 },
    interior: { eye: [-.8,1.65,-2.25], target: [-1.28,1.4,-6.5], portraitEye: [-.8,1.65,-2.25], portraitTarget: [-1.28,1.4,-6.5], fov: 66 },
    aisle: { eye: [-1.35,1.46,-3.10], target: [.05,.85,-4.83], portraitEye: [-1.38,1.46,-3.33], portraitTarget: [.02,.93,-4.78], fov: 58 },
    bento: { eye: [1.24,1.54,-6.48], target: [1.63,1.11,-7.96], portraitEye: [1.18,1.55,-6.39], portraitTarget: [1.64,1.13,-7.95], fov: 57 },
    checkout: { eye: [-2.74,1.55,-2.83], target: [-4.44,1.16,-3.61], portraitEye: [-2.61,1.57,-2.70], portraitTarget: [-4.40,1.18,-3.43], fov: 64 },
    'cooler-art': {eye:[-.85,1.67,-5.87],target:[-.44,1.31,-7.94],
      portraitEye:[-1.19,1.64,-4.35],portraitTarget:[-.48,1.23,-7.88],fov:72},
    drinks: { eye: [-.8,1.65,-6.7], target: [-1.6,1.25,-8.1], fov: 74 },
    diner: { eye: [-9.1, 2.6, .35], target: [-11.8, 1.35, -4.45] },
    stop: { eye: [13.4, 2.64, 3.8], target: [11.05, 1.25, 6.65] }
  };
  S.isStoreView = function(view) {
    return view === 'cooler-art' || view === 'aisle' || view === 'interior' || view === 'bento' || view === 'checkout' || view === 'drinks';
  };

  S.setView = function (name) {
    if(S.returnProduct) S.returnProduct();
    if(S.resetWalkInput) S.resetWalkInput();
    S.view = views[name] ? name : 'overview';
    S.portrait = window.innerWidth < window.innerHeight;
    var view = views[S.view];
    if (view) {
      S.camera.position.fromArray(S.portrait && view.portraitEye || view.eye);
      S.camera.fov = S.portrait ? (S.isStoreView(S.view) ? 68 : 76) : (view.fov || 48);
      S.camera.lookAt(new T.Vector3().fromArray(S.portrait && view.portraitTarget || view.target));
    } else {
      C.theta = C.tTheta = .55;
      C.phi = C.tPhi = 1.02;
      C.radius = C.tRadius = S.portrait ? 112 : 43;
      C.target.set(0, 1, -.5);
      C.tTarget.copy(C.target);
      S.camera.fov = 38;
      updateCamera(1);
    }
    S.camera.updateProjectionMatrix();
    S.scene.fog.density = view ? .0115 : S.scene.fog.density;
    if (S.refreshAudio) S.refreshAudio();
  };
  S.resetView = function () { S.setView('overview'); };
  var C = {
    theta: 0.70, phi: 1.13, radius: 27.5,
    tTheta: 0.70, tPhi: 1.13, tRadius: 27.5,
    target: new T.Vector3(0, 1.15, -0.5),
    tTarget: new T.Vector3(0, 1.15, -0.5)
  };
  S.ctrl = C;

  function setupControls(canvas) {
    var pointers = {}, dragMode = 0, lastX = 0, lastY = 0, lastPinch = 0;
    var angles=new T.Euler(0,0,0,'YXZ'), start=null;
    function turn(x,y){
      angles.setFromQuaternion(S.camera.quaternion,'YXZ');
      angles.y-=x*.004;
      angles.x=clamp(angles.x-y*.004,-1.19,1.12);
      angles.z=0;
      S.camera.quaternion.setFromEuler(angles);
    }
    document.addEventListener('mousemove',function(e){
      if(document.pointerLockElement===canvas && S.isStoreView(S.view)) turn(e.movementX,e.movementY);
    });

    canvas.addEventListener('pointerdown', function (e) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      start=Object.keys(pointers).length===1 ? {id:e.pointerId,x:e.clientX,y:e.clientY} : null;
      canvas.setPointerCapture(e.pointerId);
      lastX = e.clientX; lastY = e.clientY;
      dragMode = (e.button === 2 || e.shiftKey) ? 2 : 1;
      if (Object.keys(pointers).length === 2) {
        var p = Object.keys(pointers).map(function (k) { return pointers[k]; });
        lastPinch = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      }
      document.body.classList.add('dragging');
    });

    canvas.addEventListener('pointermove', function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId].x = e.clientX; pointers[e.pointerId].y = e.clientY;
      if (S.view !== 'overview') {
        if(start && Math.hypot(e.clientX-start.x,e.clientY-start.y)>7) start.dragged=true;
        if(Object.keys(pointers).length===1 && document.pointerLockElement!==canvas &&
            (e.pointerType!=='touch' || !S.isStoreView(S.view) || e.clientX>innerWidth*.42)) {
          turn(e.clientX-lastX,e.clientY-lastY);
        }
        lastX=e.clientX; lastY=e.clientY;
        return;
      }
      var keys = Object.keys(pointers);
      if (keys.length === 2) {
        var p = keys.map(function (k) { return pointers[k]; });
        var d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        if (lastPinch > 0) C.tRadius = clamp(C.tRadius * (lastPinch / d), 12, 140);
        lastPinch = d;
        return;
      }
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      if (dragMode === 2) {
        var right = new T.Vector3().setFromMatrixColumn(S.camera.matrix, 0);
        var up = new T.Vector3().setFromMatrixColumn(S.camera.matrix, 1);
        var k = C.tRadius * 0.0013;
        C.tTarget.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
        C.tTarget.x = clamp(C.tTarget.x, -9, 9);
        C.tTarget.y = clamp(C.tTarget.y, -1, 8);
        C.tTarget.z = clamp(C.tTarget.z, -9, 9);
      } else {
        C.tTheta -= dx * 0.0052;
        C.tPhi = clamp(C.tPhi - dy * 0.0045, 0.20, 1.46);
      }
    });

    function release(e) {
      if(start && start.id===e.pointerId && !start.dragged && e.type==='pointerup' && e.button===0 &&
          S.isStoreView(S.view) && S.inspectProduct){
        var rect=canvas.getBoundingClientRect();
        var locked=document.pointerLockElement===canvas;
        S.inspectProduct(locked?0:(e.clientX-rect.left)/rect.width*2-1,locked?0:1-(e.clientY-rect.top)/rect.height*2);
      }
      start=null;
      delete pointers[e.pointerId];
      if (Object.keys(pointers).length < 2) lastPinch = 0;
      var remaining = Object.keys(pointers);
      if (remaining.length === 1) { lastX = pointers[remaining[0]].x; lastY = pointers[remaining[0]].y; }
      if (Object.keys(pointers).length === 0) document.body.classList.remove('dragging');
    }
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('lostpointercapture', release);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (S.view !== 'overview') { S.walkStep(0,Math.sign(e.deltaY)*.22); return; }
      C.tRadius = clamp(C.tRadius * (1 + Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY) * 0.0012, 0.16)), 12, 140);
    }, { passive: false });
  }

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  S.clamp = clamp;

  function updateCamera(damp) {
    C.theta += (C.tTheta - C.theta) * damp;
    C.phi += (C.tPhi - C.phi) * damp;
    C.radius += (C.tRadius - C.radius) * damp;
    C.target.lerp(C.tTarget, damp);
    var sp = Math.sin(C.phi), cp = Math.cos(C.phi);
    S.camera.position.set(
      C.target.x + C.radius * sp * Math.sin(C.theta),
      C.target.y + C.radius * cp,
      C.target.z + C.radius * sp * Math.cos(C.theta)
    );
    S.camera.lookAt(C.target);
    // Preserve the night contrast when portrait framing requires a distant camera.
    S.scene.fog.density = .0115 * Math.min(1, 43 / C.radius);
  }
  S.updateCamera = function(dt) {
    if(S.view === 'overview') updateCamera(1-Math.pow(.001,dt));
    else S.updateWalk(dt);
  };

  /* ---------- material factories ---------- */
  S.toon = function (color, o) {
    return new T.MeshToonMaterial(Object.assign({ color: color, gradientMap: S.gradientMap }, o || {}));
  };
  S.basic = function (color, o) {
    return new T.MeshBasicMaterial(Object.assign({ color: color }, o || {}));
  };
  S.phong = function (color, o) {
    return new T.MeshPhongMaterial(Object.assign({ color: color, shininess: 90 }, o || {}));
  };
  S.glass = function (color, opacity) {
    return new T.MeshPhongMaterial({
      color: color === undefined ? 0xc3e2ff : color,
      transparent: true, opacity: opacity === undefined ? 0.14 : opacity,
      shininess: 120, specular: 0xdff2ff, side: T.DoubleSide, depthWrite: false
    });
  };
  S.texMat = function (tex, o) {
    return new T.MeshBasicMaterial(Object.assign({ map: tex, transparent: true, side: T.DoubleSide }, o || {}));
  };

  /* ---------- geometry helpers ---------- */
  S.group = function (parent) {
    var g = new T.Group();
    (parent || S.world).add(g);
    return g;
  };

  S.edges = function (mesh, color, opacity, threshold) {
    var eg = new T.EdgesGeometry(mesh.geometry, threshold === undefined ? 24 : threshold);
    var line = new T.LineSegments(eg, new T.LineBasicMaterial({
      color: color === undefined ? 0x111a2e : color,
      transparent: true, opacity: opacity === undefined ? 0.5 : opacity, depthWrite: false
    }));
    mesh.add(line);
    return line;
  };

  function finish(m, x, y, z, o) {
    m.position.set(x, y, z);
    if (o.ry) m.rotation.y = o.ry;
    if (o.rx) m.rotation.x = o.rx;
    if (o.rz) m.rotation.z = o.rz;
    if (o.scale) m.scale.set(o.scale[0], o.scale[1], o.scale[2]);
    m.castShadow = !!o.cast;
    m.receiveShadow = o.receive !== false;
    (o.parent || S.world).add(m);
    if (o.outline) S.edges(m, o.outlineColor, o.outlineOpacity, o.threshold);
    return m;
  }
  S.finish = finish;

  // Static primitives are immutable; repeated fasteners, rails and tile details share buffers.
  var primitives=Object.create(null);
  function primitive(Ctor,params){
    var key=Ctor.prototype.constructor.name+':'+params.join(',');
    return primitives[key] || (primitives[key]=new Ctor(...params));
  }
  S.box = function (w, h, d, mat, x, y, z, o) {
    return finish(new T.Mesh(primitive(T.BoxGeometry,[w,h,d]), mat), x, y, z, o || {});
  };
  S.plane = function (w, h, mat, x, y, z, o) {
    return finish(new T.Mesh(primitive(T.PlaneGeometry,[w,h]), mat), x, y, z, o || {});
  };
  S.cyl = function (rt, rb, h, seg, mat, x, y, z, o) {
    return finish(new T.Mesh(primitive(T.CylinderGeometry,[rt,rb,h,seg]), mat), x, y, z, o || {});
  };
  S.sphere = function (r, mat, x, y, z, o) {
    return finish(new T.Mesh(primitive(T.SphereGeometry,[r,12,8]), mat), x, y, z, o || {});
  };
  S.torus = function (r, tube, mat, x, y, z, o) {
    return finish(new T.Mesh(primitive(T.TorusGeometry,[r,tube,6,20]), mat), x, y, z, o || {});
  };

  S.line = function (points, color, opacity, parent) {
    var g = new T.BufferGeometry().setFromPoints(points.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); }));
    var m = new T.LineBasicMaterial({ color: color, transparent: true, opacity: opacity === undefined ? 0.7 : opacity });
    var l = new T.Line(g, m);
    (parent || S.world).add(l);
    return l;
  };

  S.tube = function (points, radius, mat, parent) {
    var curve = new T.CatmullRomCurve3(points.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); }));
    var m = new T.Mesh(new T.TubeGeometry(curve, Math.max(12, points.length * 6), radius, 5, false), mat);
    (parent || S.world).add(m);
    return m;
  };

  /* ---------- soft additive glow (fake bloom, very anime) ---------- */
  var glowTex = null;
  function getGlowTex() {
    if (glowTex) return glowTex;
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.18, 'rgba(255,255,255,.66)');
    g.addColorStop(0.45, 'rgba(255,255,255,.20)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    glowTex = new T.CanvasTexture(c);
    return glowTex;
  }
  S.glow = function (x, y, z, color, size, opacity, parent) {
    var m = new T.SpriteMaterial({
      map: getGlowTex(), color: color, transparent: true,
      opacity: opacity === undefined ? 0.55 : opacity,
      blending: T.AdditiveBlending, depthWrite: false, depthTest: true, fog: false
    });
    var s = new T.Sprite(m);
    s.position.set(x, y, z);
    s.scale.set(size, size, 1);
    (parent || S.world).add(s);
    return s;
  };

  /* ---------- constants: shop footprint ---------- */
  S.SHOP = { x0: -6.2, x1: 2.8, z0: -8.6, z1: -1.6, h: 4.3, floor: 0.10 };
})(window.S);

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

/* Shared world bounds, shelter footprints and pedestrian destinations. */
(function (S) {
  S.layout = {
    bounds: { minX: -14, maxX: 14, minZ: -13, maxZ: 13 },
    shelters: [
      { x0: -6.3, x1: 2.95, z0: -8.7, z1: -1.55, height: 4.35 },
      { x0: -6.3, x1: 3, z0: -1.55, z1: -0.65, height: 3.25 },
      { x0: 2.8, x1: 3.85, z0: -9, z1: -1.1, height: 3.285 },
      { x0: 5.5, x1: 9.5, z0: -9.5, z1: -5.4, height: 4.7 }
    ]
  };
  S.layout.entrance = { x: -.8, threshold: -1.55, sensorFront: -.35, sensorBack: -2.15 };
  S.layout.umbrellaStandX = -3.92;
  S.layout.busStop = { curbX: 11.5, waitX: 12.3, boardingZ: 6.1, laneX: 10.26 };
  // Coordinates of the fixtures and their collision footprints in the existing shell.
  var fixtures = {
    stockroom: {bounds:[-6.1,-4.01,-8.5,-6.5]},
    checkout:  {x:-4.45,z:-3.42,turn:Math.PI/2,bounds:[-4.87,-4.03,-4.76,-2.08]},
    oden:      {x:-4.45,z:-5.42,turn:Math.PI/2,bounds:[-4.84,-4.06,-6.05,-4.79]},
    shelfLeft: {x:-2.54,z:-4.64,depth:.5,bounds:[-3.02,-2.06,-5.70,-3.58]},
    shelfRight:{x:.12,z:-4.64,depth:.5,bounds:[-.36,.60,-5.70,-3.58]},
    drinks:    {x:-1.60,z:-8.22,width:.8,bounds:[-3.74,.54,-8.55,-7.88]},
    bento:     {x:1.65,z:-7.95,width:1.4,depth:.5,bounds:[.845,2.455,-8.45,-7.45]},
    freezer:   {x:2.15,z:-5.85,turn:Math.PI/2,bounds:[1.69,2.61,-6.65,-5.05]},
    magazines: {x:2.45,z:-4.10,turn:Math.PI,height:.64,bounds:[2.18,2.72,-4.95,-3.25]},
    coffee:    {x:-2.64,z:-2.01,turn:Math.PI,bounds:[-3.10,-2.18,-2.33,-1.69]},
    baskets:   {bounds:[.64,1,-2.17,-1.91]}
  };
  var checkout = fixtures.checkout;
  var staff = [checkout.x-.70,checkout.z];
  S.layout.interior = {
    fixtures: fixtures,
    aisleX: (fixtures.shelfLeft.bounds[1]+fixtures.shelfRight.bounds[0])/2,
    rearZ: -6.98,
    pickup: [fixtures.bento.x,-6.98],
    scanner: [checkout.x+.23,1.14,checkout.z+.21],
    bagging: [checkout.x+.07,1.25,checkout.z-.13],
    pay: [-3.53,checkout.z+.21],
    queueX: -3.53,
    stockShelf: [-5.56,.76,-6.97],
    clerk: staff,
    restock: [staff,[-5.15,-6.95],[-5.15,-6.24],[-3.60,-6.24],[-3.60,-6.98],[1.55,-6.98]]
  };
  S.walkObstacles = Object.keys(fixtures).map(function(name){return fixtures[name].bounds;});
  // Point-to-rectangle clearance avoids snagging at shelf corners.
  S.fixtureBlocks = function(x,z,radius,staffAccess) {
    return Object.keys(fixtures).some(function(name){
      if(staffAccess && name==='stockroom') return false;
      var b=fixtures[name].bounds;
      return Math.hypot(Math.max(b[0]-x,0,x-b[1]),Math.max(b[2]-z,0,z-b[3]))<radius;
    });
  };
  S.rainIntensity = 1;
  S.people = [];
  S.doorDemand = false;
  S.traffic = { pedestrianGreen: false, canEnter: false, vehicleLight: 0 };
  S.updateTraffic = function (t) {
    var phase = t % 24;
    S.traffic.vehicleLight = phase < 10 ? 2 : (phase < 12 ? 1 : 0);
    S.traffic.canEnter = phase >= 13 && phase < 17;
    S.traffic.pedestrianGreen = phase >= 13 && phase < 22;
  };
  S.groundHeight = function (x, z) {
    if (x > S.SHOP.x0 && x < S.SHOP.x1 && z > S.SHOP.z0 && z < S.SHOP.z1) return .10;
    if (z > 1.35 && z < 2.95) {
      if (x >= 3.4 && x <= 4.7) return .06 * (4.7 - x) / 1.3;
      if (x >= 10.6 && x <= 11.5) return .085 * (x - 10.6) / .9;
    }
    if (x >= 11.5 || z >= 10.75) return .085;
    if (x < -10 || (x < 4.4 && z < .75)) return .06;
    return .008;
  };
  S.shelterRainFloor = function (x,z) {
    var floor = 0.04;
    for (var i=0; i<S.layout.shelters.length; i++){
      var s=S.layout.shelters[i];
      if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1) floor = Math.max(floor, s.height);
    }
    return floor;
  };
  S.rainFloor = function (x,z,base) {
    var floor = base===undefined ? S.shelterRainFloor(x,z) : base;
    for(var i=0; i<S.people.length; i++){
      var p=S.people[i];
      if(!(p.folding>.8)) continue;
      var dx=x-p.group.position.x, dz=z-p.group.position.z;
      if(Math.abs(dx)>=.90 || Math.abs(dz)>=.90) continue;
      dx-=.25*Math.cos(p.group.rotation.y);
      dz+=.25*Math.sin(p.group.rotation.y);
      if(dx*dx+dz*dz<.65*.65) floor=Math.max(floor,p.group.position.y+2.2);
    }
    return floor;
  };
})(window.S);

/* Shared shop collision and frame-rate independent first-person movement. */
(function(S){
  var direction=new THREE.Vector3();
  var held=Object.create(null);
  var radius=.18, speed=1.55;
  var moveKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];

  S.isWalkPosition = function(x,z) {
    var shop=S.SHOP, entry=S.layout.entrance;
    if(x<shop.x0+radius || x>shop.x1-radius || z<shop.z0+radius || z>-.76) return false;
    if(z>shop.z1-radius){
      if(Math.abs(x-entry.x)>.42) return false;
      if(z<shop.z1+.19 && (!S.door || S.door.open<.88)) return false;
    }
    if(S.fixtureBlocks(x,z,radius,false)) return false;
    return !S.coldDoors || !S.coldDoors.some(function(door){
      return Math.abs(door.angle)>.05 && S.coldDoorBlocks(door,x,z);
    });
  };
  S.cameraAtDoor=function(){
    if(!S.isStoreView(S.view) || !S.camera) return false;
    var p=S.camera.position, entry=S.layout.entrance;
    return Math.abs(p.x-entry.x)<.65 && p.z>entry.sensorBack-.25 && p.z<entry.sensorFront;
  };

  S.walkStep=function(side,back){
    if(!S.isStoreView(S.view) || (!side&&!back)) return;
    S.camera.getWorldDirection(direction);
    direction.y=0; direction.normalize();
    var dx=-direction.x*back-direction.z*side, dz=-direction.z*back+direction.x*side;
    var position=S.camera.position;
    // Substep wheel and keyboard movements, including the door threshold.
    var steps=Math.ceil(Math.hypot(dx,dz)/.075);
    for(var i=0;i<steps;i++){
      var x=position.x+dx/steps, z=position.z+dz/steps;
      if(S.isWalkPosition(x,position.z)) position.x=x;
      if(S.isWalkPosition(position.x,z)) position.z=z;
    }
    position.y=S.groundHeight(position.x,position.z)+1.6;
  };

  window.addEventListener('keydown',function(e){
    if(!S.isStoreView(S.view) || /INPUT|SELECT|BUTTON/.test(e.target.tagName) || moveKeys.indexOf(e.code)<0) return;
    held[e.code]=true;
    e.preventDefault();
  });
  window.addEventListener('keyup',function(e){delete held[e.code];});
  S.walkInput={side:0,back:0};
  S.resetWalkInput=function(){
    held=Object.create(null);
    S.walkInput.side=S.walkInput.back=0;
    if(S.resetJoystick) S.resetJoystick();
  };
  window.addEventListener('blur',S.resetWalkInput);
  S.updateWalk=function(dt){
    var side=(held.KeyD||held.ArrowRight?1:0)-(held.KeyA||held.ArrowLeft?1:0)+S.walkInput.side;
    var back=(held.KeyS||held.ArrowDown?1:0)-(held.KeyW||held.ArrowUp?1:0)+S.walkInput.back;
    var norm=Math.max(1,Math.hypot(side,back));
    var position=S.camera.position, oldX=position.x, oldZ=position.z;
    S.walkStep(side*dt*speed/norm,back*dt*speed/norm);
    if((oldZ<S.SHOP.z1)!==(position.z<S.SHOP.z1) && S.refreshAudio) S.refreshAudio();
    if(Math.hypot(position.x-oldX,position.z-oldZ)>.001 && S.walkAmbience) S.walkAmbience(dt);
  };
})(window.S);

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
    var frame = S.toon(0x33465d);
    var frameHi = S.toon(0x6d809a);
    var roofMat = S.toon(0x465a70);
    var awning = S.toon(0x3b5064);
    var dark = S.toon(0x1d2a3c);
    var teal = S.toon(0x114b4c);
    var steel = S.toon(0x9aa9b6);
    var warmLight = S.basic(0xffdca2);
    var neonGreen = S.basic(0x76f5d2);

    var floorMap = S.tex.shopFloor();
    /* ---------- interior floor / ceiling / solid walls ---------- */
    S.plane(W, D, S.shopMaterial(0xdad7ca, { map: floorMap, emissiveMap: floorMap, emissiveIntensity: .13 }), cx, S.SHOP.floor, cz, { rx: -Math.PI / 2 });
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
    S.box(0.045, 2.95, 0.045, neonGreen, x1 + 0.145, 1.62, z1 + 0.145, {});
    S.glow(x1 + 0.16, 2.2, z1 + 0.16, 0x54e8c4, 1.5, .30);

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
    // A little store light reflected on the wet sidewalk just beyond the mat.
    var doorwayReflection = S.basic(0xffffff,{
      map:S.tex.reflection('#e3f1e0'), transparent:true, opacity:.25,
      blending:T.AdditiveBlending, depthWrite:false
    });
    S.groundPlane(2.5,1.22,doorwayReflection,-.8,.073,-.42);
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

    /* ---------- main illuminated signage (L shape) ---------- */
    var signMatFront = S.basic(0xffffff, { map: S.tex.brandWide() });
    var signMatRight = S.basic(0xffffff, { map: S.tex.brandShort() });
    S.signMaterials.push(signMatFront, signMatRight);
    S.box(W + 0.75, 0.80, 0.14, teal, cx, 3.94, z1 + 0.08, { cast: true, outline: true, outlineOpacity: .5 });
    S.box(0.14, 0.80, D + 0.62, teal, x1 + 0.08, 3.94, cz, { cast: true, outline: true, outlineOpacity: .5 });
    S.plane(W + 0.62, 0.72, signMatFront, cx, 3.94, z1 + 0.16, {});
    S.plane(D + 0.48, 0.72, signMatRight, x1 + 0.16, 3.94, cz, { ry: Math.PI / 2 });
    /* crisp neon rails above and below */
    S.box(W + 0.75, 0.035, 0.05, neonGreen, cx, 4.35, z1 + 0.16, {});
    S.box(W + 0.75, 0.035, 0.05, neonGreen, cx, 3.53, z1 + 0.16, {});
    S.box(0.05, 0.035, D + 0.62, neonGreen, x1 + 0.16, 4.35, cz, {});
    S.box(0.05, 0.035, D + 0.62, neonGreen, x1 + 0.16, 3.53, cz, {});
    for (var sg = 0; sg < 5; sg++) S.glow(-5.6 + sg * 2.2, 3.95, z1 + 0.25, 0x58eac8, 1.75, .12);
    for (var sg2 = 0; sg2 < 3; sg2++) S.glow(x1 + 0.28, 3.95, -7.4 + sg2 * 2.5, 0x58eac8, 1.65, .11);

    /* hanging vertical neon sign at the corner */
    var vSign = S.basic(0xffffff, { map: S.tex.neonVertical('おでん', 'コーヒー', '#6a2f58') });
    S.signMaterials.push(vSign);
    S.box(0.72, 2.02, 0.10, S.toon(0x4a2545), 3.62, 2.44, -1.06, { outline: true, outlineOpacity: .5 });
    S.plane(0.64, 1.92, vSign, 3.62, 2.44, -1.00, {});
    S.box(0.05, 1.92, 0.05, S.basic(0xff9ad4), 3.29, 2.44, -0.99, {});
    S.box(0.05, 1.92, 0.05, S.basic(0xff9ad4), 3.95, 2.44, -0.99, {});
    S.glow(3.62, 2.44, -0.92, 0xff77c8, 2.8, .26);
    S.box(0.05, 0.55, 0.05, frameHi, 3.62, 3.72, -1.06, {});

    /* ---------- pylon sign on the left of the forecourt ---------- */
    S.box(1.25, 0.16, 0.85, dark, -8.75, 0.14, -0.55, { outline: true, outlineOpacity: .4 });
    S.box(0.24, 3.5, 0.24, S.toon(0x4b5c70), -8.75, 1.9, -0.55, {});
    var py = S.basic(0xffffff, { map: S.tex.neonVertical('コンビニ', '24H 営業中', '#165a5c') });
    S.signMaterials.push(py);
    S.box(1.05, 2.55, 0.12, teal, -8.75, 3.05, -0.55, { outline: true, outlineOpacity: .5 });
    S.plane(0.96, 2.44, py, -8.75, 3.05, -0.48, {});
    S.box(1.05, 0.06, 0.08, neonGreen, -8.75, 4.36, -0.48, {});
    S.glow(-8.75, 3.1, -0.4, 0x5ce6c6, 3.2, .22);

    /* ---------- entrance mat + small forecourt details ---------- */
    S.plane(2.95, 1.10, S.basic(0xffffff, { map: S.tex.mat(), transparent: true }), -0.8, 0.075, -1.02, { rx: -Math.PI / 2 });
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

/* Original packaging, reusable product meshes and one instance batch per SKU. */
(function(S){
  var T=THREE;
  var rows=[
    ['water','天然水','矿泉水','bottle',.105,.29,.105,0x7caec1,118],
    ['tea','深蒸し茶','绿茶饮料','tea',.117,.27,.117,0x709849,148],
    ['soda','ソーダ','汽水','soda',.125,.30,.125,0x6f99bd,158],
    ['can','レモン','罐装饮料','can',.105,.17,.105,0xe3bb50,138],
    ['coffee','珈琲','瓶装咖啡','short',.112,.18,.112,0xa87b57,168],
    ['milk','牛乳','牛奶盒','carton',.12,.24,.092,0x7d9ab9,198],
    ['juice','りんご','果汁盒','juice',.10,.16,.075,0xc98a53,128],
    ['chips','うすしお','袋装薯片','bag',.17,.23,.075,0xd99349,178],
    ['crackers','おかき','米果','widebag',.18,.16,.09,0x99a66a,148],
    ['candy','フルーツ','水果糖','pouch',.115,.16,.063,0xb66d88,138],
    ['biscuits','ビスケット','饼干盒','box',.155,.145,.09,0xb87956,188],
    ['cup','醤油ラーメン','杯面','cup',.155,.148,.155,0xcb7656,248],
    ['bowl','うどん','碗面','bowl',.185,.105,.185,0x9b8e57,258],
    ['noodles','焼そば','袋装速食','flat',.191,.136,.035,0xa45845,168],
    ['onigiri','鮭おにぎり','三角饭团','triangle',.15,.16,.073,0x749761,178],
    ['sandwich','たまごサンド','三明治','sandwich',.172,.146,.096,0xc69750,288],
    ['bento','鮭弁当','便当','tray',.245,.065,.17,0xd3965c,540],
    ['bread','ミルクパン','袋装面包','bread',.178,.106,.111,0xd0a873,158],
    ['tissue','ティッシュ','抽纸盒','tissue',.21,.105,.116,0x769d8b,248],
    ['paper','ペーパー','纸巾卷','roll',.13,.135,.13,0x6ea0a7,208],
    ['soap','ハンドソープ','洗手液','pump',.108,.228,.082,0x8fa3ab,398],
    ['care','歯みがき','牙膏盒','slim',.084,.215,.061,0x61918c,238],
    ['gum','ミント','薄荷口香糖','gum',.084,.093,.042,0x6aa188,128],
    ['paperCup','ホット珈琲','咖啡纸杯','paperCup',.12,.149,.12,0xb38862,118]
  ];
  var catalog={}, batches={}, atlas, material, matte;
  S.products=catalog;
  S.productBatches=batches;
  rows.forEach(function(row,index){
    var [id,title,type,shape,w,h,d,color,price]=row;
    catalog[id]={id:id,title:title,type:type,shape:shape,w:w,h:h,d:d,color:color,price:price,index:index,positions:[]};
  });

  function art(){
    atlas=S.makeTex(2048,1024,function(ctx,w,h){
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h);
      rows.forEach(function(row,index){
        var item=catalog[row[0]];
        var x=index%6*256, y=Math.floor(index/6)*204;
        ctx.fillStyle='#eae5d4'; ctx.fillRect(x+4,y+4,248,193);
        ctx.fillStyle='#'+item.color.toString(16).padStart(6,'0');
        ctx.fillRect(x+10,y+10,236,65);
        ctx.fillRect(x+10,y+152,236,40);
        ctx.fillStyle='#ffffea';
        ctx.font='700 20px system-ui'; ctx.fillText('夜町  ·  YOMACHI',x+18,y+47);
        ctx.fillStyle='#253532'; ctx.font='700 30px '+S.FONT;
        ctx.fillText(item.title,x+18,y+115,220);
        ctx.lineWidth=3; ctx.strokeStyle='#46554e';
        ctx.beginPath();ctx.moveTo(x+19,y+128);ctx.lineTo(x+232,y+128);ctx.stroke();
        ctx.fillStyle='#24322c';ctx.font='600 20px system-ui';
        ctx.fillText(['DAILY SELECT','FRESH STOCK','CORNER MARKET'][index%3],x+18,y+178);
      });
    });
    material=S.shopMaterial(0xffffff,{map:atlas,vertexColors:true,emissive:0x69645a,emissiveIntensity:.055,shininess:22});
    matte=S.shopMaterial(0xffffff,{map:atlas,vertexColors:true,emissive:0x69645a,emissiveIntensity:.055,shininess:5,specular:0x121212});
  }

  function geometry(item){
    if(item.geometry) return item.geometry;
    if(!atlas) art();
    var {w,h,d,shape,color,index}=item;
    var pos=[], norm=[], uv=[], colors=[];
    function add(g,y,tint,label,x,z){
      g.translate(x||0,y,z||0);
      var flat=g.index?g.toNonIndexed():g;
      var a=flat.attributes, shade=new T.Color(tint);
      var lx=index%6*256, ly=Math.floor(index/6)*204;
      for(var i=0;i<a.position.count;i++){
        pos.push(a.position.getX(i),a.position.getY(i),a.position.getZ(i));
        norm.push(a.normal.getX(i),a.normal.getY(i),a.normal.getZ(i));
        uv.push(label?(lx+9+a.uv.getX(i)*238)/2048: .998,
          label?1-(ly+191-a.uv.getY(i)*181)/1024:.008);
        colors.push(shade.r,shade.g,shade.b);
      }
      if(flat!==g) flat.dispose();
      g.dispose();
    }
    function box(wd,ht,dp,y,t,x,z){ add(new T.BoxGeometry(wd,ht,dp),y,t,false,x,z); }
    function cylinder(top,bottom,ht,y,t){ add(new T.CylinderGeometry(top,bottom,ht,12),y,t); }
    function triangle(wd,ht,depth,t){
      var form=new T.Shape();
      form.moveTo(-wd/2,0);form.lineTo(wd/2,0);form.lineTo(0,ht);form.lineTo(-wd/2,0);
      var prism=new T.ExtrudeGeometry(form,{depth:depth,bevelEnabled:false});
      add(prism,0,t,false,0,-depth/2);
    }

    switch(shape){
      case 'bottle': case 'tea': case 'soda': case 'short': {
        var shoulder=shape==='tea'?.66:shape==='soda'?.74:.79;
        var profile=[[0,0],[.43,.015],[.50,.09],[shape==='soda'?.37:.50,.40],[.50,.58],[.46,shoulder],[.22,.87],[.21,.95],[0,.95]];
        add(new T.LatheGeometry(profile.map(p=>new T.Vector2(p[0]*w,p[1]*h)),14),0,color);
        cylinder(w*.23,w*.245,h*.10,h*.95,shape==='water'?0xf5f2de:color);
        break;
      }
      case 'can': case 'roll':
        cylinder(w*.48,w*.48,h*.94,h*.49,color);
        cylinder(w*.51,w*.48,.006,h-.006,0xc3c7bb);
        if(shape==='can') box(.024,.004,.017,h-.001,0x726f61);
        break;
      case 'cup': case 'bowl': case 'paperCup':
        cylinder(w*.48,w*(shape==='bowl'?.33:.31),h*.94,h*.47,color);
        cylinder(w*.52,w*.48,.012,h-.006,0xe8e2ce);
        break;
      case 'bag': case 'widebag': case 'pouch': case 'flat': case 'bread': {
        var body=new T.BoxGeometry(w,h,d,3,3,2), vertices=body.attributes.position;
        for(var v=0;v<vertices.count;v++){
          var yy=vertices.getY(v)/h, taper=1-Math.abs(yy)*.20;
          vertices.setXYZ(v,vertices.getX(v)*taper,vertices.getY(v),vertices.getZ(v)*(1-Math.abs(yy)*1.34));
        }
        body.computeVertexNormals();
        add(body,h/2,color);
        box(w*.88,.009,d*.35,h-.004,0xe4d5aa);
        box(w*.88,.009,d*.35,.004,color);
        break;
      }
      case 'carton': case 'juice':
        box(w,h*.86,d,h*.43,color);
        box(w*.94,h*.14,d*.67,h*.93,0xe4e5d4);
        if(shape==='juice') box(.014,h*.53,.010,h*.60,0xf1e3cf,w*.35,d*.52);
        break;
      case 'triangle': case 'sandwich':
        triangle(w,h,d,0xece4ca);
        if(shape==='triangle') box(w*.41,h*.42,.008,h*.23,0x405749,0,d/2+.002);
        else {box(w*.52,.018,d+.002,h*.22,0xc8ad55);box(w*.39,.012,d+.003,h*.34,0x77a063);}
        break;
      case 'tray':
        box(w,h*.65,d,h*.32,0x343d38);
        box(w*.93,h*.28,d*.91,h*.80,0xc4b38c);
        box(w*.28,.009,d*.98,h-.004,color);
        break;
      case 'pump':
        box(w,h*.72,d,h*.36,color);
        cylinder(.017,.018,h*.21,h*.82,0xe3dfd0);
        box(w*.62,.013,.031,h-.009,0xf1eddf,w*.13,0);
        break;
      default:
        box(w,h,d,h/2,color);
        if(shape==='tissue'){
          box(.04,.021,d*.41,h+.007,0xf1e9d0);
        }else if(shape==='gum'){
          box(w*.94,.009,d+.005,h-.005,0xe1ecd9);
        }
    }
    var triangular=shape==='triangle'||shape==='sandwich';
    if(shape==='tray'){
      var lid=new T.PlaneGeometry(w*.40,d*.82);
      lid.rotateX(-Math.PI/2);
      add(lid,h+.002,0xffffff,true);
    }else{
      add(new T.PlaneGeometry(w*(triangular?.49:.87),h*(triangular?.27:.43)),h*(triangular?.38:.43),0xffffff,true,0,d*.5+.003);
    }
    var g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    g.computeBoundingSphere();
    item.geometry=g;
    item.material=/bag|flat|pouch|bread|box|slim|carton|tissue/.test(shape)?matte:material;
    return g;
  }

  S.stockProduct=function(id,x,y,z,angle){
    catalog[id].positions.push([x,y,z,angle||0]);
  };
  S.buildProductBatches=function(){
    var transform=new T.Object3D();
    Object.keys(catalog).forEach(function(id){
      var item=catalog[id];
      if(!item.positions.length) return;
      var g=geometry(item);
      var mesh=new T.InstancedMesh(g,item.material,item.positions.length);
      mesh.name='Product: '+item.title;
      item.positions.forEach(function(p,i){
        transform.position.set(p[0],p[1],p[2]);transform.rotation.y=p[3];
        transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;
      mesh.userData.productId=id;
      S.world.add(mesh);
      batches[id]=mesh;
    });
  };
  S.removeStockInstances=function(entries){
    var removed=new Map();
    entries.forEach(function(entry){
      if(!removed.has(entry.id)) removed.set(entry.id,new Set());
      removed.get(entry.id).add(entry.index);
    });
    var matrix=new T.Matrix4();
    removed.forEach(function(indices,id){
      var mesh=batches[id], next=0;
      if(!mesh) return;
      for(var slot=0;slot<mesh.count;slot++){
        if(indices.has(slot)) continue;
        if(next!==slot){
          mesh.getMatrixAt(slot,matrix);
          mesh.setMatrixAt(next,matrix);
        }
        next++;
      }
      mesh.count=next;
      mesh.visible=next>0;
      mesh.instanceMatrix.needsUpdate=true;
    });
  };
})(window.S);

/* ============================================================
   interior.js — warm, fully stocked convenience store interior
   ============================================================ */
(function (S) {
  var T = THREE;

  S.buildInterior = function () {
    var fixtures = {};
    S.coldDoors = [];
    var startIndex = S.world.children.length;
    function section(name) {
      fixtures[name] = S.world.children.slice(startIndex);
      startIndex = S.world.children.length;
    }
    function move(name, oldX, oldZ) {
      var plan=S.layout.interior.fixtures[name];
      var fixture=S.group();
      fixture.name=name;
      fixtures[name].forEach(function(object) {
        fixture.add(object);
        object.position.x-=oldX;
        object.position.z-=oldZ;
      });
      fixture.position.set(plan.x,0,plan.z);
      fixture.rotation.y=plan.turn||0;
      fixture.scale.set(plan.width||1,plan.height||1,plan.depth||1);
      return fixture;
    }
    var f = S.SHOP.floor;
    // Entry mat with a thin rubber border and absorbent fabric center.
    S.box(1.65,.025,.42,S.toon(0x263a3e),-.8,.115,-1.87,{});
    S.box(1.52,.008,.34,S.toon(0x46534f),-.8,.132,-1.87,{});
    // Ceiling services are mounted flush to the ceiling plane.
    [-5.9,-3.3].forEach(function(z) {
      S.box(.65,.035,.65,S.toon(0xbbbdb5),-3.5,3.235,z,{});
      for(var slot=0;slot<6;slot++) S.box(.48,.008,.018,S.toon(0x4d5756),-3.5,3.214,z-.2+slot*.08,{});
    });
    S.cyl(.10,.10,.035,12,S.toon(0xe7e7dd),-.8,3.21,-3.8,{});
    S.sphere(.08,S.toon(0x26343c),2.53,3.12,-1.95,{});

    var cream = S.toon(0xd8cbb7);
    var white = S.toon(0xd4d0c4);
    var wood = S.toon(0xb08a67);
    var metal = S.toon(0xc0b39e);
    var frame = S.toon(0x55697c);
    var shelfMetal=S.shopMaterial(0xbecbc6);
    function tag(name,price){
      return S.basic(0xffffff,{map:S.tex.label(name,price,'#eaece1','#344643')});
    }
    var fixturesPlan=S.layout.interior.fixtures;

    S.buildShopLighting();

    /* ---------- back wall light boxes ---------- */
    S.box(4.3, 0.72, 0.10, frame, -1.7, 2.72, -8.47, {});
    S.plane(4.15, 0.60, S.basic(0xffffff, { map: S.tex.adPanel('冷たい飲料', 'WATER · TEA · SODA', '#e4ece5') }), -1.7, 2.72, -8.40, {});
    S.glow(-1.7, 2.72, -8.32, 0xffe3c4, .6, .06);
    S.box(1.5, 0.55, 0.09, frame, 1.9, 2.62, -8.47, {});
    S.plane(1.4, 0.46, S.basic(0xffffff, { map: S.tex.adPanel('お弁当', 'できたて', '#ffe8b9') }), 1.9, 2.62, -8.40, {});

    /* ---------- refrigerated drink cabinets along the back wall ---------- */
    var beverages=[['can','juice','milk','coffee'],['tea','soda','water','tea']];
    function drinkCabinet(bx,bank) {
      var first=S.world.children.length, originalStock=[], ownHinges=[];
      function stock(id,x,y,z,angle) {
        var index=S.products[id].positions.length;
        S.stockProduct(id,x,y,z,angle);
        originalStock.push({id:id,index:index});
      }
      // A hollow cabinet: rear panel and jambs leave the stock visible.
      S.box(2.35, 2.22, .06, white, bx, 1.22, -8.50, {});
      [-1.14,1.14].forEach(function (dx) {
        S.box(.07,2.22,.62,white,bx+dx,1.22,-8.22,{});
        S.box(.025,1.95,.025,S.basic(0xe5f5ff),bx+dx*.94,1.2,-7.96,{});
      });
      S.box(2.35,.12,.62,frame,bx,.17,-8.22,{});
      S.plane(.34,.10,S.basic(0xffffff,{map:S.tex.label('4°C','','#183c39','#c3e7cc')}),bx+.78,2.37,-7.88,{});
      var litBack=S.shopMaterial(0xbdc6bc,{emissiveIntensity:.14});
      S.box(2.16,1.91,.022,litBack,bx,1.21,-8.46,{});
      var gate=S.shopMaterial(0x869e9c);
      var panel=S.makeTex(256,32,function(ctx,w,h){
        ctx.fillStyle='#343e42';ctx.fillRect(0,0,w,h);
        ctx.fillStyle='#151d20';for(var stripe=4;stripe<w;stripe+=10) ctx.fillRect(stripe,6,6,20);
      });
      S.plane(2.12,.095,S.basic(0xffffff,{map:panel}),bx,.197,-7.894,{});
      for(var row=0;row<4;row++){
        var yy=.31+row*.465;
        S.box(2.12,.035,.50,metal,bx,yy,-8.20,{});
        S.box(2.12,.048,.025,gate,bx,yy+.018,-7.947,{});
        var picks=beverages[bank];
        for(var bay=0;bay<4;bay++){
          var id=picks[(bay+row)%picks.length], product=S.products[id];
          var localX=bx-.84+bay*.55;
          var worldX=fixturesPlan.drinks.x+(localX+3.22)*fixturesPlan.drinks.width;
          S.plane(.26,.048,tag(product.title,'¥'+product.price),localX,yy+.019,-7.932,{});
          [-.11,.105].forEach(function(dx,slot){
            if(!(row===1 && bay===2 && slot===0)){
              stock(id,worldX+dx*.8,yy+.019,-8.08,S.range(-.04,.04));
            }
            if((bay+row+slot)%3===0) stock(id,worldX+dx*.8,yy+.019,-8.29,0);
          });
        }
      }
      /* Hinged doors share the cabinet transform, including collision geometry. */
      [-1,1].forEach(function(side) {
        var hinge = S.group();
        hinge.position.set(bx+side*1.1,0,-7.88);
        S.plane(1.08,1.98,S.glass(0xdff2ff,.12),-side*.54,1.22,0,{parent:hinge});
        S.box(.04,1.98,.05,frame,-side*1.08,1.22,0,{parent:hinge});
        S.box(.035,.42,.05,metal,-side*.98,1.25,.05,{parent:hinge});
        S.coldDoors.push({hinge:hinge,side:side,open:false,angle:0});
        ownHinges.push(hinge);
      });
      S.box(2.35, 0.16, 0.66, frame, bx, 2.36, -8.22, {});
      S.plane(0.72, 0.22, S.basic(0xffffff, { map: S.tex.label(bank===0?'乳製品・珈琲':'水・お茶','冷蔵','#dae8de','#304c4b') }), bx, 2.36, -7.87, {});
      S.glow(bx, 2.15, -7.92, 0xdcefff, 1.2, .07);
      if(bank===1) S.coolerFallback={
        body:S.world.children.slice(first).filter(function(obj){return ownHinges.indexOf(obj)===-1;}),
        doors:ownHinges,stock:originalStock,widthScale:fixturesPlan.drinks.width,
        location:[fixturesPlan.drinks.x+(bx+3.22)*fixturesPlan.drinks.width,0,fixturesPlan.drinks.z]
      };
    }
    section('lighting');
    drinkCabinet(-4.72,0);
    drinkCabinet(-1.72,1);

    section('drinks');
    /* Four shelf faces are stocked by category, with clear price rails. */
    var shelfFaces=[
      [['cup','bowl','noodles'],['soap','care','tissue','paper']],
      [['chips','crackers','biscuits'],['candy','bread','gum']]
    ];
    function shelf(plan,index){
      var x=plan.x,z=plan.z;
      S.box(.055,1.22,2.02,shelfMetal,x,.73,z,{});
      var steel=S.shopMaterial(0x7d9590);
      var feet=S.shopMaterial(0x3e5251);
      var bases=[.24,.575,.91];
      [-.97,.97].forEach(function(edge){
        S.box(.86,.10,.10,feet,x,.15,z+edge,{});
        S.box(.07,1.27,.075,steel,x,.775,z+edge,{});
      });
      S.box(.84,.045,2.10,shelfMetal,x,1.36,z,{});
      bases.forEach(function(y,level){
        S.box(.89,.039,2.10,shelfMetal,x,y,z,{});
        [-1,1].forEach(function(side,face){
          var picks=shelfFaces[index][face];
          var first=picks[(level+face)%picks.length], second=picks[(level+face+1)%picks.length];
          S.box(.026,.064,2.10,steel,x+side*.44,y+.018,z,{});
          [first,second].forEach(function(id,block){
            var item=S.products[id], front=z-.81+block*.98;
            S.plane(.37,.052,tag(item.title,'¥'+item.price),x+side*.455,y+.02,front+.26,{ry:side*Math.PI/2});
            for(var slot=0;slot<4;slot++){
              if(level===1 && (index+block+face)%3===0 && slot===2) continue;
              S.stockProduct(id,x+side*.29,y+.027,front+slot*.205+S.range(-.017,.017),side*Math.PI/2+S.range(-.05,.05));
            }
          });
        });
      });
      // The shallow end cap remains inside the same collision footprint.
      S.box(.66,.044,.30,shelfMetal,x,.62,z+.84,{});
      S.plane(.62,.125,tag(index?'今週のおやつ':'新商品','おすすめ'),x,.81,z+1.052,{});
      S.stockProduct(index?'biscuits':'cup',x-.17,.65,z+.88,0);
      S.stockProduct(index?'candy':'bowl',x+.15,.65,z+.88,.07);
    }
    // Attach these directly in their planned coordinates.
    shelf(fixturesPlan.shelfLeft,0);
    shelf(fixturesPlan.shelfRight,1);
    section('salesShelves');
    /* ---------- bento cold case ---------- */
    S.box(1.15, 0.86, 2.00, white, 1.75, 0.53, -4.15, { outline: true, outlineOpacity: .3 });
    S.box(1.05,.05,1.88,S.toon(0xdddfd5),1.75,.92,-4.15,{});
    S.box(1.08,.07,.48,frame,1.75,1.02,-4.40,{});
    S.box(1.08,.07,.40,frame,1.75,1.23,-4.86,{});
    S.box(1.12,.72,.05,white,1.75,1.26,-5.12,{});
    S.box(1.02,.025,.04,S.basic(0xfff4dd),1.75,1.51,-5.08,{});
    [-1,1].forEach(function(side){
      S.box(.027,.51,.55,S.glass(0xe6f1ed,.14),1.75+side*.55,1.19,-4.78,{});
    });
    var tray = S.phong(0x293537,{shininess:25}), rice = S.toon(0xf5efdc), salmon = S.toon(0xd98d62), greens = S.toon(0x89a66d);
    var lid = S.glass(0xf5ffff,.16), sleeve = S.toon(0xf0e3c7);
    S.makeMeal = function () {
      var meal = S.group();
      S.box(.28,.045,.26,tray,0,0,0,{parent:meal});
      S.box(.13,.035,.21,rice,-.058,.035,0,{parent:meal});
      S.box(.09,.035,.10,salmon,.065,.037,-.04,{parent:meal});
      S.box(.09,.03,.07,greens,.065,.035,.065,{parent:meal});
      S.box(.29,.075,.27,lid,0,.036,0,{parent:meal});
      S.box(.055,.008,.275,sleeve,0,.078,0,{parent:meal});
      return meal;
    };
    // Separate short-dated product tiers and reserve a real purchasable slot.
    var fresh=fixturesPlan.bento;
    [['bento',.948,-3.58],['sandwich',1.056,-4.38],['onigiri',1.267,-4.86]].forEach(function(row){
      var [id,height,localZ]=row, item=S.products[id];
      for(var slot=0;slot<5;slot++){
        if((id==='bento' && slot===2)||(id==='sandwich' && slot===4)) continue;
        S.stockProduct(id,fresh.x-.63+slot*.313,height,fresh.z+(localZ+4.15)*fresh.depth,S.range(-.05,.05));
      }
      S.plane(.34,.062,tag(item.title,'¥'+item.price),1.75,height+.02,localZ+.275,{});
    });
    S.displayMeal=S.makeMeal();
    S.displayMeal.position.set(1.75,.976,-3.51);
    S.stock={available:true,scans:0,restocks:0};
    // An open display lets a customer reach the front row.
    S.box(1.11, .075, .025, S.glass(0xe5f6ff, .24), 1.75, .99, -3.155, {});
    S.plane(0.72, 0.24, S.basic(0xffffff, { map: S.tex.priceTag('お弁当', '#ffd97a'), transparent: true, side: T.DoubleSide }), 1.75, 1.30, -3.18, {});
    S.glow(1.75, 1.05, -4.15, 0xe5f2ff, .4, .04);

    section('bento');
    /* ---------- chest freezer near the entrance ---------- */
    S.box(1.60, 0.72, 0.92, white, -3.55, 0.46, -2.30, { outline: true, outlineOpacity: .3 });
    S.box(1.48, 0.05, 0.80, S.basic(0xdff1f7), -3.55, 0.84, -2.30, {});
    for (var ic = 0; ic < 10; ic++) {
      S.box(0.24, 0.10, 0.20, S.toon([0xf3a9bd, 0x9fc9e8, 0xf4d487, 0xb0d6a8, 0xcdb3e0][ic % 5]),
        -3.55 - 0.55 + (ic % 5) * 0.28, 0.90, -2.30 - 0.18 + Math.floor(ic / 5) * 0.34, {});
    }
    S.plane(1.52, 0.84, S.glass(0xe5f6ff, 0.20), -3.55, 0.90, -2.30, { rx: -Math.PI / 2 });
    S.plane(0.75, 0.24, S.basic(0xffffff, { map: S.tex.priceTag('アイス', '#bfe7f5'), transparent: true, side: T.DoubleSide }), -3.55, 1.12, -1.86, {});

    section('freezer');
    /* ---------- checkout counter ---------- */
    S.box(2.55, 0.94, 0.72, wood, 0.25, 0.57, -2.55, { outline: true, outlineOpacity: .32 });
    S.box(2.68, 0.06, 0.82, S.toon(0xd8c3a4), 0.25, 1.06, -2.55, {});
    S.box(0.86, 0.94, 0.68, wood, -1.32, 0.57, -2.92, {});
    S.box(0.92, 0.06, 0.74, S.toon(0xd8c3a4), -1.32, 1.06, -2.92, {});
    /* register */
    S.box(0.46, 0.26, 0.40, S.toon(0x4c5a66), -0.45, 1.22, -2.58, {});
    S.plane(0.34, 0.20, S.basic(0x7fd8e8), -0.45, 1.30, -2.37, { rx: -0.35 });
    S.box(0.42, 0.03, 0.16, S.toon(0xaab5bc), -0.45, 1.10, -2.32, {});
    S.box(.30,.035,.24,frame,.04,1.11,-2.32,{});
    S.scannerLight = S.basic(0x7eafa3);
    S.box(.22,.008,.035,S.scannerLight,.04,1.132,-2.32,{});
    S.box(.19,.06,.23,frame,.55,1.13,-2.29,{});
    S.plane(.14,.15,S.basic(0xffffff,{map:S.tex.label('PAY','タッチ','#183b42','#bce1d5')}),.55,1.165,-2.29,{rx:-Math.PI/2});
    var printer=S.shopMaterial(0x3f5358);
    S.box(.20,.14,.22,printer,-.28,1.16,-2.73,{});
    S.box(.145,.009,.025,frame,-.28,1.234,-2.65,{});
    S.receipt = S.plane(.11,.154,tag('お買上票','540'),-.28,1.292,-2.638,{rx:-.28});
    S.box(.36,.045,.21,shelfMetal,1.33,1.107,-2.49,{});
    S.box(.36,.08,.016,frame,1.33,1.157,-2.38,{});
    S.box(.30,.21,.22,S.shopMaterial(0x687d77),.45,.74,-2.94,{});
    S.box(.17,.12,.14,S.shopMaterial(0xc1976c),.45,.91,-3.02,{});
    var desk=fixturesPlan.checkout;
    ['gum','candy'].forEach(function(id,i){
      S.stockProduct(id,desk.x+.02,1.131,desk.z-1.01-i*.15,Math.PI/2);
    });
    S.receipt.visible = false;
    /* customer facing display */
    S.box(0.55, 0.36, 0.06, frame, 0.95, 1.36, -2.20, {});
    S.registerIdle = S.tex.label('レジ', 'お会計', '#203a48', '#dff8ff');
    S.registerPaid = S.tex.label('¥ 540', 'ありがとう', '#203a48', '#dff8ff');
    S.registerScreen = S.basic(0xffffff, { map: S.registerIdle });
    S.plane(.50, .30, S.registerScreen, .95, 1.36, -2.16, {});
    /* baskets, bags, small goods */
    S.box(0.34, 0.20, 0.26, S.toon(0x3d6d9c), 1.28, 1.19, -2.60, {});
    S.box(0.30, 0.02, 0.22, S.toon(0x2d5580), 1.28, 1.30, -2.60, {});
    S.box(0.18, 0.24, 0.12, S.toon(0xf3e7c8), 0.55, 1.21, -2.78, {});
    S.box(0.18, 0.24, 0.12, S.toon(0xe9d9b4), 0.76, 1.21, -2.78, {});
    S.plane(0.66, 0.20, S.basic(0xffffff, { map: S.tex.priceTag('レジ', '#ffe8a0'), transparent: true, side: T.DoubleSide }), 0.25, 0.80, -2.17, {});

    section('checkout');
    /* ---------- oden counter ---------- */
    S.box(1.20, 0.94, 0.72, S.toon(0xb9c3c7), -2.75, 0.57, -2.62, { outline: true, outlineOpacity: .3 });
    S.box(1.26, 0.06, 0.78, metal, -2.75, 1.06, -2.62, {});
    S.box(0.98, 0.16, 0.58, S.toon(0x8e9ca4), -2.75, 1.15, -2.62, {});
    S.box(0.88, 0.02, 0.48, S.basic(0xe4a461), -2.75, 1.24, -2.62, {});
    [-.15,.15].forEach(function(dx) { S.box(.018,.08,.48,metal,-2.75+dx,1.25,-2.62,{}); });
    S.box(.88,.08,.018,metal,-2.75,1.25,-2.62,{});
    S.tube([[-2.27,1.32,-2.83],[-2.23,1.34,-2.62],[-2.28,1.32,-2.42]],.012,metal);
    for (var od = 0; od < 8; od++) {
      S.cyl(0.09, 0.09, 0.06, 8, S.toon([0xf0dfb5, 0xc79a68, 0xe8e2cd, 0xb98c60][od % 4]),
        -2.75 - 0.34 + (od % 4) * 0.22, 1.27, -2.62 - 0.13 + Math.floor(od / 4) * 0.26, {});
    }
    S.box(0.02, 0.02, 0.42, metal, -2.30, 1.31, -2.62, {});
    S.plane(0.50, 0.28, S.basic(0xffffff, { map: S.tex.priceTag('おでん', '#ffcf8a'), transparent: true, side: T.DoubleSide }), -2.75, 1.55, -2.98, {});
    S.box(0.02, 0.38, 0.02, metal, -2.75, 1.36, -2.98, {});
    S.glow(-2.75, 1.30, -2.62, 0xffbb7a, .4, .05);
    for (var puff = 0; puff < 4; puff++) {
      (function (offset) {
        var steam = S.glow(-2.75, 1.36, -2.62, 0xfff0dd, .28, .10);
        steam.material.blending = T.NormalBlending;
        S.addUpdate(function (t) {
          var age = (t * .56 + offset) % 1;
          steam.position.set(-2.75 + Math.sin(t * 1.1 + offset * 6) * age * .16, 1.33 + .71 * age, -2.62);
          steam.scale.set(.21 + age * .22, .24 + age * .38, 1);
          steam.material.opacity = .18 * Math.sin(Math.PI * age);
        });
      })(puff / 4);
    }

    section('oden');
    /* ---------- coffee machine ---------- */
    var coffeeBody=S.toon(0x384348);
    var cup=S.toon(0xf1e4d1);
    S.box(.86,.84,.58,wood,2.30,.52,-6.15,{});
    S.box(.91,.045,.63,metal,2.30,.96,-6.15,{});
    S.box(.52,.62,.38,coffeeBody,2.17,1.29,-6.24,{});
    S.box(.42,.31,.025,S.basic(0x1b2627),2.17,1.20,-6.043,{});
    S.box(.40,.05,.20,coffeeBody,2.17,1.01,-5.96,{});
    S.cyl(.022,.02,.06,8,metal,2.17,1.32,-5.951,{});
    S.stockProduct('paperCup',fixturesPlan.coffee.x+.13,1.036,fixturesPlan.coffee.z-.20,Math.PI);
    S.cyl(.065,.05,.17,10,cup,2.62,1.07,-6.13,{});
    S.plane(.38,.12,S.basic(0xffffff,{map:S.tex.label('COFFEE','¥100','#213c36','#f0e4d0')}),2.17,1.49,-6.042,{});

    section('coffee');
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

    section('magazines');
    /* ---------- posters hanging inside the glass ---------- */
    [['sale', -5.15], ['onigiri', -3.55], ['bento', 1.85]].forEach(function (p) {
      S.plane(0.48, 0.72, S.basic(0xffffff, { map: S.tex.poster(p[0]), transparent: true, side: T.DoubleSide, depthWrite: false }), p[1], 2.42, -1.68, {});
      S.box(0.50, 0.02, 0.02, frame, p[1], 2.79, -1.68, {});
    });
    [['coffee', -3.10], ['pink', -4.55]].forEach(function (p) {
      S.plane(0.48, 0.72, S.basic(0xffffff, { map: S.tex.poster(p[0]), transparent: true, side: T.DoubleSide, depthWrite: false }), 2.72, 2.42, p[1], { ry: Math.PI / 2 });
    });

    section('posters');
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

    section('smallProps');
    // Staff-only storage is enclosed behind the cashier, with a real opening.
    var partition=S.toon(0xb9b7aa);
    S.box(2,.10,1.9,partition,-5.05,2.75,-7.5,{});
    S.box(.08,2.6,1.9,partition,-4.05,1.4,-7.5,{});
    S.box(.5,2.6,.08,partition,-5.85,1.4,-6.55,{});
    S.box(.55,2.6,.08,partition,-4.32,1.4,-6.55,{});
    S.box(1.22,.5,.08,partition,-5.07,2.45,-6.55,{});
    var spare=S.layout.interior.stockShelf;
    [.24,.715,1.18].forEach(function(y) {
      S.box(.52,.045,1.35,shelfMetal,-5.69,y,-7.52,{});
    });
    [-5.93,-5.45].forEach(function(x) {
      [-8.17,-6.88].forEach(function(z){S.box(.035,1.22,.035,frame,x,.71,z,{});});
    });
    var carton=S.toon(0xb19772);
    for(var stock=0;stock<5;stock++) {
      S.box(.35,.25,.35,carton,-5.69,[.387,.862,1.327][Math.floor(stock/2)],-7.96+(stock%2)*.47,{});
    }
    S.box(.31,.016,.29,frame,spare[0],spare[1]-.034,spare[2],{});
    S.plane(.65,.18,S.basic(0xffffff,{map:S.tex.label('STAFF','関係者のみ','#d9d5c7','#3f5356')}),-5.07,2.4,-6.49,{});
    var serviceDoor=S.group();
    serviceDoor.position.set(-5.59,.10,-6.53);
    S.box(1.00,2.04,.038,S.shopMaterial(0x8b9a93),.50,1.02,0,{parent:serviceDoor});
    S.box(.16,.035,.05,metal,.84,1.08,.032,{parent:serviceDoor});
    var serviceAngle=0;
    S.addUpdate(function(t,dt){
      var p=S.people.find(function(person){return person.staff;});
      var near=p && Math.abs(p.group.position.x+5.15)<.59 && Math.abs(p.group.position.z+6.53)<.70;
      serviceAngle+=((near?-1.50:0)-serviceAngle)*Math.min(1,dt*9);
      serviceDoor.rotation.y=serviceAngle;
    });

    var clockFrame=S.shopMaterial(0x36484a);
    S.cyl(.173,.173,.045,16,clockFrame,-4.29,2.45,-6.48,{rx:Math.PI/2});
    S.cyl(.145,.145,.012,16,S.basic(0xf1e9d5),-4.29,2.45,-6.45,{rx:Math.PI/2});
    S.box(.018,.093,.008,clockFrame,-4.31,2.473,-6.437,{rz:.54});
    S.box(.013,.112,.008,clockFrame,-4.272,2.488,-6.436,{rz:-.38});
    S.cyl(.078,.078,.37,12,S.shopMaterial(0xb63d36),-5.86,.37,-6.37,{});
    S.tube([[-5.86,.55,-6.37],[-5.95,.60,-6.37],[-5.98,.40,-6.36]],.013,clockFrame);
    S.plane(.22,.10,tag('消火器',''),-5.87,.77,-6.498,{});

    move('drinks',-3.22,-8.22);
    move('bento',1.75,-4.15);
    // Animated meal follows world-space navigation anchors.
    S.world.updateMatrixWorld(true);
    S.world.attach(S.displayMeal);
    S.layout.interior.meal=S.displayMeal.position.toArray();
    move('checkout',.25,-2.55);
    move('oden',-2.75,-2.62);
    move('freezer',-3.55,-2.3);
    move('coffee',2.3,-6.15);
    move('magazines',-5.88,-3.05);
    fixtures.smallProps.forEach(function(o){S.world.remove(o);});
    S.buildProductBatches();
    var doorCenter=new T.Vector3(), hingePoint=new T.Vector3(), edgePoint=new T.Vector3();
    S.coldDoorBlocks = function(door,x,z) {
      door.hinge.getWorldPosition(hingePoint);
      door.hinge.localToWorld(edgePoint.set(-door.side*1.08,0,0));
      var dx=edgePoint.x-hingePoint.x, dz=edgePoint.z-hingePoint.z;
      var along=S.clamp(((x-hingePoint.x)*dx+(z-hingePoint.z)*dz)/(dx*dx+dz*dz),0,1);
      return Math.hypot(x-hingePoint.x-dx*along,z-hingePoint.z-dz*along)<.18;
    };
    S.nearbyColdDoor = function() {
      if(!S.camera || !S.isStoreView(S.view)) return null;
      var closest=null, distance=1.65;
      S.coldDoors.forEach(function(door) {
        doorCenter.copy(door.hinge.position);
        doorCenter.x -= door.side*.54;
        doorCenter.y = 1.22;
        door.hinge.parent.localToWorld(doorCenter);
        var d=doorCenter.distanceTo(S.camera.position);
        if(d<distance) { distance=d; closest=door; }
      });
      return closest;
    };
    S.groundPlane(.26,.10,S.basic(0xc8b888),-3.52,.102,-3.86);
    S.groundPlane(.26,.10,S.basic(0xc8b888),-3.52,.102,-4.53);
    for(var basket=0;basket<3;basket++){
      var basketY=.16+basket*.061;
      S.box(.35,.028,.25,frame,.82,basketY,-2.04,{});
      [-1,1].forEach(function(side){
        S.box(.35,.067,.018,frame,.82,basketY+.033,-2.04+side*.122,{});
        S.box(.018,.067,.25,frame,.82+side*.167,basketY+.033,-2.04,{});
      });
    }
    var sole=S.basic(0x414e50,{transparent:true,opacity:.12,depthWrite:false});
    for(var step=0;step<6;step++){
      S.groundPlane(.075,.17,sole,-.8+(step%2?.11:-.11),.102,-2.1-step*.16,step%2?.1:-.1);
    }
    S.toggleColdDoor = function() {
      var door=S.nearbyColdDoor();
      if(door) door.open=!door.open;
    };
    S.addUpdate(function(t,dt) {
      S.coldDoors.forEach(function(door) {
        var target=door.open ? door.side*1.05 : 0;
        if (Math.abs(target-door.angle)<.001) return;
        var turn=door.angle+(target-door.angle)*Math.min(1,dt*3);
        door.hinge.rotation.y=turn;
        var viewer=S.camera && S.isStoreView(S.view) ? S.camera.position : null;
        var shopper=S.people[0] && S.people[0].group.position;
        if ((viewer && S.coldDoorBlocks(door,viewer.x,viewer.z)) ||
            (shopper && S.coldDoorBlocks(door,shopper.x,shopper.z))) {
          door.hinge.rotation.y=door.angle;
          return;
        }
        door.angle=turn;
      });
    });
  };
})(window.S);

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
    var x = S.layout.umbrellaStandX, z = -1.02;
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
    [[2.05, 0x3f6f9c, '可燃'], [2.66, 0x4f8a6e, 'びん・かん']].forEach(function (b) {
      S.box(0.52, 0.78, 0.46, mat(b[1]), b[0], 0.45, -1.00, { outline: true, outlineOpacity: .35 });
      S.box(0.56, 0.07, 0.50, mat(0x2c3a49), b[0], 0.87, -1.00, {});
      S.plane(0.40, 0.20, S.basic(0xffffff, { map: S.tex.label(b[2], '', '#f4f8f6', b[1]), transparent: true }), b[0], 0.58, -0.76, {});
    });
    /* menu A-board */
    var ag = S.group(); ag.position.set(-4.66, 0, -0.72);
    [-1, 1].forEach(function (s) {
      S.plane(0.72, 0.96, S.basic(0xffffff, { map: S.tex.poster(s > 0 ? 'bento' : 'coffee'), side: T.DoubleSide, transparent: true }),
        0, 0.62, s * 0.18, { rx: s * 0.22, parent: ag });
      S.box(0.04, 1.10, 0.04, mat(0x6c5c4a), -0.34, 0.55, s * 0.18, { rz: -s * 0.22, parent: ag });
      S.box(0.04, 1.10, 0.04, mat(0x6c5c4a), 0.34, 0.55, s * 0.18, { rz: -s * 0.22, parent: ag });
    });
    /* potted plants */
    [[-5.85, -1.25], [3.12, -1.84]].forEach(function (p) {
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

/* A walkable neighborhood around the original shop. */
(function (S) {
  var T = THREE;
  function label(text, w, h, x, y, z, bg, fg, parent) {
    return S.plane(w, h, S.basic(0xffffff, { map: S.tex.label(text, '', bg, fg) }), x, y, z, { parent: parent });
  }
  function building(x, z, w, d, h, color, name) {
    var g = S.group(); g.position.set(x, 0, z);
    var wall = S.toon(color), trim = S.toon(0x283546), frame = S.toon(0x8a989f);
    S.box(w, h, d, wall, 0, h / 2, 0, { parent: g, cast: true });
    S.box(w + .2, .18, d + .2, trim, 0, h + .06, 0, { parent: g });
    for (var row = 0; row < Math.floor(h / 2); row++) {
      for (var col = 0; col < 3; col++) {
        var wx = (col - 1) * w / 3.5, wy = 1.1 + row * 1.9;
        S.box(.85, 1.05, .08, frame, wx, wy, d / 2 + .04, { parent: g });
        var warm = (row + col) % 3 === 0;
        S.plane(.73, .91, S.basic(warm ? 0xc6a778 : 0x293b51), wx, wy, d / 2 + .09, { parent: g });
        S.box(.035, .94, .04, trim, wx, wy, d / 2 + .12, { parent: g });
      }
    }
    S.box(.85, 1.6, .1, trim, -w * .33, .85, d / 2 + .1, { parent: g });
    S.box(.06, .1, .04, frame, -w * .33 + .28, .9, d / 2 + .17, { parent: g });
    S.box(1.2, .1, .7, trim, -w * .33, 1.8, d / 2 + .25, { parent: g });
    label(name, w * .65, .32, 0, h - .28, d / 2 + .12, '#263444', '#b5c4c9', g);
    S.layout.shelters.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, height: h + .2 });
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
    var g = S.group(); g.position.set(-7.4, .008, 7.0);
    var paint = S.toon(0x6b878b), glass = S.phong(0x233b50), rubber = S.toon(0x121c29);
    S.box(1.65, .55, 2.9, paint, 0, .55, 0, { parent: g, cast: true });
    S.box(1.42, .65, 1.65, glass, 0, 1.12, -.05, { parent: g });
    S.box(1.55, .1, 1.8, paint, 0, 1.48, -.05, { parent: g });
    [-.71, .71].forEach(function (x) { S.box(.08, .65, 1.7, paint, x, 1.12, -.05, { parent: g }); });
    [-.84, .84].forEach(function (x) { [-.9, .9].forEach(function (z) { S.cyl(.29, .29, .16, 12, rubber, x, .29, z, { rz: Math.PI / 2, parent: g }); }); });
    [-.55, .55].forEach(function (x) { S.box(.35, .16, .04, S.basic(0xc9c8aa), x, .6, 1.47, { parent: g }); });
  }
  S.buildNeighborhood = function () {
    var asphalt = S.toon(0xffffff, { map: S.tex.asphalt() });
    var pavement = S.toon(0xffffff, { map: S.tex.pavement() });
    var curb = S.toon(0x748494);
    // New outer sidewalks connect the crossing to both sides of the block.
    S.box(2.4, .12, 26, curb, 12.7, .02, 0, {});
    S.groundPlane(2.4, 26, pavement, 12.7, .085, 0);
    S.box(28, .12, 2.3, curb, 0, .02, 11.85, {});
    S.groundPlane(28, 2.2, pavement, 0, .085, 11.85);
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
    building(-11.8, -7.6, 3.4, 5.8, 5.3, 0x424a59, '夜灯食堂');
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
    building(-6.3, -11.2, 5.1, 3.2, 5.9, 0x303c50, '月見ハイツ');
    building(.2, -11.3, 5, 3, 7.3, 0x344154, '夜灯');
    building(6.7, -11.4, 5.2, 2.8, 5.5, 0x3d4656, '二丁目');
    // Complete the existing residence entrance and mailboxes.
    S.box(1.4, .1, .8, curb, 6.6, .08, -5.05, {});
    S.box(1.5, .12, .9, S.toon(0x566779), 6.6, 2.05, -5.15, {});
    for (var m = 0; m < 3; m++) {
      S.box(.3, .32, .16, S.toon(0x8c9291), 7.5 + m * .34, .95, -5.32, {});
      S.box(.2, .025, .02, S.basic(0x243040), 7.5 + m * .34, 1, -5.22, {});
    }
    // Low street-facing facades keep the main shop visible from the default camera.
    var kiosk = S.group(); kiosk.position.set(-11.4, 0, 11.8); kiosk.rotation.y = Math.PI;
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
    lamp(12.6, 4.4); lamp(-11.8, 1.6); lamp(1.5, 11.7);
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
        light.green.color.setHex(S.traffic.pedestrianGreen ? 0x8ed6b3 : 0x233a35);
      });
    });
  };
})(window.S);

/* Small, physically supported details; walking lanes remain unobstructed. */
(function (S) {
  var T = THREE;
  S.buildDetails = function () {
    var steel = S.toon(0x657782), dark = S.toon(0x27343d), wood = S.toon(0x78644f);
    function plaque(text, sub, w, h, x, y, z, ry) {
      return S.plane(w, h, S.basic(0xffffff, { map: S.tex.label(text, sub, '#d2cbb3', '#33494b') }), x, y, z, { ry: ry || 0 });
    }
    function grate(x, z, w, d, y) {
      S.groundPlane(w, d, S.basic(0xffffff, { map: S.tex.drain() }), x, y, z);
    }
    function wet(x, z, w, d, y, opacity) {
      S.groundPlane(w, d, S.basic(0x829ba6, { map: S.tex.puddle(), transparent: true, opacity: opacity, depthWrite: false }), x, y, z);
    }
    // A dry strip under the canopy, with splash-darkened outer edge.
    S.groundPlane(7.7, .45, S.toon(0x606772, { map: S.tex.pavement() }), -1.7, .067, -1.3);
    wet(-.8, -.54, 2.7, .42, .079, .25);
    // Mat ribs stay within the existing doormat; the doorway is left clear.
    for (var i = 0; i < 9; i++) S.box(2.8, .006, .018, dark, -.8, .083, -1.46 + i * .11, {});
    plaque('24 HOURS', '年中無休', .65, .3, -3.8, 1.75, -1.455);
    plaque('入口', '足元にご注意', .42, .22, .96, 1.42, -1.455);
    // Drip tray below the existing umbrella stand, with a raised rim.
    var standX = S.layout.umbrellaStandX;
    S.box(.72, .035, .72, dark, standX, .085, -1.02, {});
    [-1, 1].forEach(function (side) {
      S.box(.74, .06, .025, steel, standX, .12, -1.02 + side * .36, {});
      S.box(.025, .06, .72, steel, standX + side * .36, .12, -1.02, {});
    });
    wet(standX, -1.02, .65, .65, .106, .42);
    // Connect the existing downpipe outlet to a covered drain channel.
    grate(-6.38, -.95, .42, .44, .069);
    grate(-6.38, -.11, .16, 1.25, .069);
    [1, 2.2].forEach(function (y) { S.box(.18, .07, .12, steel, -6.38, y, -.7, {}); });
    S.box(.18, .12, .22, steel, -6.38, 3.18, -.7, {});
    // Support and drain the existing wall-mounted AC unit.
    [-7.68, -7.02].forEach(function (z) {
      S.box(.62, .07, .07, steel, 3.2, 1.12, z, {});
      S.box(.07, .42, .07, steel, 2.94, 1.31, z, {});
      S.tube([[2.94, .95, z], [3.48, 1.12, z]], .022, steel);
    });
    S.tube([[3.5, 1.2, -7.8], [3.75, 1.1, -7.8], [3.75, .15, -7.8], [4.14, .08, -7.8]], .018, S.toon(0xb1b7af));
    // Diner: one legible entrance, raised sill, glazing and attached curtain rail.
    S.box(1.05, 1.85, .08, wood, -11.8, 1.02, -4.55, {});
    S.plane(.78, 1.12, S.phong(0x766b50), -11.8, 1.21, -4.501, {});
    S.box(.035, 1.78, .03, steel, -11.8, 1.02, -4.49, {});
    S.box(.035, .34, .07, steel, -11.45, .99, -4.45, {});
    S.box(1.2, .06, .45, S.toon(0x737369), -11.8, .09, -4.32, {});
    S.box(3.4, .035, .035, wood, -11.8, 2.1, -3.8, {});
    [-13.2, -10.4].forEach(function (x) { S.box(.035, .16, .035, steel, x, 2.17, -3.8, {}); });
    plaque('本日の定食', 'おでん・お茶', .52, .7, -10.5, 1.14, -4.48);
    S.box(.66, .14, .36, wood, -13.0, 2.03, -4.38, {});
    S.box(.5, .025, .22, S.basic(0xffd9a3), -13.0, 1.95, -4.36, {});
    // The service window closes while the door and lamp remain accessible.
    var windowX = -12.98, windowZ = -4.475, windowY = 1.40;
    S.box(.99, .93, .08, wood, windowX, windowY, windowZ, {});
    var pane = S.basic(0xffcc87);
    S.plane(.87, .79, pane, windowX, windowY, windowZ + .044, {});
    S.box(.03, .79, .028, wood, windowX, windowY, windowZ + .06, {});
    S.box(.88, .034, .028, wood, windowX, 1.24, windowZ + .06, {});
    S.box(1.04, .05, .18, steel, windowX, .92, windowZ + .04, {});
    var windowGlow = S.glow(windowX, windowY, windowZ + .07, 0xffa65e, 1.9, .18);
    var shutter = S.group();
    shutter.position.set(windowX, 1.83, windowZ + .08);
    S.box(.91, .84, .04, steel, 0, -.42, 0, { parent: shutter });
    for (var slat = 0; slat < 9; slat++) {
      S.box(.90, .012, .015, dark, 0, -.04 - slat * .094, .023, { parent: shutter });
    }
    S.box(1.04, .13, .12, steel, windowX, 1.86, windowZ + .06, {});
    S.addUpdate(function (t) {
      var phase = t % 120;
      var closed = S.clamp(Math.min((phase - 78) / 4, (118 - phase) / 4), 0, 1);
      shutter.visible = closed > .01;
      shutter.scale.y = Math.max(.001, closed);
      windowGlow.material.opacity = .18 * (1 - closed);
    });
    // Utility meter and conduit actually terminate at the alley wall.
    S.box(.12, .58, .42, steel, -9.23, 1.5, -5.65, {});
    S.plane(.25, .23, S.basic(0xb2c1bc), -9.159, 1.57, -5.65, { ry: Math.PI / 2 });
    S.tube([[-9.22, 1.2, -5.65], [-9.22, .55, -5.65], [-9.22, .55, -6.5]], .025, steel);
    // Bus shelter stays entirely on the pavement. Its road side is open.
    var roof = S.toon(0x3d565e);
    S.box(1.85, .10, 3.7, roof, 12.85, 3.04, 7.05, { cast: true });
    [5.35, 8.75].forEach(function (z) {
      S.box(.075, 2.9, .075, steel, 13.62, 1.535, z, { cast: true });
      S.box(.24, .04, .24, dark, 13.62, .105, z, {});
      S.box(1.7, .055, .055, steel, 12.83, 2.98, z, {});
    });
    S.plane(3.3, 2.1, S.glass(0x92aab1, .16), 13.62, 1.78, 7.05, { ry: -Math.PI / 2 });
    S.box(.04, .05, 3.4, steel, 13.62, .72, 7.05, {});
    // Bench runs parallel to the curb, leaving a 1.2m approach lane.
    for (var slat = 0; slat < 3; slat++) S.box(.12, .07, 1.65, wood, 13.18 + slat * .15, .58, 7.6, {});
    [6.98, 8.22].forEach(function (z) { S.box(.43, .46, .07, steel, 13.33, .315, z, {}); });
    S.box(.055, .28, 1.65, wood, 13.54, .9, 7.6, {});
    plaque('02 / 07', '夜灯駅方面', .65, .43, 13.55, 1.8, 6.0, -Math.PI / 2);
    S.box(.07, .045, 3.7, steel, 13.75, 3.09, 7.05, {});
    S.tube([[13.75, 3.05, 8.75], [13.75, .22, 8.75], [13.55, .12, 8.9]], .035, steel);
    grate(13.5, 8.95, .5, .35, .09);
    S.layout.shelters.push({ x0: 11.925, x1: 13.775, z0: 5.2, z1: 8.9, height: 3.1 });
    var stop = S.layout.busStop;
    var mark = S.basic(0xc7b479, { transparent: true, opacity: .52 });
    for (var dash = 0; dash < 7; dash++) {
      S.groundPlane(.045, .38, mark, stop.curbX - .16, .018, stop.boardingZ - .8 + dash * .62);
    }
    // Thin runoff bands follow curb edges, without covering the crossing.
    wet(11.4, 7.3, .26, 4.3, .03, .45);
    wet(1.4, .95, 3, .25, .035, .35);
    // Restrained rear-facade hardware and roof drain, kept below signs.
    [-6.3, .2].forEach(function (x, i) {
      var z = i ? -9.75 : -9.55, y = i ? 7.2 : 5.8;
      S.tube([[x + 2.2, y, z], [x + 2.2, .2, z]], .04, steel);
      [1.5, 3.6].forEach(function (h) { S.box(.16, .06, .1, steel, x + 2.2, h, z, {}); });
    });
  };
})(window.S);

/* Small articulated residents following explicit, obstacle-free walking routes. */
(function (S) {
  var T = THREE;
  function character(coat, umbrellaColor, route, speed, offset) {
    var group = S.group(), torso = S.group(group);
    var fabric = S.toon(coat), dark = S.toon(0x263243), skin = S.toon(0xd7b69b);
    S.cyl(.21, .27, .65, 8, fabric, 0, .96, 0, { parent: torso, cast: true });
    S.sphere(.18, skin, 0, 1.49, 0, { parent: torso });
    S.sphere(.19, dark, 0, 1.57, -.025, { parent: torso, scale: [1, .7, 1] });
    var legs = [], arms = [];
    [-1, 1].forEach(function (side) {
      var leg = S.group(group); leg.position.set(side * .12, .68, 0);
      S.box(.14, .5, .16, dark, 0, -.25, 0, { parent: leg });
      S.box(.16, .12, .28, dark, 0, -.54, .05, { parent: leg });
      legs.push(leg);
      var arm = S.group(torso); arm.position.set(side * .25, 1.22, 0);
      S.cyl(.07, .065, .4, 6, fabric, 0, -.18, 0, { parent: arm });
      S.sphere(.07, skin, 0, -.4, 0, { parent: arm });
      arms.push(arm);
    });
    var umbrella = S.group(group);
    S.cyl(.014, .014, 1, 6, S.toon(0xb6c5c8), .25, 1.65, .1, { parent: umbrella });
    S.cyl(.03, .67, .27, 10, S.toon(umbrellaColor), .25, 2.22, .1, { parent: umbrella, cast: true });
    S.sphere(.04, dark, .25, 2.38, .1, { parent: umbrella });
    var bag = S.group();
    var paper = S.toon(0xd5ba90);
    S.box(.26, .26, .17, paper, 0, -.18, 0, { parent: bag });
    [-.055, .055].forEach(function (z) {
      S.tube([[-.078,-.05,z],[-.05,.015,z],[.05,.015,z],[.078,-.05,z]], .009, paper, bag);
    });
    bag.visible = false;
    var shadow = S.groundPlane(.6, .6, S.basic(0x101923, { transparent: true, opacity: .3, depthWrite: false }), 0, .092, 0);
    var p = { group: group, torso: torso, umbrella: umbrella, legs: legs, arms: arms, bag: bag, shadow: shadow,
      route: route, next: 1, wait: offset || 0, distance: 0, speed: speed, folding: 1 };
    group.position.set(route[0].x, .1, route[0].z);
    S.people.push(p);
    return p;
  }
  function point(x, z, options) { return Object.assign({ x: x, z: z }, options || {}); }
  S.buildPeople = function () {
    var entry = S.layout.entrance, stop = S.layout.busStop, anchors = S.layout.interior;
    var shopper = character(0xac8268, 0xb68d70, [
      point(-8.2, -6.5), point(-8.2, -1.3), point(-6.6, -1.3), point(-6.6, .35), point(-5.6, .35),
      point(entry.x, .35), point(entry.x, -.96, { fold: true, wait: 1.2, action: 'fold' }),
      point(entry.x, -1.89, { door: true, fold: true }), point(anchors.aisleX,-3,{fold:true}), point(anchors.aisleX,anchors.rearZ,{fold:true}),
      point(anchors.pickup[0], anchors.pickup[1], { fold: true, wait: 1.4, action: 'pick', face: Math.PI }),
      point(anchors.aisleX,anchors.rearZ,{fold:true}), point(anchors.queueX,anchors.rearZ,{fold:true}), point(anchors.queueX,-3.78,{fold:true,wait:.65}),
      point(anchors.pay[0], anchors.pay[1], { fold: true, wait: 3.8, action: 'pay', face: -Math.PI/2 }),
      point(-1.35,-2.76,{fold:true}), point(entry.x, -1.89, { fold: true }), point(entry.x, -.96, { door: true, fold: true }),
      point(entry.x, -.79, { fold: true, wait: .7, action: 'unfold' }), point(entry.x, .35),
      point(-5.6, .35), point(-6.6, .35), point(-6.6, -1.3), point(-8.2, -1.3),
      point(-8.2, -6.5, { wait: 8, action: 'reset' })
    ], .85, 1);
    // Start the first shopping trip within view of the entrance camera.
    shopper.next = 5;
    shopper.group.position.set(-5.6, S.groundHeight(-5.6, .35) - .08, .35);
    var passenger = character(0x6d8795, 0x778ea8, [
      point(6.6, -4.8), point(4.8, -4.8), point(4.8, -.3), point(4, -.3), point(3.9, 2.15, { wait: .6 }),
      point(11.7, 2.15, { crossing: true }), point(stop.waitX, 4), point(stop.waitX, stop.boardingZ, { face: -Math.PI / 2 }),
      point(stop.laneX + .58, stop.boardingZ, { board: true, fold: true, action: 'board' })
    ], 1, 4);
    S.passenger = passenger;
    character(0x658c7b, 0x748c72, [
      point(-8.6, -5.8), point(-8.6, -1.3), point(-6.8, -1.3), point(-6.8, .65), point(-6, .65), point(3.2, .5),
      point(3.2, .15, { wait: 5, face: Math.PI }), point(3.2, .65), point(-6, .65), point(-6.8, .65), point(-6.8, -1.3), point(-8.6, -1.3), point(-8.6, -5.8, { wait: 12 })
    ], .74, 14);
    var clerk = character(0x6e9f92, 0x687d89, [point(anchors.clerk[0],anchors.clerk[1])], 0, 0);
    clerk.group.position.y = .02;
    clerk.staff = true; clerk.umbrella.visible = false; clerk.bag.visible = false;
    var meal = S.displayMeal, shelf = meal.position.clone();
    var checkout = new T.Vector3().fromArray(anchors.scanner);
    var hand = new T.Vector3();
    var paid = false, restockIndex = -1, returning = false, stockWait = 0, pickupWait = 0;
    var sparePosition = new T.Vector3().fromArray(anchors.stockShelf);
    var replacement = S.makeMeal();
    replacement.position.copy(sparePosition);
    var carried = false;
    var clerkHand = new T.Vector3(), bagSpot = new T.Vector3().fromArray(anchors.bagging);
    function restock(dt) {
      if (restockIndex < 0 && !S.stock.available && shopper.hasBag && shopper.group.position.z > -.8) {
        restockIndex = 1; returning = false; pickupWait = 0;
      }
      if (restockIndex < 0) return;
      var dest = anchors.restock[restockIndex], pos = clerk.group.position;
      var dx = dest[0]-pos.x, dz = dest[1]-pos.z, dist = Math.hypot(dx,dz);
      if(dist > .02) {
        var step = Math.min(dist, dt*.8);
        pos.x += dx/dist*step; pos.z += dz/dist*step;
        clerk.group.rotation.y = Math.atan2(dx,dz);
        clerk.legs[0].rotation.x = Math.sin(tick*8)*.3;
        clerk.legs[1].rotation.x = -clerk.legs[0].rotation.x;
      } else if(!returning && restockIndex===1) {
        clerk.group.rotation.y=-Math.PI/2;
        pickupWait+=dt;
        replacement.position.copy(sparePosition).lerp(clerkHand, S.clamp((pickupWait-.3)/.55,0,1));
        if(pickupWait>=.85){ carried=true; restockIndex++; }
        return;
      } else if(!returning && restockIndex === anchors.restock.length-1) {
        stockWait += dt;
        clerk.group.rotation.y = Math.PI;
        replacement.position.copy(clerkHand).lerp(shelf, Math.min(1,stockWait/1.2));
        if(stockWait >= 1.2) {
          meal.position.copy(shelf); meal.visible = true;
          S.stock.available = true; S.stock.restocks++;
          replacement.visible = false; carried=false; returning = true; stockWait = 0; restockIndex--;
        }
      } else {
        restockIndex += returning ? -1 : 1;
        if(restockIndex < 0) { clerk.group.rotation.y=Math.PI/2; clerk.legs.forEach(function(l){l.rotation.x=0;}); }
      }
      if(carried && stockWait===0) replacement.position.copy(clerkHand);
      if(restockIndex<0){
        replacement.position.copy(sparePosition);
        replacement.visible=true;
      }
    }
    var tick = 0;
    S.addUpdate(function (t, dt) {
      tick = t;
      S.doorDemand = false;
      S.people.forEach(function (p, personIndex) {
        if (p.staff) {
          if(restockIndex < 0) p.group.rotation.y = Math.PI/2 + Math.sin(t * .25) * .12;
          p.arms[0].rotation.x = shopper.action === 'pay' ? -1.05 : -.15 + Math.sin(t * 1.2) * .12;
          p.shadow.position.set(p.group.position.x, .115, p.group.position.z);
          return;
        }
        if (p.boarded) return;
        var pos = p.group.position, target = p.route[p.next];
        var dx = target.x - pos.x, dz = target.z - pos.z, distance = Math.hypot(dx, dz);
        var nearDoor = Math.abs(pos.x - entry.x) < .65 && pos.z > entry.sensorBack && pos.z < entry.sensorFront;
        if (nearDoor) S.doorDemand = true;
        var folding = p.action !== 'unfold' && target.fold && (!target.board || S.bus.canBoard);
        p.folding += ((folding ? 0 : 1) - p.folding) * Math.min(1, dt * 4);
        p.umbrella.scale.set(Math.max(.12, p.folding), 1, Math.max(.12, p.folding));
        p.umbrella.visible = p.folding > .08;
        var blocked = (p === shopper && target.action === 'pick' && !S.stock.available) || (p === shopper && target.action === 'pay' && restockIndex >= 0) || (target.door && S.door.open < .85) || (target.board && !S.bus.canBoard);
        // Once committed to crossing, continue to the opposite curb.
        if (target.crossing && distance > 7.6 && !S.traffic.canEnter) blocked = true;
        S.people.forEach(function (other, otherIndex) {
          if (other === p || other.staff || distance < .01 || otherIndex > personIndex) return;
          var ox = other.group.position.x - pos.x, oz = other.group.position.z - pos.z;
          if (Math.hypot(ox, oz) < .58 && (ox * dx + oz * dz) / distance > .15) blocked = true;
        });
        var step = 0;
        if (p.wait > 0) p.wait = Math.max(0, p.wait - dt);
        else if (!blocked && distance > .02) {
          step = Math.min(distance, dt * (target.crossing ? 1.65 : p.speed));
          pos.x += dx / distance * step; pos.z += dz / distance * step;
          var angle = Math.atan2(dx, dz), delta = Math.atan2(Math.sin(angle - p.group.rotation.y), Math.cos(angle - p.group.rotation.y));
          p.group.rotation.y += delta * Math.min(1, dt * 7);
        } else if (distance <= .02) {
          p.wait = target.wait || 0;
          p.action = target.action;
          p.actionDuration = p.wait;
          if (p.action === 'board') {
            p.boarded = true;
            p.group.visible = p.shadow.visible = false;
          }
          if (p === shopper && p.action === 'reset') {
            paid = false; p.hasMeal = false; p.hasBag = false;
            S.registerScreen.map = S.registerIdle;
            S.receipt.visible = false;
          }
          if (target.face !== undefined) p.group.rotation.y = target.face;
          p.next = (p.next + 1) % p.route.length;
        }
        p.distance += step;
        var stride = step > 0 ? Math.sin(p.distance * 9) * .42 : 0;
        p.legs[0].rotation.x = stride; p.legs[1].rotation.x = -stride;
        p.arms[0].rotation.x = p === shopper && (p.hasMeal || p.action === 'pick' || p.action === 'pay') ? -.95 : -stride * .6;
        p.arms[1].rotation.x = p.umbrella.visible ? -.8 : stride * .6;
        p.torso.position.y = step > 0 ? Math.abs(Math.sin(p.distance * 9)) * .025 : Math.sin(t * 1.5) * .008;
        p.umbrella.rotation.z = Math.sin(t * 2 + p.speed) * .025;
        var ground = S.groundHeight(pos.x, pos.z);
        if (target.board && pos.x < stop.laneX + 1.16) {
          ground = .085 + .88 * S.clamp((stop.laneX + 1.16 - pos.x) / .58, 0, 1);
        }
        pos.y = ground - .08;
        p.shadow.position.set(pos.x, S.groundHeight(pos.x, pos.z) + .005, pos.z);
      });

      var progress = shopper.actionDuration ? 1 - shopper.wait / shopper.actionDuration : 0;
      shopper.arms[0].updateWorldMatrix(true, false);
      shopper.arms[0].localToWorld(hand.set(0, -.4, .05));
      if (shopper.action === 'pick') {
        S.stock.available = false;
        meal.position.copy(shelf).lerp(hand, Math.min(1, progress * 1.6));
        shopper.hasMeal = true;
      } else if (shopper.action === 'pay') {
        meal.position.copy(hand).lerp(checkout, Math.min(1, progress * 3));
        if (!paid && progress >= .48) {
          paid = true; S.stock.scans++;
          S.receipt.visible = true;
          S.registerScreen.map = S.registerPaid;
          if (S.playSceneSound) S.playSceneSound('scan');
        }
        S.scannerLight.color.setHex(paid ? 0xc7f9be : 0x7eafa3);
        if(progress >= .55) meal.position.copy(checkout).lerp(bagSpot,Math.min(1,(progress-.55)/.2));
        if (progress >= .75) { shopper.hasMeal = false; shopper.hasBag = true; }
      } else {
        meal.position.copy(shopper.hasMeal ? hand : shelf);
      }
      meal.visible = S.stock.available || (!!shopper.hasMeal && !shopper.hasBag);
      shopper.bag.visible = !!shopper.hasBag;
      if (shopper.hasBag) {
        shopper.bag.position.copy(shopper.action === 'pay' ? bagSpot.clone().lerp(hand,S.clamp((progress-.75)/.25,0,1)) : hand);
        shopper.bag.rotation.y = shopper.group.rotation.y;
      }
      clerk.arms[0].rotation.x = restockIndex >= 0 ? -.95 : clerk.arms[0].rotation.x;
      clerk.arms[0].updateWorldMatrix(true,false);
      clerk.arms[0].localToWorld(clerkHand.set(0,-.4,.05));
      restock(dt);
    });
  };
})(window.S);

/* A curbside service shares the crossing phase with pedestrians. */
(function (S) {
  S.buildBus = function () {
    var stop = S.layout.busStop;
    var bus = S.group();
    var trim = S.toon(0x283841), teal = S.toon(0x46847e), cream = S.toon(0xe1d7b5);
    var glass = S.glass(0x9dbdc8, .42), lit = S.basic(0xffe3ad);
    function box(w, h, d, mat, x, y, z, parent) {
      return S.box(w, h, d, mat, x, y, z, { parent: parent || bus });
    }
    box(1.88, .58, 4.55, teal, 0, .67, 0);
    box(1.88, .13, 4.54, cream, 0, 2.34, 0);
    box(1.7, .09, 4.33, S.toon(0x746b52), 0, .97, 0);
    box(1.89, 1.32, .09, teal, 0, 1.62, -2.22);
    box(1.8, .69, .035, glass, 0, 1.75, 2.26);
    box(1.88, .42, .13, teal, 0, 1.12, 2.2);
    [-1, 1].forEach(function (side) {
      var x = side * .94;
      [1.55, -1.45].forEach(function (z) {
        S.cyl(.32, .32, .15, 12, trim, x, .33, z, { parent: bus, rz: Math.PI / 2 });
      });
      box(.18, .16, .04, lit, side * .68, .71, 2.28);
      box(.18, .14, .04, S.basic(0xb53b39), side * .68, .71, -2.28);
      box(.06, .11, 4.46, cream, x, 2.22, 0);
      var bays = side > 0 ? [[-1.97, .5], [.7, 2.95]] : [[0, 4.45]];
      bays.forEach(function (bay) {
        box(.06, .42, bay[1], teal, x, 1.19, bay[0]);
        box(.035, .72, bay[1], glass, x, 1.79, bay[0]);
      });
      [-2.19, -.49, .42, 1.37, 2.19].forEach(function (z) {
        box(.065, 1.26, .06, trim, x, 1.66, z);
      });
    });
    box(1.35, .025, 2.9, lit, 0, 2.25, -.2);
    [-1.72, .55, 1.35].forEach(function (z) {
      box(.56, .13, .39, cream, -.47, 1.29, z);
      box(.54, .42, .08, cream, -.47, 1.53, z - .2);
    });
    S.plane(1.32, .22, S.basic(0xffffff, {
      map: S.tex.label('02   最終', '夜灯駅', '#243944', '#ffdf9e')
    }), 0, 2.20, 2.29, { parent: bus });
    var doors = [-1.43, -.91].map(function (z) {
      var leaf = S.group(bus);
      leaf.position.set(.96, 0, z);
      box(.055, 1.30, .51, cream, 0, 1.60, 0, leaf);
      box(.06, .74, .42, S.toon(0x57737b), .02, 1.82, 0, leaf);
      return leaf;
    });
    box(.15, .12, .92, trim, 1.00, .32, -1.17);
    box(.18, .14, .92, trim, .87, .58, -1.17);
    box(.20, .14, .92, trim, .72, .80, -1.17);
    var boardingZ = stop.boardingZ + 1.17;
    var state = S.bus = { phase: 'away', canBoard: false, z: -15.6, door: 0, cycles: 0 };
    var timer = 9;
    function change(phase, seconds) { state.phase = phase; timer = seconds; }
    S.addUpdate(function (t, dt) {
      timer -= dt;
      var p = S.passenger;
      if (state.phase === 'away' && timer <= 0) change('approach', 0);
      if (state.phase === 'approach') {
        // Front bumper stays short of the crossing until the signal is green.
        var waitLine = -1.04;
        state.z = Math.min(waitLine, state.z + dt * 3);
        if (state.z >= waitLine && t % 24 < 4 && S.traffic.vehicleLight === 2) change('cross', 0);
      } else if (state.phase === 'cross') {
        var remaining = boardingZ - state.z;
        state.z += Math.min(remaining, dt * Math.min(3.6, .6 + remaining));
        if (remaining <= .001) change('stop', 12);
      } else if (state.phase === 'stop' && ((p.boarded && timer <= 8) || (timer <= 0 && p.next !== p.route.length - 1))) {
        change('close', 1.1);
      } else if (state.phase === 'close' && timer <= 0) {
        change('depart', 0);
      } else if (state.phase === 'depart') {
        state.z += dt * 3.1;
        if (state.z >= 15.6) {
          if (p.boarded) {
            var start = p.route[0];
            p.next = 1; p.wait = 5; p.action = null; p.boarded = false;
            p.group.position.set(start.x, S.groundHeight(start.x, start.z) - .08, start.z);
            p.group.visible = p.shadow.visible = true;
          }
          state.z = -15.6;
          state.cycles++;
          change('away', 17);
        }
      }
      state.door = S.clamp(state.door + (state.phase === 'stop' ? 1 : -1) * dt * 1.4, 0, 1);
      state.canBoard = state.phase === 'stop' && state.door >= .98;
      doors[0].position.z = -1.43 - .50 * state.door;
      doors[1].position.z = -.91 + .50 * state.door;
      bus.position.set(stop.laneX, .008, state.z);
      bus.visible = state.phase !== 'away';
    });
    bus.visible = false;
  };
})(window.S);

/* ============================================================
   effects.js — rain, drips, ripples, glass streaks, flicker, doors
   ============================================================ */
(function (S) {
  var T = THREE;

  function inShop(x, z) {
    return x > S.SHOP.x0 - 0.15 && x < S.SHOP.x1 + 0.15 && z > S.SHOP.z0 - 0.15 && z < S.SHOP.z1 + 0.15;
  }
  function r(a, b) { return a + (b - a) * Math.random(); }

  S.buildEffects = function () {
    rainLayer(1150, 0.15, 7.5, 0.48);
    rainLayer(160, 0.10, 11.5, 0.8);
    ripples();
    eaveDrips();
    glassStreaks();
    registerMotion();
  };

  /* ---------- falling rain (two depth layers) ---------- */
  function rainLayer(count, alpha, speed, maxLen) {
    var pos = new Float32Array(count * 6);
    var col = new Float32Array(count * 6);
    var d = [];
    for (var i = 0; i < count; i++) d.push({ x: 0, y: 0, z: 0, v: 0, len: 0, tx: 0, tz: 0, floor: 0 });

    function reset(k, initial) {
      var o = d[k];
      var bounds = S.layout.bounds;
      o.x = r(bounds.minX, bounds.maxX); o.z = r(bounds.minZ, bounds.maxZ);
      o.y = initial ? r(0.2, 13) : r(9.5, 13.5);
      o.v = speed * r(0.75, 1.35);
      o.len = maxLen * r(0.45, 1);
      o.tx = o.len * 0.14; o.tz = o.len * 0.035;
      o.shelter = S.shelterRainFloor(o.x,o.z);
      o.floor = S.rainFloor(o.x, o.z, o.shelter);
      if (initial) o.y = Math.max(o.y, o.floor + o.len + .1);
      /* raindrops catch the neon where the lights are */
      var warm = Math.max(0, 1 - Math.hypot(o.x + 1.5, o.z - 1) / 6);
      var pink = Math.max(0, 1 - Math.hypot(o.x - 3.4, o.z + 0.8) / 3.5);
      var blue = Math.max(0, 1 - Math.hypot(o.x - 6.4, o.z - 1.4) / 5);
      var cr = 0.48 + warm * 0.42 + pink * 0.30 + blue * 0.05;
      var cg = 0.66 + warm * 0.22 + pink * 0.02 + blue * 0.18;
      var cb = 0.92 - warm * 0.30 + pink * 0.05 + blue * 0.06;
      for (var v = 0; v < 2; v++) {
        col[k * 6 + v * 3] = cr; col[k * 6 + v * 3 + 1] = cg; col[k * 6 + v * 3 + 2] = cb;
      }
    }
    for (var i0 = 0; i0 < count; i0++) {
      reset(i0, true);
      var o = d[i0];
      pos[i0 * 6] = o.x; pos[i0 * 6 + 1] = o.y; pos[i0 * 6 + 2] = o.z;
      pos[i0 * 6 + 3] = o.x + o.tx; pos[i0 * 6 + 4] = o.y - o.len; pos[i0 * 6 + 5] = o.z + o.tz;
    }

    var geom = new T.BufferGeometry();
    geom.setAttribute('position', new T.BufferAttribute(pos, 3));
    geom.setAttribute('color', new T.BufferAttribute(col, 3));
    var mat = new T.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: alpha,
      depthWrite: false, blending: T.AdditiveBlending, fog: true
    });
    var lines = new T.LineSegments(geom, mat);
    lines.frustumCulled = false;
    S.world.add(lines);

    S.addUpdate(function (t, dt) {
      var visibleCount = Math.floor(count * S.rainIntensity * (S.quality === 'low' ? .55 : 1));
      geom.setDrawRange(0, visibleCount * 2);
      var pA = geom.attributes.position, cA = geom.attributes.color;
      for (var k = 0; k < visibleCount; k++) {
        var o = d[k];
        o.floor = S.rainFloor(o.x, o.z, S.legacyTuning ? undefined : o.shelter);
        o.y -= o.v * dt;
        if (o.y - o.len < o.floor) {
          reset(k, false);
          for (var v = 0; v < 2; v++) {
            cA.array[k * 6 + v * 3] = col[k * 6 + v * 3];
            cA.array[k * 6 + v * 3 + 1] = col[k * 6 + v * 3 + 1];
            cA.array[k * 6 + v * 3 + 2] = col[k * 6 + v * 3 + 2];
          }
          cA.needsUpdate = true;
        }
        var b = k * 6;
        pA.array[b] = o.x; pA.array[b + 1] = o.y; pA.array[b + 2] = o.z;
        pA.array[b + 3] = o.x + o.tx; pA.array[b + 4] = o.y - o.len; pA.array[b + 5] = o.z + o.tz;
      }
      pA.needsUpdate = true;
    });
  }

  /* ---------- water dripping off the awning ---------- */
  function eaveDrips() {
    var pts = S.eaveDripPoints;
    var drops = [];
    var dropMat = S.basic(0xc7e6f7, { transparent: true, opacity: .75, depthWrite: false });
    pts.forEach(function (p, i) {
      for (var j = 0; j < 2; j++) {
        var m = S.sphere(0.032, dropMat, p[0], p[1], p[2], {});
        m.visible = false;
        drops.push({ mesh: m, x: p[0], z: p[2], y: p[1], v: 0, wait: r(0.1, 2.6) + i * 0.07 });
      }
    });
    S.addUpdate(function (t, dt) {
      drops.forEach(function (d,index) {
        if(S.quality==='low' && index%2){d.mesh.visible=false;return;}
        if (d.wait > 0) { d.wait -= dt; d.mesh.visible = false; return; }
        d.mesh.visible = true;
        d.v += 12 * dt;
        d.y -= d.v * dt;
        d.mesh.position.set(d.x, d.y, d.z);
        d.mesh.scale.set(0.8, 1.5, 0.8);
        if (d.y < S.groundHeight(d.x, d.z) + .02) {
          d.y = 3.15; d.v = 0; d.wait = r(.5, 3.2) / S.rainIntensity;
          if (Math.abs(d.x + .8) < 1.35 && S.playSceneSound) S.playSceneSound('drip');
          S.spawnRipple(d.x, d.z, 0.55);
        }
      });
    });
  }

  /* ---------- expanding rings on puddles ---------- */
  var pool = [];
  function ripples() {
    var ring=new T.RingGeometry(.80,1,24);
    for (var i = 0; i < 34; i++) {
      var m = new T.Mesh(
        ring,
        new T.MeshBasicMaterial({ color: 0xbfe0f5, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending })
      );
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      S.world.add(m);
      pool.push({ mesh: m, life: 0, dur: 1, size: 1 });
    }
    S.spawnRipple = function (x, z, size) {
      var maxRings=S.quality==='low'?12:pool.length;
      for (var i = 0; i < maxRings; i++) {
        var p = pool[i];
        if (!p.mesh.visible) {
          p.mesh.visible = true;
          p.mesh.position.set(x, S.groundHeight(x, z) + .012, z);
          p.life = 0; p.dur = r(0.9, 1.7); p.size = size || r(0.5, 1.3);
          p.mesh.scale.setScalar(0.1);
          return;
        }
      }
    };
    var acc = 0;
    S.addUpdate(function (t, dt) {
      acc += dt;
      if (acc > (S.quality==='low'?.22:.12) / S.rainIntensity) {
        acc = 0;
        var pd = S.puddles[Math.floor(Math.random() * S.puddles.length)];
        if (pd) S.spawnRipple(pd.x + r(-pd.r, pd.r), pd.z + r(-pd.r * 0.7, pd.r * 0.7), r(0.35, 1.0));
      }
      pool.forEach(function (p) {
        if (!p.mesh.visible) return;
        p.life += dt;
        var u = p.life / p.dur;
        if (u >= 1) { p.mesh.visible = false; p.mesh.material.opacity = 0; return; }
        p.mesh.scale.setScalar((0.12 + u * 1.1) * p.size);
        p.mesh.material.opacity = 0.42 * (1 - u) * (1 - u);
      });
    });
  }

  /* ---------- streaks of rain sliding down the shop windows ---------- */
  function glassStreaks() {
    var tex = S.tex.glassStreak();
    var streaks = [];
    for (var i = 0; i < 22; i++) {
      var front = i < 14;
      var m = new T.Mesh(new T.PlaneGeometry(0.035, 0.55),
        new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: r(0.18, 0.42), depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }));
      var st = { mesh: m, front: front, y: r(0.4, 2.8), v: r(0.16, 0.48), len: 0.55, x: 0, z: 0 };
      place(st, true);
      S.world.add(m);
      streaks.push(st);
    }
    function place(st, initial) {
      if (st.front) {
        st.x = r(-5.9, 2.5); st.z = -1.535;
        st.mesh.rotation.set(0, 0, 0);
      } else {
        st.x = 2.865; st.z = r(-6.4, -1.9);
        st.mesh.rotation.set(0, Math.PI / 2, 0);
      }
      st.y = initial ? r(0.4, 2.8) : r(2.6, 3.0);
      st.mesh.position.set(st.x, st.y, st.z);
      st.mesh.scale.set(r(0.7, 1.4), r(0.7, 1.6), 1);
    }
    S.addUpdate(function (t, dt) {
      streaks.forEach(function (st) {
        st.y -= st.v * dt;
        if (st.y < 0.28) place(st, false);
        else st.mesh.position.y = st.y;
      });
    });
  }

  /* ---------- flicker, reflections, doors, signal, steam ---------- */
  function registerMotion() {
    S.signMaterials.forEach(function (m) { m.transparent = true; m.opacity = 1; });

    /* automatic door: absolute-time cycle so it stays in sync at any frame rate */
    var doorOpen = 0, doorHold = 0;
    S.addUpdate(function (t, dt) {
      doorHold = (S.doorDemand || (S.cameraAtDoor && S.cameraAtDoor())) ? 1.3 : Math.max(0, doorHold - dt);
      var doorTarget = doorHold > 0 ? 1 : 0;
      if(doorTarget && doorOpen<.08 && doorOpen+dt*4.2*(1-doorOpen)>=.08 && S.playSceneSound) S.playSceneSound('door');
      doorOpen += (doorTarget - doorOpen) * Math.min(1, dt * 4.2);
      if (S.door) {
        S.door.open = doorOpen;
        S.door.left.position.x = S.door.closedL - 0.63 * doorOpen;
        S.door.right.position.x = S.door.closedR + 0.63 * doorOpen;
      }
    });

    /* sign flicker + neon breathing */
    var glitch = 0, nextGlitch = r(2, 6);
    S.addUpdate(function (t, dt) {
      nextGlitch -= dt;
      if (nextGlitch <= 0) { glitch = r(0.05, 0.16); nextGlitch = r(18, 35); }
      var dip = glitch > 0 ? 0.88 : 1;
      if (glitch > 0) glitch -= dt;
      var breathe = 0.96 + 0.045 * Math.sin(t * 2.1) + 0.02 * Math.sin(t * 7.7);
      S.signMaterials.forEach(function (m, i) { m.opacity = Math.min(1, breathe * dip + i * 0.004); });
      S.neonExtras.forEach(function (n) {
        n.sprite.material.opacity = n.base * (0.88 + 0.12 * Math.sin(t * 1.7 + n.phase)) * dip;
      });
    });

    /* wet reflections shimmer + puddle breathe */
    S.addUpdate(function (t, dt) {
      S.reflections.forEach(function (r) {
        r.mesh.material.opacity = r.base * (0.84 + 0.16 * Math.sin(t * 1.25 + r.phase));
        r.mesh.scale.y = 1 + 0.035 * Math.sin(t * 1.9 + r.phase);
      });
      S.puddles.forEach(function (p, i) {
        if (p.mesh) p.mesh.material.opacity = 0.86 + 0.14 * Math.sin(t * 0.9 + i);
      });
    });

    /* distant traffic signal slowly cycles */
    S.addUpdate(function (t) {
      var sig = S.trafficSignal;
      if (!sig) return;
      var active = S.traffic.vehicleLight;
      sig.lights.forEach(function (l, i) {
        var on = i === active;
        var c = l.glow.material.color;
        l.mat.color.setRGB(
          (c.r) * (on ? 1 : 0.16),
          (c.g) * (on ? 1 : 0.16),
          (c.b) * (on ? 1 : 0.16)
        );
        l.glow.material.opacity = on ? (0.36 + 0.06 * Math.sin(t * 3)) : 0.0;
      });
    });
  }
})(window.S);

/* Field-recorded rain. Lazy loaded, quiet by default, no autoplay. */
(function (S) {
  var context, source, gain, filter, hum, humGain, enabled = false;
  var stepTime=0;
  var button = document.getElementById('rain-audio');
  var volume = document.getElementById('rain-volume');
  var status = document.getElementById('audio-status');
  function volumeLevel() { return Math.pow(Number(volume.value) / 100, 1.6); }
  function indoors() {
    if(S.isStoreView) return S.isStoreView(S.view) && S.camera && S.inShop && S.inShop(S.camera.position);
    return ['interior','bento','checkout','drinks'].indexOf(S.view)!==-1;
  }
  function level() {
    var shelter = indoors() ? .42 : S.view === 'entrance' ? .76 : S.view === 'stop' ? .85 : 1;
    return volumeLevel() * shelter * (.55 + .45 * S.rainIntensity);
  }
  S.refreshAudio = function () {
    if (!enabled || !filter) return;
    var cutoff = indoors() ? 680 : S.view === 'entrance' ? 2300 : 5200;
    filter.frequency.setTargetAtTime(cutoff, context.currentTime, .2);
    fade(level(), .35);
    if(humGain) humGain.gain.setTargetAtTime(indoors()?volumeLevel()*.011:0,context.currentTime,.3);
  };
  S.playSceneSound = function (name) {
    if (!enabled || document.hidden || context.state !== 'running') return;
    var drip = name === 'drip';
    if (drip && S.view !== 'entrance') return;
    var now = context.currentTime, voice = context.createOscillator(), env = context.createGain();
    var step=name==='step', door=name==='door';
    var duration = step?.09:door?.18:drip?.055:.10;
    voice.type = 'sine';
    voice.frequency.setValueAtTime(step?110:door?640:drip?710:1040,now);
    voice.frequency.exponentialRampToValueAtTime(step?47:door?880:drip?370:820,now+duration);
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(volumeLevel() * (step?.038:door?.045:drip?.035*S.rainIntensity:indoors()?.12:.035), now + .006);
    env.gain.linearRampToValueAtTime(0, now + duration);
    voice.connect(env); env.connect(context.destination);
    voice.onended = function () { voice.disconnect(); env.disconnect(); };
    voice.start(now); voice.stop(now + duration);
  };
  S.walkAmbience=function(dt){
    if(!enabled || !indoors()) return;
    stepTime+=dt;
    if(stepTime>.48){stepTime=0;S.playSceneSound('step');}
  };
  function fade(value, seconds) {
    var now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(value, now + seconds);
  }
  async function prepare() {
    var response = await fetch('assets/audio/rain-street.mp3');
    if (!response.ok) throw new Error('Rain asset unavailable');
    var buffer = await context.decodeAudioData(await response.arrayBuffer());
    // Blend the last four seconds into the start, then loop to second four.
    var overlap = Math.floor(buffer.sampleRate * 4);
    for (var c = 0; c < buffer.numberOfChannels; c++) {
      var data = buffer.getChannelData(c);
      for (var i = 0; i < overlap; i++) {
        var t = i / (overlap - 1), end = data.length - overlap + i;
        data[end] = data[end] * Math.cos(t * Math.PI / 2) + data[i] * Math.sin(t * Math.PI / 2);
      }
    }
    source = context.createBufferSource(); source.buffer = buffer;
    source.loop = true; source.loopStart = 4; source.loopEnd = buffer.duration;
    gain = context.createGain(); gain.gain.value = 0;
    filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    source.connect(filter); filter.connect(gain); gain.connect(context.destination);
    source.start(0, 4);
    hum=context.createOscillator();
    hum.type='sine';
    hum.frequency.value=61;
    humGain=context.createGain();humGain.gain.value=0;
    hum.connect(humGain);humGain.connect(context.destination);hum.start();
  }
  button.addEventListener('click', async function () {
    button.disabled = true;
    try {
      if (!context) {
        context = new (window.AudioContext || window.webkitAudioContext)();
        // Resume in the user gesture, before awaiting the download (Safari).
        await context.resume();
        status.textContent = '正在加载雨声…';
        await prepare();
      }
      if (enabled) {
        fade(0, .45);
        if(humGain) humGain.gain.setTargetAtTime(0,context.currentTime,.13);
        await new Promise(function (resolve) { setTimeout(resolve, 500); });
        await context.suspend(); enabled = false;
      } else {
        await context.resume();
        if (context.state !== 'running') throw new Error('Audio suspended');
        enabled = true; S.refreshAudio();
        if (document.hidden) await context.suspend();
      }
      button.textContent = enabled ? '雨声：开' : '雨声：关';
      button.setAttribute('aria-pressed', String(enabled));
      status.textContent = '';
    } catch (error) {
      if (context) { try { await context.close(); } catch (_) {} }
      context = source = gain = filter = hum = humGain = null; enabled = false;
      button.textContent = '雨声重试'; button.setAttribute('aria-pressed', 'false');
      status.textContent = '雨声暂时无法播放，请重试';
    } finally { button.disabled = false; }
  });
  volume.addEventListener('input', function () {
    volume.setAttribute('aria-valuetext', volume.value + '%');
    if (gain && enabled) S.refreshAudio();
  });
  document.addEventListener('visibilitychange', async function () {
    if (!context || !enabled) return;
    try {
      if (document.hidden) await context.suspend();
      else { await context.resume(); fade(level(), .6); }
    } catch (_) { status.textContent = '点击雨声按钮可恢复播放'; }
  });
})(window.S);

/* Local, reversible product inspection; shop inventory remains owned by the NPCs. */
(function(S){
  var T=THREE;
  var ray=new T.Raycaster(), pointer=new T.Vector2();
  var saved=new T.Matrix4(), hidden=new T.Matrix4().makeScale(0.00001,0.00001,0.00001);
  var active=null, held=null, panel, title, note, action, blockers=[];
  var itemPosition=new T.Vector3(), instanceTransform=new T.Matrix4();
  var visibleBlockers=[], blockerHits=[], productHits=[];

  S.pickProduct=function(x,y){
    if(!S.isStoreView(S.view) || !S.inShop(S.camera.position)) return null;
    S.camera.updateMatrixWorld();
    S.world.updateMatrixWorld(true);
    pointer.set(x,y);
    ray.setFromCamera(pointer,S.camera);
    ray.far=1.70;
    productHits.length=0;
    var hit=ray.intersectObjects(Object.values(S.productBatches),false,productHits)[0];
    if(!hit) return null;
    visibleBlockers.length=0;
    for(var i=0;i<blockers.length;i++){
      var parent=blockers[i];
      while(parent && parent.visible) parent=parent.parent;
      if(!parent) visibleBlockers.push(blockers[i]);
    }
    ray.far=hit.distance-.015;
    blockerHits.length=0;
    if(ray.intersectObjects(visibleBlockers,false,blockerHits).length) return null;
    var meta=hit.object.userData;
    return {mesh:hit.object,index:hit.instanceId,product:meta.product||S.products[meta.productId]};
  };

  function showInfo(selection){
    active=selection;
    panel.hidden=!selection;
    if(!selection) return;
    var info=selection.product;
    title.textContent=info.type+'  ·  ¥'+info.price;
    note.textContent=info.title;
    action.textContent=held?'归位':'拿起来';
  }
  function returnProduct(fromButton){
    if(held){
      if(fromButton && S.perf) S.perf.interaction('商品归位');
      held.mesh.setMatrixAt(held.index,saved);
      held.mesh.instanceMatrix.needsUpdate=true;
      S.camera.remove(held.model);
      held=null;
    }
    if(panel) showInfo(null);
  }
  S.returnProduct=returnProduct;
  S.inspectProduct=function(x,y){
    if(!panel || document.body.classList.contains('photo')) return;
    if(held) return;
    if(S.perf) S.perf.interaction('查看商品');
    showInfo(S.pickProduct(x,y));
  };
  function takeProduct(){
    if(!active || held) { returnProduct(true); return; }
    if(S.perf) S.perf.interaction('拿取商品');
    active.mesh.getMatrixAt(active.index,saved);
    active.mesh.setMatrixAt(active.index,hidden);
    active.mesh.instanceMatrix.needsUpdate=true;
    var model=new T.Mesh(active.mesh.geometry,active.mesh.material);
    model.position.set(.19,-.26,-.53);
    model.rotation.set(-.15,-.27,.13);
    S.camera.add(model);
    held=Object.assign({model:model},active);
    showInfo(held);
  }
  S.installShopInteractions=function(){
    panel=document.getElementById('product-card');
    title=document.getElementById('product-title');
    note=document.getElementById('product-note');
    action=document.getElementById('take-product');
    action.onclick=takeProduct;
    document.getElementById('close-product').onclick=function(){returnProduct(true);};
    document.getElementById('inspect-product').onclick=function(){S.inspectProduct(0,0);};
    S.addShopBlockers(S.world);
    S.scene.add(S.camera);
    S.addUpdate(function(){
      if(active&&!held){
        active.mesh.getMatrixAt(active.index,instanceTransform);
        itemPosition.setFromMatrixPosition(instanceTransform);
        active.mesh.localToWorld(itemPosition);
        var eye=S.camera.position;
        if(Math.hypot(itemPosition.x-eye.x,itemPosition.z-eye.z)>1.85) showInfo(null);
      }
    });
  };

  S.addShopBlockers=function(root){
    root.traverse(function(object){
      if(object.isMesh && object.visible && !object.isInstancedMesh && !object.material.transparent){
        blockers.push(object);
      }
    });
  };
  S.inShop=function(position){
    var room=S.SHOP;
    return position.x>room.x0 && position.x<room.x1 && position.z>room.z0 && position.z<room.z1;
  };
})(window.S);

/* Optional Blender asset. The original cabinet remains a complete fallback. */
(function(S){
  var T=THREE;
  var initial=new T.Matrix4().makeScale(0.00001,0.00001,0.00001);

  S.createCoolerLoader=function(){
    var loader=new T.GLTFLoader();
    if(S.legacyTuning) return loader;
    loader.register(function(parser){
      return {
        name:'SharedCoolerAtlas',
        beforeRoot:function(){
          var textures=parser.json.textures, atlas=textures && textures[0];
          if(!atlas || atlas.extensions) return;
          // Blender exports separate slots for the same atlas and sampler.
          // Remap those slots before r128 decodes each into a GPU texture.
          parser.json.materials.forEach(function(material){
            var ref=material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture;
            if(!ref || ref.extensions) return;
            var texture=textures[ref.index];
            if(texture && !texture.extensions && texture.source===atlas.source && texture.sampler===atlas.sampler){
              ref.index=0;
            }
          });
        }
      };
    });
    return loader;
  };

  S.mountCoolerSample=function(model,fallback){
    var cabinet=model.getObjectByName('Cabinet');
    var stock=model.getObjectByName('Stock');
    var leaves=[model.getObjectByName('Door_L'),model.getObjectByName('Door_R')];
    if(!cabinet || !stock || leaves.some(function(leaf){return !leaf;})) throw new Error('Missing cabinet or hinge nodes');
    if(!fallback || fallback.doors.length!==2) throw new Error('Original hinges unavailable');

    model.updateMatrixWorld(true);
    var pools=Object.create(null);
    stock.traverse(function(object){
      if(!object.isMesh) return;
      var sku=object.userData.sku, id=object.userData.productId;
      if(!sku || !S.products[id]) throw new Error('Unrecognized drink: '+id);
      var product={
        id:id,
        title:object.userData.productTitle,
        price:object.userData.productPrice,
        type:S.products[id].type
      };
      if(!product.title || !Number.isFinite(product.price)) throw new Error('Missing drink label: '+sku);
      var pool=pools[sku] || (pools[sku]={product:product,geometry:object.geometry,material:object.material,matrices:[]});
      if(pool.geometry!==object.geometry || pool.material!==object.material) throw new Error('SKU meshes must share geometry and material');
      pool.matrices.push(object.matrixWorld.clone());
    });
    if(Object.keys(pools).length<6) throw new Error('Incomplete drink asset');

    var position=fallback.location;
    var assembly=new T.Group();
    assembly.name='Blender cooler sample';
    assembly.position.fromArray(position);
    cabinet.traverse(function(node){
      if(!node.isMesh) return;
      node.receiveShadow=true;
      if(!S.legacyTuning && node.material.name==='Baked cool bounce'){
        node.material.color.setRGB(.42,.47,.45);
        node.material.emissive.setRGB(.42,.45,.42);
      }
    });
    assembly.add(cabinet);

    var mounted=Object.create(null);
    Object.keys(pools).forEach(function(sku){
      var pool=pools[sku];
      var instance=new T.InstancedMesh(pool.geometry,pool.material,pool.matrices.length);
      instance.name='Blender SKU '+sku;
      instance.userData.product=pool.product;
      pool.matrices.forEach(function(matrix,index){instance.setMatrixAt(index,matrix);});
      instance.instanceMatrix.needsUpdate=true;
      // PBR goods get a little baked shelf bounce from their own packaging map.
      pool.material.emissive.setHex(0xffffff);
      pool.material.emissiveMap=pool.material.map;
      pool.material.emissiveIntensity=.105;
      mounted['cooler:'+sku]=instance;
      assembly.add(instance);
    });
    var leafVisuals=leaves.map(function(leaf,index){
      var visual=new T.Group();
      visual.name=leaf.name+' Blender finish';
      // The parent of the old hinge carries the historical X scale.
      visual.scale.x=1/fallback.widthScale;
      leaf.children.slice().forEach(function(child){visual.add(child);});
      visual.traverse(function(node){
        if(node.isMesh && node.material.transparent){
          // One thin pane per leaf, with stable sorting and visible interiors.
          node.material.depthWrite=false;
          node.material.side=T.DoubleSide;
          node.renderOrder=2;
          if(!S.legacyTuning){
            node.material.opacity*=.79;
            node.material.color.lerp(new T.Color(0xf2f7f4),.4);
          }
        }
      });
      return {hinge:fallback.doors[index],visual:visual};
    });

    // Do not touch the old scene until the entire authored asset is ready.
    if(S.returnProduct) S.returnProduct();
    fallback.body.forEach(function(object){object.visible=false;});
    leafVisuals.forEach(function(item){
      item.hinge.children.slice().forEach(function(old){old.visible=false;});
      item.hinge.add(item.visual);
      if(S.addShopBlockers) S.addShopBlockers(item.visual);
    });
    if(S.legacyTuning){
      fallback.stock.forEach(function(entry){
        var instance=S.productBatches[entry.id];
        if(instance) {instance.setMatrixAt(entry.index,initial);instance.instanceMatrix.needsUpdate=true;}
      });
    }else{
      S.removeStockInstances(fallback.stock);
    }
    Object.keys(mounted).forEach(function(key){S.productBatches[key]=mounted[key];});
    S.world.add(assembly);
    if(S.addShopBlockers) S.addShopBlockers(assembly);
    if(!S.legacyTuning) assembly.updateMatrixWorld(true);

    return assembly;
  };

  S.loadCoolerSample=function(){
    function state(value){
      S.coolerSampleState=value;
      if(window.rainPreview) window.rainPreview.cooler(value);
    }
    if(new URLSearchParams(location.search).get('cooler')==='original'){
      state('original');
      return Promise.resolve(false);
    }
    if(!T.GLTFLoader) {
      state('fallback');
      return Promise.resolve(false);
    }
    state('loading');
    if(S.perf) S.perf.mark('GLB 请求');
    return new Promise(function(resolve){
      var timeout=setTimeout(function(){fallback(new Error('Cooler asset timed out'));},18000);
      function fallback(error){
        if(S.coolerSampleState!=='loading') return;
        clearTimeout(timeout);
        state('fallback');
        console.warn('Blender cooler asset unavailable. Original cabinet retained.',error);
        resolve(false);
      }
      var loader=S.createCoolerLoader();
      var request=new T.FileLoader(loader.manager).setResponseType('arraybuffer');
      request.load('assets/models/yomachi-cooler.glb',function(bytes){
        if(S.coolerSampleState!=='loading') return;
        if(S.perf) S.perf.mark('GLB 到达');
        try {loader.parse(bytes,'',mount,fallback);}
        catch(error){fallback(error);}
      },undefined,fallback);
      function mount(result){
        if(S.coolerSampleState!=='loading') return;
        try {
          if(S.perf) S.perf.mark('GLB 解码完成');
          S.mountCoolerSample(result.scene,S.coolerFallback);
          clearTimeout(timeout);
          state('ready');
          if(S.perf) S.perf.mark('GLB 装配完成');
          resolve(true);
        }catch(error){fallback(error);}
      }
    });
  };
})(window.S);

/* Optional in-browser diagnostics. Time measurements run on the browser CPU. */
(function(S){
  var options=new URLSearchParams(location.search);
  var startupMarks=Object.create(null);
  var maxWindowSize=240;

  S.perf={
    mark:function(label){startupMarks[label]=performance.now();},
    interaction:function(){}
  };

  function rounded(value){return Math.round(value*10)/10;}

  S.installPerformancePanel=function(renderer){
    var panel=document.getElementById('perf-panel'), toggle=document.getElementById('perf-toggle');
    if(!panel || !toggle) return;
    var output=document.getElementById('perf-readout'), graph=document.getElementById('perf-graph');
    var showGraph=document.getElementById('perf-show-graph'), details=document.getElementById('perf-marks');
    var copy=document.getElementById('perf-copy'), exportField=document.getElementById('perf-export');
    var frames=new Float32Array(maxWindowSize), interactions=Object.create(null);
    var length=0, cursor=0, previous=0, lastDraw=0;
    var firstSceneWindow=0, scenePeak=0, firstAssetWindow=0, assetPeak=0;
    var currentInteraction=null, submit=0, open=false;
    var latest=null;

    function reset(){
      length=0;
      cursor=0;
      previous=0;
      lastDraw=0;
      latest=null;
      output.textContent='采样中…';
    }
    function setOpen(value){
      open=value;
      panel.hidden=!value;
      toggle.setAttribute('aria-expanded',String(value));
      renderer.info.autoReset=!value;
      if(value) reset();
    }
    toggle.disabled=false;
    toggle.onclick=function(){setOpen(!open);};
    document.getElementById('perf-close').onclick=function(){setOpen(false);};
    document.getElementById('perf-reset').onclick=function(){
      reset();
      interactions=Object.create(null);
      currentInteraction=null;
      exportField.hidden=true;
    };
    showGraph.onchange=function(){graph.hidden=!showGraph.checked;};
    document.addEventListener('visibilitychange',function(){if(open) reset();});
    setOpen(options.get('perf')==='1');

    function drawGraph(values){
      var ctx=graph.getContext('2d'), width=graph.width,height=graph.height;
      if(!ctx) return;
      ctx.clearRect(0,0,width,height);
      [16.7,33.3].forEach(function(limit){
        var heightAt=height-limit/70*height;
        ctx.fillStyle='#556670';
        ctx.fillRect(0,heightAt,width,1);
      });
      ctx.beginPath();
      ctx.strokeStyle='#aee1c7';
      var step=width/Math.max(1,values.length-1);
      values.forEach(function(ms,index){
        var y=height-Math.min(ms,70)/70*height;
        if(index) ctx.lineTo(index*step,y);
        else ctx.moveTo(0,y);
      });
      ctx.stroke();
    }

    function snapshot(){
      var values=[];
      for(var i=0;i<length;i++) values.push(frames[(cursor-length+i+maxWindowSize)%maxWindowSize]);
      var total=values.reduce(function(sum,value){return sum+value;},0);
      var sorted=values.slice().sort(function(a,b){return a-b;});
      var avg=total/length, timing=renderer.info.render;
      var report={
        variant:S.coolerSampleState, tuning:S.legacyTuning?'legacy':'optimized', quality:S.quality, view:S.view,
        viewport:innerWidth+' × '+innerHeight, devicePixelRatio:window.devicePixelRatio||1,
        buffer:renderer.domElement.width+' × '+renderer.domElement.height, pixelRatio:renderer.getPixelRatio(),
        samples:length, approximateSeconds:rounded(total/1000), fps:rounded(1000/avg), frameMeanMs:rounded(avg),
        frameP95Ms:rounded(sorted[Math.ceil(length*.95)-1]), frameMaxMs:rounded(sorted[length-1]),
        framesAbove33ms:values.filter(function(ms){return ms>33.4;}).length,
        calls:timing.calls, triangles:timing.triangles, cpuSubmitMs:rounded(submit),
        geometries:renderer.info.memory.geometries, textures:renderer.info.memory.textures,
        shaderPrograms:renderer.info.programs.length, shadowMap:renderer.shadowMap.enabled,
        startupMs:Object.fromEntries(Object.entries(startupMarks).map(function(entry){return [entry[0],rounded(entry[1])];})),
        sceneFirst1500msPeak:scenePeak?rounded(scenePeak):null,
        assetFirst1500msPeak:assetPeak?rounded(assetPeak):null,
        interactions:Object.fromEntries(Object.entries(interactions).map(function(entry){return [entry[0],entry[1].peak];}))
      };
      if(showGraph.checked) drawGraph(values);
      return report;
    }
    function display(){
      latest=snapshot();
      output.textContent=latest.fps+' FPS · 平均 '+latest.frameMeanMs+' ms · P95 '+latest.frameP95Ms+' ms\n'+
        'Draw calls '+latest.calls+' · 三角面 '+latest.triangles.toLocaleString()+'\n'+
        '像素比 '+rounded(latest.pixelRatio)+' / '+latest.devicePixelRatio+' · '+latest.buffer;
      details.textContent=Object.entries(latest.startupMs).map(function(entry){return entry[0]+' '+entry[1]+' ms';}).join('\n')+
        (latest.sceneFirst1500msPeak===null?'':'\n场景首帧后 1.5 秒最大帧间隔 '+latest.sceneFirst1500msPeak+' ms')+
        (latest.assetFirst1500msPeak===null?'':'\n新版首帧后 1.5 秒最大帧间隔 '+latest.assetFirst1500msPeak+' ms')+
        Object.keys(interactions).map(function(name){return '\n'+name+'后 1 秒最大帧间隔 '+interactions[name].peak+' ms';}).join('');
    }
    copy.onclick=function(){
      if(!latest) return;
      var text=JSON.stringify(latest,null,2);
      function showExport(){
        exportField.hidden=false;
        exportField.value=text;
        exportField.select();
      }
      if(navigator.clipboard) navigator.clipboard.writeText(text).then(function(){copy.textContent='已复制';},showExport);
      else showExport();
    };
    S.perf.beforeFrame=function(){
      if(!open) return 0;
      renderer.info.reset();
      return performance.now();
    };
    S.perf.frame=function(stamp,started){
      if(!open) return;
      submit=performance.now()-started;
      if(previous){
        var ms=stamp-previous;
        if(ms>0){
          if(stamp<firstSceneWindow) scenePeak=Math.max(scenePeak,ms);
          if(stamp<firstAssetWindow) assetPeak=Math.max(assetPeak,ms);
          frames[cursor]=ms;
          cursor=(cursor+1)%maxWindowSize;
          length=Math.min(length+1,maxWindowSize);
          if(currentInteraction && stamp<=currentInteraction.until) {
            currentInteraction.peak=rounded(Math.max(currentInteraction.peak,ms));
          }
        }
      }
      previous=stamp;
      if(length>0 && stamp-lastDraw>=750){
        lastDraw=stamp;
        display();
      }
    };
    S.perf.sceneFrame=function(){firstSceneWindow=performance.now()+1500;};
    S.perf.assetFrame=function(){firstAssetWindow=performance.now()+1500;};
    S.perf.interaction=function(name){
      if(!open) return;
      currentInteraction={peak:0,until:performance.now()+1000};
      interactions[name]=currentInteraction;
    };
    S.perf.reset=function(keepPrevious){
      if(!open) return;
      var latestStamp=previous;
      reset();
      if(keepPrevious) previous=latestStamp;
    };
    S.perf.report=function(){return latest;};
  };
})(window.S);

/* ============================================================
   main.js — assemble the diorama and run the render loop
   ============================================================ */
(function (S) {
  function reportError(message,error) {
    if(window.rainPreview) window.rainPreview.fail(message);
    else {
      document.getElementById('render-error').hidden = false;
      document.getElementById('controls').hidden = true;
    }
    console.error(error);
  }

  function boot() {
    if(S.perf) S.perf.mark('场景初始化开始');
    try { S.init(); } catch (error) {
      reportError('当前浏览器无法启动 WebGL。请在 Safari 或 Chrome 中直接打开后重试。',error);
      return;
    }
    try { startScene(); } catch (error) {
      reportError('3D 场景初始化失败。请重新加载。',error);
    }
  }

  function startScene() {
    /* build order: ground -> shell -> interior -> street props -> animation */
    S.buildBase();
    S.buildStore();
    S.buildInterior();
    S.buildStreet();
    S.buildNeighborhood();
    S.buildDetails();
    S.buildPeople();
    S.buildBus();
    S.buildEffects();
    S.installShopInteractions();
    if(S.perf) S.perf.mark('场景组装完成');
    if(S.installPerformancePanel) S.installPerformancePanel(S.renderer);
    if(S.legacyTuning && S.loadCoolerSample) S.loadCoolerSample();
    setupJoystick();
    S.resetView();
    var views = document.querySelectorAll('[data-view]');
    views.forEach(function (button) {
      button.onclick = function () {
        if(document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
        S.setView(button.dataset.view);
        if(S.perf && S.perf.reset) S.perf.reset();
        if(window.rainPreview) window.rainPreview.view(S.view==='cooler-art');
        document.getElementById('scene').focus({preventScroll:true});
        refreshWalkControls();
        views.forEach(function (other) {
          other.setAttribute('aria-pressed', String(other === button));
        });
      };
    });
    document.getElementById('walk-forward').onclick = function(){ S.walkStep(0,-.25); };
    document.getElementById('walk-back').onclick = function(){ S.walkStep(0,.25); };
    var walkControls = document.getElementById('walk-controls');
    var joystick = document.getElementById('joystick');
    var coldDoorButton = document.getElementById('cold-door');
    function refreshWalkControls() {
      var outside = !S.isStoreView(S.view);
      if(walkControls.hidden!==outside) walkControls.hidden=outside;
      if(joystick.hidden!==outside) joystick.hidden=outside;
      var door = outside ? null : S.nearbyColdDoor();
      if(coldDoorButton.hidden!==!door) coldDoorButton.hidden=!door;
      if (door) {
        var label = door.open ? '关闭冷柜' : '打开冷柜';
        if (coldDoorButton.textContent !== label) coldDoorButton.textContent = label;
      }
    }
    var controlsElapsed=0;
    S.addUpdate(function(t,dt){
      controlsElapsed+=dt;
      if(S.legacyTuning || controlsElapsed>=.08){
        refreshWalkControls();
        controlsElapsed=0;
      }
    });
    refreshWalkControls();
    coldDoorButton.onclick = function(){
      var door=S.nearbyColdDoor();
      if(!door) return;
      if(S.perf) S.perf.interaction(door.open?'关柜门':'开柜门');
      S.toggleColdDoor();
      refreshWalkControls();
    };
    var canvas=document.getElementById('scene');
    var lockButton=document.getElementById('mouse-lock');
    lockButton.hidden=!canvas.requestPointerLock;
    lockButton.onclick=function(){
      if(!canvas.requestPointerLock) return;
      if(document.pointerLockElement===canvas) {document.exitPointerLock();return;}
      try {
        var result=canvas.requestPointerLock();
        if(result && result.catch) result.catch(lockFailed);
      } catch(error){lockFailed();}
    };
    function lockFailed(){lockButton.textContent='可拖动转向';}
    document.addEventListener('pointerlockerror',lockFailed);
    document.addEventListener('pointerlockchange',function(){
      var locked=document.pointerLockElement===canvas;
      lockButton.setAttribute('aria-pressed',String(locked));
      lockButton.textContent=locked?'Esc 退出锁定':'锁定鼠标';
      if(locked) canvas.focus();
      S.resetWalkInput();
    });
    var quality = document.getElementById('quality');
    quality.value=S.initialQuality;

    S.setQuality(quality.value);
    quality.onchange = function () {
      if(S.perf && S.perf.reset){
        S.perf.reset(true);
        S.perf.interaction(quality.value==='high'?'切换高清':'切换流畅');
      }
      S.setQuality(quality.value);
    };
    document.getElementById('weather').onchange = function (e) {
      S.rainIntensity = Number(e.target.value);
      S.refreshAudio();
    };
    document.getElementById('photo').onclick = function () {
      S.returnProduct();
      S.resetWalkInput();
      document.body.classList.add('photo');
      document.getElementById('exit-photo').focus();
    };
    function exitPhoto() {
      if (!document.body.classList.contains('photo')) return;
      document.body.classList.remove('photo');
      document.getElementById('photo').focus();
    }
    document.getElementById('exit-photo').onclick = exitPhoto;
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') exitPhoto(); });

    if(new URLSearchParams(location.search).get('view')==='cooler-art'){
      var sampleView=document.querySelector('[data-view="cooler-art"]');
      if(sampleView) sampleView.click();
    }
    var clock = new THREE.Clock();
    var firstFrame=true, firstAssetFrame=true;
    function frame(stamp) {
      var dt = Math.min(clock.getDelta(), 0.10);
      if(!document.hidden){
        var renderStart=S.perf && S.perf.beforeFrame ? S.perf.beforeFrame() : 0;
        try {
          S.simulationTime = (S.simulationTime || 0) + dt;
          var t = S.simulationTime;
          S.updateTraffic(t);
          S.updateCamera(dt);
          for (var i = 0; i < S.updaters.length; i++) S.updaters[i](t, dt);
          S.renderer.render(S.scene, S.camera);
        } catch(error){
          reportError('3D 渲染失败。请重新加载。',error);
          return;
        }
        if(firstFrame && S.renderer.info.render.calls>0){
          firstFrame=false;
          if(S.perf){
            S.perf.mark('场景首帧提交');
            if(S.perf.sceneFrame) S.perf.sceneFrame();
          }
          if(window.rainPreview) window.rainPreview.ready();
          if(!S.legacyTuning && S.loadCoolerSample) S.loadCoolerSample();
        }
        if(firstAssetFrame && S.coolerSampleState==='ready'){
          firstAssetFrame=false;
          if(S.perf) {
            S.perf.mark('冷柜装配后首帧提交');
            if(S.perf.assetFrame) S.perf.assetFrame();
          }
        }
        if(S.perf && S.perf.frame) S.perf.frame(stamp,renderStart);
      }
      requestAnimationFrame(frame);
    }
    frame(performance.now());
  }

  function setupJoystick(){
    var base=document.getElementById('joystick'), knob=base.firstElementChild;
    var active=null, originX=0, originY=0, limit=29;
    function move(e){
      if(active!==e.pointerId) return;
      var dx=e.clientX-originX, dy=e.clientY-originY;
      var factor=Math.max(1,Math.hypot(dx,dy)/limit);
      dx/=factor; dy/=factor;
      S.walkInput.side=dx/limit; S.walkInput.back=dy/limit;
      knob.style.transform='translate('+dx+'px,'+dy+'px)';
    }
    function reset(){
      active=null;
      S.walkInput.side=S.walkInput.back=0;
      knob.style.transform='';
    }
    S.resetJoystick=reset;
    base.addEventListener('pointerdown',function(e){
      if(active!==null) return;
      active=e.pointerId;
      var r=base.getBoundingClientRect();
      originX=r.left+r.width/2; originY=r.top+r.height/2;
      base.setPointerCapture(active);
      move(e);
    });
    base.addEventListener('pointermove',move);
    ['pointerup','pointercancel','lostpointercapture'].forEach(function(event){
      base.addEventListener(event,function(e){if(e.pointerId===active) reset();});
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.S);

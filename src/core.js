/* ============================================================
   core.js — renderer / camera / orbit control / toon material kit
   ============================================================ */
window.S = window.S || {};
(function (S) {
  var T = THREE;

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
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
    updateCamera(1);
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

    /* warm shop interior — the emotional center of the scene */
    [[-3.8, 2.9, -5.6, 0xffa863, 1.40, 12],
     [0.9, 2.9, -4.4, 0xffa05c, 1.25, 11],
     [-1.6, 2.9, -2.6, 0xffb878, 1.00, 9]].forEach(function (p) {
      var l = new T.PointLight(p[3], p[4], p[5], 2);
      l.position.set(p[0], p[1], p[2]);
      scene.add(l);
    });

    var signGlow = new T.PointLight(0x6df2d0, 0.95, 9, 2);
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
    S.renderer.setSize(window.innerWidth, window.innerHeight);
    var portrait = window.innerWidth < window.innerHeight;
    if (portrait !== S.portrait) { S.portrait = portrait; S.resetView(); }
  }

  /* ---------- orbit control: drag = rotate, wheel = zoom, right-drag = pan ---------- */
  S.setQuality = function (quality) {
    S.quality = quality;
    S.renderer.setPixelRatio(quality === "low" ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
    S.renderer.shadowMap.enabled = quality !== "low";
    S.scene.traverse(function (o) { if (o.material) o.material.needsUpdate = true; });
  };
  S.resetView = function () {
    S.portrait = window.innerWidth < window.innerHeight;
    C.tTheta = .55; C.tPhi = 1.02;
    C.tRadius = window.innerWidth < window.innerHeight ? 112 : 43;
    C.tTarget.set(0, 1, -.5);
  };
  var C = {
    theta: 0.70, phi: 1.13, radius: 27.5,
    tTheta: 0.70, tPhi: 1.13, tRadius: 27.5,
    target: new T.Vector3(0, 1.15, -0.5),
    tTarget: new T.Vector3(0, 1.15, -0.5)
  };
  S.ctrl = C;

  function setupControls(canvas) {
    var pointers = {}, dragMode = 0, lastX = 0, lastY = 0, lastPinch = 0;

    canvas.addEventListener('pointerdown', function (e) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
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
      delete pointers[e.pointerId];
      if (Object.keys(pointers).length < 2) lastPinch = 0;
      var remaining = Object.keys(pointers);
      if (remaining.length === 1) { lastX = pointers[remaining[0]].x; lastY = pointers[remaining[0]].y; }
      if (Object.keys(pointers).length === 0) document.body.classList.remove('dragging');
    }
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
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
  }
  S.updateCamera = function (dt) { updateCamera(1 - Math.pow(0.001, dt)); };

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

  S.box = function (w, h, d, mat, x, y, z, o) {
    return finish(new T.Mesh(new T.BoxGeometry(w, h, d), mat), x, y, z, o || {});
  };
  S.plane = function (w, h, mat, x, y, z, o) {
    return finish(new T.Mesh(new T.PlaneGeometry(w, h), mat), x, y, z, o || {});
  };
  S.cyl = function (rt, rb, h, seg, mat, x, y, z, o) {
    return finish(new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), mat), x, y, z, o || {});
  };
  S.sphere = function (r, mat, x, y, z, o) {
    return finish(new T.Mesh(new T.SphereGeometry(r, 12, 8), mat), x, y, z, o || {});
  };
  S.torus = function (r, tube, mat, x, y, z, o) {
    return finish(new T.Mesh(new T.TorusGeometry(r, tube, 6, 20), mat), x, y, z, o || {});
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

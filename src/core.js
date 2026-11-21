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

    var signGlow = new T.PointLight(0xffd5a1, 0.85, 5.7, 2);
    signGlow.position.set(-1.5, 2.65, -0.75);
    scene.add(signGlow);

    var vmLight = new T.PointLight(0xffb082, 0.36, 5, 2);
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
    if(portrait!==S.portrait && S.view==='street-walk'){
      S.portrait=portrait;
      S.camera.fov=portrait?67:61;
      S.camera.updateProjectionMatrix();
    } else if (portrait !== S.portrait) S.setView(S.view);
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
    diner: { eye: [-12.85, 2.2, .15], target: [-11.8, 1.42, -4.25],
      portraitEye: [-12.6, 2.05, .75], portraitTarget: [-11.8, 1.48, -4.25], fov: 51 },
    alley: {eye:[-7.92,1.71,-2.37], target:[-7.9,1.29,-6.38],
      portraitEye:[-7.92,1.68,-2.20],portraitTarget:[-7.89,1.32,-6.38], fov:53},
    'street-walk': {eye:[12.18,1.685,7.6],target:[11.94,1.60,2.15],fov:61},
    stop: { eye: [11.48, 2.22, 10.4], target: [13.0, 1.58, 6.96],
      portraitEye: [11.52, 2.12, 11.05], portraitTarget: [13.0, 1.66, 6.96], fov: 55 }
  };
  S.isStoreView = function(view) {
    if(view==='street-walk') return !!S.camera && S.streetZone(S.camera.position)==='inside';
    return view === 'cooler-art' || view === 'aisle' || view === 'interior' || view === 'bento' || view === 'checkout' || view === 'drinks';
  };
  S.isWalkView = function(view){return view==='street-walk' || S.isStoreView(view);};

  S.setView = function (name) {
    if(S.returnProduct) S.returnProduct();
    if(S.resetWalkInput) S.resetWalkInput();
    S.view = views[name] || name==='corner' ? name : 'overview';
    S.portrait = window.innerWidth < window.innerHeight;
    var view = views[S.view];
    if (view) {
      S.camera.position.fromArray(S.portrait && view.portraitEye || view.eye);
      if(S.view==='street-walk'){
        var spawn=S.layout.streetWalk.spawn;
        S.camera.position.set(spawn[0],1.6+S.groundHeight(spawn[0],spawn[1]),spawn[1]);
      }
      S.camera.fov = S.portrait ? (S.view==='street-walk' ? 67 : S.isStoreView(S.view) ? 68 : 76) : (view.fov || 48);
      S.camera.lookAt(new T.Vector3().fromArray(S.portrait && view.portraitTarget || view.target));
    } else {
      var corner = name==='corner';
      C.theta = C.tTheta = corner ? .31 : .49;
      C.phi = C.tPhi = corner ? 1.29 : 1.08;
      C.radius = C.tRadius = corner ? (S.portrait ? 39 : 23.5) : (S.portrait ? 86 : 40);
      if(corner) C.target.set(-.65,1.49,-1.95);
      else C.target.set(-1.3,1.05,-1.1);
      C.tTarget.copy(C.target);
      S.camera.fov = 38;
      updateCamera(1);
    }
    S.camera.updateProjectionMatrix();
    S.scene.fog.density = view ? .017 : S.scene.fog.density;
    if (S.refreshAudio) S.refreshAudio();
  };
  S.resetView = function () { S.setView('corner'); };
  S.isOrbitView = function () { return S.view==='corner' || S.view==='overview'; };
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
      if(S.rotateHeld && S.rotateHeld(x,y)) return;
      angles.setFromQuaternion(S.camera.quaternion,'YXZ');
      angles.y-=x*.004;
      angles.x=clamp(angles.x-y*.004,-1.19,1.12);
      angles.z=0;
      S.camera.quaternion.setFromEuler(angles);
    }
    document.addEventListener('mousemove',function(e){
      if(document.pointerLockElement===canvas && S.isWalkView(S.view)) turn(e.movementX,e.movementY);
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
      if (!S.isOrbitView()) {
        if(start && Math.hypot(e.clientX-start.x,e.clientY-start.y)>7) start.dragged=true;
        if(Object.keys(pointers).length===1 && document.pointerLockElement!==canvas &&
            (S.holdingProduct?.() || e.pointerType!=='touch' || !S.isWalkView(S.view) || e.clientX>innerWidth*.42)) {
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
      if (!S.isOrbitView()) { S.walkStep(0,Math.sign(e.deltaY)*.22); return; }
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
    if(S.isOrbitView()) updateCamera(1-Math.pow(.001,dt));
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

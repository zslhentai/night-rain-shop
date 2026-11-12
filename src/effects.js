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
    rainLayer(1150, 0.23, 7.5, 0.55);
    rainLayer(200, 0.13, 11.5, 0.95);
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
      o.x = r(-11, 11); o.z = r(-11, 11);
      o.y = initial ? r(0.2, 13) : r(9.5, 13.5);
      o.v = speed * r(0.75, 1.35);
      o.len = maxLen * r(0.45, 1);
      o.tx = o.len * 0.14; o.tz = o.len * 0.035;
      o.floor = inShop(o.x, o.z) ? 3.62 : 0.03;
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
      depthWrite: false, blending: T.AdditiveBlending, fog: false
    });
    var lines = new T.LineSegments(geom, mat);
    lines.frustumCulled = false;
    S.world.add(lines);

    S.addUpdate(function (t, dt) {
      var pA = geom.attributes.position, cA = geom.attributes.color;
      for (var k = 0; k < count; k++) {
        var o = d[k];
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
      drops.forEach(function (d) {
        if (d.wait > 0) { d.wait -= dt; d.mesh.visible = false; return; }
        d.mesh.visible = true;
        d.v += 12 * dt;
        d.y -= d.v * dt;
        d.mesh.position.set(d.x, d.y, d.z);
        d.mesh.scale.set(0.8, 1.5, 0.8);
        if (d.y < 0.10) {
          d.y = 3.15; d.v = 0; d.wait = r(0.5, 3.2);
          S.spawnRipple(d.x, d.z, 0.55);
        }
      });
    });
  }

  /* ---------- expanding rings on puddles ---------- */
  var pool = [];
  function ripples() {
    for (var i = 0; i < 34; i++) {
      var m = new T.Mesh(
        new T.RingGeometry(0.80, 1.0, 24),
        new T.MeshBasicMaterial({ color: 0xbfe0f5, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending })
      );
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      S.world.add(m);
      pool.push({ mesh: m, life: 0, dur: 1, size: 1 });
    }
    S.spawnRipple = function (x, z, size) {
      for (var i = 0; i < pool.length; i++) {
        var p = pool[i];
        if (!p.mesh.visible) {
          p.mesh.visible = true;
          p.mesh.position.set(x, 0.045 + Math.random() * 0.004, z);
          p.life = 0; p.dur = r(0.9, 1.7); p.size = size || r(0.5, 1.3);
          p.mesh.scale.setScalar(0.1);
          return;
        }
      }
    };
    var acc = 0;
    S.addUpdate(function (t, dt) {
      acc += dt;
      if (acc > 0.09) {
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
    var doorOpen = 0;
    S.addUpdate(function (t, dt) {
      var phase = t % 15.5;
      var doorTarget = (phase > 4.5 && phase < 8.4) ? 1 : 0;
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
      if (nextGlitch <= 0) { glitch = r(0.05, 0.16); nextGlitch = r(2.5, 8); }
      var dip = glitch > 0 ? 0.55 : 1;
      if (glitch > 0) glitch -= dt;
      var breathe = 0.96 + 0.045 * Math.sin(t * 2.1) + 0.02 * Math.sin(t * 7.7);
      S.signMaterials.forEach(function (m, i) { m.opacity = Math.min(1, breathe * dip + i * 0.004); });
      S.neonExtras.forEach(function (n) {
        n.sprite.material.opacity = n.base * (0.88 + 0.12 * Math.sin(t * 1.7 + n.phase)) * dip;
      });
      S.interiorGlows.forEach(function (g, i) {
        var u = (t * 0.35 + i * 0.3) % 1;
        g.position.y = 1.42 + u * 0.5;
        g.material.opacity = 0.13 * Math.sin(Math.PI * u);
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
      var phase = t % 15;
      var active = phase < 7 ? 2 : (phase < 8.8 ? 1 : 0);
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

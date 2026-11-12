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
    for (var c = 0; c < 5; c++) label(c === 2 ? '営業中' : 'おでん', .55, .6, (c - 2) * .65, 1.82, .85, '#635244', '#e0c6a1', diner);
    S.glow(-11.8, 1.5, -3.8, 0xffc78a, 2.3, .18);
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

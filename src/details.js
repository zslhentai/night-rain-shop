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
    S.box(.72, .035, .72, dark, -2.55, .085, -1.02, {});
    [-1, 1].forEach(function (side) {
      S.box(.74, .06, .025, steel, -2.55, .12, -1.02 + side * .36, {});
      S.box(.025, .06, .72, steel, -2.55 + side * .36, .12, -1.02, {});
    });
    wet(-2.55, -1.02, .65, .65, .106, .42);
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

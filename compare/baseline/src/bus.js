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

/* A curbside service shares the crossing phase with pedestrians. */
(function (S) {
  S.buildBus = function () {
    var stop = S.layout.busStop;
    var bus = S.group();
    var trim = S.toon(0x283841), teal = S.toon(0x46847e), cream = S.toon(0xe1d7b5);
    var glass = S.glass(0x9dbdc8, .42), lit = S.basic(0xffe3ad);
    var fallback=S.group(bus), wheels=[], brakeLights=[];
    function box(w, h, d, mat, x, y, z, parent) {
      return S.box(w, h, d, mat, x, y, z, { parent: parent || bus });
    }
    box(1.88, .58, 4.55, teal, 0, .67, 0,fallback);
    box(1.88, .13, 4.54, cream, 0, 2.34, 0,fallback);
    box(1.7, .09, 4.33, S.toon(0x746b52), 0, .97, 0);
    box(1.89, 1.32, .09, teal, 0, 1.62, -2.22,fallback);
    box(1.8, .69, .035, glass, 0, 1.75, 2.26);
    box(1.88, .42, .13, teal, 0, 1.12, 2.2,fallback);
    [-1, 1].forEach(function (side) {
      var x = side * .94;
      [1.55, -1.45].forEach(function (z) {
        var wheel=S.group(bus);wheel.position.set(x,.33,z); wheels.push(wheel);
        S.cyl(.32, .32, .15, 16, trim, 0,0,0,{parent:wheel,rz:Math.PI/2});
        S.cyl(.184,.184,.035,12,S.phong(0x889594,{shininess:28}),side*.08,0,0,{parent:wheel,rz:Math.PI/2});
        S.cyl(.064,.064,.011,8,trim,side*.102,.061,.075,{parent:wheel,rz:Math.PI/2});
      });
      box(.18, .14, .04, lit, side * .68, .71, 2.30);
      var brake=S.basic(0xa23a31);
      brakeLights.push(brake);
      box(.18, .14, .04, brake, side * .68, .71, -2.30);
      box(.06, .11, 4.46, cream, x, 2.22, 0,fallback);
      var bays = side > 0 ? [[-1.97, .5], [.7, 2.95]] : [[0, 4.45]];
      bays.forEach(function (bay) {
        box(.06, .42, bay[1], teal, x, 1.19, bay[0],fallback);
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
    }), 0, 2.18, 2.34, { parent: bus });
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
    var sheen=S.basic(0xffffff,{map:S.tex.reflection('#eddfbd'),transparent:true,
      blending:THREE.AdditiveBlending,depthWrite:false,opacity:.38});
    var headlight=S.plane(1.65,4.6,sheen,0,.021,4.45,{parent:bus,rx:-Math.PI/2});
    var mist=S.basic(0xccdfdf,{map:S.tex.puddle(),transparent:true,
      depthWrite:false,opacity:0,blending:THREE.AdditiveBlending});
    [-1,1].forEach(function(side){S.plane(.4,2.1,mist,side*.98,.08,-2.05,{parent:bus,rx:-Math.PI/2});});
    if(S.streetArtSlot) S.streetArtSlot('bus-shell',fallback,bus,[0,0,0]);
    var boardingZ = stop.boardingZ + 1.17;
    var state = S.bus = { phase: 'away', canBoard: false, z: -15.6, door: 0, cycles: 0 };
    var timer = 9;
    function change(phase, seconds) { state.phase = phase; timer = seconds; }
    S.addUpdate(function (t, dt) {
      var oldZ=state.z, oldPhase=state.phase;
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
      var distance=state.z-oldZ;
      var moving=oldPhase!=='away' && bus.visible && distance>0;
      if(moving) wheels.forEach(function(wheel){wheel.rotation.x-=distance/.32;});
      var braking=state.phase==='stop' || state.phase==='close' ||
        state.phase==='approach' && distance<.015 || state.phase==='cross' && boardingZ-state.z<2.4;
      brakeLights.forEach(function(material){material.color.setHex(braking?0xff624b:0xa23a31);});
      mist.opacity=moving && S.quality!=='low'?.105*S.rainIntensity:0;
      headlight.visible=state.phase!=='away';
      if(oldPhase!=='stop' && state.phase==='stop' && S.playSceneSound) S.playSceneSound('bus-stop');
      if(S.updateBusAudio) S.updateBusAudio(bus.position,bus.visible,state.phase,dt);
    });
    bus.visible = false;
  };
})(window.S);

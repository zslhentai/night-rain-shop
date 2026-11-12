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
    var bag = S.box(.24, .3, .17, S.toon(0xc4c8ae), -.27, .53, .03, { parent: group });
    var shadow = S.groundPlane(.6, .6, S.basic(0x101923, { transparent: true, opacity: .3, depthWrite: false }), 0, .092, 0);
    var p = { group: group, torso: torso, umbrella: umbrella, legs: legs, arms: arms, bag: bag, shadow: shadow,
      route: route, next: 1, wait: offset || 0, distance: 0, speed: speed, folding: 1 };
    group.position.set(route[0].x, .1, route[0].z);
    S.people.push(p);
    return p;
  }
  function point(x, z, options) { return Object.assign({ x: x, z: z }, options || {}); }
  S.buildPeople = function () {
    character(0xac8268, 0xb68d70, [
      point(-8.2, -6.5), point(-8.2, -1.3), point(-6.6, -1.3), point(-6.6, .35), point(-5.6, .35), point(-.8, .35, { wait: 1 }),
      point(-.8, -1, { fold: true, wait: 1.2 }), point(-.8, -1.95, { door: true, fold: true, wait: 6 }),
      point(-.8, -1, { door: true, fold: true, wait: .5 }), point(-.8, .35, { wait: 1 }),
      point(-5.6, .35), point(-6.6, .35), point(-6.6, -1.3), point(-8.2, -1.3), point(-8.2, -6.5, { wait: 8 })
    ], .85, 1);
    character(0x6d8795, 0x778ea8, [
      point(6.6, -4.8), point(4.8, -4.8), point(4.8, -.3), point(4, -.3), point(3.9, 2.15, { wait: .6 }),
      point(11.7, 2.15, { crossing: true }), point(12.3, 4), point(12.3, 6.1, { wait: 7 }),
      point(12.3, 4), point(11.7, 2.15), point(3.9, 2.15, { crossing: true }),
      point(4, -.3), point(4.8, -.3), point(4.8, -4.8), point(6.6, -4.8, { wait: 10 })
    ], 1, 4);
    character(0x658c7b, 0x748c72, [
      point(-8.6, -5.8), point(-8.6, -1.3), point(-6.8, -1.3), point(-6.8, .65), point(-6, .65), point(3.2, .5),
      point(3.2, .15, { wait: 5, face: Math.PI }), point(3.2, .65), point(-6, .65), point(-6.8, .65), point(-6.8, -1.3), point(-8.6, -1.3), point(-8.6, -5.8, { wait: 12 })
    ], .74, 14);
    var clerk = character(0x6e9f92, 0x687d89, [point(1.8, -3.4), point(1.8, -3.4)], 0, 0);
    clerk.staff = true; clerk.umbrella.visible = false; clerk.bag.visible = false;
    S.addUpdate(function (t, dt) {
      S.doorDemand = false;
      S.people.forEach(function (p) {
        if (p.staff) {
          p.group.rotation.y = -.5 + Math.sin(t * .25) * .3;
          p.arms[0].rotation.x = -.4 + Math.sin(t * 1.2) * .16;
          p.shadow.position.set(p.group.position.x, .115, p.group.position.z);
          return;
        }
        var pos = p.group.position, target = p.route[p.next];
        var dx = target.x - pos.x, dz = target.z - pos.z, distance = Math.hypot(dx, dz);
        var nearDoor = Math.abs(pos.x + .8) < .75 && pos.z > -3 && pos.z < .5;
        if (nearDoor) S.doorDemand = true;
        var folding = target.fold || pos.z < -.8 && Math.abs(pos.x + .8) < 1;
        p.folding += ((folding ? 0 : 1) - p.folding) * Math.min(1, dt * 4);
        p.umbrella.scale.set(Math.max(.12, p.folding), 1, Math.max(.12, p.folding));
        p.umbrella.visible = p.folding > .08;
        var blocked = target.door && S.door.open < .85;
        // Once committed to crossing, continue to the opposite curb.
        if (target.crossing && distance > 7.6 && !(t % 15 >= 9.8 && t % 15 < 11.2)) blocked = true;
        S.people.forEach(function (other) {
          if (other === p || other.staff || distance < .01) return;
          var ox = other.group.position.x - pos.x, oz = other.group.position.z - pos.z;
          if (Math.hypot(ox, oz) < .58 && (ox * dx + oz * dz) / distance > .15) blocked = true;
        });
        var step = 0;
        if (p.wait > 0) p.wait = Math.max(0, p.wait - dt);
        else if (!blocked && distance > .02) {
          step = Math.min(distance, dt * (target.crossing ? 2.5 : p.speed));
          pos.x += dx / distance * step; pos.z += dz / distance * step;
          var angle = Math.atan2(dx, dz), delta = Math.atan2(Math.sin(angle - p.group.rotation.y), Math.cos(angle - p.group.rotation.y));
          p.group.rotation.y += delta * Math.min(1, dt * 7);
        } else if (distance <= .02) {
          p.wait = target.wait || 0;
          if (target.face !== undefined) p.group.rotation.y = target.face;
          p.next = (p.next + 1) % p.route.length;
        }
        p.distance += step;
        var stride = step > 0 ? Math.sin(p.distance * 9) * .42 : 0;
        p.legs[0].rotation.x = stride; p.legs[1].rotation.x = -stride;
        p.arms[0].rotation.x = -stride * .6;
        p.arms[1].rotation.x = p.umbrella.visible ? -.8 : stride * .6;
        p.torso.position.y = step > 0 ? Math.abs(Math.sin(p.distance * 9)) * .025 : Math.sin(t * 1.5) * .008;
        p.umbrella.rotation.z = Math.sin(t * 2 + p.speed) * .025;
        p.shadow.position.set(pos.x, .115, pos.z);
      });
    });
  };
})(window.S);

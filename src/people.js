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

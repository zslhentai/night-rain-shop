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
  S.layout.busStop = { curbX: 11.5, waitX: 12.3, boardingZ: 6.1, laneX: 10.26 };
  // Shared interaction anchors: display, scanner and staff restocking aisle.
  S.layout.interior = {
    meal: [1.85,.98,-7.95], pickup: [1.65,-6.95],
    scanner: [-4.22,1.14,-3.19], bagging: [-4.38,1.25,-3.53],
    clerk: [-5.15,-3.4], restock: [[-5.15,-3.4],[-5.15,-6.95],[-5.15,-6.1],[-3.65,-6.1],[-3.65,-6.95],[1.55,-6.95]]
  };
  S.walkObstacles = [
    [-6.1,-4.01,-8.5,-6.5],[-4.87,-4.03,-4.74,-2.06],
    [-4.84,-4.06,-6.05,-4.79],[-3.13,-2.17,-5.71,-3.59],
    [-.33,.63,-5.71,-3.59],[-3.74,.54,-8.55,-7.88],
    [.845,2.455,-8.45,-7.45],[1.69,2.61,-6.65,-5.05],
    [2.22,2.68,-4.95,-3.25],[-5.67,-4.93,-2.87,-1.93]
  ];
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
  S.rainFloor = function (x, z) {
    var floor = 0.04;
    S.layout.shelters.forEach(function (s) {
      if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1) floor = Math.max(floor, s.height);
    });
    S.people.forEach(function (p) {
      if (p.folding > .8 && Math.hypot(x - p.group.position.x - .25 * Math.cos(p.group.rotation.y), z - p.group.position.z + .25 * Math.sin(p.group.rotation.y)) < .65) floor = Math.max(floor, p.group.position.y + 2.2);
    });
    return floor;
  };
})(window.S);

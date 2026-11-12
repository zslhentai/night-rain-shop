/* Shared world bounds, shelter footprints and pedestrian destinations. */
(function (S) {
  S.layout = {
    bounds: { minX: -14, maxX: 14, minZ: -13, maxZ: 13 },
    shelters: [
      { x0: -6.3, x1: 2.95, z0: -8.7, z1: -1.55, height: 4.35 },
      { x0: -6.3, x1: 3, z0: -1.55, z1: -0.65, height: 3.25 },
      { x0: 5.5, x1: 9.5, z0: -9.5, z1: -5.4, height: 4.7 }
    ]
  };
  S.people = [];
  S.doorDemand = false;
  S.traffic = { pedestrianGreen: false };
  S.rainFloor = function (x, z) {
    var floor = 0.04;
    S.layout.shelters.forEach(function (s) {
      if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1) floor = Math.max(floor, s.height);
    });
    S.people.forEach(function (p) {
      if (p.umbrella.visible && Math.hypot(x - p.group.position.x, z - p.group.position.z) < 0.65) floor = Math.max(floor, 2.2);
    });
    return floor;
  };
})(window.S);

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
  S.layout.umbrellaStandX = -3.92;
  S.layout.busStop = { curbX: 11.5, waitX: 12.3, boardingZ: 6.1, laneX: 10.26 };
  // Coordinates of the fixtures and their collision footprints in the existing shell.
  var fixtures = {
    stockroom: {bounds:[-6.1,-4.01,-8.5,-6.5]},
    checkout:  {x:-4.45,z:-3.42,turn:Math.PI/2,bounds:[-4.87,-4.03,-4.76,-2.08]},
    oden:      {x:-4.45,z:-5.42,turn:Math.PI/2,bounds:[-4.84,-4.06,-6.05,-4.79]},
    shelfLeft: {x:-2.54,z:-4.64,depth:.5,bounds:[-3.02,-2.06,-5.70,-3.58]},
    shelfRight:{x:.12,z:-4.64,depth:.5,bounds:[-.36,.60,-5.70,-3.58]},
    drinks:    {x:-1.60,z:-8.22,width:.8,bounds:[-3.74,.54,-8.55,-7.88]},
    bento:     {x:1.65,z:-7.95,width:1.4,depth:.5,bounds:[.845,2.455,-8.45,-7.45]},
    freezer:   {x:2.15,z:-5.85,turn:Math.PI/2,bounds:[1.69,2.61,-6.65,-5.05]},
    magazines: {x:2.45,z:-4.10,turn:Math.PI,height:.64,bounds:[2.18,2.72,-4.95,-3.25]},
    coffee:    {x:-2.64,z:-2.01,turn:Math.PI,bounds:[-3.10,-2.18,-2.33,-1.69]},
    baskets:   {bounds:[.64,1,-2.17,-1.91]}
  };
  var checkout = fixtures.checkout;
  var staff = [checkout.x-.70,checkout.z];
  S.layout.interior = {
    fixtures: fixtures,
    aisleX: (fixtures.shelfLeft.bounds[1]+fixtures.shelfRight.bounds[0])/2,
    rearZ: -6.98,
    pickup: [fixtures.bento.x,-6.98],
    scanner: [checkout.x+.23,1.14,checkout.z+.21],
    bagging: [checkout.x+.07,1.25,checkout.z-.13],
    pay: [-3.53,checkout.z+.21],
    queueX: -3.53,
    stockShelf: [-5.56,.76,-6.97],
    clerk: staff,
    restock: [staff,[-5.15,-6.95],[-5.15,-6.24],[-3.60,-6.24],[-3.60,-6.98],[1.55,-6.98]]
  };
  S.walkObstacles = Object.keys(fixtures).map(function(name){return fixtures[name].bounds;});
  // Point-to-rectangle clearance avoids snagging at shelf corners.
  S.fixtureBlocks = function(x,z,radius,staffAccess) {
    return Object.keys(fixtures).some(function(name){
      if(staffAccess && name==='stockroom') return false;
      var b=fixtures[name].bounds;
      return Math.hypot(Math.max(b[0]-x,0,x-b[1]),Math.max(b[2]-z,0,z-b[3]))<radius;
    });
  };
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

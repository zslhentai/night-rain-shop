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
  // Walkable center-lines overlap at the curb ramps and street corners.
  S.layout.streetWalk = {
    spawn: [12.18, 7.6],
    crossing: [4.64, 10.68, 1.49, 2.81],
    paths: [
      [-13.53, 4.13, -.83, .55], // continuous store and diner pavement
      [-1.23, -.37, -1.84, -.57], // automatic door approach
      [3.40, 4.79, .28, 2.81], // shop-side corner and ramp
      [10.53, 12.30, 1.49, 2.81], // bus-side ramp
      [11.72, 13.57, -2.2, 11.71],
      [-13.58, -10.34, -4.06, .37], // diner frontage
      [-9.14, -6.52, -7.14, .20], // service alley
      [2.99, 4.09, -7.70, -.34] // vending machine service sidewalk
    ],
    // Footprints for props the player can actually walk around.
    obstacles: [
      [12.98,13.57,6.77,8.43], [13.57,13.69,5.28,5.42],
      [13.57,13.69,8.68,8.81], [13.12,13.39,5.35,5.58],
      [12.51,12.69,4.31,4.49], [11.69,11.91,.98,1.22],
      [3.70,3.91,3.06,3.33], [2.44,3.46,-1.23,-.41],
      [3.47,4.49,-1.23,-.41], [-3.88,-3.59,-1.12,-.36],
      [-5.21,-3.93,-.53,-.10], [-7.77,-7.13,-1.04,-.40],
      [-8.86,-8.44,-5.21,-4.79], [-7.67,-6.53,-7.16,-6.65],
      [-12,-11.61,1.43,1.77]
    ]
  };
  S.streetZone = function (p) {
    var a=S.layout.entrance;
    if(p.x>S.SHOP.x0 && p.x<S.SHOP.x1 && p.z>S.SHOP.z0 && p.z<S.SHOP.z1) return 'inside';
    if(p.x>11.87 && p.x<13.8 && p.z>5.2 && p.z<8.9) return 'stop';
    if(p.x>-14 && p.x<-9.6 && p.z>-4.7 && p.z<-3.6) return 'diner';
    if(Math.abs(p.x-a.x)<4.76 && p.z>a.threshold-.1 && p.z<-.62) return 'awning';
    return 'street';
  };
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
    if (x>2.8 && x<4.3 && z<1.35 && z>.55) return .06;
    if (x < -10 || (x < 4.4 && z < .75)) return .06;
    return .008;
  };
  S.shelterRainFloor = function (x,z) {
    var floor = 0.04;
    for (var i=0; i<S.layout.shelters.length; i++){
      var s=S.layout.shelters[i];
      if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1) floor = Math.max(floor, s.height);
    }
    return floor;
  };
  S.rainFloor = function (x,z,base) {
    var floor = base===undefined ? S.shelterRainFloor(x,z) : base;
    for(var i=0; i<S.people.length; i++){
      var p=S.people[i];
      if(!(p.folding>.8)) continue;
      var dx=x-p.group.position.x, dz=z-p.group.position.z;
      if(Math.abs(dx)>=.90 || Math.abs(dz)>=.90) continue;
      dx-=.25*Math.cos(p.group.rotation.y);
      dz+=.25*Math.sin(p.group.rotation.y);
      if(dx*dx+dz*dz<.65*.65) floor=Math.max(floor,p.group.position.y+2.2);
    }
    return floor;
  };
})(window.S);

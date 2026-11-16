/* ============================================================
   interior.js — warm, fully stocked convenience store interior
   ============================================================ */
(function (S) {
  var T = THREE;
  S.interiorGlows = [];

  S.buildInterior = function () {
    var fixtures = {};
    S.coldDoors = [];
    var startIndex = S.world.children.length;
    function section(name) {
      fixtures[name] = S.world.children.slice(startIndex);
      startIndex = S.world.children.length;
    }
    function move(name, oldX, oldZ) {
      var plan=S.layout.interior.fixtures[name];
      var fixture=S.group();
      fixture.name=name;
      fixtures[name].forEach(function(object) {
        fixture.add(object);
        object.position.x-=oldX;
        object.position.z-=oldZ;
      });
      fixture.position.set(plan.x,0,plan.z);
      fixture.rotation.y=plan.turn||0;
      fixture.scale.set(plan.width||1,plan.height||1,plan.depth||1);
      return fixture;
    }
    var f = S.SHOP.floor;
    // Entry mat with a thin rubber border and absorbent fabric center.
    S.box(1.65,.025,.42,S.toon(0x263a3e),-.8,.115,-1.87,{});
    S.box(1.52,.008,.34,S.toon(0x46534f),-.8,.132,-1.87,{});
    // Ceiling services are mounted flush to the ceiling plane.
    [-5.9,-3.3].forEach(function(z) {
      S.box(.65,.035,.65,S.toon(0xbbbdb5),-3.5,3.235,z,{});
      for(var slot=0;slot<6;slot++) S.box(.48,.008,.018,S.toon(0x4d5756),-3.5,3.214,z-.2+slot*.08,{});
    });
    S.cyl(.10,.10,.035,12,S.toon(0xe7e7dd),-.8,3.21,-3.8,{});
    S.sphere(.08,S.toon(0x26343c),2.53,3.12,-1.95,{});

    var cream = S.toon(0xd8cbb7);
    var white = S.toon(0xd4d0c4);
    var wood = S.toon(0xb08a67);
    var metal = S.toon(0xc0b39e);
    var frame = S.toon(0x55697c);
    var bottleColors = [0x7fc3d8, 0xf0cf82, 0xe58f92, 0xa5cf96, 0xd7a6e0, 0xeab07c, 0xf3efe0];

    var bottleMats = bottleColors.map(function(c) { return S.phong(c, { shininess: 24, emissive:c, emissiveIntensity:.10 }); });

    S.buildShopLighting();

    /* ---------- back wall light boxes ---------- */
    S.box(4.3, 0.72, 0.10, frame, -1.7, 2.72, -8.47, {});
    S.plane(4.15, 0.60, S.basic(0xffffff, { map: S.tex.adPanel('冷たい飲料', 'WATER · TEA · SODA', '#e4ece5') }), -1.7, 2.72, -8.40, {});
    S.glow(-1.7, 2.72, -8.32, 0xffe3c4, .6, .06);
    S.box(1.5, 0.55, 0.09, frame, 1.9, 2.62, -8.47, {});
    S.plane(1.4, 0.46, S.basic(0xffffff, { map: S.tex.adPanel('お弁当', 'できたて', '#ffe8b9') }), 1.9, 2.62, -8.40, {});

    /* ---------- refrigerated drink cabinets along the back wall ---------- */
    var drinkPrices = S.tex.label('130   150   180   130', '円   冷たい飲料', '#f4f2e9', '#334d58');
    function drinkCabinet(bx) {
      // A hollow cabinet: rear panel and jambs leave the stock visible.
      S.box(2.35, 2.22, .06, white, bx, 1.22, -8.50, {});
      [-1.14,1.14].forEach(function (dx) {
        S.box(.07,2.22,.62,white,bx+dx,1.22,-8.22,{});
        S.box(.025,1.95,.025,S.basic(0xe5f5ff),bx+dx*.94,1.2,-7.96,{});
      });
      S.box(2.35,.12,.62,frame,bx,.17,-8.22,{});
      for(var vent=0;vent<18;vent++) S.box(.065,.045,.012,frame,bx-.98+vent*.115,.20,-7.90,{});
      S.plane(.34,.10,S.basic(0xffffff,{map:S.tex.label('4°C','','#183c39','#c3e7cc')}),bx+.78,2.37,-7.88,{});
      var litBack=S.shopMaterial(0xbdc6bc,{emissiveIntensity:.14});
      S.box(2.16,1.91,.022,litBack,bx,1.21,-8.46,{});
      for (var row = 0; row < 3; row++) {
        var yy = 0.48 + row * 0.56;
        S.box(2.12, 0.035, 0.50, metal, bx, yy - 0.17, -8.20, {});
        S.plane(1.9,.09,S.basic(0xffffff,{map:drinkPrices}),bx,yy-.12,-7.935,{});
        for (var c = 0; c < 8; c++) {
          var col = bottleColors[(c + row * 3 + (bx > -3 ? 2 : 0)) % bottleColors.length];
          S.box(0.17, 0.33, 0.16, bottleMats[bottleColors.indexOf(col)], bx - 0.90 + c * 0.255, yy + 0.01, -8.14, {});
          S.cyl(.045,.055,.065,10,bottleMats[bottleColors.indexOf(col)],bx-.90+c*.255,yy+.205,-8.14,{});
          S.cyl(.046,.046,.025,10,frame,bx-.90+c*.255,yy+.25,-8.14,{});
          S.box(0.13, 0.06, 0.02, S.basic(0xf7f4e8), bx - 0.90 + c * 0.255, yy + 0.06, -8.05, {});
        }
      }
      /* Hinged doors share the cabinet transform, including collision geometry. */
      [-1,1].forEach(function(side) {
        var hinge = S.group();
        hinge.position.set(bx+side*1.1,0,-7.88);
        S.plane(1.08,1.98,S.glass(0xdff2ff,.12),-side*.54,1.22,0,{parent:hinge});
        S.box(.04,1.98,.05,frame,-side*1.08,1.22,0,{parent:hinge});
        S.box(.035,.42,.05,metal,-side*.98,1.25,.05,{parent:hinge});
        S.coldDoors.push({hinge:hinge,side:side,open:false,angle:0});
      });
      S.box(2.35, 0.16, 0.66, frame, bx, 2.36, -8.22, {});
      S.plane(0.72, 0.22, S.basic(0xffffff, { map: S.tex.priceTag('¥130', '#ffdf62') }), bx, 2.36, -7.87, {});
      S.glow(bx, 2.15, -7.92, 0xdcefff, 1.2, .07);
    }
    section('lighting');
    drinkCabinet(-4.72);
    drinkCabinet(-1.72);

    section('drinks');
    /* ---------- staff door + lockers ---------- */
    S.box(0.06, 2.05, 1.05, S.toon(0xa9a394), -6.06, 1.15, -7.55, {});
    S.plane(0.92, 1.90, S.basic(0xffffff, { map: S.tex.staffDoor() }), -6.02, 1.15, -7.55, { ry: Math.PI / 2 });
    S.cyl(0.045, 0.045, 0.09, 8, metal, -5.96, 1.10, -7.12, { rx: Math.PI / 2 });
    /* locker bank */
    S.box(1.80, 2.05, 0.55, S.toon(0xc9d0d0), 1.85, 1.13, -8.28, { outline: true, outlineOpacity: .3 });
    for (var l = 0; l < 3; l++) {
      S.box(0.54, 0.90, 0.02, S.toon(0xdde3e2), 1.30 + l * 0.56, 1.55, -7.99, {});
      S.box(0.54, 0.90, 0.02, S.toon(0xdde3e2), 1.30 + l * 0.56, 0.60, -7.99, {});
      S.box(0.12, 0.03, 0.03, metal, 1.48 + l * 0.56, 1.55, -7.97, {});
    }

    section('staff');
    /* ---------- three long gondola shelves ---------- */
    var goods = [
      {names:['カップ麺','スープ','日用品'], colors:[0xd98660,0x679484,0xd6b671]},
      {names:['ポテト','ビスケット','菓子'], colors:[0xd0a84d,0xa96158,0x508b83]}
    ];
    var packShapes=[
      new T.CylinderGeometry(.132,.102,.25,10),
      new T.BoxGeometry(.22,.27,.24),
      new T.BoxGeometry(.19,.24,.20),
      new T.BoxGeometry(.15,.32,.22)
    ];
    var shelfMetal=S.toon(0xb7c7c3);
    function gondola(sx, variant) {
      var assortment=goods[variant];
      S.box(.08,1.26,4.2,cream,sx,.73,-5.25,{});
      S.box(.94,.06,4.24,shelfMetal,sx,1.36,-5.25,{});
      [-7.29,-3.21].forEach(function(z){
        S.box(.92,.11,.07,frame,sx,.17,z,{});
        S.box(.08,1.21,.075,frame,sx,.74,z,{});
      });
      for(var level=0;level<3;level++){
        var base=.22+level*.37;
        var kind=level===2 ? (variant===0?0:3) : level+1;
        var geometry=packShapes[kind];
        var packHeight=geometry.parameters.height;
        var material=S.phong(assortment.colors[level],{shininess:13});
        var strip=S.basic(0xffffff,{map:S.tex.label(assortment.names[level],['¥178','¥248','¥138'][level],'#e6ede7','#394d4a')});
        S.box(.96,.044,4.22,shelfMetal,sx,base,-5.25,{});
        [-1,1].forEach(function(side) {
          var positions=[];
          for(var slot=0;slot<11;slot++){
            if((variant+level+slot*3+side+12)%13!==0) positions.push(-7.06+slot*.36);
          }
          var packs=new T.InstancedMesh(geometry,material,positions.length);
          var matrix=new T.Matrix4();
          positions.forEach(function(z,index) {
            matrix.makeTranslation(sx+side*.265,base+.023+packHeight/2,z);
            packs.setMatrixAt(index,matrix);
          });
          packs.instanceMatrix.needsUpdate=true;
          S.world.add(packs);
          S.box(.02,.065,4.14,cream,sx+side*.48,base-.011,-5.25,{});
          [-6.55,-5.27,-4.01].forEach(function(z) {
            S.plane(.38,.065,strip,sx+side*.495,base-.01,z,{ry:side*Math.PI/2});
          });
          var label=S.basic(0xffffff,{map:S.tex.label(assortment.names[level],'', '#e5dfc2','#3e554e')});
          positions.forEach(function(z,index){
            var labelWidth=kind===0?.13:.17;
            if(index%2===0) S.plane(labelWidth,.10,label,sx+side*(kind===0?.382:kind===1?.378:kind===2?.363:.343),base+.10,z,{ry:side*Math.PI/2});
          });
        });
      }
      S.plane(.69,.16,S.basic(0xffffff,{map:S.tex.label(variant===0?'食品・日用品':'お菓子','', '#dfebe2','#344a43')}),sx,1.29,-3.12,{});
    }
    gondola(-4.85, 0);
    section('shelfLeft');
    gondola(-2.15, 1);
    section('shelfRight');


    /* rice balls + snacks on the shelf ends */
    for (var rb = 0; rb < 6; rb++) {
      var rx = -4.85 + (rb % 3) * 0.28, rz = -3.02 + Math.floor(rb / 3) * 0.30;
      S.cyl(0.15, 0.15, 0.10, 3, S.toon(0xfaf6e9), rx, 1.56, rz, { ry: 0.5 });
      S.box(0.10, 0.02, 0.09, S.toon(0x33403c), rx, 1.51, rz, {});
    }
    var snackColors = [0xf0c96c, 0xe4938e, 0x8fc0b4, 0xb6a3d8, 0xe8a878];
    for (var sn = 0; sn < 10; sn++) {
      S.box(0.16, 0.26, 0.10, S.toon(snackColors[sn % snackColors.length]),
        -2.15 - 0.28 + (sn % 5) * 0.14, 1.65 + Math.floor(sn / 5) * 0.02, -3.06 + Math.floor(sn / 5) * 0.16, { rz: S.range(-.15, .15) });
    }

    section('endGoods');
    /* ---------- bento cold case ---------- */
    S.box(1.15, 0.86, 2.00, white, 1.75, 0.53, -4.15, { outline: true, outlineOpacity: .3 });
    S.box(1.05,.05,1.88,S.toon(0xdddfd5),1.75,.92,-4.15,{});
    S.box(1.08,.07,.48,frame,1.75,1.02,-4.40,{});
    S.box(1.08,.07,.40,frame,1.75,1.23,-4.86,{});
    S.box(1.12,.72,.05,white,1.75,1.26,-5.12,{});
    S.box(1.02,.025,.04,S.basic(0xfff4dd),1.75,1.51,-5.08,{});
    [-1,1].forEach(function(side){
      S.box(.027,.51,.55,S.glass(0xe6f1ed,.14),1.75+side*.55,1.19,-4.78,{});
    });
    var tray = S.phong(0x293537,{shininess:25}), rice = S.toon(0xf5efdc), salmon = S.toon(0xd98d62), greens = S.toon(0x89a66d);
    var lid = S.glass(0xf5ffff,.16), sleeve = S.toon(0xf0e3c7);
    S.makeMeal = function () {
      var meal = S.group();
      S.box(.28,.045,.26,tray,0,0,0,{parent:meal});
      S.box(.13,.035,.21,rice,-.058,.035,0,{parent:meal});
      S.box(.09,.035,.10,salmon,.065,.037,-.04,{parent:meal});
      S.box(.09,.03,.07,greens,.065,.035,.065,{parent:meal});
      S.box(.29,.075,.27,lid,0,.036,0,{parent:meal});
      S.box(.055,.008,.275,sleeve,0,.078,0,{parent:meal});
      return meal;
    };
    for (var bb = 0; bb < 12; bb++) {
      if (bb < 7) continue;
      var meal = S.makeMeal();
      meal.position.set(1.39+(bb%3)*.36,.98,-4.80+Math.floor(bb/3)*.43);
      if (bb === 10) { S.displayMeal=meal; meal.position.set(1.75,.98,-3.51); }
    }
    var bread = S.toon(0xe4cba4);
    for(var sandwich=0;sandwich<2;sandwich++) {
      var x=1.39+sandwich*.36;
      S.cyl(.13,.13,.06,3,bread,x,1.18,-4.37,{rx:Math.PI/2});
      S.cyl(.115,.115,.025,3,greens,x,1.18,-4.33,{rx:Math.PI/2});
      S.cyl(.13,.13,.03,3,rice,x,1.18,-4.30,{rx:Math.PI/2});
    }
    S.stock = { available:true, scans:0, restocks:0 };
    S.plane(.8,.12,S.basic(0xffffff,{map:S.tex.label('540 / 280 / 320','BENTO · SANDWICH','#f4eee0','#36575a')}),1.75,.82,-3.142,{});
    // Rear row sandwiches and triangular wrapped rice balls.
    for(var food=0;food<3;food++) {
      S.cyl(.105,.105,.09,3,rice,1.4+food*.32,1.37,-4.9,{rx:Math.PI/2});
      S.box(.05,.09,.095,tray,1.4+food*.32,1.34,-4.9,{});
    }
    // An open display lets a customer reach the front row.
    S.box(1.11, .075, .025, S.glass(0xe5f6ff, .24), 1.75, .99, -3.155, {});
    S.plane(0.72, 0.24, S.basic(0xffffff, { map: S.tex.priceTag('お弁当', '#ffd97a'), transparent: true, side: T.DoubleSide }), 1.75, 1.30, -3.18, {});
    S.glow(1.75, 1.05, -4.15, 0xe5f2ff, .4, .04);

    section('bento');
    /* ---------- chest freezer near the entrance ---------- */
    S.box(1.60, 0.72, 0.92, white, -3.55, 0.46, -2.30, { outline: true, outlineOpacity: .3 });
    S.box(1.48, 0.05, 0.80, S.basic(0xdff1f7), -3.55, 0.84, -2.30, {});
    for (var ic = 0; ic < 10; ic++) {
      S.box(0.24, 0.10, 0.20, S.toon([0xf3a9bd, 0x9fc9e8, 0xf4d487, 0xb0d6a8, 0xcdb3e0][ic % 5]),
        -3.55 - 0.55 + (ic % 5) * 0.28, 0.90, -2.30 - 0.18 + Math.floor(ic / 5) * 0.34, {});
    }
    S.plane(1.52, 0.84, S.glass(0xe5f6ff, 0.20), -3.55, 0.90, -2.30, { rx: -Math.PI / 2 });
    S.plane(0.75, 0.24, S.basic(0xffffff, { map: S.tex.priceTag('アイス', '#bfe7f5'), transparent: true, side: T.DoubleSide }), -3.55, 1.12, -1.86, {});

    section('freezer');
    /* ---------- checkout counter ---------- */
    S.box(2.55, 0.94, 0.72, wood, 0.25, 0.57, -2.55, { outline: true, outlineOpacity: .32 });
    S.box(2.68, 0.06, 0.82, S.toon(0xd8c3a4), 0.25, 1.06, -2.55, {});
    S.box(0.86, 0.94, 0.68, wood, -1.32, 0.57, -2.92, {});
    S.box(0.92, 0.06, 0.74, S.toon(0xd8c3a4), -1.32, 1.06, -2.92, {});
    /* register */
    S.box(0.46, 0.26, 0.40, S.toon(0x4c5a66), -0.45, 1.22, -2.58, {});
    S.plane(0.34, 0.20, S.basic(0x7fd8e8), -0.45, 1.30, -2.37, { rx: -0.35 });
    S.box(0.42, 0.03, 0.16, S.toon(0xaab5bc), -0.45, 1.10, -2.32, {});
    S.box(.30,.035,.24,frame,.04,1.11,-2.32,{});
    S.scannerLight = S.basic(0x7eafa3);
    S.box(.22,.008,.035,S.scannerLight,.04,1.132,-2.32,{});
    S.box(.19,.06,.23,frame,.55,1.13,-2.29,{});
    S.plane(.14,.15,S.basic(0xffffff,{map:S.tex.label('PAY','タッチ','#183b42','#bce1d5')}),.55,1.165,-2.29,{rx:-Math.PI/2});
    S.receipt = S.plane(.10,.25,S.basic(0xffffff),-.45,1.37,-2.37,{});
    S.receipt.visible = false;
    /* customer facing display */
    S.box(0.55, 0.36, 0.06, frame, 0.95, 1.36, -2.20, {});
    S.registerIdle = S.tex.label('レジ', 'お会計', '#203a48', '#dff8ff');
    S.registerPaid = S.tex.label('¥ 540', 'ありがとう', '#203a48', '#dff8ff');
    S.registerScreen = S.basic(0xffffff, { map: S.registerIdle });
    S.plane(.50, .30, S.registerScreen, .95, 1.36, -2.16, {});
    /* baskets, bags, small goods */
    S.box(0.34, 0.20, 0.26, S.toon(0x3d6d9c), 1.28, 1.19, -2.60, {});
    S.box(0.30, 0.02, 0.22, S.toon(0x2d5580), 1.28, 1.30, -2.60, {});
    S.box(0.18, 0.24, 0.12, S.toon(0xf3e7c8), 0.55, 1.21, -2.78, {});
    S.box(0.18, 0.24, 0.12, S.toon(0xe9d9b4), 0.76, 1.21, -2.78, {});
    S.plane(0.66, 0.20, S.basic(0xffffff, { map: S.tex.priceTag('レジ', '#ffe8a0'), transparent: true, side: T.DoubleSide }), 0.25, 0.80, -2.17, {});

    section('checkout');
    /* ---------- oden counter ---------- */
    S.box(1.20, 0.94, 0.72, S.toon(0xb9c3c7), -2.75, 0.57, -2.62, { outline: true, outlineOpacity: .3 });
    S.box(1.26, 0.06, 0.78, metal, -2.75, 1.06, -2.62, {});
    S.box(0.98, 0.16, 0.58, S.toon(0x8e9ca4), -2.75, 1.15, -2.62, {});
    S.box(0.88, 0.02, 0.48, S.basic(0xe4a461), -2.75, 1.24, -2.62, {});
    [-.15,.15].forEach(function(dx) { S.box(.018,.08,.48,metal,-2.75+dx,1.25,-2.62,{}); });
    S.box(.88,.08,.018,metal,-2.75,1.25,-2.62,{});
    S.tube([[-2.27,1.32,-2.83],[-2.23,1.34,-2.62],[-2.28,1.32,-2.42]],.012,metal);
    for (var od = 0; od < 8; od++) {
      S.cyl(0.09, 0.09, 0.06, 8, S.toon([0xf0dfb5, 0xc79a68, 0xe8e2cd, 0xb98c60][od % 4]),
        -2.75 - 0.34 + (od % 4) * 0.22, 1.27, -2.62 - 0.13 + Math.floor(od / 4) * 0.26, {});
    }
    S.box(0.02, 0.02, 0.42, metal, -2.30, 1.31, -2.62, {});
    S.plane(0.50, 0.28, S.basic(0xffffff, { map: S.tex.priceTag('おでん', '#ffcf8a'), transparent: true, side: T.DoubleSide }), -2.75, 1.55, -2.98, {});
    S.box(0.02, 0.38, 0.02, metal, -2.75, 1.36, -2.98, {});
    S.glow(-2.75, 1.30, -2.62, 0xffbb7a, .4, .05);
    for (var puff = 0; puff < 4; puff++) {
      (function (offset) {
        var steam = S.glow(-2.75, 1.36, -2.62, 0xfff0dd, .28, .10);
        steam.material.blending = T.NormalBlending;
        S.addUpdate(function (t) {
          var age = (t * .56 + offset) % 1;
          steam.position.set(-2.75 + Math.sin(t * 1.1 + offset * 6) * age * .16, 1.33 + .71 * age, -2.62);
          steam.scale.set(.21 + age * .22, .24 + age * .38, 1);
          steam.material.opacity = .18 * Math.sin(Math.PI * age);
        });
      })(puff / 4);
    }

    section('oden');
    /* ---------- coffee machine ---------- */
    var coffeeBody=S.toon(0x384348);
    var cup=S.toon(0xf1e4d1);
    S.box(.86,.84,.58,wood,2.30,.52,-6.15,{});
    S.box(.91,.045,.63,metal,2.30,.96,-6.15,{});
    S.box(.52,.62,.38,coffeeBody,2.17,1.29,-6.24,{});
    S.box(.42,.31,.025,S.basic(0x1b2627),2.17,1.20,-6.043,{});
    S.box(.40,.05,.20,coffeeBody,2.17,1.01,-5.96,{});
    S.cyl(.022,.02,.06,8,metal,2.17,1.32,-5.951,{});
    S.cyl(.062,.048,.13,10,cup,2.17,1.10,-5.95,{});
    S.cyl(.065,.05,.17,10,cup,2.62,1.07,-6.13,{});
    S.plane(.38,.12,S.basic(0xffffff,{map:S.tex.label('COFFEE','¥100','#213c36','#f0e4d0')}),2.17,1.49,-6.042,{});

    section('coffee');
    /* ---------- magazine rack against the left wall ---------- */
    S.box(0.46, 1.70, 1.70, S.toon(0xb7a98f), -5.88, 0.95, -3.05, { outline: true, outlineOpacity: .3 });
    for (var mr = 0; mr < 3; mr++) {
      var my = 0.55 + mr * 0.52;
      S.box(0.50, 0.04, 1.64, S.toon(0xd6c8a9), -5.86, my, -3.05, {});
      for (var mg = 0; mg < 4; mg++) {
        S.plane(0.34, 0.44, S.basic(0xffffff, { map: S.tex.magazine(mr * 4 + mg), side: T.DoubleSide }),
          -5.62, my + 0.24, -3.05 - 0.58 + mg * 0.39, { ry: Math.PI / 2, rz: -0.08 });
      }
    }

    section('magazines');
    /* ---------- posters hanging inside the glass ---------- */
    [['sale', -5.15], ['onigiri', -3.55], ['bento', 1.85]].forEach(function (p) {
      S.plane(0.48, 0.72, S.basic(0xffffff, { map: S.tex.poster(p[0]), transparent: true, side: T.DoubleSide, depthWrite: false }), p[1], 2.42, -1.68, {});
      S.box(0.50, 0.02, 0.02, frame, p[1], 2.79, -1.68, {});
    });
    [['coffee', -3.10], ['pink', -4.55]].forEach(function (p) {
      S.plane(0.48, 0.72, S.basic(0xffffff, { map: S.tex.poster(p[0]), transparent: true, side: T.DoubleSide, depthWrite: false }), 2.72, 2.42, p[1], { ry: Math.PI / 2 });
    });

    section('posters');
    /* ---------- floor guidance + small props ---------- */
    [['1', '飲料', -3.5, -6.6], ['2', 'お菓子', -0.8, -6.6], ['3', 'お弁当', -0.8, -3.5]].forEach(function (p) {
      S.plane(0.55, 0.28, S.basic(0xffffff, { map: S.tex.label(p[0], p[1], '#e8f1e4', '#4d7c6d'), transparent: true, opacity: .8, depthWrite: false, side: T.DoubleSide }),
        p[2], f + 0.005, p[3], { rx: -Math.PI / 2 });
    });
    /* shopping baskets stacked, a cardboard box, a small bin */
    S.box(0.42, 0.26, 0.34, S.toon(0x3d6d9c), -5.55, 0.23, -1.95, {});
    S.box(0.42, 0.26, 0.34, S.toon(0x3d6d9c), -5.55, 0.47, -1.95, {});
    S.box(0.50, 0.36, 0.44, S.toon(0xc9a877), 1.55, 0.28, -7.15, { outline: true, outlineOpacity: .3 });
    S.cyl(0.18, 0.15, 0.42, 10, S.toon(0x7f8d98), 2.35, 0.31, -3.00, {});
    S.cyl(0.19, 0.19, 0.03, 10, S.toon(0x596770), 2.35, 0.53, -3.00, {});
    /* fire extinguisher by the staff door */
    S.cyl(0.09, 0.09, 0.42, 8, S.toon(0xd3513f), -5.95, 0.31, -6.75, {});

    section('smallProps');
    fixtures.staff.concat(fixtures.endGoods).forEach(function(o){S.world.remove(o);});
    // Staff-only storage is enclosed behind the cashier, with a real opening.
    var partition=S.toon(0xb9b7aa);
    S.box(2,.10,1.9,partition,-5.05,2.75,-7.5,{});
    S.box(.08,2.6,1.9,partition,-4.05,1.4,-7.5,{});
    S.box(.5,2.6,.08,partition,-5.85,1.4,-6.55,{});
    S.box(.55,2.6,.08,partition,-4.32,1.4,-6.55,{});
    S.box(1.22,.5,.08,partition,-5.07,2.45,-6.55,{});
    var spare=S.layout.interior.stockShelf;
    [.24,.715,1.18].forEach(function(y) {
      S.box(.52,.045,1.35,shelfMetal,-5.69,y,-7.52,{});
    });
    [-5.93,-5.45].forEach(function(x) {
      [-8.17,-6.88].forEach(function(z){S.box(.035,1.22,.035,frame,x,.71,z,{});});
    });
    var carton=S.toon(0xb19772);
    for(var stock=0;stock<5;stock++) {
      S.box(.35,.25,.35,carton,-5.69,[.387,.862,1.327][Math.floor(stock/2)],-7.96+(stock%2)*.47,{});
    }
    S.box(.31,.016,.29,frame,spare[0],spare[1]-.034,spare[2],{});
    S.plane(.65,.18,S.basic(0xffffff,{map:S.tex.label('STAFF','関係者のみ','#d9d5c7','#3f5356')}),-5.07,2.4,-6.49,{});
    move('drinks',-3.22,-8.22);
    move('shelfLeft',-4.85,-5.25);
    move('shelfRight',-2.15,-5.25);
    move('bento',1.75,-4.15);
    // Animated meal follows world-space navigation anchors.
    S.world.updateMatrixWorld(true);
    S.world.attach(S.displayMeal);
    S.layout.interior.meal=S.displayMeal.position.toArray();
    move('checkout',.25,-2.55);
    move('oden',-2.75,-2.62);
    move('freezer',-3.55,-2.3);
    move('coffee',2.3,-6.15);
    move('magazines',-5.88,-3.05);
    fixtures.smallProps.forEach(function(o){S.world.remove(o);});
    var doorCenter=new T.Vector3(), hingePoint=new T.Vector3(), edgePoint=new T.Vector3();
    S.coldDoorBlocks = function(door,x,z) {
      door.hinge.getWorldPosition(hingePoint);
      door.hinge.localToWorld(edgePoint.set(-door.side*1.08,0,0));
      var dx=edgePoint.x-hingePoint.x, dz=edgePoint.z-hingePoint.z;
      var along=S.clamp(((x-hingePoint.x)*dx+(z-hingePoint.z)*dz)/(dx*dx+dz*dz),0,1);
      return Math.hypot(x-hingePoint.x-dx*along,z-hingePoint.z-dz*along)<.18;
    };
    S.nearbyColdDoor = function() {
      if(!S.camera || !S.isStoreView(S.view)) return null;
      var closest=null, distance=1.65;
      S.coldDoors.forEach(function(door) {
        doorCenter.copy(door.hinge.position);
        doorCenter.x -= door.side*.54;
        doorCenter.y = 1.22;
        door.hinge.parent.localToWorld(doorCenter);
        var d=doorCenter.distanceTo(S.camera.position);
        if(d<distance) { distance=d; closest=door; }
      });
      return closest;
    };
    S.groundPlane(.26,.10,S.basic(0xc8b888),-3.52,.102,-3.86);
    S.groundPlane(.26,.10,S.basic(0xc8b888),-3.52,.102,-4.53);
    for(var basket=0;basket<3;basket++){
      var basketY=.16+basket*.061;
      S.box(.35,.028,.25,frame,.82,basketY,-2.04,{});
      [-1,1].forEach(function(side){
        S.box(.35,.067,.018,frame,.82,basketY+.033,-2.04+side*.122,{});
        S.box(.018,.067,.25,frame,.82+side*.167,basketY+.033,-2.04,{});
      });
    }
    var sole=S.basic(0x414e50,{transparent:true,opacity:.12,depthWrite:false});
    for(var step=0;step<6;step++){
      S.groundPlane(.075,.17,sole,-.8+(step%2?.11:-.11),.102,-2.1-step*.16,step%2?.1:-.1);
    }
    S.toggleColdDoor = function() {
      var door=S.nearbyColdDoor();
      if(door) door.open=!door.open;
    };
    S.addUpdate(function(t,dt) {
      S.coldDoors.forEach(function(door) {
        var target=door.open ? door.side*1.05 : 0;
        if (Math.abs(target-door.angle)<.001) return;
        var turn=door.angle+(target-door.angle)*Math.min(1,dt*3);
        door.hinge.rotation.y=turn;
        var viewer=S.camera && S.isStoreView(S.view) ? S.camera.position : null;
        var shopper=S.people[0] && S.people[0].group.position;
        if ((viewer && S.coldDoorBlocks(door,viewer.x,viewer.z)) ||
            (shopper && S.coldDoorBlocks(door,shopper.x,shopper.z))) {
          door.hinge.rotation.y=door.angle;
          return;
        }
        door.angle=turn;
      });
    });
  };
})(window.S);

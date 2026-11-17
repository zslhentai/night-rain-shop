/* ============================================================
   interior.js — warm, fully stocked convenience store interior
   ============================================================ */
(function (S) {
  var T = THREE;

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
    var shelfMetal=S.shopMaterial(0xbecbc6);
    function tag(name,price){
      return S.basic(0xffffff,{map:S.tex.label(name,price,'#eaece1','#344643')});
    }
    var fixturesPlan=S.layout.interior.fixtures;

    S.buildShopLighting();

    /* ---------- back wall light boxes ---------- */
    S.box(4.3, 0.72, 0.10, frame, -1.7, 2.72, -8.47, {});
    S.plane(4.15, 0.60, S.basic(0xffffff, { map: S.tex.adPanel('冷たい飲料', 'WATER · TEA · SODA', '#e4ece5') }), -1.7, 2.72, -8.40, {});
    S.glow(-1.7, 2.72, -8.32, 0xffe3c4, .6, .06);
    S.box(1.5, 0.55, 0.09, frame, 1.9, 2.62, -8.47, {});
    S.plane(1.4, 0.46, S.basic(0xffffff, { map: S.tex.adPanel('お弁当', 'できたて', '#ffe8b9') }), 1.9, 2.62, -8.40, {});

    /* ---------- refrigerated drink cabinets along the back wall ---------- */
    var beverages=[['can','juice','milk','coffee'],['tea','soda','water','tea']];
    function drinkCabinet(bx,bank) {
      var first=S.world.children.length, originalStock=[], ownHinges=[];
      function stock(id,x,y,z,angle) {
        var index=S.products[id].positions.length;
        S.stockProduct(id,x,y,z,angle);
        originalStock.push({id:id,index:index});
      }
      // A hollow cabinet: rear panel and jambs leave the stock visible.
      S.box(2.35, 2.22, .06, white, bx, 1.22, -8.50, {});
      [-1.14,1.14].forEach(function (dx) {
        S.box(.07,2.22,.62,white,bx+dx,1.22,-8.22,{});
        S.box(.025,1.95,.025,S.basic(0xe5f5ff),bx+dx*.94,1.2,-7.96,{});
      });
      S.box(2.35,.12,.62,frame,bx,.17,-8.22,{});
      S.plane(.34,.10,S.basic(0xffffff,{map:S.tex.label('4°C','','#183c39','#c3e7cc')}),bx+.78,2.37,-7.88,{});
      var litBack=S.shopMaterial(0xbdc6bc,{emissiveIntensity:.14});
      S.box(2.16,1.91,.022,litBack,bx,1.21,-8.46,{});
      var gate=S.shopMaterial(0x869e9c);
      var panel=S.makeTex(256,32,function(ctx,w,h){
        ctx.fillStyle='#343e42';ctx.fillRect(0,0,w,h);
        ctx.fillStyle='#151d20';for(var stripe=4;stripe<w;stripe+=10) ctx.fillRect(stripe,6,6,20);
      });
      S.plane(2.12,.095,S.basic(0xffffff,{map:panel}),bx,.197,-7.894,{});
      for(var row=0;row<4;row++){
        var yy=.31+row*.465;
        S.box(2.12,.035,.50,metal,bx,yy,-8.20,{});
        S.box(2.12,.048,.025,gate,bx,yy+.018,-7.947,{});
        var picks=beverages[bank];
        for(var bay=0;bay<4;bay++){
          var id=picks[(bay+row)%picks.length], product=S.products[id];
          var localX=bx-.84+bay*.55;
          var worldX=fixturesPlan.drinks.x+(localX+3.22)*fixturesPlan.drinks.width;
          S.plane(.26,.048,tag(product.title,'¥'+product.price),localX,yy+.019,-7.932,{});
          [-.11,.105].forEach(function(dx,slot){
            if(!(row===1 && bay===2 && slot===0)){
              stock(id,worldX+dx*.8,yy+.019,-8.08,S.range(-.04,.04));
            }
            if((bay+row+slot)%3===0) stock(id,worldX+dx*.8,yy+.019,-8.29,0);
          });
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
        ownHinges.push(hinge);
      });
      S.box(2.35, 0.16, 0.66, frame, bx, 2.36, -8.22, {});
      S.plane(0.72, 0.22, S.basic(0xffffff, { map: S.tex.label(bank===0?'乳製品・珈琲':'水・お茶','冷蔵','#dae8de','#304c4b') }), bx, 2.36, -7.87, {});
      S.glow(bx, 2.15, -7.92, 0xdcefff, 1.2, .07);
      if(bank===1) S.coolerFallback={
        body:S.world.children.slice(first).filter(function(obj){return ownHinges.indexOf(obj)===-1;}),
        doors:ownHinges,stock:originalStock,widthScale:fixturesPlan.drinks.width,
        location:[fixturesPlan.drinks.x+(bx+3.22)*fixturesPlan.drinks.width,0,fixturesPlan.drinks.z]
      };
    }
    section('lighting');
    drinkCabinet(-4.72,0);
    drinkCabinet(-1.72,1);

    section('drinks');
    /* Four shelf faces are stocked by category, with clear price rails. */
    var shelfFaces=[
      [['cup','bowl','noodles'],['soap','care','tissue','paper']],
      [['chips','crackers','biscuits'],['candy','bread','gum']]
    ];
    function shelf(plan,index){
      var x=plan.x,z=plan.z;
      S.box(.055,1.22,2.02,shelfMetal,x,.73,z,{});
      var steel=S.shopMaterial(0x7d9590);
      var feet=S.shopMaterial(0x3e5251);
      var bases=[.24,.575,.91];
      [-.97,.97].forEach(function(edge){
        S.box(.86,.10,.10,feet,x,.15,z+edge,{});
        S.box(.07,1.27,.075,steel,x,.775,z+edge,{});
      });
      S.box(.84,.045,2.10,shelfMetal,x,1.36,z,{});
      bases.forEach(function(y,level){
        S.box(.89,.039,2.10,shelfMetal,x,y,z,{});
        [-1,1].forEach(function(side,face){
          var picks=shelfFaces[index][face];
          var first=picks[(level+face)%picks.length], second=picks[(level+face+1)%picks.length];
          S.box(.026,.064,2.10,steel,x+side*.44,y+.018,z,{});
          [first,second].forEach(function(id,block){
            var item=S.products[id], front=z-.81+block*.98;
            S.plane(.37,.052,tag(item.title,'¥'+item.price),x+side*.455,y+.02,front+.26,{ry:side*Math.PI/2});
            for(var slot=0;slot<4;slot++){
              if(level===1 && (index+block+face)%3===0 && slot===2) continue;
              S.stockProduct(id,x+side*.29,y+.027,front+slot*.205+S.range(-.017,.017),side*Math.PI/2+S.range(-.05,.05));
            }
          });
        });
      });
      // The shallow end cap remains inside the same collision footprint.
      S.box(.66,.044,.30,shelfMetal,x,.62,z+.84,{});
      S.plane(.62,.125,tag(index?'今週のおやつ':'新商品','おすすめ'),x,.81,z+1.052,{});
      S.stockProduct(index?'biscuits':'cup',x-.17,.65,z+.88,0);
      S.stockProduct(index?'candy':'bowl',x+.15,.65,z+.88,.07);
    }
    // Attach these directly in their planned coordinates.
    shelf(fixturesPlan.shelfLeft,0);
    shelf(fixturesPlan.shelfRight,1);
    section('salesShelves');
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
    // Separate short-dated product tiers and reserve a real purchasable slot.
    var fresh=fixturesPlan.bento;
    [['bento',.948,-3.58],['sandwich',1.056,-4.38],['onigiri',1.267,-4.86]].forEach(function(row){
      var [id,height,localZ]=row, item=S.products[id];
      for(var slot=0;slot<5;slot++){
        if((id==='bento' && slot===2)||(id==='sandwich' && slot===4)) continue;
        S.stockProduct(id,fresh.x-.63+slot*.313,height,fresh.z+(localZ+4.15)*fresh.depth,S.range(-.05,.05));
      }
      S.plane(.34,.062,tag(item.title,'¥'+item.price),1.75,height+.02,localZ+.275,{});
    });
    S.displayMeal=S.makeMeal();
    S.displayMeal.position.set(1.75,.976,-3.51);
    S.stock={available:true,scans:0,restocks:0};
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
    var printer=S.shopMaterial(0x3f5358);
    S.box(.20,.14,.22,printer,-.28,1.16,-2.73,{});
    S.box(.145,.009,.025,frame,-.28,1.234,-2.65,{});
    S.receipt = S.plane(.11,.154,tag('お買上票','540'),-.28,1.292,-2.638,{rx:-.28});
    S.box(.36,.045,.21,shelfMetal,1.33,1.107,-2.49,{});
    S.box(.36,.08,.016,frame,1.33,1.157,-2.38,{});
    S.box(.30,.21,.22,S.shopMaterial(0x687d77),.45,.74,-2.94,{});
    S.box(.17,.12,.14,S.shopMaterial(0xc1976c),.45,.91,-3.02,{});
    var desk=fixturesPlan.checkout;
    ['gum','candy'].forEach(function(id,i){
      S.stockProduct(id,desk.x+.02,1.131,desk.z-1.01-i*.15,Math.PI/2);
    });
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
    S.stockProduct('paperCup',fixturesPlan.coffee.x+.13,1.036,fixturesPlan.coffee.z-.20,Math.PI);
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
    var serviceDoor=S.group();
    serviceDoor.position.set(-5.59,.10,-6.53);
    S.box(1.00,2.04,.038,S.shopMaterial(0x8b9a93),.50,1.02,0,{parent:serviceDoor});
    S.box(.16,.035,.05,metal,.84,1.08,.032,{parent:serviceDoor});
    var serviceAngle=0;
    S.addUpdate(function(t,dt){
      var p=S.people.find(function(person){return person.staff;});
      var near=p && Math.abs(p.group.position.x+5.15)<.59 && Math.abs(p.group.position.z+6.53)<.70;
      serviceAngle+=((near?-1.50:0)-serviceAngle)*Math.min(1,dt*9);
      serviceDoor.rotation.y=serviceAngle;
    });

    var clockFrame=S.shopMaterial(0x36484a);
    S.cyl(.173,.173,.045,16,clockFrame,-4.29,2.45,-6.48,{rx:Math.PI/2});
    S.cyl(.145,.145,.012,16,S.basic(0xf1e9d5),-4.29,2.45,-6.45,{rx:Math.PI/2});
    S.box(.018,.093,.008,clockFrame,-4.31,2.473,-6.437,{rz:.54});
    S.box(.013,.112,.008,clockFrame,-4.272,2.488,-6.436,{rz:-.38});
    S.cyl(.078,.078,.37,12,S.shopMaterial(0xb63d36),-5.86,.37,-6.37,{});
    S.tube([[-5.86,.55,-6.37],[-5.95,.60,-6.37],[-5.98,.40,-6.36]],.013,clockFrame);
    S.plane(.22,.10,tag('消火器',''),-5.87,.77,-6.498,{});

    move('drinks',-3.22,-8.22);
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
    S.buildProductBatches();
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

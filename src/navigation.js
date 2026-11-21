/* Pedestrian paths, shop fixtures and frame-rate independent walking. */
(function(S){
  var direction=new THREE.Vector3();
  var held=Object.create(null);
  var radius=.18, speed=1.55;
  var moveKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];

  function contains(b,x,z) { return x>=b[0] && x<=b[1] && z>=b[2] && z<=b[3]; }
  function intersects(b,x,z) {
    return Math.hypot(Math.max(b[0]-x,0,x-b[1]),Math.max(b[2]-z,0,z-b[3]))<radius;
  }
  S.isWalkPosition = function(x,z,previousX,previousZ) {
    var shop=S.SHOP, entry=S.layout.entrance;
    if(x>=shop.x0+radius && x<=shop.x1-radius && z>=shop.z0+radius && z<=-.76) {
      if(z>shop.z1-radius){
        if(Math.abs(x-entry.x)>.42) return false;
        if(z<shop.z1+.19 && (!S.door || S.door.open<.88)) return false;
      }
      if(S.fixtureBlocks(x,z,radius,false)) return false;
      return !S.coldDoors || !S.coldDoors.some(function(door){
        return Math.abs(door.angle)>.05 && S.coldDoorBlocks(door,x,z);
      });
    }
    if(S.view!=='street-walk') return false;
    if(z>shop.z1-radius && z<shop.z1+radius && x>=shop.x0-radius && x<=shop.x1+radius){
      if(Math.abs(x-entry.x)>.42) return false;
      if(!S.door || S.door.open<.88) return false;
    }
    var street=S.layout.streetWalk;
    if(street.obstacles.some(function(b){return intersects(b,x,z);})) return false;
    if(S.bus && S.bus.phase!=='away'){
      var lane=S.layout.busStop.laneX;
      if(Math.abs(x-lane)<.99+radius && Math.abs(z-S.bus.z)<2.37+radius) return false;
    }
    if(contains(street.crossing,x,z)) {
      return previousX===undefined || S.traffic.canEnter || contains(street.crossing,previousX,previousZ);
    }
    return street.paths.some(function(b){return contains(b,x,z);});
  };
  S.cameraAtDoor=function(){
    if(!S.isWalkView(S.view) || !S.camera) return false;
    var p=S.camera.position, entry=S.layout.entrance;
    return Math.abs(p.x-entry.x)<.65 && p.z>entry.sensorBack-.25 && p.z<entry.sensorFront;
  };

  S.walkStep=function(side,back){
    if(S.holdingProduct?.() || !S.isWalkView(S.view) || (!side&&!back)) return;
    S.camera.getWorldDirection(direction);
    direction.y=0; direction.normalize();
    var dx=-direction.x*back-direction.z*side, dz=-direction.z*back+direction.x*side;
    var position=S.camera.position;
    // Substep wheel and keyboard movements, including the door threshold.
    var steps=Math.ceil(Math.hypot(dx,dz)/.075);
    for(var i=0;i<steps;i++){
      var x=position.x+dx/steps, z=position.z+dz/steps;
      if(S.isWalkPosition(x,position.z,position.x,position.z)) position.x=x;
      if(S.isWalkPosition(position.x,z,position.x,position.z)) position.z=z;
    }
    position.y=S.groundHeight(position.x,position.z)+1.6;
  };

  window.addEventListener('keydown',function(e){
    if(!S.isWalkView(S.view) || /INPUT|SELECT|BUTTON/.test(e.target.tagName) || moveKeys.indexOf(e.code)<0) return;
    held[e.code]=true;
    e.preventDefault();
  });
  window.addEventListener('keyup',function(e){delete held[e.code];});
  S.walkInput={side:0,back:0};
  S.resetWalkInput=function(){
    held=Object.create(null);
    S.walkInput.side=S.walkInput.back=0;
    if(S.resetJoystick) S.resetJoystick();
  };
  window.addEventListener('blur',S.resetWalkInput);
  S.updateWalk=function(dt){
    var side=(held.KeyD||held.ArrowRight?1:0)-(held.KeyA||held.ArrowLeft?1:0)+S.walkInput.side;
    var back=(held.KeyS||held.ArrowDown?1:0)-(held.KeyW||held.ArrowUp?1:0)+S.walkInput.back;
    var norm=Math.max(1,Math.hypot(side,back));
    var position=S.camera.position, oldX=position.x, oldZ=position.z;
    S.walkStep(side*dt*speed/norm,back*dt*speed/norm);
    if((Math.abs(position.x-oldX)+Math.abs(position.z-oldZ)>.001) && S.refreshAudio &&
       S.streetZone({x:oldX,z:oldZ})!==S.streetZone(position)) S.refreshAudio();
    if(Math.hypot(position.x-oldX,position.z-oldZ)>.001 && S.walkAmbience) S.walkAmbience(dt);
  };
})(window.S);

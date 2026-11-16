/* ============================================================
   main.js — assemble the diorama and run the render loop
   ============================================================ */
(function (S) {
  function boot() {
    try { S.init(); } catch (error) {
      document.getElementById('render-error').hidden = false;
      document.getElementById('controls').hidden = true;
      console.error(error);
      return;
    }

    /* build order: ground -> shell -> interior -> street props -> animation */
    S.buildBase();
    S.buildStore();
    S.buildInterior();
    S.buildStreet();
    S.buildNeighborhood();
    S.buildDetails();
    S.buildPeople();
    S.buildBus();
    S.buildEffects();
    S.installShopInteractions();
    setupJoystick();
    S.resetView();
    var views = document.querySelectorAll('[data-view]');
    views.forEach(function (button) {
      button.onclick = function () {
        if(document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
        S.setView(button.dataset.view);
        document.getElementById('scene').focus({preventScroll:true});
        refreshWalkControls();
        views.forEach(function (other) {
          other.setAttribute('aria-pressed', String(other === button));
        });
      };
    });
    document.getElementById('walk-forward').onclick = function(){ S.walkStep(0,-.25); };
    document.getElementById('walk-back').onclick = function(){ S.walkStep(0,.25); };
    var walkControls = document.getElementById('walk-controls');
    var coldDoorButton = document.getElementById('cold-door');
    function refreshWalkControls() {
      walkControls.hidden = !S.isStoreView(S.view);
      document.getElementById('joystick').hidden=walkControls.hidden;
      var door = walkControls.hidden ? null : S.nearbyColdDoor();
      coldDoorButton.hidden = !door;
      if (door) {
        var label = door.open ? '关闭冷柜' : '打开冷柜';
        if (coldDoorButton.textContent !== label) coldDoorButton.textContent = label;
      }
    }
    S.addUpdate(refreshWalkControls);
    refreshWalkControls();
    coldDoorButton.onclick = function(){ S.toggleColdDoor(); };
    var canvas=document.getElementById('scene');
    var lockButton=document.getElementById('mouse-lock');
    lockButton.hidden=!canvas.requestPointerLock;
    lockButton.onclick=function(){
      if(!canvas.requestPointerLock) return;
      if(document.pointerLockElement===canvas) {document.exitPointerLock();return;}
      try {
        var result=canvas.requestPointerLock();
        if(result && result.catch) result.catch(lockFailed);
      } catch(error){lockFailed();}
    };
    function lockFailed(){lockButton.textContent='可拖动转向';}
    document.addEventListener('pointerlockerror',lockFailed);
    document.addEventListener('pointerlockchange',function(){
      var locked=document.pointerLockElement===canvas;
      lockButton.setAttribute('aria-pressed',String(locked));
      lockButton.textContent=locked?'Esc 退出锁定':'锁定鼠标';
      if(locked) canvas.focus();
      S.resetWalkInput();
    });
    var quality = document.getElementById('quality');
    if(window.matchMedia('(pointer: coarse)').matches) quality.value='low';

    S.setQuality(quality.value);
    quality.onchange = function () { S.setQuality(quality.value); };
    document.getElementById('weather').onchange = function (e) {
      S.rainIntensity = Number(e.target.value);
      S.refreshAudio();
    };
    document.getElementById('photo').onclick = function () {
      S.returnProduct();
      S.resetWalkInput();
      document.body.classList.add('photo');
      document.getElementById('exit-photo').focus();
    };
    function exitPhoto() {
      if (!document.body.classList.contains('photo')) return;
      document.body.classList.remove('photo');
      document.getElementById('photo').focus();
    }
    document.getElementById('exit-photo').onclick = exitPhoto;
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') exitPhoto(); });

    var clock = new THREE.Clock();
    function frame() {
      requestAnimationFrame(frame);
      var dt = Math.min(clock.getDelta(), 0.10);
      if (document.hidden) return;
      S.simulationTime = (S.simulationTime || 0) + dt;
      var t = S.simulationTime;
      S.updateTraffic(t);
      S.updateCamera(dt);
      for (var i = 0; i < S.updaters.length; i++) S.updaters[i](t, dt);
      S.renderer.render(S.scene, S.camera);
    }
    frame();
  }

  function setupJoystick(){
    var base=document.getElementById('joystick'), knob=base.firstElementChild;
    var active=null, originX=0, originY=0, limit=29;
    function move(e){
      if(active!==e.pointerId) return;
      var dx=e.clientX-originX, dy=e.clientY-originY;
      var factor=Math.max(1,Math.hypot(dx,dy)/limit);
      dx/=factor; dy/=factor;
      S.walkInput.side=dx/limit; S.walkInput.back=dy/limit;
      knob.style.transform='translate('+dx+'px,'+dy+'px)';
    }
    function reset(){
      active=null;
      S.walkInput.side=S.walkInput.back=0;
      knob.style.transform='';
    }
    S.resetJoystick=reset;
    base.addEventListener('pointerdown',function(e){
      if(active!==null) return;
      active=e.pointerId;
      var r=base.getBoundingClientRect();
      originX=r.left+r.width/2; originY=r.top+r.height/2;
      base.setPointerCapture(active);
      move(e);
    });
    base.addEventListener('pointermove',move);
    ['pointerup','pointercancel','lostpointercapture'].forEach(function(event){
      base.addEventListener(event,function(e){if(e.pointerId===active) reset();});
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.S);

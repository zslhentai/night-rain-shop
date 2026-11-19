/* ============================================================
   main.js — assemble the diorama and run the render loop
   ============================================================ */
(function (S) {
  function reportError(message,error) {
    if(window.rainPreview) window.rainPreview.fail(message);
    else {
      document.getElementById('render-error').hidden = false;
      document.getElementById('controls').hidden = true;
    }
    console.error(error);
  }

  function boot() {
    if(S.perf) S.perf.mark('场景初始化开始');
    try { S.init(); } catch (error) {
      reportError('当前浏览器无法启动 WebGL。请在 Safari 或 Chrome 中直接打开后重试。',error);
      return;
    }
    try { startScene(); } catch (error) {
      reportError('3D 场景初始化失败。请重新加载。',error);
    }
  }

  function startScene() {
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
    S.installNightShopping();
    if(S.perf) S.perf.mark('场景组装完成');
    if(S.installPerformancePanel) S.installPerformancePanel(S.renderer);
    if(S.legacyTuning && S.loadCoolerSample) S.loadCoolerSample();
    setupJoystick();
    S.resetView();
    var settings=document.getElementById('settings-list'), settingsToggle=document.getElementById('settings-toggle');
    var viewList=document.getElementById('view-list'), viewsToggle=document.getElementById('views-toggle');
    function closeViews(){viewList.classList.remove('expanded');viewsToggle.setAttribute('aria-expanded','false');}
    function closeSettings(){settings.hidden=true;settingsToggle.setAttribute('aria-expanded','false');}
    viewsToggle.onclick=function(){closeSettings();viewsToggle.setAttribute('aria-expanded',String(viewList.classList.toggle('expanded')));};
    settingsToggle.onclick=function(){closeViews();settings.hidden=!settings.hidden;settingsToggle.setAttribute('aria-expanded',String(!settings.hidden));};
    var views = document.querySelectorAll('[data-view]');
    views.forEach(function (button) {
      button.onclick = function () {
        if(document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
        closeViews(); closeSettings();
        if(!S.isStoreView(button.dataset.view)) S.leaveNightShopping();
        S.setView(button.dataset.view);
        if(S.perf && S.perf.reset) S.perf.reset();
        if(window.rainPreview) window.rainPreview.view(S.view==='cooler-art');
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
    var joystick = document.getElementById('joystick');
    var coldDoorButton = document.getElementById('cold-door');
    function refreshWalkControls() {
      var outside = !S.isStoreView(S.view);
      if(walkControls.hidden!==outside) walkControls.hidden=outside;
      if(joystick.hidden!==outside) joystick.hidden=outside;
      var door = outside ? null : S.nearbyColdDoor();
      if(coldDoorButton.hidden!==!door) coldDoorButton.hidden=!door;
      if (door) {
        var label = door.open ? '关闭冷柜' : '打开冷柜';
        if (coldDoorButton.textContent !== label) coldDoorButton.textContent = label;
      }
    }
    var controlsElapsed=0, artElapsed=0;
    var shopping=document.getElementById('errand-start');
    shopping.disabled=true;
    S.addUpdate(function(t,dt){
      controlsElapsed+=dt; artElapsed+=dt;
      if(artElapsed>.45){
        S.queueNightStock();artElapsed=0;
        if(shopping.disabled && ['original','ready','fallback'].includes(S.coolerSampleState)) shopping.disabled=false;
        if(S.door && S.refreshDoorAudio) S.refreshDoorAudio();
      }
      if(S.legacyTuning || controlsElapsed>=.08){
        refreshWalkControls();
        controlsElapsed=0;
      }
    });
    refreshWalkControls();
    coldDoorButton.onclick = function(){
      var door=S.nearbyColdDoor();
      if(!door) return;
      if(S.perf) S.perf.interaction(door.open?'关柜门':'开柜门');
      S.returnProduct();
      S.toggleColdDoor();
      refreshWalkControls();
    };
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
    quality.value=S.initialQuality;

    S.setQuality(quality.value);
    quality.onchange = function () {
      if(S.perf && S.perf.reset){
        S.perf.reset(true);
        S.perf.interaction(quality.value==='high'?'切换高清':'切换流畅');
      }
      S.setQuality(quality.value);
    };
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
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') {exitPhoto();S.returnProduct();closeSettings();closeViews();} });

    var preset=new URLSearchParams(location.search).get('view');
    var requested=Array.from(views).find(button=>button.dataset.view===preset);
    if(requested) requested.click();
    if(new URLSearchParams(location.search).get('shot')==='1') document.getElementById('photo').click();
    var clock = new THREE.Clock();
    var firstFrame=true, firstAssetFrame=true;
    function frame(stamp) {
      var dt = Math.min(clock.getDelta(), 0.10);
      if(!document.hidden){
        var renderStart=S.perf && S.perf.beforeFrame ? S.perf.beforeFrame() : 0;
        try {
          S.simulationTime = (S.simulationTime || 0) + dt;
          var t = S.simulationTime;
          S.updateTraffic(t);
          S.updateCamera(dt);
          for (var i = 0; i < S.updaters.length; i++) S.updaters[i](t, dt);
          S.cullStockBatches();
          S.renderer.render(S.scene, S.camera);
        } catch(error){
          reportError('3D 渲染失败。请重新加载。',error);
          return;
        }
        if(firstFrame && S.renderer.info.render.calls>0){
          firstFrame=false;
          if(S.perf){
            S.perf.mark('场景首帧提交');
            if(S.perf.sceneFrame) S.perf.sceneFrame();
          }
          if(window.rainPreview) window.rainPreview.ready();
          if(!S.legacyTuning && S.loadCoolerSample) S.loadCoolerSample();
        }
        if(firstAssetFrame && S.coolerSampleState==='ready'){
          firstAssetFrame=false;
          if(S.perf) {
            S.perf.mark('冷柜装配后首帧提交');
            if(S.perf.assetFrame) S.perf.assetFrame();
          }
        }
        if(S.perf && S.perf.frame) S.perf.frame(stamp,renderStart);
      }
      requestAnimationFrame(frame);
    }
    frame(performance.now());
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

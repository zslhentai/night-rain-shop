/* ============================================================
   main.js — assemble the diorama and run the render loop
   ============================================================ */
(function (S) {
  function boot() {
    S.init();

    /* build order: ground -> shell -> interior -> street props -> animation */
    S.buildBase();
    S.buildStore();
    S.buildInterior();
    S.buildStreet();
    S.buildNeighborhood();
    S.buildPeople();
    S.buildEffects();
    S.resetView();
    document.getElementById("reset-view").onclick = S.resetView;
    document.getElementById("quality").onchange = function (e) { S.setQuality(e.target.value); };
    setTimeout(function () { document.getElementById("hint").style.opacity = 0; }, 10000);

    /* a very soft cool ambience around the whole model */
    S.glow(0, 1.2, 0, 0x6f9fd8, 26, 0.055);
    S.glow(-1.7, 1.6, -4.6, 0xffa45c, 9.5, 0.075);

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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.S);

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
    S.resetView();
    var views = document.querySelectorAll('[data-view]');
    views.forEach(function (button) {
      button.onclick = function () {
        S.setView(button.dataset.view);
        views.forEach(function (other) {
          other.setAttribute('aria-pressed', String(other === button));
        });
      };
    });
    var quality = document.getElementById('quality');
    if (window.innerWidth < 650) quality.value = 'low';
    S.setQuality(quality.value);
    quality.onchange = function () { S.setQuality(quality.value); };
    document.getElementById('weather').onchange = function (e) {
      S.rainIntensity = Number(e.target.value);
      S.refreshAudio();
    };
    document.getElementById('photo').onclick = function () {
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

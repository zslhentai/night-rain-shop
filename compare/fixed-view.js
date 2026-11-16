document.addEventListener('DOMContentLoaded', function () {
  if (!S.renderer) return;
  var shots = {
    front: [[-.8, 2.13, 7.9], [-1.35, 1.66, -2.15], 'entrance', 64],
    angle: [[1.4, 2.4, 3.5], [-1.3, 1.55, -1.42], 'entrance', 76],
    inside: [[-.8, 1.65, -2.25], [-1.28, 1.4, -6.5], 'interior', 76]
  };
  var shot = shots[new URLSearchParams(location.search).get('shot')] || shots.front;
  S.setView(shot[2]);
  S.setQuality('low');
  var dt = 1 / 30;
  for (var frame = 1; frame <= 285; frame++) {
    var time = frame * dt;
    S.updateTraffic(time);
    S.updaters.forEach(function (step) { step(time, dt); });
  }
  function draw() {
    S.camera.position.fromArray(shot[0]);
    S.camera.lookAt(new THREE.Vector3().fromArray(shot[1]));
    S.camera.fov = innerWidth < innerHeight ? shot[3] : shot[3] - 20;
    S.camera.updateProjectionMatrix();
    S.renderer.render(S.scene, S.camera);
  }
  draw();
  window.addEventListener('resize', draw);
});

/* Project the storefront's illuminated surfaces onto broken patches of wet asphalt. */
(function (S) {
  var T = THREE;

  S.buildWetStreet = function () {
    var shop = S.wetShop;
    var lights = new T.Scene();
    shop.fascia.forEach(function (face) {
      var copy = face.clone();
      copy.material = new T.MeshBasicMaterial({ map:face.material.map, color:0xe4c7a1 });
      lights.add(copy);
    });

    var panes = S.makeTex(96, 128, function (ctx, w, h) {
      var glow = ctx.createLinearGradient(0, 0, 0, h);
      glow.addColorStop(0, '#fde9b9');
      glow.addColorStop(.32, '#eac593');
      glow.addColorStop(.7, '#8e7652');
      glow.addColorStop(1, '#d6ae72');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#405449';
      ctx.fillRect(0, h*.69, w, 6);
      ctx.fillRect(0, 0, 4, h);
      ctx.fillRect(w-4, 0, 4, h);
    });
    var windowLight = new T.MeshBasicMaterial({map:panes});
    function lightSurface(width, height, material, x, y, z, rotation) {
      var face = new T.Mesh(new T.PlaneGeometry(width, height),material);
      face.position.set(x,y,z);
      face.rotation.y = rotation || 0;
      lights.add(face);
    }
    [-5.66,-4.73,-3.80,-2.87,-1.50,-.10,1.17,2.21].forEach(function (x) {
      lightSurface(x> -2.2 && x<.1 ? 1.31 : .86,2.48,windowLight,x,1.52,shop.z1+.015);
    });
    for (var z=-6.12; z<shop.z1-.12; z+=1.02) {
      lightSurface(.93,2.48,windowLight,shop.x1+.03,1.52,z,Math.PI/2);
    }
    S.wetVending.forEach(function (machine) {
      var panel = machine.panel;
      lightSurface(1.01,2.03,new T.MeshBasicMaterial({color:machine.color}),panel.position.x+.04,1.09,panel.position.z-.01);
      lightSurface(.80,1.44,panel.material,panel.position.x,1.23,panel.position.z);
    });

    var target = new T.WebGLRenderTarget(1,1,{depthBuffer:true,stencilBuffer:false});
    var camera = new T.PerspectiveCamera();
    var direction = new T.Vector3(), aim = new T.Vector3();
    var lastPosition = new T.Vector3(Infinity,0,0), lastRotation = new T.Quaternion();
    var previousProjection = new T.Matrix4(), projection = new T.Matrix4();
    var uniforms = {
      mirrorMap:{value:target.texture}, mirrorProjection:{value:projection},
      rain:{value:1}, age:{value:0}
    };
    var asphalt = S.groundPlane(28,26,new T.ShaderMaterial({
      uniforms:uniforms, transparent:true, depthWrite:false, fog:false,
      vertexShader:`
        uniform mat4 mirrorProjection;
        varying vec4 mirrorCoord;
        varying vec3 world;
        void main() {
          vec4 p = modelMatrix * vec4(position, 1.0);
          world = p.xyz;
          mirrorCoord = mirrorProjection * p;
          gl_Position = projectionMatrix * viewMatrix * p;
        }`,
      fragmentShader:`
        uniform sampler2D mirrorMap;
        uniform float rain;
        uniform float age;
        varying vec4 mirrorCoord;
        varying vec3 world;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f*f*(3.0-2.0*f);
          return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
                     mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
        }
        void main() {
          if (mirrorCoord.w <= 0.) discard;
          vec2 uv = mirrorCoord.xy / mirrorCoord.w * .5 + .5;
          vec2 p = world.xz;
          float grain = noise(p * vec2(21.,77.));
          float rivulets = noise(p * vec2(3.8,29.) + vec2(0.,age*.65));
          float patches = noise(p * vec2(1.35,1.75));
          uv += vec2((rivulets-.5)*.028, (grain-.5)*.012);
          if (any(lessThan(uv,vec2(.003))) || any(greaterThan(uv,vec2(.997)))) discard;
          vec4 color = texture2D(mirrorMap,uv);
          float wet = smoothstep(.32,.76,patches*.66 + rivulets*.34);
          float facing = normalize(cameraPosition-world).y;
          float fresnel = mix(.78,1.12,1.-clamp(facing,0.,1.));
          float alpha = color.a * (.08+.64*wet) * (.38+.62*grain) * fresnel * mix(.81,1.,rain);
          gl_FragColor = vec4(color.rgb*vec3(1.0,.88,.69),alpha);
          #include <tonemapping_fragment>
          #include <encodings_fragment>
        }`
    }),0,.018,0);
    asphalt.name = 'Wet storefront reflections';
    asphalt.renderOrder = -4;
    asphalt.visible = false;

    var lastDraw = -Infinity, planeY = asphalt.position.y;
    S.updateWetStreet = function (stamp, time) {
      var view = S.camera, renderer = S.renderer;
      var inView = (S.isOrbitView() || S.view==='entrance') &&
        view.position.y > planeY && (view.position.z > shop.z1 || view.position.x > shop.x1);
      asphalt.visible = inView;
      if (!inView) return;
      uniforms.age.value = time;
      uniforms.rain.value = S.rainIntensity;
      var low = S.quality==='low';
      var maxEdge = low ? 300 : 640;
      var width = Math.round(view.aspect >= 1 ? maxEdge : maxEdge * view.aspect);
      var height = Math.round(view.aspect >= 1 ? maxEdge / view.aspect : maxEdge);
      width = Math.max(1,width); height = Math.max(1,height);
      var resized = target.width !== width || target.height !== height;
      var moved = lastPosition.distanceToSquared(view.position) > .002 ||
        1-Math.abs(lastRotation.dot(view.quaternion)) > .000004;
      if (!resized && previousProjection.equals(view.projectionMatrix) && (!moved || stamp-lastDraw < (low ? 100 : 66))) return;

      if (resized) target.setSize(width,height);
      view.getWorldDirection(direction);
      camera.copy(view,false);
      camera.position.y = 2*planeY-view.position.y;
      camera.up.set(0,-1,0);
      direction.y *= -1;
      camera.lookAt(aim.copy(camera.position).add(direction));
      camera.updateMatrixWorld(true);
      projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);

      var previousTarget = renderer.getRenderTarget();
      renderer.setRenderTarget(target);
      try {
        renderer.clear();
        renderer.render(lights,camera);
      } finally {
        renderer.setRenderTarget(previousTarget);
      }
      lastDraw = stamp;
      lastPosition.copy(view.position);
      lastRotation.copy(view.quaternion);
      previousProjection.copy(view.projectionMatrix);
    };
  };
})(window.S);

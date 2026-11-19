/* Field-recorded rain. Lazy loaded, quiet by default, no autoplay. */
(function (S) {
  var context, source, gain, filter, hum, humGain, enabled = false;
  var stepTime=0;
  var button = document.getElementById('rain-audio');
  var volume = document.getElementById('rain-volume');
  var status = document.getElementById('audio-status');
  function volumeLevel() { return Math.pow(Number(volume.value) / 100, 1.6); }
  function indoors() {
    if(S.isStoreView) return S.isStoreView(S.view) && S.camera && S.inShop && S.inShop(S.camera.position);
    return ['interior','bento','checkout','drinks'].indexOf(S.view)!==-1;
  }
  var doorMix=0;
  S.refreshDoorAudio=function(){
    if(!enabled || !S.camera || !S.door) return;
    var entry=S.layout.entrance, pos=S.camera.position;
    var near=Math.max(0,1-Math.hypot(pos.x-entry.x,pos.z-entry.threshold)/3.2);
    var next=indoors()?near*S.door.open:0;
    if(Math.abs(next-doorMix)>.025 || (next===0 && doorMix)){doorMix=next;S.refreshAudio();}
  };
  function level() {
    var shelter = indoors() ? .42+.23*doorMix : S.view === 'entrance' ? .76 : S.view === 'stop' ? .85 : 1;
    return volumeLevel() * shelter * (.55 + .45 * S.rainIntensity);
  }
  S.refreshAudio = function () {
    if (!enabled || !filter) return;
    var cutoff = indoors() ? 680+1330*doorMix : S.view === 'entrance' ? 2300 : 5200;
    filter.frequency.setTargetAtTime(cutoff, context.currentTime, .2);
    fade(level(), .35);
    if(humGain) humGain.gain.setTargetAtTime(indoors()?volumeLevel()*.011:0,context.currentTime,.3);
  };
  S.playSceneSound = function (name) {
    if (!enabled || document.hidden || context.state !== 'running') return;
    var drip = name === 'drip';
    if (drip && S.view !== 'entrance') return;
    var now = context.currentTime, voice = context.createOscillator(), env = context.createGain();
    var step=name==='step', door=name==='door';
    var duration = step?.09:door?.18:drip?.055:.10;
    voice.type = 'sine';
    voice.frequency.setValueAtTime(step?110:door?640:drip?710:1040,now);
    voice.frequency.exponentialRampToValueAtTime(step?47:door?880:drip?370:820,now+duration);
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(volumeLevel() * (step?.038:door?.045:drip?.035*S.rainIntensity:indoors()?.12:.035), now + .006);
    env.gain.linearRampToValueAtTime(0, now + duration);
    voice.connect(env); env.connect(context.destination);
    voice.onended = function () { voice.disconnect(); env.disconnect(); };
    voice.start(now); voice.stop(now + duration);
  };
  S.walkAmbience=function(dt){
    if(!enabled || !indoors()) return;
    stepTime+=dt;
    if(stepTime>.48){stepTime=0;S.playSceneSound('step');}
  };
  function fade(value, seconds) {
    var now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(value, now + seconds);
  }
  async function prepare() {
    var response = await fetch('assets/audio/rain-street.mp3');
    if (!response.ok) throw new Error('Rain asset unavailable');
    var buffer = await context.decodeAudioData(await response.arrayBuffer());
    // Blend the last four seconds into the start, then loop to second four.
    var overlap = Math.floor(buffer.sampleRate * 4);
    for (var c = 0; c < buffer.numberOfChannels; c++) {
      var data = buffer.getChannelData(c);
      for (var i = 0; i < overlap; i++) {
        var t = i / (overlap - 1), end = data.length - overlap + i;
        data[end] = data[end] * Math.cos(t * Math.PI / 2) + data[i] * Math.sin(t * Math.PI / 2);
      }
    }
    source = context.createBufferSource(); source.buffer = buffer;
    source.loop = true; source.loopStart = 4; source.loopEnd = buffer.duration;
    gain = context.createGain(); gain.gain.value = 0;
    filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    source.connect(filter); filter.connect(gain); gain.connect(context.destination);
    source.start(0, 4);
    hum=context.createOscillator();
    hum.type='sine';
    hum.frequency.value=61;
    humGain=context.createGain();humGain.gain.value=0;
    hum.connect(humGain);humGain.connect(context.destination);hum.start();
  }
  button.addEventListener('click', async function () {
    button.disabled = true;
    try {
      if (!context) {
        context = new (window.AudioContext || window.webkitAudioContext)();
        // Resume in the user gesture, before awaiting the download (Safari).
        await context.resume();
        status.textContent = '正在加载雨声…';
        await prepare();
      }
      if (enabled) {
        fade(0, .45);
        if(humGain) humGain.gain.setTargetAtTime(0,context.currentTime,.13);
        await new Promise(function (resolve) { setTimeout(resolve, 500); });
        await context.suspend(); enabled = false;
      } else {
        await context.resume();
        if (context.state !== 'running') throw new Error('Audio suspended');
        enabled = true; S.refreshAudio();
        if (document.hidden) await context.suspend();
      }
      button.textContent = enabled ? '雨声：开' : '雨声：关';
      button.setAttribute('aria-pressed', String(enabled));
      status.textContent = '';
    } catch (error) {
      if (context) { try { await context.close(); } catch (_) {} }
      context = source = gain = filter = hum = humGain = null; enabled = false;
      button.textContent = '雨声重试'; button.setAttribute('aria-pressed', 'false');
      status.textContent = '雨声暂时无法播放，请重试';
    } finally { button.disabled = false; }
  });
  volume.addEventListener('input', function () {
    volume.setAttribute('aria-valuetext', volume.value + '%');
    if (gain && enabled) S.refreshAudio();
  });
  document.addEventListener('visibilitychange', async function () {
    if (!context || !enabled) return;
    try {
      if (document.hidden) await context.suspend();
      else { await context.resume(); fade(level(), .6); }
    } catch (_) { status.textContent = '点击雨声按钮可恢复播放'; }
  });
})(window.S);

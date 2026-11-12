/* Field-recorded rain. Lazy loaded, quiet by default, no autoplay. */
(function () {
  var context, source, gain, enabled = false;
  var button = document.getElementById('rain-audio');
  var volume = document.getElementById('rain-volume');
  var status = document.getElementById('audio-status');
  function level() { return Math.pow(Number(volume.value) / 100, 1.6); }
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
    source.connect(gain); gain.connect(context.destination); source.start(0, 4);
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
        await new Promise(function (resolve) { setTimeout(resolve, 500); });
        await context.suspend(); enabled = false;
      } else {
        await context.resume();
        if (context.state !== 'running') throw new Error('Audio suspended');
        enabled = true; fade(level(), 1.2);
        if (document.hidden) await context.suspend();
      }
      button.textContent = enabled ? '雨声：开' : '雨声：关';
      button.setAttribute('aria-pressed', String(enabled));
      status.textContent = '';
    } catch (error) {
      if (context) { try { await context.close(); } catch (_) {} }
      context = source = gain = null; enabled = false;
      button.textContent = '雨声重试'; button.setAttribute('aria-pressed', 'false');
      status.textContent = '雨声暂时无法播放，请重试';
    } finally { button.disabled = false; }
  });
  volume.addEventListener('input', function () {
    volume.setAttribute('aria-valuetext', volume.value + '%');
    if (gain && enabled) fade(level(), .15);
  });
  document.addEventListener('visibilitychange', async function () {
    if (!context || !enabled) return;
    try {
      if (document.hidden) await context.suspend();
      else { await context.resume(); fade(level(), .6); }
    } catch (_) { status.textContent = '点击雨声按钮可恢复播放'; }
  });
})();

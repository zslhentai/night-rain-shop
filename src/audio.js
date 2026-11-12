/* Locally synthesized rain: no external downloads or autoplay. */
(function () {
  var context, source, gain;
  var enabled = false;
  var button = document.getElementById('rain-audio');
  function createRain() {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    var buffer = context.createBuffer(2, context.sampleRate * 12, context.sampleRate);
    for (var channel = 0; channel < 2; channel++) {
      var samples = buffer.getChannelData(channel), brown = 0;
      for (var i = 0; i < samples.length; i++) {
        var white = Math.random() * 2 - 1;
        brown = (brown + .025 * white) / 1.025;
        samples[i] = brown * 2.4 + white * .14;
      }
      // Crossfade the tail into the beginning for a quiet loop boundary.
      var fade = Math.floor(context.sampleRate * .15);
      for (var j = 0; j < fade; j++) {
        var mix = j / fade;
        samples[samples.length - fade + j] = samples[samples.length - fade + j] * (1 - mix) + samples[j] * mix;
      }
    }
    source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
    var filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 6500;
    gain = context.createGain(); gain.gain.value = .65;
    source.connect(filter); filter.connect(gain); gain.connect(context.destination);
    source.start();
  }
  button.addEventListener('click', async function () {
    button.disabled = true;
    try {
      if (!context) createRain();
      if (enabled) await context.suspend();
      else await context.resume();
      enabled = context.state === 'running';
      button.textContent = enabled ? '雨声：开' : '雨声：关';
      button.setAttribute('aria-pressed', String(enabled));
    } catch (error) {
      button.textContent = '雨声重试';
      button.setAttribute('aria-pressed', 'false');
      enabled = false;
    } finally { button.disabled = false; }
  });
})();

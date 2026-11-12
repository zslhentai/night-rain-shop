# Rain recording

`rain-street.mp3` derives from **Urban Street on a Rainy Afternoon**, by
**Extemporalist**, released under **CC0 1.0**.

Source: https://commons.wikimedia.org/wiki/File:Urban_Street_on_a_Rainy_Afternoon.flac
License: https://creativecommons.org/publicdomain/zero/1.0/

Excerpt: 04:10–05:26; selected for low, stable RMS energy. High-pass 160 Hz,
low-pass 4200 Hz, loudness target -29 LUFS / -9 dBTP, 32 kHz, 96 kbps MP3.
The browser blends a four-second overlap for a 72-second loop. Original
street ambience may retain distant environmental sounds; no thunder or
artificial noise is mixed in. The asset is loaded only when enabled.

Reproduce from the Commons MP3 transcode:

```sh
ffmpeg -ss 250 -t 76 -i original.mp3 -af 'highpass=f=160,lowpass=f=4200,loudnorm=I=-29:TP=-9:LRA=5' -ar 32000 -ac 2 -c:a libmp3lame -b:a 96k rain-street.mp3
```

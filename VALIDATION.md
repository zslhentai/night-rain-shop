# Rain ambience and neighborhood detail update

Implemented:
- CC0 field recording replaces generated noise; 35% initial volume, user-controlled
  volume, fade in/out, lazy download, four-second loop crossfade, hidden-tab pause.
- Entrance mat ribs, glazing notices, umbrella drip tray, connected drain channel;
  corrected hidden sidewalk drain elevation and reduced broad puddle brightness.
- Diner entrance, sill, curtain mounting, menu and attached light; alley meter/conduit.
- AC support brackets and condensate pipe; rear facade downpipes and clamps.
- Bus shelter with glazing, roof supports, drainage, route panel, bench parallel to
  curb; relocated stop sign to leave the pedestrian approach clear.

Checks completed:
- JavaScript syntax and git diff whitespace checks.
- Real Three.js scene construction with native canvas textures: 1,269 meshes,
  finite geometry coordinates; 240-second simulation visits all 17/15/13 route
  waypoints; traffic phases and shelter rain exclusion pass.
- Mock Web Audio/DOM tests: lazy load, six toggles reuse one source, zero volume,
  hidden-tab suspend/resume.
- Encoded recording measured at -29.91 LUFS, -9.38 dBTP before runtime volume.

Run checks with Node; scene.cjs additionally requires @napi-rs/canvas:

```sh
node tests/audio.cjs
node tests/scene.cjs
python -m http.server 8765
```

Still requires visual/listening review: Chromium launch was blocked by a socket
permission failure and the shared browser connection timed out. These checks do
not establish GPU rendering quality, mobile layout, actual browser audio playback,
subjective sound quality, or real device performance. No new live deployment.

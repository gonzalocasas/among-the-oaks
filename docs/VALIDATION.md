# Validation ledger

## Verified by direct file inspection, 15 Nov 2026
- `prototype/index.html` exists and contains an import map referencing Three.js 0.186.1 on jsDelivr.
- `prototype/src/main.js` exists and contains scene, switching, touch/desktop input, performance HUD and JSON export.
- The JavaScript file passes `node --check` (syntax check only).
- Four local PNG concept art assets exist. These are generated illustrations, NOT screenshots of the engine.

## Verified in headless Chrome, 15 Nov 2026 (before GitHub Pages deploy)
- Page loads without JS errors at 1280×800 and 390×844 (touch) viewports.
- WebGPU unavailable in the test environment; Three.js fell back to WebGL2 as intended (software rendering, so FPS numbers are meaningless).
- Naturalistic and Symbolic modes both render; HUD stats update.
- Fixed two mobile overlaps: status pill covering "Export results", and joystick covering the stats panel.
- Console warnings only: `THREE.Clock` deprecated (use `THREE.Timer`), `PCFSoftShadowMap` replaced by `PCFShadowMap` under WebGPURenderer.

## Changes after first phone test, 15 Nov 2026
- Phone (WebGPU) reported ~59 FPS in both modes at High quality.
- Naturalistic: gradient blue sky dome, small sun disc sprite, thinner fog, warm yellow sun, warm ground bounce.
- Movement: fixed yaw sign bug (walk direction diverged from view after turning, strafe inverted), added smoothed velocity, diagonal normalisation, sliding collision on all trunks, light head bob, arrow keys.
- Cache busting: deploy workflow stamps the commit hash into `index.html` (`main.js?v=<sha>`) and writes `version.json`; a stale cached page reloads once with `?v=<sha>`.

## Not verified
- Actual browser rendering and console runtime success.
- WebGPU and WebGL2 fallback on any physical device.
- Visual equality between expected and actual outputs.
- Measured FPS, memory consumption, thermals or startup costs.
- Function of mode controls or actual JSON log generation in browser.
- Actual Strata Nova source, MuJoCo compatibility, Gaussian splatting output.

## Dependency caveat
- Runtime imports are from an online CDN. This zip includes app source and local images but does NOT bundle the Three.js dependency. The prototype needs internet access or a dependency-bundling step before browser runtime.

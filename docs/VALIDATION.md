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

## Not verified
- Actual browser rendering and console runtime success.
- WebGPU and WebGL2 fallback on any physical device.
- Visual equality between expected and actual outputs.
- Measured FPS, memory consumption, thermals or startup costs.
- Function of mode controls or actual JSON log generation in browser.
- Actual Strata Nova source, MuJoCo compatibility, Gaussian splatting output.

## Dependency caveat
- Runtime imports are from an online CDN. This zip includes app source and local images but does NOT bundle the Three.js dependency. The prototype needs internet access or a dependency-bundling step before browser runtime.

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

## Symbolic mode removed; draw-call fix, 15 Nov 2026
- Decision: continue with the naturalistic style only. Symbolic mode, its UI and its code paths are removed (`docs/HANDOFF.md` is left as the original brief).
- HUD bug: "Draw calls" showed `renderer.info.render.calls`, which in WebGPURenderer is the cumulative number of render passes since page load (it was ~11,000 on the phone and growing). It now shows `renderer.info.render.drawCalls` (per frame); exported JSON uses the same.
- Measured per-frame draw calls (headless, all quality levels): 175 before, 81 after merging each tree's trunk, branches and roots into one mesh. Triangle count unchanged.

## Gaussian splat experiment, 15 Nov 2026
- Renderer: three.js r186's native `GaussianSplat` (examples/jsm/objects), WebGPU compute sort; JS sort on the WebGL2 fallback. Loaders: SPZ, PLY, SPLAT, KSPLAT.
- UI: "Splat" select (bundled sample), "Open splat…" (pick a local file on the device, nothing is uploaded), "Flip splat" (180° about X for captures stored upside down).
- Placement: on the ground ~6 m in front of the camera. Captures between 0.3 and 40 m keep their own scale; anything outside that range is scaled to 3 m.
- Sample: `prototype/splats/lion.v3.spz` (4.3 MB, 195,099 splats), "Lion" by Renaud via superspl.at, CC BY 4.0; credit shown in the status line and in `lion.license.txt`. Copied from the three.js examples.
- Headless Chrome (WebGL2, software): sample loads and decodes in ~1.5–2 s; local `.splat` file loads via the file input; Flip and clear work; no JS errors. The triangle counter includes 2 triangles per splat.
- Known limits: splats take no fog, light or shadows from the scene; no collision; "Flip" only covers the common upside-down case.

## Spark migration, 19 Nov 2026
- Pinned Spark 2.4.0 (latest stable release listed upstream) and retained Three.js 0.186.1.
- Replaced native GaussianSplat/loaders with SparkRenderer and SplatMesh; switched to WebGLRenderer because Spark 2.4 uses WebGL2.
- Preserved sample/local SPZ, PLY, SPLAT and KSPLAT loading, grounding/scaling, flip, counts and load-time export. Pending loads are discarded after clear or a newer load request.
- HUD/export explicitly identify Spark; draw calls use WebGLRenderer's `info.render.calls`, reset once per frame to include nested Spark work.
- Verified JavaScript syntax with `node --check`, diff whitespace with `git diff --check`, and successful download/syntax of the pinned Spark module. Checked loading, bounds and disposal APIs against the v2.4.0 source.
- Browser verification was unavailable (browser access host unavailable). Sample rendering, local formats, controls, occlusion and mobile performance still require runtime checks for this migration. Earlier runtime results above apply to the previous native renderer.

## Not verified
- Actual browser rendering and console runtime success.
- WebGPU and WebGL2 fallback on any physical device.
- Visual equality between expected and actual outputs.
- Measured FPS, memory consumption, thermals or startup costs.
- Function of mode controls or actual JSON log generation in browser.
- Actual Strata Nova source, MuJoCo compatibility, Gaussian splatting output.

## Dependency caveat
- Runtime imports are from an online CDN. This zip includes app source and local images but does NOT bundle the Three.js dependency. The prototype needs internet access or a dependency-bundling step before browser runtime.

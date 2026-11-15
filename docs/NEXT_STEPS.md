# Next development steps

## Milestone A: baseline reproducibility
- [ ] Run the included prototype in a supported local browser.
- [ ] Fix any errors and pin/bundle all dependencies.
- [ ] Capture `naturalistic` and `symbolic` screenshots from identical camera pose, viewport and quality.
- [ ] Export performance JSON for each, and record hardware/browser/backend.
- [ ] Verify touch movement, look gesture and pointer lock.

**Done when:** screenshots and results exist from the actual program, and a second developer can reproduce them.

## Milestone B: visual fidelity
- [ ] Use a licensed or self-created oak trunk/bark PBR material set.
- [ ] Improve oak crown geometry, leaf shapes/arrangement, translucency approximations and wind.
- [ ] Improve terrain blending, rocks and low vegetation.
- [ ] Improve shadows, sun, atmospheric depth and tonemapping under mobile budgets.
- [ ] Define a reproducible fly-through camera path and per-device quality tiers.

**Done when:** clearly improved screenshots and per-device profiling results are available.

## Milestone C: splat feasibility
- [ ] Source licensed/self-captured real forest imagery with adequate view coverage.
- [ ] Render splat scene in browser and record memory, load time and FPS.
- [ ] Place mesh-based interactive oak within splat scene; test depth/occlusion and lighting coherence.
- [ ] Compare against classic mesh forest using same path.

**Done when:** a written recommendation says where (if anywhere) splatting adds value.

## Milestone D: interaction/geometry/physics
- [ ] Audit accessible `gramaziokohler/strata-nova` source and actual COMPAS/TS interface.
- [ ] Test Pyodide/COMPAS startup costs and mesh update latency.
- [ ] Probe MuJoCo WASM on mobile; implement proxy tree collider and controlled falling.
- [ ] Implement an intentional notch-cut interaction and log segmentation.

**Done when:** one end-to-end tree-fell-and-segment interaction works on real target hardware.

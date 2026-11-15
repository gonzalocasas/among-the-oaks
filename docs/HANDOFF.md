# Among the Oaks
## Project handoff | Rendering Benchmark 001

**Prepared:** 15 November 2026  
**Status:** First unverified browser rendering prototype plus AI-generated visual-development references  
**Primary deliverable:** `prototype/index.html` and `prototype/src/main.js`

## 1. Executive summary

**Among the Oaks** is a proposed calm, first-person mobile/web game set in an oak forest. The core experience is the sensory pleasure of being among trees, selecting a tree, creating a controlled cut, watching the oak fall, and handling timber. The game should feel gentle, immersive, tactile and contemplative, not like a frantic resource-extraction or survival simulator.

An initial **One Oak Benchmark** compares two visual styles in a shared deterministic scene:

- **Naturalistic:** More foliage instances, procedural bark and wood textures, rocks, leaves, grass, sunlight and fog. This is a basic procedural approximation and **not photorealism**.
- **Symbolic:** Simpler branching shapes, faceted foliage, a restrained palette and reduced ground detail.

The camera is first-person in both variants. The prototype contains no actual tree cutting or gameplay progression. The existing screenshots in `concept-art/` are **AI-generated concept illustrations, not renders of the prototype**. No genuine engine screenshots have been captured or verified.

## 2. Design decisions and open questions

### Agreed direction

- Name: **Among the Oaks**.
- Experience: peaceful forest presence, felling and wood handling; craftsmanship may become a downstream mechanic, not the primary emotional pitch.
- Camera: **first-person**, human eye height; calm traversal and deliberate interaction; possible slow choreographed camera movement for important events.
- Target platform: mobile web first, desktop browser supported.
- Compare **high-fidelity naturalistic** and **deliberately simplified/stylized** scenes using identical camera and layout.
- Evaluate Gaussian splatting for photorealistic scenery, especially non-interactive surroundings, without assuming it will replace editable tree meshes.

### Not yet decided

- Visual style winner, monetization, target device floor, exact input gestures, world size, crafting mechanics, narrative, sound assets, accessibility settings, and whether Gaussian splats are worth their costs.
- Whether Three.js WebGPU renderer is ultimately the production renderer (alternatives should be benchmarked if necessary).
- Integration details with Strata Nova, COMPAS, Pyodide and MuJoCo.

## 3. File inventory

```text
among-the-oaks-handoff/
  README.md
  docs/
    HANDOFF.md                 This document, editable Markdown
    HANDOFF.pdf                Printable handoff
    VALIDATION.md              Evidence and limitations
    NEXT_STEPS.md              Suggested roadmap and acceptance criteria
  prototype/
    index.html                 Browser UI and dependency import map
    src/main.js                Procedural scene, cameras, controls, stats
    README.md                  Usage and developer notes
  concept-art/
    00-visual-identity.png     AI concept illustration
    01-approach.png            AI concept illustration
    02-cutting.png             AI concept illustration
    03-timber-flow.png         AI concept illustration
  scripts/
    serve.sh                   Starts local static server
  SHA256SUMS.txt               Integrity hashes
```

## 4. Architecture: present vs envisioned

### Present, implemented in `prototype/src/main.js`

- JavaScript ES module, Three.js **0.186.1**, `WebGPURenderer` with intended WebGL2 fallback.
- Three.js fetched at runtime from **jsDelivr CDN** via the `index.html` import map. The package is **not offline/self-contained** for first run.
- Scene: perspective camera, directional sun, hemisphere light, fog, a central oak plus nine background trees, logs, instanced ground scatter, procedural texture generation.
- Alternate rendering builds use the same fixed layout, with stylistic complexity varied according to mode.
- Movement: WASD + pointer lock on desktop; virtual joystick and look area on touch devices.
- Controls: style switch, quality select, reset view, local JSON metrics export.
- Reported FPS derives from JavaScript frame cadence. It is **not** validated GPU time; metrics may be misleading on some renderers/devices.
- No path recording or fixed camera playback. Reset sets a reproducible initial position and orientation.

### Future candidate design, NOT implemented

```text
                 Gameplay and interaction (TypeScript)
                     /                \
         Geometry pipeline          Dynamics pipeline
     Pyodide + COMPAS (Strata Nova?)   MuJoCo WASM
             |                          |
        Editable tree meshes   Proxy colliders, rigid bodies
             \                          /
                Render scene (Three.js WebGPU)
                        |
             Mobile browser / installable PWA
```

IMPORTANT: Do **not** assume MuJoCo 4 WASM integrates out of the box with the exact chosen renderer or that Pyodide can import every COMPAS dependency. Verify each path. The requested GitHub repository is `https://github.com/gramaziokohler/strata-nova`; its actual code has **not** been inspected here. Obtain repository access before planning reuse.

## 5. Rendering benchmark protocol

1. Serve the `prototype/` directory with `python3 -m http.server 8080` and open `http://localhost:8080` (requires internet for current Three.js CDN imports).
2. Keep device, browser version, viewport, resolution, quality level and initial camera orientation identical between tests. Use **Reset view** after each mode change.
3. Allow asset loading and several seconds of rendering to stabilize before recording measurements.
4. For each quality setting (low/medium/high), capture actual screenshots in naturalistic and symbolic modes. Label them clearly `REAL ENGINE SCREENSHOT` and include hardware, date, FPS and backend.
5. Export JSON logs from the UI. Also measure browser GPU timings or WebGPU timestamps where supported, memory, load time, p50/p95 frame time, frame pacing and thermals after sustained play.
6. Test touch interactions on a real phone over an HTTPS origin if WebGPU is required. `localhost` is a secure-context exception on the same device; a LAN IP served over HTTP is not equivalent.
7. Keep the same camera path for future photogrammetry, splat and stylized variants; only compare like with like.

Suggested initial target (to validate rather than promise): stable 30 FPS on an agreed mobile baseline, scalable toward 60 FPS on modern premium devices, with no runaway memory, no severe thermal throttling and acceptable initial load time.

## 6. Gaussian splatting research track

Hypothesis: A captured oak forest (Gaussian splat) could improve the quality of static background scenery compared with custom low-poly assets.

Key trade-offs to test:

- Excellent captured detail vs potentially high splat count, memory, sorting, overdraw and streaming cost.
- View-dependent appearance vs free first-person motion and missing/underrepresented viewpoints in the capture.
- Static reconstructed world vs moving branches, day-night changes, object interactions and tree removal.
- Collision, segmentation and occlusion between splat scenery and editable mesh trees.
- Asset provenance/licensing, file formats and mobile browser compatibility.

Recommended **hybrid** proof of concept: mesh-based central cuttable oak, simple physics/collider proxies, and an optional splatted distant background. Start from a licensed or self-captured scene, not random procedural Gaussian clouds, and evaluate perceived quality *and* runtime cost.

## 7. First vertical slice, after render benchmark

- Approach one oak; select via subtle, accessible highlight and interaction affordance.
- Create notch by repeated controlled gestures and procedural geometry changes.
- At a cut threshold, hand a simplified representation to a rigid-body simulation, tilt and fell the tree under tuned gravity/collisions.
- Once settled, segment the fallen trunk into logs, then roll/stack them.
- Preserve calm pacing, clear feedback, and physically plausible (not necessarily strictly realistic) motion.

For early prototypes, prefer scripted or simplified tree-fall physics until the visual and interaction loops are validated. Procedural fracture is a separate problem from rigid-body motion.

## 8. Risks and dependencies

1. Current renderer launch has **not been successfully visually verified** in this environment. A JS parse check is not a rendering test.
2. Runtime Three.js CDN dependency requires access and version pinning; for robust distribution bundle npm dependencies and lock versions.
3. Naturalistic mode currently uses placeholder procedural geometry/textures. Concept art fidelity cannot be inferred from it.
4. Browser support, WebGPU backend selection, frame pacing and mobile thermal behavior need real measurements.
5. Strata Nova integration requires its source and dependency graph; private repository access was not available.
6. Physics, procedural cutting, audio, progression, save/load, accessibility and deployment are outside the current implementation.

## 9. Explicit next task for receiving developer/agent

**First: get the existing baseline actually running and generate two honest screenshots.** Fix any runtime issues; do not start a new implementation without inspecting the provided source. Bundle dependencies or provide a proven install step, then record identical screenshots for naturalistic and symbolic modes. Validate keyboard/touch controls, renderer fallback, and benchmarking export. Commit the verified baseline.

**Second: improve visual fidelity**, using appropriate licensed PBR textures, normal maps, proper oak leaf models/billboards, shadows, ground layering and light scattering approximations. Preserve a controlled, deterministic benchmark and capture progress screenshots.

**Third: run a Gaussian-splat comparison** against the conventional naturalistic scene under identical camera conditions, recording quality and hardware costs.

Only after visual and device budgets are understood should the project integrate geometry editing (COMPAS/Strata Nova) and dynamics (MuJoCo).

## 10. Suggested completion report from receiving environment

Provide: (a) exact run commands; (b) screenshots for both modes, clearly marked real engine output; (c) browser and GPU/backend details; (d) results table including FPS, frame time, memory and loading metrics; (e) changes made; (f) remaining blockers; (g) short recommendation on naturalistic vs symbolic vs hybrid-splat path.

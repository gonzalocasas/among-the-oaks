# Among the Oaks: prototype

Serve this folder locally:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080 on the same machine. The import map fetches Three.js 0.186.1 from jsDelivr and Spark 2.4.0 from sparkjs.dev; an internet connection is required. For mobile browser testing, use a suitable HTTPS static host (or an appropriate secure local-development setup). No package build step exists.

Controls: WASD to walk, Shift for faster movement, click for pointer lock, mouse to look, arrow keys also walk, `Q` quality, `R` reset. Gaussian splats: pick the bundled sample from the Splat menu, or "Open splat…" to load a `.spz`, `.ply`, `.splat` or `.ksplat` file from the device; "Flip splat" turns an upside-down capture. Mobile: left virtual stick for movement and right-side drag to look. The UI exports measurements as JSON.

Rendering: Spark 2.4.0 renders splats alongside the forest using Three.js WebGLRenderer (WebGL2). This replaces the native Three.js splat/WebGPU path. Hardware antialiasing is disabled following Spark’s performance guidance. HUD/export draw calls count WebGL calls per frame, including Spark work; results are not directly comparable to the previous WebGPU backend.

Limitations: the Spark migration has not been runtime/screenshot-verified; visuals are procedural blockouts, not photorealistic; no cutting, COMPAS, Pyodide, MuJoCo, or audio. Performance HUD measures JS frame cadence rather than GPU time. Consult `../docs/HANDOFF.md` and `../docs/VALIDATION.md`.

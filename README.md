# Among the Oaks: prototype

Serve this folder locally:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080 on the same machine. The import map fetches Three.js 0.186.1 from jsDelivr; an internet connection is required. For mobile browser testing, use a suitable HTTPS static host (or an appropriate secure local-development setup). No package build step exists.

Controls: WASD to walk, Shift for faster movement, click for pointer lock, mouse to look, arrow keys also walk, `Q` quality, `R` reset. Mobile: left virtual stick for movement and right-side drag to look. The UI exports measurements as JSON.

Limitations: prototype not runtime/screenshot-verified; visuals are procedural blockouts, not photorealistic; no Gaussian splats, cutting, COMPAS, Pyodide, MuJoCo, or audio. Performance HUD measures JS frame cadence rather than GPU time. Consult `../docs/HANDOFF.md` and `../docs/VALIDATION.md`.

# tools/blender — build-time asset factory

Headless Blender (`blender -b`) scripts. **Never used at runtime** — the site
builds from the committed artifacts in `public/assets/3d/`.

| Script | Output | Purpose |
|---|---|---|
| `make_tetra.py` | `tetra-wire-{hi,lo}.glb` | Regular tetrahedron → Wireframe modifier (edge frame, no filled faces) → Bevel → GLB. The app instances this: outlines only, one draw call. |
| `make_record.py` | `record.glb`, `record-grooves.webp` | Lathe-perfect vinyl disc (label UV region as 2nd material slot) + procedural concentric-groove height map, 2048 baked → 1024 shipped. |
| `bake_env.py` | `studio-night.hdr` | 512×256 equirect environment: dark room, one soft cool key ("pressed at night") for reflective materials. |
| `render_og.py` | `public/og-<route>.png` | Cycles social images of the outlined-tetra composition, palette-locked to design.md. |

Run everything: `npm run make:assets`

Notes:
- Scripts request Draco compression; this VPS's Blender 4.0.2 build lacks
  `libextern_draco.so`, so exports fall back to plain GLB. All meshes are tiny
  (≤23KB) — well under the 150KB budget either way. On a Blender build with
  Draco, the same scripts produce compressed GLBs with no app change
  (`public/draco/` decoder is already shipped).
- Cycles denoising is disabled (this build ships without OpenImageDenoiser).

"""make_record.py — the vinyl disc GLB + baked groove texture.

A lathe-perfect record: thin cylinder disc with a center-label UV region as a
second material slot, plus a 2048px concentric-groove height map generated
procedurally and shipped at 1024 (the npm script converts PNG -> WebP). One
GLB reused by the hero composition and the player.

Run:  blender -b -P tools/blender/make_record.py -- --out public/assets/3d/
"""

import bpy
import math
import sys
from pathlib import Path

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
out_dir = Path(argv[argv.index("--out") + 1]) if "--out" in argv else Path("public/assets/3d")
out_dir.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)

# ── disc: 96-segment cylinder, razor-thin, with a marked label region ──
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=1.0, depth=0.02)
disc = bpy.context.active_object
disc.name = "record"

vinyl = bpy.data.materials.new("vinyl")
label = bpy.data.materials.new("label")
disc.data.materials.append(vinyl)
disc.data.materials.append(label)
# Faces whose center sits within the label radius get the label slot.
LABEL_R = 0.34
for poly in disc.data.polygons:
    cx, cy, _ = poly.center
    if math.hypot(cx, cy) < LABEL_R:
        poly.material_index = 1

bpy.ops.object.select_all(action="DESELECT")
disc.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=str(out_dir / "record.glb"),
    export_format="GLB",
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_materials="PLACEHOLDER",
)
print(f"wrote {out_dir / 'record.glb'}")

# ── groove height map: concentric micro-rings, 2048 -> shipped at 1024 ──
SIZE = 2048
img = bpy.data.images.new("grooves", width=SIZE, height=SIZE, alpha=False, float_buffer=True)
px = [0.0] * (SIZE * SIZE * 4)
half = SIZE / 2
for y in range(SIZE):
    for x in range(SIZE):
        r = math.hypot(x - half, y - half) / half  # 0..~1.41
        if 0.36 < r < 0.97:
            v = 0.5 + 0.5 * math.sin(r * 1400.0)  # ~110 rings across the band
            v = 0.35 + 0.5 * v
        else:
            v = 0.5
        i = (y * SIZE + x) * 4
        px[i] = px[i + 1] = px[i + 2] = v
        px[i + 3] = 1.0
img.pixels.foreach_set(px)
img.scale(1024, 1024)
img.filepath_raw = str(out_dir / "record-grooves.png")
img.file_format = "PNG"
img.save()
print(f"wrote {out_dir / 'record-grooves.png'}")

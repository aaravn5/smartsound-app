"""make_tetra.py — beveled wire-tetrahedron GLBs (build-time asset factory).

Raw TetrahedronGeometry edges are razor-sharp; the references use softened
geometry. This builds a regular tetrahedron, converts it to an edge FRAME
(Wireframe modifier — no filled faces survive), rounds the frame with a
Bevel, and exports Draco-compressed GLBs at two detail levels. The app
instances this geometry thousands of times: outlines only, one draw call.

Run:  blender -b -P tools/blender/make_tetra.py -- --out public/assets/3d/
"""

import bpy
import bmesh
import sys
from pathlib import Path

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
out_dir = Path(argv[argv.index("--out") + 1]) if "--out" in argv else Path("public/assets/3d")
out_dir.mkdir(parents=True, exist_ok=True)

# Regular tetrahedron vertices (unit-ish scale, matches three's Tetrahedron).
VERTS = [(1, 1, 1), (1, -1, -1), (-1, 1, -1), (-1, -1, 1)]
FACES = [(0, 1, 2), (0, 2, 3), (0, 3, 1), (1, 3, 2)]


def build(name: str, wire_thickness: float, bevel_width: float, bevel_segments: int) -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    vs = [bm.verts.new(v) for v in VERTS]
    for f in FACES:
        bm.faces.new([vs[i] for i in f])
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Edge frame — the faces are consumed; only the rounded skeleton remains.
    wf = obj.modifiers.new("wire", "WIREFRAME")
    wf.thickness = wire_thickness
    wf.use_even_offset = True
    if bevel_segments > 0:
        bv = obj.modifiers.new("bevel", "BEVEL")
        bv.width = bevel_width
        bv.segments = bevel_segments
        bv.limit_method = "ANGLE"
        bv.angle_limit = 0.6
    bpy.ops.object.shade_smooth()

    bpy.ops.export_scene.gltf(
        filepath=str(out_dir / f"{name}.glb"),
        export_format="GLB",
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_normals=True,
        export_texcoords=False,
        export_materials="NONE",
    )
    print(f"wrote {out_dir / f'{name}.glb'}")


# Hi: rounded frame for close-up scale. Lo: plain frame for the far swarm.
build("tetra-wire-hi", wire_thickness=0.10, bevel_width=0.015, bevel_segments=2)
build("tetra-wire-lo", wire_thickness=0.09, bevel_width=0.0, bevel_segments=0)

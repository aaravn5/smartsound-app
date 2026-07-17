"""render_og.py — social/OG images from the real 3D assets.

Cycles renders of the outlined-tetra composition on the Deep Space canvas at
1200x630, palette-locked to design.md tokens. One render per named route.

Run:  blender -b -P tools/blender/render_og.py -- --out public/ --name og-home
"""

import bpy
import bmesh
import sys
from pathlib import Path

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
out_dir = Path(argv[argv.index("--out") + 1]) if "--out" in argv else Path("public")
name = argv[argv.index("--name") + 1] if "--name" in argv else "og-home"
out_dir.mkdir(parents=True, exist_ok=True)

DEEP_SPACE = (0.0117, 0.0117, 0.0202)  # #171721 linearized-ish
STARLIGHT = (0.86, 0.86, 0.90)
MERCURY = (0.086, 0.14, 0.83)  # #5266eb

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.use_denoising = False
scene.cycles.samples = 96
scene.render.resolution_x = 1200
scene.render.resolution_y = 630
scene.render.image_settings.file_format = "PNG"

world = bpy.data.worlds.new("bg")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (*DEEP_SPACE, 1.0)

VERTS = [(1, 1, 1), (1, -1, -1), (-1, 1, -1), (-1, -1, 1)]
FACES = [(0, 1, 2), (0, 2, 3), (0, 3, 1), (1, 3, 2)]


def wire_tetra(loc, rot, scale, color, strength):
    mesh = bpy.data.meshes.new("t")
    bm = bmesh.new()
    vs = [bm.verts.new(v) for v in VERTS]
    for f in FACES:
        bm.faces.new([vs[i] for i in f])
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("t", mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = rot
    obj.scale = (scale,) * 3
    wf = obj.modifiers.new("wire", "WIREFRAME")
    wf.thickness = 0.06
    mat = bpy.data.materials.new("edge")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    em = nodes.new("ShaderNodeEmission")
    em.inputs[0].default_value = (*color, 1.0)
    em.inputs[1].default_value = strength
    out = nodes.new("ShaderNodeOutputMaterial")
    mat.node_tree.links.new(em.outputs[0], out.inputs[0])
    obj.data.materials.append(mat)


# A loose constellation — one Mercury-tinted lead, Starlight companions.
wire_tetra((0.9, 0, 0.2), (0.4, 0.3, 0.6), 1.1, MERCURY, 4.0)
wire_tetra((-1.6, 0.4, -0.6), (0.9, 0.1, 0.2), 0.7, STARLIGHT, 2.0)
wire_tetra((-0.4, -0.9, 0.5), (0.2, 0.8, 0.4), 0.45, STARLIGHT, 1.6)
wire_tetra((2.4, 1.1, -1.2), (0.7, 0.5, 0.1), 0.5, STARLIGHT, 1.2)

cam_data = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_data)
cam.location = (0, -6.5, 0.4)
cam.rotation_euler = (1.5708, 0, 0)
scene.collection.objects.link(cam)
scene.camera = cam

scene.render.filepath = str(out_dir / f"{name}.png")
bpy.ops.render.render(write_still=True)
print(f"wrote {out_dir / f'{name}.png'}")

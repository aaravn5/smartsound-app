"""bake_env.py — one small studio environment for reflective materials.

A dark room with a single soft key light ("pressed at night"): rendered as a
512x256 equirectangular Radiance HDR for scene.environment, so ghost fills
and the record surface pick up believable reflections without runtime lights.

Run:  blender -b -P tools/blender/bake_env.py -- --out public/assets/3d/
"""

import bpy
import sys
from pathlib import Path

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
out_dir = Path(argv[argv.index("--out") + 1]) if "--out" in argv else Path("public/assets/3d")
out_dir.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.use_denoising = False
scene.cycles.samples = 64
scene.render.resolution_x = 512
scene.render.resolution_y = 256
scene.render.image_settings.file_format = "HDR"

# Near-black world with a faint deep-space blue floor bounce.
world = bpy.data.worlds.new("night")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.006, 0.006, 0.010, 1.0)
bg.inputs[1].default_value = 1.0

# One soft key — a large emissive plane high to camera-left.
bpy.ops.mesh.primitive_plane_add(size=6, location=(-4, 2, 5), rotation=(0.9, 0.5, 0))
key = bpy.context.active_object
mat = bpy.data.materials.new("key")
mat.use_nodes = True
nodes = mat.node_tree.nodes
nodes.clear()
em = nodes.new("ShaderNodeEmission")
em.inputs[0].default_value = (0.85, 0.88, 1.0, 1.0)  # cool moonlight
em.inputs[1].default_value = 14.0
out = nodes.new("ShaderNodeOutputMaterial")
mat.node_tree.links.new(em.outputs[0], out.inputs[0])
key.data.materials.append(mat)

# Panoramic equirectangular camera at the origin.
cam_data = bpy.data.cameras.new("envcam")
cam_data.type = "PANO"
cam_data.panorama_type = "EQUIRECTANGULAR"
cam = bpy.data.objects.new("envcam", cam_data)
cam.rotation_euler = (1.5708, 0, 0)
scene.collection.objects.link(cam)
scene.camera = cam

scene.render.filepath = str(out_dir / "studio-night.hdr")
bpy.ops.render.render(write_still=True)
print(f"wrote {out_dir / 'studio-night.hdr'}")

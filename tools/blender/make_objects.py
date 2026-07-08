"""make_objects.py — the floating museum objects (high-key transparent renders).

Four SmartSound artifacts rendered evenly-lit on transparent film, meant to
sit directly on the Gallery Plate canvas with no card, shadow, or frame:

  record.png   — near-black vinyl, groove rings, Voltage Lime label
  tetra.png    — carbon wire tetrahedron (edge frame, no faces)
  sleeve.png   — chalk sleeve slab with a lime disc peeking out
  coil.png     — carbon torus-knot "pulse coil"

Run:  blender -b -P tools/blender/make_objects.py -- --out public/assets/objects/
"""

import bpy
import math
import sys
from pathlib import Path

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
out_dir = Path(argv[argv.index("--out") + 1]) if "--out" in argv else Path("public/assets/objects")
out_dir.mkdir(parents=True, exist_ok=True)

LIME = (0.76, 1.0, 0.19)
CARBON = (0.008, 0.008, 0.008)
CHALK = (0.93, 0.93, 0.93)
VINYL = (0.012, 0.012, 0.016)


def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.use_denoising = False
    scene.cycles.samples = 48
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1400
    world = bpy.data.worlds.new("key")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (1, 1, 1, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 1.35
    return scene


def mat(name, color, rough=0.4, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    m.diffuse_color = (*color, 1)
    return m


def camera(scene, loc, rot):
    cam_data = bpy.data.cameras.new("cam")
    cam = bpy.data.objects.new("cam", cam_data)
    cam.location = loc
    cam.rotation_euler = rot
    scene.collection.objects.link(cam)
    scene.camera = cam


def shoot(scene, name):
    scene.render.filepath = str(out_dir / name)
    bpy.ops.render.render(write_still=True)
    print(f"wrote {out_dir / name}")


# ── record ──
scene = fresh()
bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=1.0, depth=0.018)
bpy.context.active_object.data.materials.append(mat("vinyl", VINYL, 0.32))
for r in (0.45, 0.55, 0.65, 0.75, 0.85, 0.93):
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.0022)
    t = bpy.context.active_object
    t.location.z = 0.010
    t.data.materials.append(mat("groove", (0.10, 0.10, 0.12), 0.5))
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.33, depth=0.004)
lb = bpy.context.active_object
lb.location.z = 0.011
lb.data.materials.append(mat("label", LIME, 0.6))
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.035, depth=0.006)
pp = bpy.context.active_object
pp.location.z = 0.012
pp.data.materials.append(mat("pip", CARBON, 0.6))
# Straight top-down — the page rotates it in CSS; composition stays perfect.
camera(scene, (0, 0, 3.2), (0, 0, 0))
shoot(scene, "record.png")

# ── wire tetra ──
scene = fresh()
import bmesh

mesh = bpy.data.meshes.new("tetra")
bm = bmesh.new()
VS = [(1, 1, 1), (1, -1, -1), (-1, 1, -1), (-1, -1, 1)]
vs = [bm.verts.new(v) for v in VS]
for f in ((0, 1, 2), (0, 2, 3), (0, 3, 1), (1, 3, 2)):
    bm.faces.new([vs[i] for i in f])
bm.to_mesh(mesh)
bm.free()
obj = bpy.data.objects.new("tetra", mesh)
scene.collection.objects.link(obj)
wf = obj.modifiers.new("wire", "WIREFRAME")
wf.thickness = 0.07
obj.data.materials.append(mat("edge", CARBON, 0.45))
obj.rotation_euler = (math.radians(28), math.radians(18), math.radians(30))
camera(scene, (0, -5.2, 1.4), (math.radians(75), 0, 0))
shoot(scene, "tetra.png")

# ── sleeve with record peeking ──
scene = fresh()
bpy.ops.mesh.primitive_cube_add(size=1)
sl = bpy.context.active_object
sl.scale = (1.05, 0.02, 1.05)
sl.data.materials.append(mat("sleeve", CHALK, 0.65))
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.95, depth=0.015)
rc = bpy.context.active_object
rc.rotation_euler = (math.radians(90), 0, 0)
rc.location = (0.42, 0.03, 0.1)
rc.data.materials.append(mat("vinyl2", VINYL, 0.32))
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.30, depth=0.02)
lb2 = bpy.context.active_object
lb2.rotation_euler = (math.radians(90), 0, 0)
lb2.location = (0.42, 0.045, 0.1)
lb2.data.materials.append(mat("label2", LIME, 0.6))
for o in scene.objects:
    if o.type == "MESH":
        o.rotation_euler.z += math.radians(-8)
camera(scene, (0, -4.4, 0.5), (math.radians(84), 0, 0))
shoot(scene, "sleeve.png")

# ── pulse coil ──
scene = fresh()
bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.05, major_segments=96)
c1 = bpy.context.active_object
c1.data.materials.append(mat("coil", CARBON, 0.4))
bpy.ops.mesh.primitive_torus_add(major_radius=0.72, minor_radius=0.04, major_segments=96)
c2 = bpy.context.active_object
c2.rotation_euler = (math.radians(38), 0, 0)
c2.data.materials.append(mat("coil2", (0.10, 0.10, 0.12), 0.4))
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.10)
core = bpy.context.active_object
core.data.materials.append(mat("core", LIME, 0.5))
camera(scene, (0, -3.6, 1.5), (math.radians(68), 0, 0))
shoot(scene, "coil.png")

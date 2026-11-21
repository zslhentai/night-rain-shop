"""Generate original exterior fixtures for Yomachi. No external assets.
Run: blender -b -t 2 --factory-startup --python tools/build-street-assets.py -- assets/models/yomachi-street.glb
"""
from pathlib import Path
import sys

import bpy

out = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
bpy.ops.wm.read_factory_settings(use_empty=True)
out.parent.mkdir(parents=True, exist_ok=True)


def paint(name, rgb, roughness=.55, metallic=0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*rgb, 1)
    material.use_nodes = True
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*rgb, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    return material


rubber = paint('Charcoal rubber and vents', (.037, .047, .049), .84)
aluminum = paint('Satin anodized aluminum', (.42, .48, .46), .39, .22)
bus_green = paint('Bus deep green enamel', (.052, .245, .192), .38, .12)
ivory = paint('Ivory route service livery', (.77, .705, .525), .44)
vending_green = paint('Cold vending jade powder coat', (.045, .188, .174), .43, .12)
vending_red = paint('Hot vending persimmon powder coat', (.46, .061, .043), .42, .12)
roof = paint('Standing-seam patinated zinc', (.109, .208, .203), .51, .13)
wood = paint('Outdoor oiled cypress', (.32, .218, .117), .72)


def box(group, name, dimensions, position, material, bevel=.012):
    # Three/world X,Y,Z -> Blender X,-Z,Y. All dimensions are in meters.
    width, height, depth = dimensions
    x, y, z = position
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z, y))
    obj = bpy.context.object
    obj.name = name
    obj.scale = width, depth, height
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        edge = obj.modifiers.new('Pressed or cast edge', 'BEVEL')
        edge.width = bevel
        edge.segments = 2 if bevel >= .023 else 1
        bpy.ops.object.modifier_apply(modifier=edge.name)
    obj.data.materials.append(material)
    group.setdefault(material, []).append(obj)


def finish(name, group):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    for material, objects in group.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        if len(objects) > 1:
            bpy.ops.object.join()
        obj = bpy.context.object
        obj.name = name + ' ' + material.name
        obj.parent = root


body = {}
box(body, 'Skirt', (1.85, .49, 4.48), (0, .70, 0), bus_green, .10)
box(body, 'Pressed roof', (1.89, .16, 4.57), (0, 2.35, 0), ivory, .066)
box(body, 'Roof ventilation cover', (.83, .10, .69), (0, 2.465, -.72), bus_green, .035)
box(body, 'Rear engine wall', (1.82, 1.22, .12), (0, 1.48, -2.215), bus_green, .043)
box(body, 'Rear glass', (1.41, .46, .022), (0, 1.875, -2.278), rubber, .062)
box(body, 'Dashboard front apron', (1.87, .48, .18), (0, 1.10, 2.19), bus_green, .06)
box(body, 'Destination casing', (1.51, .265, .059), (0, 2.181, 2.302), rubber, .027)
box(body, 'Front bumper', (1.86, .124, .15), (0, .45, 2.245), rubber, .041)
box(body, 'Rear bumper', (1.86, .124, .15), (0, .45, -2.245), rubber, .041)
box(body, 'Front plate', (.29, .106, .024), (0, .544, 2.328), ivory, .018)
box(body, 'Rear number plate', (.30, .112, .024), (0, .544, -2.328), ivory, .018)
for row in range(5):
    box(body, 'Radiator aperture', (.80, .022, .018), (0, .94 + row * .043, -2.283), rubber, .005)
for side in (-1, 1):
    x = side * .941
    box(body, 'Livery stripe', (.021, .066, 4.40), (x, 2.213, 0), ivory, .008)
    box(body, 'Mirror arm', (.24, .046, .055), (side * .992, 1.96, 2.08), aluminum, .012)
    box(body, 'Side mirror pod', (.125, .23, .105), (side * 1.095, 1.86, 2.09), rubber, .022)
    for length, z in ([(.49, -1.97), (2.95, .70)] if side > 0 else [(4.42, 0)]):
        box(body, 'Pressed waist panel', (.085, .43, length), (side * .916, 1.185, z), bus_green, .037)
        box(body, 'Cream waist stripe', (.023, .063, length - .04), (side * .964, 1.286, z), ivory, .008)
finish('bus-shell', body)


def vending(name, coat):
    group = {}
    box(group, 'Press formed enamel body', (1.011, 2.09, .82), (0, 1.085, 0), coat, .031)
    box(group, 'Recessed plinth', (.979, .103, .782), (0, .057, -.012), rubber, .019)
    box(group, 'Stainless service fascia', (.99, .152, .842), (0, 2.102, .008), aluminum, .023)
    for x in (-.487, .392):
        box(group, 'Chrome window mullion', (.032, 1.51, .041), (x, 1.24, .451), aluminum, .008)
    for y in (.472, 1.996):
        box(group, 'Glazed window rail', (.898, .027, .040), (-.047, y, .452), aluminum, .006)
    box(group, 'Beveled delivery frame', (.65, .34, .056), (-.116, .299, .432), aluminum, .026)
    box(group, 'Recessed delivery chute', (.572, .257, .035), (-.116, .299, .461), rubber, .033)
    box(group, 'Delivery flap grip', (.384, .024, .025), (-.116, .353, .484), aluminum, .009)
    box(group, 'Maintenance lock', (.034, .08, .022), (.445, .798, .476), aluminum, .006)
    for row in range(5):
        box(group, 'Compressor intake', (.013, .026, .275), (.508, .235 + row*.042, -.098), rubber, .005)
    finish(name, group)


vending('vending-warm', vending_red)
vending('vending-cold', vending_green)

shelter = {}
box(shelter, 'Folded zinc canopy', (1.845, .105, 3.69), (0, 3.042, 0), roof, .023)
box(shelter, 'Back gutter', (.090, .084, 3.68), (.887, 3.091, 0), aluminum, .013)
for z in (-1.70, 1.70):
    box(shelter, 'Extruded rear column', (.100, 2.89, .105), (.77, 1.538, z), roof, .015)
    box(shelter, 'Column shoe', (.24, .045, .24), (.77, .109, z), aluminum, .011)
    box(shelter, 'Cantilever arm', (1.70, .096, .077), (-.012, 2.966, z), roof, .017)
for z in (-1.2, -.6, 0, .6, 1.2):
    box(shelter, 'Raised standing seam', (1.73, .018, .021), (-.02, 3.103, z), aluminum, .004)
for x in (.33, .48, .63):
    box(shelter, 'Cypress bench slat', (.132, .052, 1.65), (x, .583, .55), wood, .019)
for z in (-.07, 1.17):
    box(shelter, 'Anchored bench support', (.47, .445, .075), (.49, .32, z), roof, .014)
for y in (.81, .94):
    box(shelter, 'Cypress backrest', (.054, .105, 1.65), (.69, y, .55), wood, .023)
finish('shelter-frame', shelter)

bpy.ops.export_scene.gltf(filepath=str(out), export_format='GLB', export_yup=True, export_materials='EXPORT', export_texcoords=False)

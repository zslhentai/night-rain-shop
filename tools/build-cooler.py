"""Build the original Yomachi cooler. Blender 4.3+ and Pillow; no external assets.
Run: blender -b -t 2 --factory-startup --python tools/build-cooler.py -- output.glb [render.jpg]
Blender coordinates: X width, Y depth (front = -Y), Z up. Units match the shop.
"""
import math
import os
from pathlib import Path
import random
import sys
import tempfile
import bpy
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFont

args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
if not args:
    raise SystemExit('Pass the output GLB path after --')
output = Path(args[0]).resolve()
output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
random.seed(2718)
TMP = tempfile.TemporaryDirectory()

# Neck and shoulder rings are authored per product (radius and height, in metres).
SKU = {
    'water': ('water', '天然水', 'CLEAR SPRING', '#aadce1', '#237787', 118, .29,
              [(0,.039),(.008,.045),(.026,.047),(.039,.042),(.116,.041),(.129,.047),(.178,.044),(.22,.041),(.252,.021),(.271,.017)]),
    'tea': ('tea','深蒸し茶','ROASTED GREEN TEA','#9d8c48','#214930',148,.275,
            [(0,.045),(.011,.050),(.045,.051),(.065,.047),(.172,.047),(.19,.050),(.211,.049),(.238,.026),(.257,.018)]),
    'soda': ('soda','柚子ソーダ','YUZU SPARKLING','#c5d99b','#78913b',158,.285,
             [(0,.042),(.013,.050),(.045,.050),(.071,.043),(.139,.044),(.177,.051),(.212,.047),(.245,.024),(.259,.018)]),
    'melon': ('soda','メロンソーダ','MELON FIZZ','#81c999','#23765b',158,.254,
              [(0,.038),(.013,.043),(.056,.041),(.078,.037),(.132,.039),(.169,.047),(.195,.045),(.218,.022),(.237,.017)]),
    'lemon': ('can','レモン','LEMON SODA','#e9d16c','#8e5a24',138,.171,
              [(0,.038),(.006,.049),(.013,.051),(.150,.051),(.161,.047),(.17,.046)]),
    'grape': ('can','ぶどう','GRAPE SODA','#a58dbe','#5b437f',138,.191,
              [(0,.034),(.007,.043),(.024,.046),(.169,.046),(.182,.043),(.19,.042)]),
    'coffee': ('coffee','深煎り珈琲','DARK ROAST','#96816d','#463328',168,.197,
               [(0,.037),(.010,.047),(.030,.048),(.133,.047),(.152,.043),(.164,.028),(.177,.021)]),
    'milk': ('milk','低温牛乳','DAILY MILK','#ebeee8','#495e85',198,.213,[])
}
ROWS = [
    ['tea','tea','water','water','milk','milk','water'],
    ['water','water','tea','tea','melon','soda','soda'],
    ['soda','soda','melon','melon','lemon','lemon','grape'],
    ['coffee','coffee','grape','grape','lemon','coffee','milk']
]
SHELF_HEIGHTS = (1.733,1.270,.807,.344)
ATLAS_W, ATLAS_H = 2048, 1024
atlas = Image.new('RGB', (ATLAS_W, ATLAS_H), '#e8ebe7')
draw = ImageDraw.Draw(atlas)
FONT_LAT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_CJK='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
if not Path(FONT_LAT).exists():
    FONT_LAT=os.environ.get('COOLER_LATIN_FONT','DejaVuSans-Bold.ttf')
if not Path(FONT_CJK).exists():
    FONT_CJK=os.environ.get('COOLER_JAPANESE_FONT',FONT_LAT)

def font(size, japanese=False):
    return ImageFont.truetype(FONT_CJK if japanese else FONT_LAT, size)

def art_center(x, y, title, size, color, japanese=False):
    draw.text((x,y),title,font=font(size,japanese),fill=color,anchor='mm')

tiles={}
for i,(name,(_type,jp,en,body,accent,_price,_height,_rings)) in enumerate(SKU.items()):
    tx=(i%4)*512
    ty=(i//4)*256
    tiles[name]=(tx,ty)
    draw.rectangle((tx,ty,tx+511,ty+255),fill=body)
    draw.rectangle((tx+8,ty+25,tx+503,ty+167),fill='#eee9d8')
    draw.rectangle((tx+8,ty+25,tx+503,ty+48),fill=accent)
    draw.rectangle((tx+8,ty+148,tx+503,ty+167),fill=accent)
    draw.line((tx+40,ty+143,tx+472,ty+143),fill=accent,width=2)
    art_center(tx+256,ty+36,'YOMACHI  /  DAILY DRINKS',12,'#f8f3df')
    art_center(tx+256,ty+94,jp,33,accent,True)
    art_center(tx+256,ty+129,en,19,accent)
    for x in (tx+43,tx+468):
        draw.ellipse((x-13,ty+79,x+13,ty+105),outline=accent,width=2)
        draw.line((x-8,ty+92,x+8,ty+92),fill=accent,width=2)
    for x in range(tx+18,tx+92,4):
        draw.rectangle((x,ty+114,x+1+(x%3),ty+139),fill=accent)
    draw.rectangle((tx+4,ty+181,tx+507,ty+220),fill=body)
    draw.rectangle((tx+4,ty+226,tx+507,ty+250),fill=accent)

draw.rectangle((8,523,2040,718),fill='#233d3e')
draw.rectangle((20,532,2028,707),outline='#e5b884',width=4)
art_center(1024,592,'YOMACHI  /  DRINKS',70,'#f1eee2')
art_center(1024,669,'冷たい飲み物',43,'#c2e5d9',True)
for row,names in enumerate(ROWS):
    y=742+60*row
    for col,name in enumerate(names):
        x=8+col*291
        draw.rectangle((x,y,x+272,y+45),fill='#e4e8dc')
        draw.text((x+7,y+22),SKU[name][1],font=font(20,True),fill='#26372e',anchor='lm')
        draw.text((x+258,y+22),'¥'+str(SKU[name][5]),font=font(20),fill='#385b53',anchor='rm')

artfile=Path(TMP.name)/'yomachi-cooler.png'
atlas.save(artfile)
image=bpy.data.images.load(str(artfile))
image.pack()

def mat(name, rgb, rough=.38, metal=0, alpha=1, glow=0, texture=False):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*rgb,alpha)
    m.use_nodes=True
    bsdf=m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value=(*rgb,1)
    bsdf.inputs['Metallic'].default_value=metal
    bsdf.inputs['Roughness'].default_value=rough
    bsdf.inputs['Alpha'].default_value=alpha
    if glow:
        bsdf.inputs['Emission Color'].default_value=(*rgb,1)
        bsdf.inputs['Emission Strength'].default_value=glow
    if texture:
        tex=m.node_tree.nodes.new('ShaderNodeTexImage')
        tex.image=image
        m.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
    if alpha<1:
        m.surface_render_method='DITHERED'
    return m

enamel=mat('Warm enamel',(.55,.59,.54),.32,.22)
graphite=mat('Graphite powder coat',(.038,.059,.064),.40,.24)
steel=mat('Satin shelf steel',(.36,.45,.43),.30,.36)
edge=mat('Brushed aluminum trim',(.66,.70,.66),.30,.42)
seal=mat('EPDM gasket',(.027,.033,.036),.69)
rear=mat('Baked cool bounce',(.35,.49,.48),.57,.05,glow=.13)
led=mat('Frosted neutral LED',(.62,.87,.79),.33,glow=.96)
lcd=mat('Thermostat status',(.23,.86,.64),.31,glow=.90)
glass=mat('Clear low-iron door glass',(.84,.95,.95),.19,0,.095)
pack=mat('Printed packaging atlas',(.85,.85,.85),.34,glow=.018,texture=True)
can=mat('Printed aluminum atlas',(.85,.85,.85),.25,.18,glow=.014,texture=True)
sign=mat('Aisle sign and price atlas',(.80,.8,.8),.53,glow=.12,texture=True)

def empty(name,location=(0,0,0),parent=None):
    obj=bpy.data.objects.new(name,None)
    bpy.context.collection.objects.link(obj)
    obj.parent=parent
    obj.location=location
    return obj

def block(name, size, loc, material, parent, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj=bpy.context.object
    obj.name=name
    obj.parent=parent
    obj.location=loc
    obj.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(material)
    if bevel:
        mod=obj.modifiers.new('Edge radius','BEVEL')
        mod.width=bevel
        mod.segments=2 if bevel>=.006 else 1
        norm=obj.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
        bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.ops.object.modifier_apply(modifier=norm.name)
    return obj

def mesh(name,verts,faces,uvs,material,parent):
    data=bpy.data.meshes.new(name)
    data.from_pydata(verts,[],faces)
    data.update()
    uv=data.uv_layers.new()
    for face,coords in zip(data.polygons,uvs):
        for k,(x,y) in zip(face.loop_indices,coords):
            uv.data[k].uv=(x/ATLAS_W,1-y/ATLAS_H)
    data.materials.append(material)
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    obj.parent=parent
    return obj

def panel(name,x,depth,z,width,height,uv,parent):
    u0,v0,u1,v1=uv
    return mesh(name,[(x-width/2,depth,z-height/2),(x+width/2,depth,z-height/2),
                      (x+width/2,depth,z+height/2),(x-width/2,depth,z+height/2)],
                [(0,1,2,3)],[((u0,v1),(u1,v1),(u1,v0),(u0,v0))],sign,parent)

def compact(parent):
    """One export primitive per material for fixed fixtures."""
    groups={}
    for obj in parent.children:
        if obj.type=='MESH':
            groups.setdefault(obj.data.materials[0].name,[]).append(obj)
    for material,objects in groups.items():
        if len(objects)<2:
            continue
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join()
        objects[0].name=parent.name+' / '+material

root=empty('Yomachi Cooler')
case=empty('Cabinet',parent=root)
stock=empty('Stock',parent=root)
block('Rear insulation',(1.84,.055,2.15),(0,.283,1.246),enamel,case,.012)
block('Liner',(1.71,.024,1.94),(0,.246,1.237),rear,case,.009)
for side in (-1,1):
    for z in (.48,1.19,1.87):
        block('Liner stiffener',(.026,.006,.44),(side*.67,.232,z),steel,case,.002)
    block('Folded side skin',(.068,.60,2.22),(side*.899,-.007,1.214),enamel,case,.012)
    block('Structural cartridge',(.060,.062,2.08),(side*.906,-.28,1.246),graphite,case,.008)
    block('LED channel',(.031,.046,1.95),(side*.83,-.217,1.25),graphite,case,.004)
    block('LED diffuser',(.014,.021,1.91),(side*.814,-.229,1.25),led,case,.004)
    block('Bottom levelling foot',(.125,.34,.06),(side*.73,.0,.13),graphite,case,.008)
block('Cooling module',(1.86,.58,.20),(0,-.003,.224),graphite,case,.016)
for i in range(28):
    block('Intake louver',(.046,.022,.066),(-.78+i*.058,-.294,.218),seal,case,.003)
block('Lower kick rail',(1.78,.034,.026),(0,-.313,.158),edge,case,.004)
block('Header panel',(1.87,.60,.19),(0,-.006,2.299),graphite,case,.012)
block('Header edge',(1.78,.022,.017),(0,-.319,2.38),edge,case,.004)
panel('Water, tea and soda',-.067,-.312,2.303,1.49,.129,(8,523,2040,718),case)
block('Thermostat recess',(.118,.012,.045),(.754,-.309,2.30),seal,case,.006)
for x,z,w,h in [(0,-.002,.019,.004),(.009,.007,.004,.014),(-.009,.007,.004,.014),(.009,-.011,.004,.014)]:
    block('4 degrees LCD segment',(w,.004,h),(.756+x,-.317,2.299+z),lcd,case)
for x,z,w,h in [(0,.004,.007,.002),(0,-.004,.007,.002),(-.004,0,.002,.007),(.004,0,.002,.007)]:
    block('Degrees indicator',(w,.004,h),(.781+x,-.317,2.313+z),lcd,case)
block('Header front LED',(1.79,.022,.012),(0,-.238,2.172),led,case,.002)

for row,height in enumerate(reversed(SHELF_HEIGHTS)):
    block('Formed metal shelf',(1.70,.468,.027),(0,-.004,height),steel,case,.008)
    block('Price rail',(1.70,.028,.040),(0,-.251,height+.004),graphite,case,.005)
    block('Low product retainer',(1.64,.012,.018),(0,-.229,height+.028),edge,case,.002)
    for col in range(7):
        block('Lane divider',(.007,.392,.019),(-.82+col*.241,.001,height+.024),steel,case,.001)
        u=8+col*291
        panel('Shelf product and price',-.73+col*.244,-.266,height+.003,.225,.024,(u,742+(3-row)*60,u+272,787+(3-row)*60),case)
compact(case)

for side,label in [(-1,'Door_L'),(1,'Door_R')]:
    pivot=empty(label,(side*.88,-.34,0),root)
    mid=-side*.432
    for z in (.273,2.212):
        block('Rounded horizontal sash',(.861,.044,.042),(mid,0,z),graphite,pivot,.008)
        block('Fine contact edge',(.806,.006,.007),(mid,-.023,z+.019),edge,pivot,.001)
    for x in (mid-.413,mid+.413):
        block('Rounded upright sash',(.035,.045,1.98),(x,0,1.244),graphite,pivot,.008)
        block('Inner EPDM gasket',(.014,.021,1.90),(x+(.017 if x<mid else -.017),.006,1.244),seal,pivot,.002)
    for z in (.365,2.119):
        block('Hinge cover',(.042,.053,.10),(-side*.016,.009,z),graphite,pivot,.005)
    handle=-side*.777
    for z in (1.059,1.437):
        block('Handle standoff',(.035,.045,.043),(handle,-.030,z),edge,pivot,.006)
    block('Pull handle',(.029,.027,.411),(handle,-.064,1.247),edge,pivot,.011)
    # A single pane avoids doubled alpha and allows unobstructed shelf sight lines.
    mesh('Clear pane',[(mid-.398,.003,.297),(mid+.398,.003,.297),(mid+.398,.003,2.187),(mid-.398,.003,2.187)],
         [(0,1,2,3)],[[(0,0),(1,0),(1,1),(0,1)]],glass,pivot)
    compact(pivot)

def ring_product(name):
    kind,_,_,_,_,_,height,rings=SKU[name]
    tx,ty=tiles[name]
    if not rings:
        rings=[(.001,.046),(.176,.046),(.197,.038),(.212,.030)]
        segments=4
    else:
        segments=12
        if kind=='can':
            rings=rings+[(height+.0008,.040),(height+.001,.001)]
        else:
            neck=rings[-1][1]
            rings=rings+[(height-.017,neck*1.16),(height-.004,neck*1.16),(height,neck*.92),(height+.0001,.001)]
    verts=[]
    for z,radius in rings:
        for col in range(segments):
            phi=-math.pi/2+math.tau*(col/segments-.5)
            if kind=='milk':
                phi+=math.pi/4
                radius_x=radius*1.47
                radius_y=radius*1.29
            else:
                radius_x=radius_y=radius
            verts.append((radius_x*math.cos(phi),radius_y*math.sin(phi),z))
    faces=[]; uvs=[]
    for row in range(len(rings)-1):
        z0,z1=rings[row][0],rings[row+1][0]
        for col in range(segments):
            nxt=(col+1)%segments
            faces.append((row*segments+col,row*segments+nxt,(row+1)*segments+nxt,(row+1)*segments+col))
            # A paper sleeve is painted directly around the curved container.
            center=(z0+z1)/2/height
            if .28<center<.77:
                v0=ty+164-max(0,min(1,(z0/height-.23)/.55))*135
                v1=ty+164-max(0,min(1,(z1/height-.23)/.55))*135
            elif center>.87:
                v0=v1=ty+(239 if kind!='can' else 194)
            else:
                v0=v1=ty+202
            u0=tx+8+col*496/segments
            u1=tx+8+(col+1)*496/segments
            uvs.append([(u0,v0),(u1,v0),(u1,v1),(u0,v1)])
    faces.append(tuple(reversed(range(segments))))
    uvs.append([(tx+12,ty+201)]*segments)
    faces.append(tuple((len(rings)-1)*segments+i for i in range(segments)))
    uvs.append([(tx+12,ty+238)]*segments)
    obj=mesh('SKU '+name,verts,faces,uvs,can if kind=='can' else pack,stock)
    for face in obj.data.polygons:
        face.use_smooth=kind!='milk' and len(face.vertices)==4
    return obj

used={}
def place(name,x,y,z,turn):
    if name in used:
        obj=bpy.data.objects.new(name,used[name].data)
        bpy.context.collection.objects.link(obj)
        obj.parent=stock
    else:
        obj=ring_product(name)
        used[name]=obj
    obj.name='SKU_'+name+'_'+str(len(stock.children))
    obj['productId']=SKU[name][0]
    obj['productTitle']=SKU[name][1]
    obj['productPrice']=SKU[name][5]
    obj['sku']=name
    obj.location=(x,y,z)
    obj.rotation_euler.z=turn

for row,names in enumerate(ROWS):
    height=SHELF_HEIGHTS[row]+.015
    # The price artwork lists rows top to bottom, shelf rails are indexed bottom to top.
    for col,name in enumerate(names):
        for slot in range(2):
            if (row,col,slot) in {(1,2,1),(2,4,0),(3,1,1),(3,6,1)}:
                continue
            x=-.739+col*.244+slot*.112+random.uniform(-.008,.008)
            place(name,x,-.133+random.uniform(-.025,.024),height,random.uniform(-.075,.075))
            if slot==0 and (row+col)%4==0:
                place(name,x,.069,height,random.uniform(-.12,.12))

bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',export_extras=True,
                           export_yup=True, export_lights=False,export_cameras=False)

if len(args)>1:
    scene=bpy.context.scene
    scene.render.engine='CYCLES'
    scene.cycles.samples=32
    scene.cycles.use_denoising=False
    scene.render.resolution_x=680
    scene.render.resolution_y=800
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='JPEG'
    scene.render.image_settings.quality=91
    scene.render.threads_mode='FIXED'
    scene.render.threads=2
    world=bpy.data.worlds.new('Neutral studio reference')
    scene.world=world
    world.use_nodes=True
    world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.19,.25,.27,1)
    world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.47
    stage=mat('Studio stage',(.044,.058,.067),.68)
    block('Ground',(200,200,.06),(0,0,.065),stage,None)
    def aim(obj,target):
        obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    def area(name,loc,target,energy,color,size):
        data=bpy.data.lights.new(name,'AREA')
        data.energy=energy; data.color=color; data.shape='DISK'; data.size=size
        obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=loc;aim(obj,target)
    area('Warm sales floor',(-1.7,-3.0,3.6),(0,0,1.3),180,(1,.86,.69),2.6)
    area('Cool side fill',(2.1,-1.3,2.8),(0,0,1.35),126,(.68,.83,1),2.5)
    area('Shelf fill',(0,-2.7,1.7),(0,0,1.25),36,(.90,1,.93),2)
    bpy.data.objects['Door_R'].rotation_euler.z=-.29
    camera_data=bpy.data.cameras.new('Cabinet portrait')
    camera=bpy.data.objects.new('Cabinet portrait',camera_data)
    scene.collection.objects.link(camera)
    camera.location=(2.56,-6.1,2.44)
    aim(camera,(0,0,1.27))
    camera_data.lens=91
    scene.camera=camera
    scene.render.filepath=str(Path(args[1]).resolve())
    bpy.ops.render.render(write_still=True)

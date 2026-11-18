"""Bake the original Yomachi deli trio to an embedded glTF atlas, in metres.
blender -b --factory-startup --python tools/build-fresh.py -- assets/models/night-fresh.glb
Requires Pillow, DejaVu Sans and Noto CJK (or FRESH_CJK_FONT).
Front is Blender -Y, exported as Three.js +Z. The origin rests on the shelf.
"""
from pathlib import Path
import math
import os
import random
import sys
import tempfile

import bpy
from PIL import Image, ImageDraw, ImageFont

DEST = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
DEST.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
rng = random.Random(1185)
atlas = Image.new('RGB', (1024, 512), '#d9d5c5')
tiles = {}
cjk = os.environ.get('FRESH_CJK_FONT', '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc')
latin = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def tile(name, rect, base, decorate=None):
    x, y, w, h = rect
    art = Image.new('RGB', (w, h), base)
    if decorate:
        decorate(ImageDraw.Draw(art), w, h)
    atlas.paste(art, (x, y))
    # Two texels of filtering bleed protection inside every region.
    tiles[name] = (x + 2, y + 2, w - 4, h - 4)


def food_texture(kind):
    def paint(d, w, h):
        for _ in range(w*h//28):
            x, y = rng.randrange(w), rng.randrange(h)
            if kind == 'rice':
                d.ellipse((x, y, x+9, y+4), fill=rng.choice(('#ded5af', '#e9dfc0', '#efe7cb')))
                d.line((x+2, y+1, x+6, y+1), fill='#fcf3dd')
            elif kind == 'nori':
                d.line((x, y, x+rng.randrange(3, 13), y+rng.randrange(-3, 3)),
                       fill=rng.choice(('#244035', '#385446', '#273c34', '#182d28')))
            elif kind == 'crumb':
                d.ellipse((x, y, x+rng.randrange(1, 6), y+3),
                          fill=rng.choice(('#f4e7c6', '#d9c39d', '#eee0bf')))
            elif kind == 'egg':
                d.polygon(((x,y),(x+15,y-2),(x+14,y+7),(x+2,y+12)),
                          fill=rng.choice(('#eeb02d', '#f3bc46', '#fff0be', '#fff4dc', '#e7a42a')))
            elif kind == 'salmon':
                d.point((x,y), fill='#ed9a61')
        if kind == 'salmon':
            for i in range(-1,9):
                x = i*30
                d.line([(x,0),(x+15,24),(x+12,48),(x+27,83),(x+35,h)],
                       fill='#ffe0ae', width=4)
            for _ in range(35):
                x,y = rng.randrange(w),rng.randrange(h)
                d.ellipse((x,y,x+rng.randrange(2,7),y+2),fill='#b1683b')
    return paint


def label(title, subtitle, accent, price):
    def paint(d, w, h):
        d.rectangle((0,0,10,h), fill=accent)
        d.rectangle((12,6,w-6,h-7), outline=accent, width=2)
        def font(size, jp=False):
            return ImageFont.truetype(cjk if jp else latin, size)
        d.text((22,15), 'YOMACHI  /  DELI', font=font(15), fill=accent)
        d.text((20,34), title, font=font(32,True), fill='#23392f', stroke_width=0)
        d.line((22,87,w-18,87),fill=accent,width=3)
        d.text((22,94),subtitle,font=font(14),fill=accent)
        d.text((w-16,99),'¥'+str(price),font=font(18),anchor='rm',fill='#22352e')
    return paint


tile('rice', (0,0,256,128), '#f3e9cd', food_texture('rice'))
tile('salmon',(256,0,256,128),'#e18c59', food_texture('salmon'))
tile('nori',(512,0,256,128),'#283f32',food_texture('nori'))
tile('egg',(768,0,256,128),'#f5d991',food_texture('egg'))
tile('crumb',(0,128,256,128),'#f2e6cb',food_texture('crumb'))
tile('meal_tag',(256,128,256,128),'#faf1d9',label('焼き鮭弁当','GRILLED SALMON','#a34836',540))
tile('rice_tag',(512,128,256,128),'#f7eed1',label('紅しゃけ','SALMON','#aa4738',178))
tile('egg_tag',(768,128,256,128),'#fff2cb',label('たまごサンド','EGG SANDWICH','#847028',288))

palette = {
    'tray':'#273434', 'tray_side':'#354849', 'lip':'#697570', 'film':'#d9e6db',
    'glint':'#f3f1d9','paper':'#eee3bd','seal':'#d3c6a6','tab':'#bd5942',
    'lettuce':'#6a9246','broccoli':'#5c8045','pickle':'#e1aa42','pink':'#c97778',
    'crust':'#dab480','seed':'#423c30','broil':'#ad693b','soy':'#95503c',
    'mustard':'#e0af40','dark':'#38483a','herb':'#6c7542'
}
for i,(key,color) in enumerate(palette.items()):
    tile(key,((i%10)*64,264+i//10*64,64,64),color)


def print_strip(d,w,h):
    d.rectangle((8,4,w-8,h-4),outline='#ba4f3e',width=3)
    d.text((w//2,6),'1',font=ImageFont.truetype(latin,30),anchor='mt',fill='#a94437')
    d.polygon(((w//2-12,51),(w//2+12,51),(w//2,66)),fill='#b14e3d')
    for y in range(82,h-18,13):
        d.line((w//2,y,w//2,y+6),fill='#aa4936',width=4)


tile('pull',(650,266,68,220),'#efe3bd',print_strip)


def texture_material(path):
    atlas.save(path)
    img=bpy.data.images.load(str(path)); img.pack()
    mat=bpy.data.materials.new('Yomachi deli • printed food and paper')
    mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value=.54
    node=mat.node_tree.nodes.new('ShaderNodeTexImage')
    node.image=img
    mat.node_tree.links.new(node.outputs['Color'],bsdf.inputs['Base Color'])
    return mat


class Product:
    def __init__(self,name):
        self.name=name
        self.points=[]; self.faces=[]; self.coords=[]

    def face(self, vertices, surface, uv=None):
        # Vertices on a face are listed counterclockwise as seen from outside.
        start=len(self.points)
        self.points.extend(vertices)
        self.faces.append(tuple(range(start,start+len(vertices))))
        if uv is None:
            uv=[(0,0),(1,0),(1,1),(0,1)] if len(vertices)==4 else [
                (.5+.47*math.cos(i*math.tau/len(vertices)),
                 .5+.47*math.sin(i*math.tau/len(vertices))) for i in range(len(vertices))]
        x,y,w,h=tiles[surface]
        self.coords.append([((x+u*w)/atlas.width,1-(y+(1-v)*h)/atlas.height) for u,v in uv])

    def levels(self,rings,surfaces,bottom,top):
        # Rings in XY counterclockwise, ascending Z.
        self.face(list(reversed(rings[0])),bottom)
        for lower,upper,surf in zip(rings,rings[1:],surfaces):
            for i in range(len(lower)):
                j=(i+1)%len(lower)
                self.face((lower[i],lower[j],upper[j],upper[i]),surf)
        ring=rings[-1]
        xs,ys=zip(*[(p[0],p[1]) for p in ring])
        self.face(ring,top,[((x-min(xs))/(max(xs)-min(xs)),(y-min(ys))/(max(ys)-min(ys))) for x,y,_ in ring])

    def rounded(self,x,y,w,d,zlow,zhigh,r,surface,top=None):
        def ring(z,shrink):
            pts=[]
            for sx,sy,angle in [(1,1,0),(-1,1,90),(-1,-1,180),(1,-1,270)]:
                for step in range(3):
                    a=math.radians(angle+step*45)
                    pts.append((x+sx*(w/2-r-shrink)+r*math.cos(a),
                                y+sy*(d/2-r-shrink)+r*math.sin(a),z))
            return pts
        bevel=min(.0017,(zhigh-zlow)*.23)
        self.levels([ring(zlow,bevel),ring(zlow+bevel,0),ring(zhigh-bevel,0),ring(zhigh,bevel)],
                    [surface]*3,surface,top or surface)

    def wedge(self,outline,front,back,face,side=None):
        near=[(x,front,z) for x,z in outline]
        far=[(x,back,z) for x,z in outline]
        xs,zs=zip(*outline)
        uv=[((x-min(xs))/(max(xs)-min(xs)),(z-min(zs))/(max(zs)-min(zs))) for x,z in outline]
        self.face(near,face,uv); self.face(far[::-1],face,uv[::-1])
        for i in range(len(near)):
            j=(i+1)%len(near)
            self.face((near[i],far[i],far[j],near[j]),side or face)

    def finish(self,material):
        mesh=bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.points,[],self.faces); mesh.update()
        uv=mesh.uv_layers.new()
        for p,coords in zip(mesh.polygons,self.coords):
            for index,values in zip(p.loop_indices,coords): uv.data[index].uv=values
        mesh.materials.append(material)
        obj=bpy.data.objects.new('product_'+self.name,mesh)
        bpy.context.collection.objects.link(obj)


def meal():
    p=Product('bento')
    # Shallow lacquer tray, rolled rim and a stepped, fitted lid edge.
    p.rounded(0,0,.233,.158,0,.020,.012,'tray')
    p.rounded(0,0,.245,.170,.018,.024,.012,'tray_side','lip')
    p.rounded(0,0,.238,.163,.023,.027,.012,'tray','tray')
    p.rounded(-.056,.0,.100,.134,.026,.039,.015,'rice')
    for i in range(15):
        x,y=rng.uniform(-.081,-.038),rng.uniform(-.032,.031)
        p.face([(x-.0014,y,.0394),(x,y-.0008,.040),(x+.0014,y,.0394),(x,y+.0008,.040)],'seed')
    # A pickled plum on the rice balances the pink garnish on the opposite side.
    rings=[[( -.061+r*math.cos(i*math.tau/10),.016+r*math.sin(i*math.tau/10),z) for i in range(10)]
           for z,r in [(.039,.010),(.045,.012),(.050,.008),(.051,.003)]]
    p.levels(rings,['soy','tab','soy'],'soy','tab')
    # Asymmetric grilled fillet with independently mapped cross-fat lines on top.
    outline=[(.003,-.044),(.019,-.057),(.077,-.043),(.097,-.025),(.093,-.002),(.078,.010),(.021,-.002)]
    p.levels([[(x,y,.034) for x,y in outline],[(x*.96+.002,y*.95,.049) for x,y in outline]],
             ['broil'],'broil','salmon')
    for cx,cy in [(.026,.031),(.041,.043),(.056,.031)]:
        rings=[[(cx+r*math.cos(i*math.tau/8),cy+r*math.sin(i*math.tau/8),z) for i in range(8)]
               for z,r in [(.027,.010),(.041,.016),(.047,.011)]]
        p.levels(rings,['lettuce','broccoli'],'lettuce','broccoli')
    for i in range(3):
        p.rounded(.079+i*.001,.026+i*.011,.028,.010,.027,.040,.004,'pink' if i==2 else 'pickle')
    # Paper label across the short side of the snap-on lid. Narrow light catches
    # along its edge describe clear plastic without extra alpha-sort passes.
    for side in (-1,1):
        p.rounded(0,side*.078,.226,.002,.040,.046,.0005,'film')
        p.rounded(side*.115,0,.002,.148,.040,.046,.0005,'film')
    x1,x2=-.098,-.025
    p.face([(x1,-.070,.061),(x2,-.070,.061),(x2,-.025,.065),(x1,-.025,.065)],'meal_tag')
    p.face([(x1,-.079,.024),(x2,-.079,.024),(x2,-.070,.061),(x1,-.070,.061)],'paper')
    return p


def onigiri():
    p=Product('onigiri')
    outline=[(-.062,0),(.062,0),(.075,.011),(.071,.032),(.013,.145),(.005,.152),
             (-.005,.152),(-.013,.145),(-.071,.032),(-.075,.011)]
    p.wedge(outline,-.035,.035,'rice')
    seaweed=[(-.060,.004),(.060,.004),(.068,.015),(.064,.033),(.021,.113),
             (-.021,.113),(-.064,.033),(-.068,.015)]
    p.wedge(seaweed,-.036,.036,'nori')
    p.face([(-.006,-.0365,.007),(.006,-.0365,.007),(.006,-.0365,.151),(-.006,-.0365,.151)],'pull')
    p.wedge([(-.011,.148),(.011,.148),(.011,.155),(0,.160),(-.011,.155)],-.034,.032,'tab')
    p.face([(-.034,-.0368,.041),(.034,-.0368,.041),(.034,-.0368,.077),(-.034,-.0368,.077)],'rice_tag')
    # Crimped seams catch light toward the two lower corners.
    for side in (-1,1):
        path=[(.073*side,.017),(.069*side,.033),(.020*side,.129)]
        for a,b in zip(path,path[1:]):
            points=[(a[0],-.0359,a[1]),(b[0],-.0359,b[1]),
                    (b[0]-.0014*side,-.0359,b[1]),(a[0]-.0014*side,-.0359,a[1])]
            if side<0: points.reverse()
            p.face(points,'film')
    return p


def sandwich():
    p=Product('sandwich')
    # Two sandwich halves on edge. Each presents its filled cut edge through
    # a slightly raked front window, backed by a triangular bread profile.
    profile=[(-.042,.005),(.044,.005),(.044,.017),(-.026,.137),(-.032,.140)]
    def slice_(x0,x1,surface,edge):
        left=[(x0,y,z) for y,z in profile]; right=[(x1,y,z) for y,z in profile]
        p.face(left[::-1],surface);p.face(right,surface)
        for i in range(len(left)):
            j=(i+1)%len(left)
            p.face((left[i],left[j],right[j],right[i]),edge if i==2 else surface)
    for start in [-.079,.001]:
        slice_(start,start+.019,'crumb','crust')
        slice_(start+.019,start+.036,'egg','egg')
        slice_(start+.036,start+.041,'herb','herb')
        slice_(start+.041,start+.057,'egg','egg')
        slice_(start+.057,start+.076,'crumb','crust')
    p.rounded(0,0,.172,.096,0,.006,.004,'paper')
    # The fold and closed back, formed from a single cardboard cradle.
    front=[(-.086,-.047,.004),(.086,-.047,.004),(.084,-.0455,.021),(-.084,-.0455,.021)]
    p.face(front,'mustard')
    p.face([(.084,.047,.004),(-.084,.047,.004),(-.080,.046,.034),(.080,.046,.034)],'paper')
    for side in (-1,1):
        xx=side*.085
        sidewall=[(xx,-.046,.004),(xx,.046,.004),(xx,.044,.033),(xx,-.042,.023)]
        if side<0: sidewall.reverse()
        p.face(sidewall,'paper')
    for x0 in [-.058,.022]:
        for j in range(8):
            z=.027+j*.012
            x=x0+rng.uniform(-.003,.007); y=-.04255+.010*(z-.005)/.135
            p.face([(x,y,z),(x+.007,y,z+.001),(x+.011,y+.0003,z+.007),(x+.002,y+.0003,z+.008)],
                   'mustard' if j%3 else 'glint')
    p.face([(.004,-.0442,.019),(.072,-.0442,.019),(.072,-.0418,.057),(.004,-.0418,.057)],'egg_tag')
    p.face([(-.080,-.0325,.138),(.078,-.0325,.138),(.078,-.031,.146),(-.080,-.031,.146)],'seal')
    return p


with tempfile.TemporaryDirectory() as temp:
    material=texture_material(Path(temp)/'night-deli-atlas.png')
    for make in (meal,onigiri,sandwich): make().finish(material)
    bpy.ops.export_scene.gltf(filepath=str(DEST),export_format='GLB',export_yup=True,
                              export_animations=False,export_cameras=False,export_lights=False)

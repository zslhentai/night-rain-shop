"""Build Yomachi's aisle collection. Blender 4.3+, Pillow and Noto CJK fonts.
blender -b -t 2 --factory-startup --python tools/build-aisle.py -- assets/models/night-aisle.glb
Blender -Y is the front of every pack. The exported +Z faces the customer.
"""
import math
import os
import random
import sys
import tempfile
from functools import lru_cache
from pathlib import Path

import bpy
from PIL import Image, ImageDraw, ImageFont

OUTPUT = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
# Title and price come from the shop catalogue. Printed names are shorter for small packs.
# family, width/height/depth, pair of original designs (id, front copy, caption, colours)
FAMILIES = [
    ('chips', (.170,.230,.075), [
        ('chips','うすしお','POTATO CHIPS','#e9b943','#254b50','#a33c31'),
        ('seaweedChips','海苔しお','NORI CHIPS','#387660','#f7eac3','#e2a742')]),
    ('crackers', (.180,.160,.090), [
        ('crackers','おかき','RICE CRACKERS','#b7452d','#fff0c4','#525433'),
        ('sesameRice','黒ごま','SESAME ARARE','#44575a','#fff1cf','#b66c48')]),
    ('candy', (.115,.160,.063), [
        ('candy','フルーツ','FRUIT DROPS','#dd7886','#532d4a','#f9d164'),
        ('citrusCandy','柚子あめ','YUZU DROPS','#ecca53','#255a45','#f5ead2')]),
    ('biscuits', (.155,.145,.090), [
        ('biscuits','ビスケット','BUTTER BISCUITS','#386278','#f8e5b4','#b96543'),
        ('cocoaBiscuits','サブレ','COCOA SABLES','#6a443c','#ffe4b2','#87a695')]),
    ('cup', (.155,.148,.155), [
        ('cup','醤油','SHOYU RAMEN','#b63c2c','#fff0cc','#443328'),
        ('misoCup','味噌','MISO RAMEN','#ac732d','#fff4cd','#743827')]),
    ('bowl', (.185,.105,.185), [
        ('bowl','うどん','KITSUNE UDON','#dfd7b1','#25483c','#b45c39'),
        ('sobaBowl','山菜そば','SANSAI SOBA','#596e50','#f4eacb','#b98041')]),
    ('noodles', (.191,.136,.035), [
        ('noodles','焼そば','YAKISOBA','#c55a39','#fff0cf','#324f46'),
        ('spicyNoodles','まぜそば','CHILI NOODLES','#792e34','#fff0c8','#efa84b')]),
    ('tissue', (.210,.105,.116), [
        ('tissue','ティッシュ','SOFT TISSUES','#afc4bf','#284c55','#fff5d9'),
        ('softTissue','やわらか紙','COTTON TOUCH','#c9b9c7','#594359','#fff1d9')])
]
TILE = 512
ATLAS = TILE * 4
# Padding inside each island prevents neighbour colours leaking into mip levels.
REGIONS = {'front': (8, 8, 305, 332), 'back': (319, 8, 504, 332),
           'top': (8, 347, 246, 504), 'side': (262, 347, 504, 504)}
JP = os.environ.get('AISLE_JAPANESE_FONT','/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc')
LATIN = os.environ.get('AISLE_LATIN_FONT','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
PAPER = '#f8eed1'
DARK = '#342e28'

@lru_cache(maxsize=None)
def font(size, jp=False):
    return ImageFont.truetype(JP if jp else LATIN, size)

def centered(draw, y, text, ink, size, max_width=275, x=148, jp=False):
    while size > 9 and draw.textlength(text, font=font(size,jp)) > max_width:
        size -= 1
    draw.text((x,y),text,fill=ink,font=font(size,jp),anchor='mm')

def cereal(draw, x, y, scale, kind, dark=False):
    """Hand-printed food illustration, one repeatable shape per ingredient."""
    def pts(*xy):
        return tuple(round((x if i%2==0 else y) + val*scale) for i,val in enumerate(xy))
    if kind == 'chip':
        draw.ellipse(pts(-36,-9,33,10),fill='#9c622b')
        draw.pieslice(pts(-37,-28,36,8),145,358,fill='#e9b14a',outline='#c48b35',width=2)
        draw.arc(pts(-28,-22,30,5),190,339,fill='#fff0a3',width=3)
    elif kind == 'cracker':
        draw.rounded_rectangle(pts(-23,-16,23,16),radius=max(2,int(8*scale)),
                               fill='#ba7838',outline='#965d33',width=2)
        draw.rounded_rectangle(pts(-22,-20,22,11),radius=max(2,int(7*scale)),fill='#e8b363')
        for dx,dy in [(-12,-8),(4,2),(10,-12),(-4,-14)]:
            draw.ellipse(pts(dx,dy,dx+4,dy+2),fill='#343830' if dark else '#a6753d')
    elif kind == 'cookie':
        draw.ellipse(pts(-36,-18,36,16),fill='#82472d')
        draw.ellipse(pts(-36,-23,36,9),fill='#a36b4d' if dark else '#dda25e',
                     outline='#d5ae82' if dark else '#f5cf8d',width=2)
        for dx,dy in [(-14,-10),(0,-12),(14,-8),(-5,-2),(10,-1)]:
            draw.ellipse(pts(dx-1,dy-1,dx+2,dy+2),fill='#5d4337' if dark else '#a06f42')
    else:
        draw.ellipse(pts(-24,-24,24,24),fill='#f5af43',outline='#fff3bf',width=3)
        for angle in range(0,360,45):
            rad=math.radians(angle)
            draw.line(pts(0,0,20*math.cos(rad),20*math.sin(rad)),fill='#fff1aa',width=2)

def noodles_art(draw, cx, cy, scale, greens):
    def p(x,y): return (round(cx+x*scale),round(cy+y*scale))
    draw.pieslice([p(-85,-48),p(85,44)],0,180,fill='#bd5134',outline=DARK,width=2)
    draw.ellipse([p(-85,-40),p(85,12)],fill=PAPER,outline=DARK,width=2)
    draw.ellipse([p(-77,-35),p(77,7)],fill='#aa7939')
    for j in range(5):
        wave=[p(-50+i*4,-22+j*4+4.4*math.sin(i*.62+j)) for i in range(24)]
        draw.line(wave,fill='#f8dfa0',width=max(2,round(scale*3)))
    draw.ellipse([p(7,-29),p(35,-11)],fill='#fff4cf')
    draw.ellipse([p(14,-24),p(26,-15)],fill='#e6a13c')
    for j in range(6):
        x,y=-40+(j%3)*9,-13+(j//3)*5
        draw.ellipse([p(x,y),p(x+8,y+4)],fill=greens)

def tile_art(family, sku, variant):
    _, title, en, base, ink, accent=sku
    img=Image.new('RGB',(TILE,TILE),base)
    front=Image.new('RGB',(298,325),base)
    d=ImageDraw.Draw(front)
    # Prominent silhouettes and deliberately different layouts for each family.
    if family=='chips':
        d.polygon([(0,157),(298,96),(298,268),(0,292)],fill=ink)
        centered(d,41,'POTATO',ink,40)
        centered(d,83,title,ink,62,jp=True)
        for x,y,s in [(71,211,1.05),(126,201,1.25),(175,186,1.15),(204,225,.94),(135,246,.84)]:
            cereal(d,x,y,s,'chip')
        d.ellipse((223,132,272,181),fill=accent)
        centered(d,157,'塩',PAPER,26,x=248,jp=True)
        centered(d,287,en,ink,20)
    elif family=='crackers':
        d.rectangle((19,11,277,307),outline=PAPER,width=3)
        centered(d,32,'米菓製造所',ink,22,jp=True)
        centered(d,86,title,ink,64,jp=True)
        d.rounded_rectangle((24,135,272,252),radius=32,fill='#ab773f',outline=ink,width=4)
        for j,(x,y) in enumerate([(62,171),(105,163),(159,168),(211,169),(248,180),
                                   (49,205),(91,212),(141,195),(184,206),(226,214),(142,231)]):
            cereal(d,x,y,.76+(j%3)*.08,'cracker',variant)
        d.arc((25,138,139,244),158,265,fill='#f5dca3',width=3)
        centered(d,279,en,ink,20)
    elif family=='candy':
        d.rounded_rectangle((30,49,268,241),radius=74,fill='#f8e6bb')
        centered(d,82,'DROP SHOP',ink,24)
        centered(d,133,title,ink,49,jp=True)
        if variant:
            for x,y,s in [(95,206,1.12),(145,192,.8),(194,216,1.08)]:
                cereal(d,x,y,s,'citrus')
        else:
            for x,y,col in [(103,190,'#be5659'),(147,218,'#758b54'),(193,191,'#ecab53')]:
                d.ellipse((x-20,y-20,x+20,y+21),fill=col)
                d.arc((x-14,y-15,x+10,y+8),180,266,fill=PAPER,width=3)
                d.ellipse((x+4,y-23,x+20,y-16),fill='#597746')
        centered(d,275,en,ink,20)
    elif family=='biscuits':
        for x in range(3,300,18): d.line((x,0,x,325),fill=accent,width=2)
        d.rounded_rectangle((13,17,284,309),radius=20,fill=base,outline=ink,width=3)
        centered(d,46,'MAISON  ·  YOMACHI',ink,18)
        centered(d,101,title,ink,48,jp=True)
        for x,y,s in [(86,222,.98),(139,216,1.24),(180,193,1.25),(209,224,.82)]:
            cereal(d,x,y,s,'cookie',variant)
        centered(d,267,en,ink,20)
    elif family in ('cup','bowl','noodles'):
        if family=='cup':
            for y in (17,27,297,307): d.rectangle((0,y,297,y+4),fill=ink)
            centered(d,56,'夜町製麺',ink,24,jp=True)
            centered(d,125,title,ink,81,jp=True)
            noodles_art(d,150,213,.91,'#537249')
        elif family=='bowl':
            for y in range(-12,300,38):
                for x in range(-27,310,49): d.arc((x,y,x+54,y+35),180,360,fill=accent,width=2)
            d.rounded_rectangle((32,48,266,248),radius=10,fill=PAPER)
            centered(d,83,'だし仕立て',DARK,24,jp=True)
            centered(d,135,title,DARK,53,jp=True)
            noodles_art(d,150,206,.82,'#4d7649')
        else:
            d.polygon([(0,0),(102,0),(50,325),(0,325)],fill=accent)
            d.rounded_rectangle((19,33,279,258),radius=12,fill=PAPER)
            centered(d,71,'鉄板仕込み',DARK,23,jp=True)
            centered(d,127,title,DARK,61,jp=True)
            noodles_art(d,148,212,.93,'#497344')
        centered(d,276,en,ink,19)
    else:
        for j in range(6):
            x,y=18+j*51,212+(j%2)*26
            d.arc((x-28,y-157,x+56,y+69),95,236,fill=ink,width=3)
            for k in range(3):
                d.ellipse((x-5,y-k*26,x+20,y+13-k*26),fill=accent)
        d.rounded_rectangle((21,41,277,170),radius=13,fill=PAPER)
        centered(d,78,'YOMACHI  /  HOME',ink,20)
        centered(d,127,title,ink,41,jp=True)
        centered(d,287,en,ink,19)
    centered(d,314,'夜 町 商 店',ink,12,jp=True)
    img.paste(front,(8,8))
    # Nutrition grid, product name, fold seam and a non-scannable illustrated code.
    d=ImageDraw.Draw(img)
    d.rounded_rectangle((326,36,497,295),radius=5,fill=PAPER)
    d.text((336,48),'夜町商店',font=font(19,True),fill=DARK)
    d.text((336,79),title,font=font(17,True),fill=DARK)
    note='直射日光を避ける' if family!='tissue' else '乾燥した場所'
    for j,(key,value) in enumerate([('品名',title),('区分',('家庭用品' if family=='tissue' else '加工食品')),('保存',note),('販売','夜町商店')]):
        y=118+j*22
        d.line((335,y-4,487,y-4),fill='#948c7b',width=1)
        d.text((336,y),key,font=font(11,True),fill=DARK)
        d.text((388,y),value,font=font(11,True),fill=DARK)
    rng=random.Random(sku[0])
    x=342
    while x<484:
        width=rng.randrange(1,4)
        d.rectangle((x,228,x+width,264),fill=DARK)
        x+=width+rng.randrange(2,5)
    d.text((342,270),'YOMACHI  MARKET',font=font(12),fill=DARK)
    # Lid artwork remains legible from normal eye height above a short shelf.
    if family in ('cup','bowl'):
        d.ellipse((10,348,245,504),fill=PAPER,outline=accent,width=6)
        d.ellipse((21,355,234,498),outline=accent,width=2)
        d.text((128,394),title,font=font(32,True),fill=DARK,anchor='mm')
        noodles_art(d,127,445,.53,'#4f774b')
    elif family=='tissue':
        d.rounded_rectangle((23,366,228,485),radius=30,fill=accent)
        d.rounded_rectangle((39,393,212,451),radius=24,fill='#625e68')
    else:
        for y in range(352,505,10): d.line((9,y,244,y),fill=ink,width=2)
    d.rectangle((263,347,503,503),fill=base)
    d.line((279,358,279,495),fill=accent,width=5)
    d.text((301,396),'YOMACHI',font=font(20),fill=ink)
    d.text((301,430),en,font=font(12),fill=ink)
    return img

class Mesh:
    def __init__(self, sku, index):
        self.sku, self.index=sku,index
        self.v=[]; self.f=[]; self.uv=[]; self.smooth=[]
    def vertex(self, xyz):
        i=len(self.v); self.v.append(tuple(xyz)); return i
    def face(self, ids, coords, region='front', smooth=False):
        self.f.append(ids); self.smooth.append(smooth)
        x,y,w,h=REGIONS[region]
        col,row=self.index%4,self.index//4
        self.uv.append([((col*TILE+x+u*(w-x))/ATLAS,
                         1-(row*TILE+h-v*(h-y))/ATLAS) for u,v in coords])
    def build(self,material):
        name='product_'+self.sku
        data=bpy.data.meshes.new(name)
        data.from_pydata(self.v,[],self.f)
        data.update()
        obj=bpy.data.objects.new(name,data)
        bpy.context.collection.objects.link(obj)
        data.materials.append(material)
        uv=data.uv_layers.new(name='Print')
        for face, corners, smooth in zip(data.polygons,self.uv,self.smooth):
            face.use_smooth=smooth
            for loop,coord in zip(face.loop_indices,corners): uv.data[loop].uv=coord

def packet(m,dims,family):
    w,h,d=dims
    # Inset shoulders, gusseted foot, crimp, and rounded pillow volume. Ring winding is CCW.
    specs={
        'chips': [(0,.85,.13),(.035,.91,.14),(.095,.91,.76),(.27,.98,.96),(.55,1,1),
                  (.79,.98,.92),(.90,.93,.65),(.952,.94,.13),(1,.92,.12)],
        'crackers':[(0,.89,.18),(.05,.97,.25),(.14,.99,.82),(.39,1,1),(.74,.98,.90),
                    (.88,.94,.56),(.94,.98,.12),(1,.95,.10)],
        'candy':[(0,.69,.74),(.09,.92,.99),(.28,1,1),(.65,.94,.88),(.79,.89,.56),
                 (.83,.91,.32),(.86,.95,.35),(.95,.95,.10),(1,.91,.10)],
        'noodles':[(0,.93,.12),(.05,.96,.14),(.14,.96,.67),(.24,1,.95),(.70,1,1),
                   (.86,.98,.71),(.94,.98,.14),(1,.95,.13)]}
    rings=[]
    for row,(z,wr,dr) in enumerate(specs[family]):
        ring=[]
        for j in range(20):
            angle=2*math.pi*j/20-math.pi
            c,s=math.cos(angle),math.sin(angle)
            x=math.copysign(abs(c)**.62,c)*w*wr*.5
            y=math.copysign(abs(s)**.60,s)*d*dr*.5
            # Crimp cuts are geometric, and catch light when viewed edge-on.
            crest=(-.012*h if j%2 and row==len(specs[family])-1 else 0)
            y+=d*.026*math.sin(j*2.3+row*1.1)*math.sin(math.pi*z)
            ring.append(m.vertex((x,y,z*h+crest)))
        rings.append(ring)
    def uv(i,front):
        x,_,z=m.v[i]
        return (.5+x/w if front else .5-x/w,z/h)
    for lower,upper in zip(rings,rings[1:]):
        for j in range(20):
            k=(j+1)%20; front=j<10
            ids=(lower[j],lower[k],upper[k],upper[j])
            m.face(ids,[uv(i,front) for i in ids],'front' if front else 'back',True)
    cap(m,rings[-1],w,d)
    cap(m,rings[0][::-1],w,d)

def cap(m,ids,w,d):
    m.face(ids,[(.5+m.v[i][0]/w,.5+m.v[i][1]/d) for i in ids],'top')

def carton(m,dims,tissue):
    w,h,d=dims
    bevel=min(w,h,d)*.045
    rings=[]
    for z,shrink in [(0,bevel*.6),(bevel,0),(h-bevel,0),(h,bevel*.6)]:
        x,y=w/2-shrink,d/2-shrink
        corners=[(-x+bevel,-y),(x-bevel,-y),(x,-y+bevel),(x,y-bevel),
                 (x-bevel,y),(-x+bevel,y),(-x,y-bevel),(-x,-y+bevel)]
        rings.append([m.vertex((a,b,z)) for a,b in corners])
    for lower,upper in zip(rings,rings[1:]):
        for j in range(8):
            k=(j+1)%8
            ids=(lower[j],lower[k],upper[k],upper[j])
            region='front' if j==0 else 'back' if j==4 else 'side'
            uvs=[]
            for i in ids:
                x,y,z=m.v[i]
                u=x/w if j==0 else -x/w if j==4 else y/d if j<=3 else -y/d
                uvs.append((.5+u,z/h))
            m.face(ids,uvs,region)
    cap(m,rings[-1],w,d);cap(m,rings[0][::-1],w,d)
    if tissue:
        # Folded paper projecting through the aperture; samples the paper-coloured back panel.
        front=[]; back=[]; crest=[]
        for x,up in [(-.31,.04),(-.18,.24),(-.03,.14),(.11,.29),(.28,.07)]:
            front.append(m.vertex((x*w,-.05*d,h)))
            crest.append(m.vertex((x*w,.017*d,h+h*up)))
            back.append(m.vertex((x*w,.063*d,h)))
        for j in range(4):
            m.face((front[j],front[j+1],crest[j+1],crest[j]),[(.9,.36)]*4,'back')
            m.face((crest[j],crest[j+1],back[j+1],back[j]),[(.87,.36)]*4,'back')

def pot(m,dims,bowl):
    w,h,d=dims
    profile=([(0,.54),(.045,.56),(.15,.64),(.50,.80),(.87,.96),(.90,1),(.97,1),(1,.94)]
             if bowl else [(0,.66),(.028,.68),(.075,.67),(.77,.91),(.90,.96),(.91,1),(.97,1),(1,.94)])
    rings=[]
    for z,r in profile:
        ring=[]
        for j in range(32):
            angle=2*math.pi*j/32-math.pi
            ring.append(m.vertex((math.cos(angle)*w*.5*r,math.sin(angle)*d*.5*r,z*h)))
        rings.append(ring)
    for lower,upper in zip(rings,rings[1:]):
        for j in range(32):
            k=(j+1)%32; front=j<16
            ids=(lower[j],lower[k],upper[k],upper[j])
            u=(j%16)/16; end=u+1/16
            uv=[(u,m.v[ids[0]][2]/h),(end,m.v[ids[1]][2]/h),
                (end,m.v[ids[2]][2]/h),(u,m.v[ids[3]][2]/h)]
            m.face(ids,uv,'front' if front else 'back',True)
    cap(m,rings[-1],w,d);cap(m,rings[0][::-1],w,d)
    # An outward foil pull-tab, only a few millimetres beyond the rim.
    ids=[m.vertex((x*w,y*d,z*h)) for x,y,z in
         [(.20,-.40,1),(.28,-.45,.98),(.36,-.395,.98),(.30,-.345,1)]]
    m.face(ids,[(.63,.15),(.7,.10),(.8,.14),(.75,.19)],'top')

bpy.ops.wm.read_factory_settings(use_empty=True)
atlas=Image.new('RGB',(ATLAS,ATLAS),PAPER)
models=[]
for family_index,(family,dims,skus) in enumerate(FAMILIES):
    for variant,sku in enumerate(skus):
        index=family_index*2+variant
        atlas.paste(tile_art(family,sku,variant),((index%4)*TILE,(index//4)*TILE))
        mesh=Mesh(sku[0],index)
        if family in ('chips','crackers','candy','noodles'): packet(mesh,dims,family)
        elif family in ('cup','bowl'): pot(mesh,dims,family=='bowl')
        else: carton(mesh,dims,family=='tissue')
        models.append(mesh)
with tempfile.TemporaryDirectory() as directory:
    path=Path(directory)/'night-market-print.jpg'
    atlas.save(path,quality=91,subsampling=0,optimize=True)
    image=bpy.data.images.load(str(path)); image.pack()
    mat=bpy.data.materials.new('Night market print');mat.use_nodes=True
    shader=mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Roughness'].default_value=.6
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
    mat.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color'])
    for mesh in models: mesh.build(mat)
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT),export_format='GLB',export_yup=True,
                              export_image_format='AUTO',export_texcoords=True,
                              export_normals=True,export_animations=False,export_cameras=False,
                              export_lights=False,export_apply=True)

"""Measure transparent gutters and registration. Never changes source pixels."""
from pathlib import Path
from PIL import Image
import numpy as np
import re, json
root=Path(__file__).resolve().parent.parent
names=list(dict.fromkeys(re.findall(r"assetImage\('([^'?]+)", (root/'combat.js').read_text(encoding='utf-8'))))
names=[n for n in names if any(t in n for t in ['fx-','frames-','bolt-','thrust-'])]
data={}
def cut(scores,ideal,span):
    lo=max(1,round(ideal-span));hi=min(len(scores)-1,round(ideal+span))
    window=scores[lo:hi];best=window.min()
    ids=np.flatnonzero(window<=best+0.01)+lo
    groups=np.split(ids,np.where(np.diff(ids)>1)[0]+1)
    group=min(groups,key=lambda g: abs((g[0]+g[-1])/2-ideal)-len(g)*.3)
    return int(round((group[0]+group[-1])/2))
for name in names:
    im=np.asarray(Image.open(root/'assets'/name).convert('RGBA'));h,w=im.shape[:2]
    cols,rows=(6,1) if w/h>4 else ((3,2) if name.startswith(('seed-bolt','spear-thrust')) else ((6,3) if name=='new-attacks-v1.png' else (6,4) if name=='weapon-frames-v2.png' else (4,3)))
    if name=='melee-fx-v1.png':continue # rejected opaque fallback
    alpha=im[:,:,3];mass=(alpha>32).astype(float)
    rowcuts=[0]+[cut(mass.sum(axis=1),h*r/rows,min(48,h/rows*.14)) for r in range(1,rows)]+[h]
    frames=[];boxes=[];cores=[];necks=[]
    for row in range(rows):
        y0,y1=rowcuts[row:row+2]
        colcuts=[0]+[cut(mass[y0:y1].sum(axis=0),w*c/cols,min(42,w/cols*.12)) for c in range(1,cols)]+[w]
        for col in range(cols):
            x0,x1=colcuts[col:col+2]
            # Per-column vertical gutter catches an overhanging neighbour even
            # when another column has a taller cel in the same row.
            score=mass[:,x0:x1].sum(axis=1)
            top=0 if row==0 else cut(score,h*row/rows,min(45,h/rows*.13))
            bottom=h if row==rows-1 else cut(score,h*(row+1)/rows,min(45,h/rows*.13))
            frames.append([x0,top,x1-x0,bottom-top])
            yy,xx=np.where(alpha[top:bottom,x0:x1]>32)
            if len(xx):boxes.append([(x0+int(xx.min())-col*w/cols)/(w/cols),(top+int(yy.min())-row*h/rows)/(h/rows),(x0+int(xx.max())+1-col*w/cols)/(w/cols),(top+int(yy.max())+1-row*h/rows)/(h/rows)])
            else:boxes.append([.5,.5,.5,.5])
            pixels=im[top:bottom,x0:x1];white=(pixels[:,:,0]>230)&(pixels[:,:,1]>208)&(pixels[:,:,2]>150)&(pixels[:,:,3]>180)
            cy,cx=np.where(white)
            cores.append([round((x0+float(cx.mean())-col*w/cols)/(w/cols),4),round((top+float(cy.mean())-row*h/rows)/(h/rows),4)] if len(cx)>6 else [.5,.5])
            neck=None
            # Only a connected painted neck, never nearby curls or motes.
            for dy in range(5,min(bottom-top,int(h/rows*.23))):
                ids=np.flatnonzero(white[dy])
                if len(ids)<12:continue
                mid=int(np.median(ids));a=mid;b=mid
                while a>0 and pixels[dy,a-1,3]>32:a-=1
                while b<pixels.shape[1]-1 and pixels[dy,b+1,3]>32:b+=1
                if b-a<12:continue
                neck=[x0+a,top+dy,b-a+1];break
            necks.append(neck)
    union=[min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes)]
    data[name]={'cols':cols,'rows':rows,'size':[w,h],'frames':frames,'boxes':[[round(v,4) for v in b] for b in boxes],'cores':cores,'necks':necks,'union':[round(v,4) for v in union]}
(root/'fx-atlas-data.js').write_text('// Measured by scripts/measure-fx-atlases.py. Source artwork is unchanged.\nconst FX_ATLAS_DATA='+json.dumps(data,separators=(',',':'))+';\n',encoding='utf-8')
print(f'{len(data)} atlases measured, {sum(len(v["frames"]) for v in data.values())} cells')

"""Contact sheets and alpha gutters for visual audit; source art is untouched."""
from pathlib import Path
from PIL import Image, ImageDraw
import re, json
root=Path(__file__).resolve().parent.parent
names=list(dict.fromkeys(re.findall(r"assetImage\('([^'?]+)", (root/'combat.js').read_text(encoding='utf-8'))))
names=[n for n in names if any(t in n for t in ['fx-','frames-','bolt-','thrust-'])]
names+=['epic-ice-spike-frames-v1.png','epic-spark-arc-frames-v1.png','thunder-strike-frames-v1.png']
out=root/'reports';out.mkdir(exist_ok=True)
for page in range((len(names)+7)//8):
    canvas=Image.new('RGB',(1120,8*180),'#243629');d=ImageDraw.Draw(canvas)
    for row,n in enumerate(names[page*8:page*8+8]):
        im=Image.open(root/'assets'/n).convert('RGBA');w,h=im.size
        cols,rows=(6,1) if w/h>4 else ((3,2) if n.startswith(('seed-bolt','spear-thrust')) else ((6,3) if n=='new-attacks-v1.png' else (6,4) if n=='weapon-frames-v2.png' else (4,3)))
        d.text((4,row*180+4),n,fill='white')
        for j,f in enumerate([0,2,4,6,8,10]):
            f=min(f,cols*rows-1);x=f%cols;y=f//cols
            cell=im.crop((round(x*w/cols),round(y*h/rows),round((x+1)*w/cols),round((y+1)*h/rows)))
            cell.thumbnail((165,150));canvas.paste(cell,(10+j*184,row*180+25),cell)
            d.rectangle((j*184,row*180+22,(j+1)*184-2,(row+1)*180-2),outline='#536246')
    canvas.save(out/f'attack-art-{page}.jpg')
print(json.dumps(names))

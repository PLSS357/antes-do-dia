from pathlib import Path
import subprocess
from pypdf import PdfReader
from PIL import Image, ImageOps, ImageDraw
root = Path(__file__).resolve().parents[1]
poppler=Path('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1105-1297-0_26.1105.1297.0_x64__3k8sg7r9htsxt/dependencies/native/poppler/Library/bin/pdftoppm.exe')
qa=root/'work/pdf-qa';qa.mkdir(parents=True,exist_ok=True)
thumbs=[]
for pdf in sorted((root/'materials').rglob('*.pdf')):
    reader=PdfReader(pdf)
    expected={'session-1':3,'session-2':5,'post-oneshot':2}[pdf.parent.name]
    assert len(reader.pages)==expected,(pdf,len(reader.pages))
    for page in reader.pages:
        text=page.extract_text()
        assert len(text)>200
        assert '\ufffd' not in text
    prefix=qa/f'{pdf.parent.name}-{pdf.stem}'
    subprocess.run([str(poppler),'-scale-to','700','-png',str(pdf),str(prefix)],check=True,capture_output=True)
    for png in sorted(qa.glob(prefix.name+'-*.png')):
        im=Image.open(png).convert('RGB');im.thumbnail((255,365))
        tile=Image.new('RGB',(280,400),'#ddd');tile.paste(im,((280-im.width)//2,20))
        ImageDraw.Draw(tile).text((8,384),png.stem,fill='#111')
        thumbs.append(tile)
sheet=Image.new('RGB',(280*5,400*((len(thumbs)+4)//5)),'white')
for i,tile in enumerate(thumbs):sheet.paste(tile,((i%5)*280,(i//5)*400))
sheet.save(qa/'contact-sheet.png')
print(f'{len(thumbs)} páginas verificadas e renderizadas; contact-sheet.png gerada.')

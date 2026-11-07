"""Generate offline A4 handouts from materials-export.json, using bundled ReportLab."""
from pathlib import Path
import json
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

root = Path(__file__).resolve().parents[1]
data = json.loads((root / 'work/materials-export.json').read_text(encoding='utf-8'))
pdfmetrics.registerFont(TTFont('Body', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('Book', 'C:/Windows/Fonts/georgia.ttf'))
for group, cards in data.items():
    for styled in (False, True):
        output = root / 'materials' / group / ('estilizado.pdf' if styled else 'legivel.pdf')
        output.parent.mkdir(parents=True, exist_ok=True)
        face = 'Book' if styled else 'Body'
        body = ParagraphStyle('body', fontName=face, fontSize=11, leading=18, textColor='#171b22', spaceAfter=10, splitLongWords=True)
        title = ParagraphStyle('title', fontName=face, fontSize=21, leading=28, textColor='#8f2531' if styled else '#171b22', spaceAfter=22)
        small = ParagraphStyle('small', fontName='Body', fontSize=8, leading=12, textColor='#56634e', spaceAfter=20)
        flow = []
        for i, (heading, text) in enumerate(cards):
            if i: flow.append(PageBreak())
            flow += [Paragraph('ACERVO / CÓPIA DE CAMPO', small), Paragraph(escape(heading), title)]
            for line in text.split('\n'):
                flow.append(Paragraph(escape(line), body) if line else Spacer(1, 8))
        def decorate(c, d):
            w, h = A4
            c.saveState()
            if styled:
                c.setFillColorRGB(.97,.96,.93); c.rect(0,0,w,h,fill=1,stroke=0)
                c.setStrokeColorRGB(.65,.55,.34); c.rect(38,38,w-76,h-76,fill=0,stroke=1)
            c.setFont('Body', 8); c.setFillColorRGB(.35,.35,.32)
            c.drawString(57,27, f'Catastrophe - peça ficcional - {group}')
            c.drawRightString(w-57,27,str(d.page))
            c.restoreState()
        SimpleDocTemplate(str(output),pagesize=A4,leftMargin=58,rightMargin=58,topMargin=65,bottomMargin=60).build(flow,onFirstPage=decorate,onLaterPages=decorate)
        print(output)

"""Legenda palavra por palavra sobre frames/ -> frames_cap/.
Palavras listadas em work/nomes.json (nomes técnicos) ficam AMARELAS; as outras brancas. Contorno preto grosso, ~65% da altura."""
import json, os, glob, re, unicodedata
from PIL import Image, ImageDraw, ImageFont
W = json.load(open('work/words.json'))
norm = lambda s: re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFD', s.lower()))
NOMES = {norm(x) for n in (json.load(open('work/nomes.json')) if os.path.exists('work/nomes.json') else []) for x in n.split()}
font = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Black.otf', 100)
os.makedirs('frames_cap', exist_ok=True)
def word_at(t):
    cur = None
    for i, w in enumerate(W):
        nxt = W[i + 1]['s'] if i + 1 < len(W) else w['e'] + 0.4
        if w['s'] - 0.03 <= t < min(nxt, w['e'] + 0.45): cur = w['w']
    return cur
for f in sorted(glob.glob('frames/f*.jpg')):
    n = int(os.path.basename(f)[1:5]); im = Image.open(f).convert('RGB'); w = word_at(n / 30)
    if w:
        w = w.strip('.,;:!?…"“”()').upper() if norm(w) in NOMES else w.strip(',;:…"“”()')
        if w:
            d = ImageDraw.Draw(im); x, y = im.width / 2, im.height * 0.65
            d.text((x + 5, y + 7), w, font=font, anchor='mm', fill=(0, 0, 0), stroke_width=14, stroke_fill=(0, 0, 0))
            d.text((x, y), w, font=font, anchor='mm', fill=(255, 210, 63) if norm(w) in NOMES else (255, 255, 255), stroke_width=11, stroke_fill=(18, 18, 24))
    im.save('frames_cap/' + os.path.basename(f), quality=94)
print('captions ok', len(glob.glob('frames_cap/*.jpg')))

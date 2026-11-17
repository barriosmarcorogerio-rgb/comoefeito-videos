"""uso: python3 banner.py out/banner_raw.png "NOME" "subtitulo" saida.jpg  (YouTube 2560x1440; área segura central 1546x423)"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
src, name, sub, out = sys.argv[1:5]
im = Image.open(src).convert('RGB'); W, H = im.size
im = ImageEnhance.Contrast(im).enhance(1.05)
F = '/usr/share/fonts/opentype/inter/Inter-Black.otf'; FB = '/usr/share/fonts/opentype/inter/Inter-Bold.otf'
# vinheta suave
v = Image.new('L', (W, H), 0); vd = ImageDraw.Draw(v)
for i in range(60): vd.rectangle((i * 12, i * 7, W - i * 12, H - i * 7), outline=int(110 * (1 - i / 60)), width=12)
im = Image.composite(Image.new('RGB', (W, H), (20, 25, 40)), im, v.filter(ImageFilter.GaussianBlur(40)))
size = 200
while ImageDraw.Draw(im).textlength(name, font=ImageFont.truetype(F, size)) > 1460: size -= 6
fN, fS = ImageFont.truetype(F, size), ImageFont.truetype(FB, 66)
cy = H / 2 - 40
sh = Image.new('L', (W, H), 0); sd = ImageDraw.Draw(sh)
sd.text((W / 2 + 6, cy + 10), name, font=fN, anchor='mm', fill=200); sd.text((W / 2 + 4, cy + 170), sub, font=fS, anchor='mm', fill=200)
im = Image.composite(Image.new('RGB', (W, H), (10, 20, 40)), im, sh.filter(ImageFilter.GaussianBlur(14)))
d = ImageDraw.Draw(im)
d.text((W / 2, cy), name, font=fN, anchor='mm', fill=(255, 255, 255))
d.rounded_rectangle((W / 2 - 140, cy + 100, W / 2 + 140, cy + 114), 7, fill=(242, 138, 28))
d.text((W / 2, cy + 170), sub, font=fS, anchor='mm', fill=(255, 255, 255))
im.save(out, quality=93); print(out)

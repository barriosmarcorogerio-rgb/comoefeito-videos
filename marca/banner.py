"""uso: python3 banner.py out/banner_raw.png "NOME" "subtitulo" saida.jpg  (YouTube 2560x1440; área segura central 1546x423)"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
src, name, sub, out = sys.argv[1:5]
im = Image.open(src).convert('RGB'); W, H = im.size
F = '/usr/share/fonts/opentype/inter/Inter-Black.otf'; FB = '/usr/share/fonts/opentype/inter/Inter-Bold.otf'
band = Image.new('RGBA', (W, H), (0, 0, 0, 0)); bd = ImageDraw.Draw(band)
bd.rounded_rectangle((W/2-800, H/2-215, W/2+800, H/2+215), 40, fill=(14, 28, 48, 150)); band = band.filter(ImageFilter.GaussianBlur(3))
im = Image.alpha_composite(im.convert('RGBA'), band).convert('RGB'); d = ImageDraw.Draw(im)
size = 190
while d.textlength(name, font=ImageFont.truetype(F, size)) > 1450: size -= 6
d.text((W/2, H/2-55), name, font=ImageFont.truetype(F, size), anchor='mm', fill=(255, 255, 255), stroke_width=6, stroke_fill=(14, 28, 48))
d.rectangle((W/2-120, H/2+48, W/2+120, H/2+58), fill=(242, 138, 28))
d.text((W/2, H/2+125), sub, font=ImageFont.truetype(FB, 64), anchor='mm', fill=(255, 214, 140))
im.save(out, quality=92); print(out)

#!/usr/bin/env python3
"""Generate MindForge Android/web/Play icons from the Knowledge Cube master."""

from __future__ import annotations

import base64
import io
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / 'branding/source/mindforge-knowledge-cube-master.png'
GEN = ROOT / 'branding/generated'
ANDROID_RES = ROOT / 'android/app/src/main/res'
PUBLIC = ROOT / 'public'

BG = (15, 17, 23, 255)  # #0F1117
PLAY_BG = (8, 10, 18, 255)
SAFE_SCALE = 0.62
LEGACY_SCALE = 0.86

LEGACY = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}
ADAPTIVE_FG = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432,
}
SPLASH = {
    'drawable/splash.png': (480, 320),
    'drawable-port-mdpi/splash.png': (320, 480),
    'drawable-port-hdpi/splash.png': (480, 800),
    'drawable-port-xhdpi/splash.png': (720, 1280),
    'drawable-port-xxhdpi/splash.png': (960, 1600),
    'drawable-port-xxxhdpi/splash.png': (1280, 1920),
    'drawable-land-mdpi/splash.png': (480, 320),
    'drawable-land-hdpi/splash.png': (800, 480),
    'drawable-land-xhdpi/splash.png': (1280, 720),
    'drawable-land-xxhdpi/splash.png': (1600, 960),
    'drawable-land-xxxhdpi/splash.png': (1920, 1280),
}


def trim_cube(im: Image.Image, threshold: int = 18, pad_ratio: float = 0.06) -> Image.Image:
    px = im.load()
    w, h = im.size
    mask = Image.new('L', (w, h), 0)
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            r, g, b, _a = px[x, y]
            if max(r, g, b) > threshold:
                mp[x, y] = 255
    mask = mask.filter(ImageFilter.MaxFilter(9))
    bbox = mask.getbbox()
    if not bbox:
        return im
    x0, y0, x1, y1 = bbox
    side = max(x1 - x0, y1 - y0)
    pad = int(side * pad_ratio)
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2
    half = side / 2 + pad
    box = (
        max(0, int(cx - half)),
        max(0, int(cy - half)),
        min(w, int(cx + half)),
        min(h, int(cy + half)),
    )
    cropped = im.crop(box)
    side2 = max(cropped.size)
    canvas = Image.new('RGBA', (side2, side2), (0, 0, 0, 0))
    canvas.paste(
        cropped,
        ((side2 - cropped.size[0]) // 2, (side2 - cropped.size[1]) // 2),
        cropped,
    )
    return canvas


def black_to_alpha(im: Image.Image, cutoff: int = 22) -> Image.Image:
    im = im.convert('RGBA')
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            m = max(r, g, b)
            if m <= cutoff:
                px[x, y] = (r, g, b, 0)
            elif m < cutoff + 40:
                px[x, y] = (r, g, b, int(a * (m - cutoff) / 40))
    return im


def fit_on_canvas(src: Image.Image, size: int, scale: float, bg=None) -> Image.Image:
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0) if bg is None else bg)
    target = max(1, int(size * scale))
    icon = src.copy()
    icon.thumbnail((target, target), Image.Resampling.LANCZOS)
    tmp = Image.new('RGBA', (target, target), (0, 0, 0, 0))
    tmp.paste(icon, ((target - icon.size[0]) // 2, (target - icon.size[1]) // 2), icon)
    canvas.paste(tmp, ((size - target) // 2, (size - target) // 2), tmp)
    return canvas


def save_rgb(im: Image.Image, path: Path, bg=(0, 0, 0)) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if im.mode == 'RGBA':
        base = Image.new('RGB', im.size, bg)
        base.paste(im, mask=im.split()[-1])
        base.save(path, 'PNG', optimize=True)
    else:
        im.convert('RGB').save(path, 'PNG', optimize=True)


def make_splash(cube_alpha: Image.Image, w: int, h: int) -> Image.Image:
    canvas = Image.new('RGBA', (w, h), BG)
    overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    glow_r = int(min(w, h) * 0.35)
    cx, cy = w // 2, int(h * 0.48)
    for i, alpha in enumerate((40, 24, 12)):
        r = glow_r + i * int(glow_r * 0.25)
        d.ellipse((cx - r, cy - int(r * 0.55), cx + r, cy + int(r * 0.55)), fill=(40, 120, 200, alpha))
    canvas = Image.alpha_composite(canvas, overlay)
    icon_target = int(min(w, h) * 0.42)
    icon = cube_alpha.copy()
    icon.thumbnail((icon_target, icon_target), Image.Resampling.LANCZOS)
    canvas.paste(icon, ((w - icon.size[0]) // 2, (h - icon.size[1]) // 2 - int(h * 0.02)), icon)
    return canvas.convert('RGB')


def main() -> int:
    if not MASTER.exists():
        print(f'Missing master logo: {MASTER}', file=sys.stderr)
        return 1

    GEN.mkdir(parents=True, exist_ok=True)
    master = Image.open(MASTER).convert('RGBA')
    cube = trim_cube(master).resize((1024, 1024), Image.Resampling.LANCZOS)
    cube_alpha = black_to_alpha(cube)
    cube_alpha.save(GEN / 'mindforge-icon-foreground-source.png')

    (ANDROID_RES / 'values/ic_launcher_background.xml').write_text(
        '''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0F1117</color>
</resources>
'''
    )

    for folder, size in ADAPTIVE_FG.items():
        out_dir = ANDROID_RES / folder
        out_dir.mkdir(parents=True, exist_ok=True)
        fit_on_canvas(cube_alpha, size, SAFE_SCALE).save(out_dir / 'ic_launcher_foreground.png', 'PNG', optimize=True)

        leg_size = LEGACY[folder]
        legacy = fit_on_canvas(cube_alpha, leg_size, LEGACY_SCALE, bg=BG)
        save_rgb(legacy, out_dir / 'ic_launcher.png', bg=BG[:3])

        mask = Image.new('L', (leg_size, leg_size), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, leg_size - 1, leg_size - 1), fill=255)
        circ = Image.new('RGBA', (leg_size, leg_size), BG)
        content = fit_on_canvas(cube_alpha, leg_size, LEGACY_SCALE)
        circ.paste(content, (0, 0), content)
        masked = Image.new('RGBA', (leg_size, leg_size), BG)
        masked.paste(circ, (0, 0), mask)
        save_rgb(masked, out_dir / 'ic_launcher_round.png', bg=BG[:3])

    for rel, (w, h) in SPLASH.items():
        path = ANDROID_RES / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        make_splash(cube_alpha, w, h).save(path, 'PNG', optimize=True)

    save_rgb(fit_on_canvas(cube_alpha, 192, 0.88, bg=BG), PUBLIC / 'icon-192.png', bg=BG[:3])
    save_rgb(fit_on_canvas(cube_alpha, 512, 0.88, bg=BG), PUBLIC / 'icon-512.png', bg=BG[:3])
    play512 = fit_on_canvas(cube_alpha, 512, 0.90, bg=PLAY_BG)
    save_rgb(play512, GEN / 'mindforge-play-icon-512.png', bg=PLAY_BG[:3])
    save_rgb(play512, PUBLIC / 'play-icon-512.png', bg=PLAY_BG[:3])
    save_rgb(fit_on_canvas(cube_alpha, 1024, 0.90, bg=BG), GEN / 'mindforge-icon-1024.png', bg=BG[:3])
    fit_on_canvas(cube_alpha, 1024, SAFE_SCALE).save(GEN / 'mindforge-icon-foreground-1024.png')
    Image.new('RGB', (1024, 1024), BG[:3]).save(GEN / 'mindforge-icon-background-1024.png')
    save_rgb(fit_on_canvas(cube_alpha, 32, 0.92, bg=BG), PUBLIC / 'favicon-32.png', bg=BG[:3])
    save_rgb(fit_on_canvas(cube_alpha, 128, 0.92, bg=BG), PUBLIC / 'logo-mark.png', bg=BG[:3])

    fav = fit_on_canvas(cube_alpha, 128, 0.90, bg=BG)
    rgb128 = Image.new('RGB', (128, 128), BG[:3])
    rgb128.paste(fav, mask=fav.split()[-1])
    buf = io.BytesIO()
    rgb128.save(buf, 'PNG', optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode('ascii')
    (PUBLIC / 'favicon.svg').write_text(
        f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="MindForge">
  <image href="data:image/png;base64,{b64}" width="128" height="128" />
</svg>
'''
    )

    feat = Image.new('RGBA', (1024, 500), BG)
    grad = Image.new('RGBA', (1024, 500), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(500):
        t = y / 499
        gd.line([(0, y), (1023, y)], fill=(int(15 + 30 * t), int(17 + 10 * (1 - t)), int(23 + 55 * t), 255))
    feat = Image.alpha_composite(feat, grad)
    glow = Image.new('RGBA', (1024, 500), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse((40, 60, 460, 460), fill=(50, 140, 220, 35))
    gdraw.ellipse((700, -40, 1100, 280), fill=(120, 60, 180, 28))
    feat = Image.alpha_composite(feat, glow)
    icon = cube_alpha.copy()
    icon.thumbnail((360, 360), Image.Resampling.LANCZOS)
    feat.paste(icon, (70, (500 - icon.size[1]) // 2), icon)
    draw = ImageDraw.Draw(feat)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 72)
        sub = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 28)
    except OSError:
        font = ImageFont.load_default()
        sub = font
    draw.text((470, 175), 'MindForge', font=font, fill=(255, 255, 255, 255))
    draw.text((470, 265), 'Forge knowledge. One puzzle at a time.', font=sub, fill=(170, 190, 220, 255))
    feat_rgb = Image.new('RGB', (1024, 500), BG[:3])
    feat_rgb.paste(feat, mask=feat.split()[-1])
    feat_rgb.save(GEN / 'mindforge-feature-1024x500.png', 'PNG', optimize=True)
    feat_rgb.save(PUBLIC / 'feature-graphic-1024x500.png', 'PNG', optimize=True)
    make_splash(cube_alpha, 1080, 1920).save(GEN / 'mindforge-splash-portrait-1080x1920.png')
    make_splash(cube_alpha, 1920, 1080).save(GEN / 'mindforge-splash-landscape-1920x1080.png')
    print('MindForge Knowledge Cube icons generated.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

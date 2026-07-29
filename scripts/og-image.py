#!/usr/bin/env python3
"""
Regenerates the Founders Helm social share card (app/opengraph-image.png).

The card is a static PNG on purpose: it costs nothing at runtime and renders
identically on every crawler. It is drawn from the same assets the landing page
uses -- public/fonts/*.woff2 and the #f97316 / #0A0A0A / #F5F5F0 palette -- so
the share preview and the page a visitor lands on are the same design.

Run from the repo root:

    python3 scripts/og-image.py

Requires: pillow, fonttools, brotli  (pip install pillow fonttools brotli)
"""

from __future__ import annotations

import io
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / "public" / "fonts"
OUT = ROOT / "app" / "opengraph-image.png"
OUT_TWITTER = ROOT / "app" / "twitter-image.png"

W, H = 1200, 630

INK = (245, 245, 240)        # #F5F5F0
MUTED = (168, 168, 168)      # #A8A8A8
ORANGE = (249, 115, 22)      # #f97316
BG = (10, 10, 10)            # #0A0A0A

PAD_X = 84


def load(name: str, size: int) -> ImageFont.FreeTypeFont:
    """woff2 -> in-memory TTF -> PIL font. Pillow cannot read woff2 directly."""
    font = TTFont(FONT_DIR / name, fontNumber=0)
    buf = io.BytesIO()
    font.flavor = None
    font.save(buf)
    buf.seek(0)
    return ImageFont.truetype(buf, size)


def track(draw: ImageDraw.ImageDraw, xy, text, font, fill, spacing):
    """Letter-spaced text. Pillow has no tracking, so step glyph by glyph."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + spacing
    return x


def main() -> None:
    img = Image.new("RGB", (W, H), BG)

    # Accent glow, top-right -- the hero's radial gradient, drawn as a blurred
    # disc so the falloff matches rather than banding.
    glow = Image.new("RGB", (W, H), BG)
    gd = ImageDraw.Draw(glow)
    cx, cy, r = 1105, -40, 430
    steps = 60
    for i in range(steps, 0, -1):
        t = i / steps
        rad = r * t
        a = (1 - t) ** 2.1 * 0.62
        col = tuple(int(BG[c] + (ORANGE[c] - BG[c]) * a) for c in range(3))
        gd.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=col)
    glow = glow.filter(ImageFilter.GaussianBlur(58))
    img = Image.blend(img, glow, 1.0)

    draw = ImageDraw.Draw(img)

    # Orange hairline across the top, fading at both edges.
    for x in range(W):
        f = math.sin(math.pi * x / W) ** 0.85
        col = tuple(int(BG[c] + (ORANGE[c] - BG[c]) * f) for c in range(3))
        draw.line([(x, 0), (x, 3)], fill=col)

    mono = load("ibm-plex-mono-600.woff2", 20)
    mono_sm = load("ibm-plex-mono-400.woff2", 19)
    serif = load("instrument-serif-400.woff2", 108)
    serif_it = load("instrument-serif-400-italic.woff2", 108)
    body = load("bricolage-grotesque-variable.woff2", 30)

    # Wordmark
    draw.rectangle([PAD_X, 74, PAD_X + 12, 86], fill=ORANGE)
    track(draw, (PAD_X + 30, 68), "FOUNDERS HELM", mono, INK, 4.6)

    # Headline -- the landing hero's h1, with the same accent word.
    y = 182
    draw.text((PAD_X, y), "Your entire business.", font=serif, fill=INK)
    y += 116
    x = PAD_X
    draw.text((x, y), "One ", font=serif, fill=INK)
    x += draw.textlength("One ", font=serif)
    draw.text((x, y), "dashboard.", font=serif_it, fill=ORANGE)

    # Subline -- the half of the metadata description the headline does not
    # already say, so the card never repeats itself.
    draw.text((PAD_X, 464), "10 integrated tools for founders.", font=body, fill=MUTED)

    # Footer rule + proof row
    draw.line([(PAD_X, 536), (W - PAD_X, 536)], fill=(38, 38, 38), width=1)
    x = track(draw, (PAD_X, 566), "TEN PRODUCTS", mono_sm, ORANGE, 3.4)
    x = track(draw, (x + 14, 566), "/", mono_sm, (95, 95, 95), 3.4)
    x = track(draw, (x + 14, 566), "ONE LOGIN", mono_sm, MUTED, 3.4)
    x = track(draw, (x + 14, 566), "/", mono_sm, (95, 95, 95), 3.4)
    track(draw, (x + 14, 566), "ONE FLAT PRICE", mono_sm, MUTED, 3.4)

    w = draw.textlength("foundershelm.com", font=mono_sm)
    draw.text((W - PAD_X - w, 566), "foundershelm.com", font=mono_sm, fill=MUTED)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    img.save(OUT_TWITTER, "PNG", optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
    print(f"wrote {OUT_TWITTER} ({OUT_TWITTER.stat().st_size} bytes)")


if __name__ == "__main__":
    main()

"""Crop official 2D starter Axies and paint a plant-class egg."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "axie"
SHEET = OUT / "starter-sheet.png"

NAMES = [
    "puffy",
    "pomodoro",
    "nest",
    "blossom",
    "reptile",
    "bird",
    "buba",
    "bug",
    "dusk",
]


def trim(im: Image.Image, pad: int = 8) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(im.width, r + pad)
    b = min(im.height, b + pad)
    return im.crop((l, t, r, b))


def square_pad(im: Image.Image, extra: int = 6) -> Image.Image:
    w, h = im.size
    side = max(w, h) + extra * 2
    out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    out.paste(im, ((side - w) // 2, (side - h) // 2), im)
    return out


def split_sheet(path: Path) -> list[Image.Image]:
    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size
    # Treat near-black as empty so the sheet background does not glue cells.
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16 or (r + g + b) < 18:
                px[x, y] = (0, 0, 0, 0)

    visited = [[False] * w for _ in range(h)]
    boxes: list[tuple[int, int, int, int]] = []
    for y in range(h):
        for x in range(w):
            if visited[y][x] or px[x, y][3] < 20:
                continue
            stack = [(x, y)]
            visited[y][x] = True
            minx = maxx = x
            miny = maxy = y
            count = 0
            while stack:
                cx, cy = stack.pop()
                count += 1
                if cx < minx:
                    minx = cx
                if cx > maxx:
                    maxx = cx
                if cy < miny:
                    miny = cy
                if cy > maxy:
                    maxy = cy
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx] and px[nx, ny][3] >= 20:
                        visited[ny][nx] = True
                        stack.append((nx, ny))
            if count > 800:
                boxes.append((minx, miny, maxx + 1, maxy + 1))

    boxes.sort(key=lambda b: (b[1] // 80, b[0]))
    crops = []
    for box in boxes:
        crops.append(trim(im.crop(box)))
    return crops


def paint_egg(size: int = 512) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = cy = size // 2
    rx, ry = int(size * 0.30), int(size * 0.36)
    ink = (42, 36, 28, 255)

    def oval(scale: float, dy: float, fill, outline=None, width=0):
        box = [
            cx - rx * scale,
            cy - ry * scale + dy,
            cx + rx * scale,
            cy + ry * scale + dy,
        ]
        d.ellipse(box, fill=fill, outline=outline, width=width)

    oval(1.0, 18, ink)
    oval(0.92, 18, (244, 236, 186, 255))
    oval(0.78, 8, (214, 220, 130, 255))
    spots = [
        (0.16, -0.08, 0.13, (126, 164, 64, 255)),
        (-0.2, 0.1, 0.1, (148, 180, 78, 255)),
        (0.06, 0.22, 0.08, (110, 148, 56, 255)),
        (-0.04, -0.24, 0.07, (168, 188, 88, 255)),
        (0.26, 0.12, 0.06, (96, 132, 52, 255)),
    ]
    for ox, oy, s, col in spots:
        box = [
            cx + ox * size - s * size,
            cy + oy * size - s * size * 1.15 + 12,
            cx + ox * size + s * size,
            cy + oy * size + s * size * 1.15 + 12,
        ]
        d.ellipse(box, fill=col, outline=ink, width=5)
    d.ellipse(
        [cx - rx * 0.5, cy - ry * 0.42, cx - rx * 0.08, cy - ry * 0.02],
        fill=(255, 252, 232, 170),
    )
    leaf = [cx + 8, cy - ry - 8, cx + 78, cy - ry + 64]
    d.ellipse(leaf, fill=(86, 148, 58, 255), outline=ink, width=7)
    d.line([cx + 28, cy - ry + 28, cx + 58, cy - ry + 8], fill=ink, width=4)
    return im.filter(ImageFilter.SMOOTH)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    crops = split_sheet(SHEET)
    print(f"found {len(crops)} sprites")
    for i, crop in enumerate(crops):
        name = NAMES[i] if i < len(NAMES) else f"starter-{i}"
        dest = OUT / f"{name}.png"
        square_pad(crop).save(dest)
        print(name, crop.size, dest)

    egg_path = OUT / "egg.png"
    if not egg_path.exists():
        paint_egg().save(egg_path)
        print("egg", egg_path)
    else:
        print("egg kept", egg_path)


if __name__ == "__main__":
    main()

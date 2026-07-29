#!/usr/bin/env python3
"""
Normalize the monster sprite packs (Pink / Owlet / Dude) into tight,
feet-aligned square frames that match the Knight/Mage/Rogue convention.

The game draws every frame in the same on-screen box, so the ON-SCREEN size
of a pose == how tall its cropped content is inside the square canvas.

Run:  python3 scripts/normalize_monsters.py
Output: assets/game assets/char/<Monster>/norm/<Group>/<frame>.png

------------------------------------------------------------------------
TUNING KNOBS (edit these):
  CANVAS        square output size in px (leave as-is unless clipping)
  TARGET_H      target CONTENT height for standing poses. Bigger = char
                appears larger in-game.
  BOTTOM_MARGIN gap between feet and canvas bottom. Bigger = char floats
                higher off the ground. Smaller = sits lower.
  ALPHA_THR     transparency cutoff when finding the character outline.

  NORMALIZE_EACH_POSE
      False (default) -> idle/walk/run share ONE scale (true proportions;
                         idle looks taller than walk because it IS taller).
      True            -> each pose (idle, walk, run) is scaled to the SAME
                         content height, so standing and walking look equal
                         size. This is what fixes "idle looks bigger".
------------------------------------------------------------------------
"""
from PIL import Image
import os

# ---- KNOBS ----------------------------------------------------------
CANVAS = 256
TARGET_H = 200
BOTTOM_MARGIN = 12
ALPHA_THR = 16
NORMALIZE_EACH_POSE = True   # <- set True to make idle == walk size
# ---------------------------------------------------------------------

ROOT = os.path.join(os.path.dirname(__file__), "..", "assets", "game assets", "char")
ROOT = os.path.abspath(ROOT)

# character -> {output_group: (source_folder, [filenames])}
CHARS = {
    "Pink_Monster": {
        "Idle":   ("Idle",    [f"Idle{i}.png"    for i in range(1, 5)]),
        "Walk":   ("Walk",    [f"Walk{i}.png"    for i in range(1, 7)]),
        "Run":    ("Run",     [f"Run{i}.png"     for i in range(1, 7)]),
        "Jump":   ("Jump",    [f"Jump{i}.png"    for i in range(1, 9)]),
        "Attack": ("Attack4", [f"Attack4_{i}.png" for i in range(1, 5)]),
    },
    "2 Owlet_Monster": {
        "Idle":   ("Idle",    [f"Idle{i}.png"    for i in range(1, 5)]),
        "Walk":   ("Walk",    [f"Walk{i}.png"    for i in range(1, 7)]),
        "Run":    ("Run",     [f"Run{i}.png"     for i in range(1, 7)]),
        "Jump":   ("Jump",    [f"Jump{i}.png"    for i in range(1, 9)]),
        "Attack": ("Attack1", [f"Attack1_{i}.png" for i in range(1, 5)]),
    },
    "3 Dude_Monster": {
        "Idle":   ("Idle",    [f"Idle{i}.png"    for i in range(1, 5)]),
        "Walk":   ("Walk",    [f"Walk{i}.png"    for i in range(1, 7)]),
        "Run":    ("Run",     [f"Run{i}.png"     for i in range(1, 7)]),
        "Jump":   ("Jump",    [f"Jump{i}.png"    for i in range(1, 9)]),
        "Attack": ("Attack1", [f"Attack{i}.png"  for i in range(1, 5)]),
    },
}

# Poses treated as "standing" for the shared-scale calc / per-pose leveling.
STANDING = ("Idle", "Walk", "Run")


def content_bbox(im):
    a = im.getchannel("A").point(lambda v: 255 if v > ALPHA_THR else 0)
    return a.getbbox()


def group_max_content_h(char, group):
    """Tallest content height across all frames in one pose group."""
    folder, files = CHARS[char][group]
    h = 1
    for fn in files:
        p = os.path.join(ROOT, char, folder, fn)
        if not os.path.exists(p):
            continue
        bb = content_bbox(Image.open(p).convert("RGBA"))
        if bb:
            h = max(h, bb[3] - bb[1])
    return h


def render(char):
    groups = CHARS[char]

    # global scale (shared across standing poses) from the tallest standing pose
    global_max_h = max(group_max_content_h(char, g) for g in STANDING if g in groups)
    global_scale = TARGET_H / global_max_h

    for group, (folder, files) in groups.items():
        # pick the scale for this group
        if NORMALIZE_EACH_POSE and group in STANDING:
            # scale THIS pose so its own tallest frame hits TARGET_H
            scale = TARGET_H / group_max_content_h(char, group)
        else:
            # jump/attack (and everything, when not leveling) use the shared scale
            scale = global_scale

        outdir = os.path.join(ROOT, char, "norm", group)
        os.makedirs(outdir, exist_ok=True)

        for fn in files:
            p = os.path.join(ROOT, char, folder, fn)
            if not os.path.exists(p):
                print("  MISSING", p)
                continue
            im = Image.open(p).convert("RGBA")
            bb = content_bbox(im)
            if not bb:
                Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0)).save(
                    os.path.join(outdir, fn))
                continue
            l, t, r, b = bb
            crop = im.crop((l, t, r, b))
            nw = max(1, round(crop.width * scale))
            nh = max(1, round(crop.height * scale))
            crop = crop.resize((nw, nh), Image.LANCZOS)
            canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
            x = (CANVAS - nw) // 2
            y = CANVAS - BOTTOM_MARGIN - nh
            if y < 0:
                y = 0  # clamp tall jump frames
            canvas.paste(crop, (x, y), crop)
            canvas.save(os.path.join(outdir, fn))

    mode = "per-pose leveled" if NORMALIZE_EACH_POSE else "shared scale"
    print(f"{char}: {mode}, global_scale={global_scale:.3f}")


if __name__ == "__main__":
    for c in CHARS:
        render(c)
    print("DONE")

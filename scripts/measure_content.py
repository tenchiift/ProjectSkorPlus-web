#!/usr/bin/env python3
"""
Measure each character's content box (opaque pixels) as fractions of the frame,
across idle+walk frames. Paste the output into the CONTENT map in
src/game/characterAssets.js so the character picker can size every character
consistently.

Run:  python3 scripts/measure_content.py
"""
from PIL import Image
import glob, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..",
                                    "assets", "game assets", "char"))

# registry key -> (folder relative to ROOT, [pose subfolders to sample])
SETS = {
    "knight":       ("Knight",              ["Idle", "Walk"]),
    "mage":         ("Mage",                ["Idle", "Walk"]),
    "rogue":        ("Rogue",               ["Idle", "Walk"]),
    "pinkMonster":  ("Pink_Monster/norm",   ["Idle", "Walk"]),
    "owletMonster": ("2 Owlet_Monster/norm",["Idle", "Walk"]),
    "dudeMonster":  ("3 Dude_Monster/norm", ["Idle", "Walk"]),
}
THR = 16

def box(base, groups):
    W = H = 0
    L = T = 10**9; R = B = -1
    for g in groups:
        for f in sorted(glob.glob(os.path.join(ROOT, base, g, "*.png"))):
            im = Image.open(f).convert("RGBA"); W, H = im.size
            bb = im.getchannel("A").point(lambda v: 255 if v > THR else 0).getbbox()
            if bb:
                l, t, r, b = bb
                L = min(L, l); T = min(T, t); R = max(R, r); B = max(B, b)
    return W, H, L, T, R, B

print("const CONTENT = {")
for key, (base, groups) in SETS.items():
    W, H, L, T, R, B = box(base, groups)
    print(f"  {key+':':13s} {{ left: {L/W:.3f}, top: {T/H:.3f}, "
          f"w: {(R-L)/W:.3f}, h: {(B-T)/H:.3f} }},")
print("};")

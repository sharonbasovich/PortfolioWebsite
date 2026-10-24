"""Author the existing DM Sans title as SVG paths; no font parser ships at runtime.

Uses FontTools and Brotli only during authoring. The optional dependency folder is
outside the repository; the existing font and its OFL notice stay authoritative.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--deps", type=Path, default=ROOT.parent / "font-authoring-deps")
args = parser.parse_args()
if args.deps.is_dir():
    sys.path.insert(0, str(args.deps))

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

source = ROOT / "dist/startup/experience/assets/dm-sans-latin.woff2"
font = TTFont(source)
if "fvar" in font:
    font = instantiateVariableFont(font, {"wght": 500}, inplace=False)
glyph_set = font.getGlyphSet()
cmap = font.getBestCmap()


def kern(left: str, right: str) -> float:
    """Read the pair adjustments used by the kern feature (no ligatures here)."""
    result = 0
    if "GPOS" in font:
        table = font["GPOS"].table
        indices = set()
        if table.FeatureList:
            for record in table.FeatureList.FeatureRecord:
                if record.FeatureTag == "kern":
                    indices.update(record.Feature.LookupListIndex)
        for index in sorted(indices):
            lookup = table.LookupList.Lookup[index]
            for sub in lookup.SubTable:
                kind = lookup.LookupType
                if kind == 9:
                    kind, sub = sub.ExtensionLookupType, sub.ExtSubTable
                if kind != 2 or left not in sub.Coverage.glyphs:
                    continue
                value = None
                if sub.Format == 1:
                    pairs = sub.PairSet[sub.Coverage.glyphs.index(left)]
                    match = next((p for p in pairs.PairValueRecord if p.SecondGlyph == right), None)
                    value = match.Value1 if match else None
                elif sub.Format == 2:
                    a = sub.ClassDef1.classDefs.get(left, 0)
                    b = sub.ClassDef2.classDefs.get(right, 0)
                    value = sub.Class1Record[a].Class2Record[b].Value1
                result += getattr(value, "XAdvance", 0) or 0
    elif "kern" in font:
        for sub in font["kern"].kernTables:
            result += sub.kernTable.get((left, right), 0)
    return result


def number(value: float) -> str:
    return format(value, ".3f").rstrip("0").rstrip(".") or "0"


words = []
for text in ("My", "projects"):
    cursor, previous = 0, None
    glyphs = []
    for char in text:
        name = cmap[ord(char)]
        if previous:
            cursor += kern(previous, name)
        pen = SVGPathPen(glyph_set, ntos=number)
        glyph_set[name].draw(pen)
        bounds = BoundsPen(glyph_set)
        glyph_set[name].draw(bounds)
        advance = glyph_set[name].width
        glyphs.append({"char": char, "x": cursor, "advance": advance,
                       "bounds": list(bounds.bounds), "d": pen.getCommands()})
        cursor += advance
        previous = name
    words.append({"text": text, "advance": cursor, "glyphs": glyphs})

data = {"family": "DM Sans", "weight": 500,
        "unitsPerEm": font["head"].unitsPerEm,
        "fontSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "words": words}
output = ROOT / "dist/startup/experience/study/glyph-data.js"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(
    "// Generated from the site's existing DM Sans font at weight 500.\n"
    "// Source font is SIL OFL-1.1; see ../licenses/DM-Sans-OFL.txt.\n"
    "// Rebuild with python tools/generate-project-glyphs.py.\n"
    "export const glyphTypography = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n",
    encoding="utf-8",
)
print(json.dumps({"output": str(output), "glyphs": sum(len(w["glyphs"]) for w in words),
                  "bytes": output.stat().st_size, "font_sha256": data["fontSha256"]}))

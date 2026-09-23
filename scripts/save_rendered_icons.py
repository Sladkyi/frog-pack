#!/usr/bin/env python3
"""
Reads the base64 PNG data from step 1573 output and saves each file into assets/icons/<id>.png.
"""
import os
import json
import base64

OUTPUT_TXT = r"C:\Users\User\.gemini\antigravity-ide\brain\3e85bdcf-760b-4c60-bd10-2cd6ffc03c58\.system_generated\steps\1573\output.txt"
ICONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "icons"))
os.makedirs(ICONS_DIR, exist_ok=True)

with open(OUTPUT_TXT, "r", encoding="utf-8") as f:
    raw = f.read().strip()

start = raw.find('{')
end = raw.rfind('}') + 1
data = json.loads(raw[start:end])

print(f"Loaded {len(data)} rendered icons.")
for wid, data_url in data.items():
    if data_url.startswith("data:image/png;base64,"):
        b64 = data_url.split(",", 1)[1]
        raw_bytes = base64.b64decode(b64)
        out_path = os.path.join(ICONS_DIR, f"{wid}.png")
        with open(out_path, "wb") as out_f:
            out_f.write(raw_bytes)
        print(f"  Saved {wid}.png ({len(raw_bytes)} bytes)")

print("All rendered icons successfully written to disk!")

"""Stage the static demo and a single-WebGL-context, fixed-camera V5/V6 comparison."""
import argparse
from pathlib import Path
import shutil
import subprocess

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("destination", type=Path)
parser.add_argument("--baseline", default="323f849d627e750234f415cbcef380aa8cf8ddcf")
args = parser.parse_args()
out = args.destination.resolve()
if root == out or root in out.parents:
    raise SystemExit("Specify a staging directory outside the source checkout")
out.mkdir(parents=True, exist_ok=True)
for name in ("assets", "src", "vendor", "compare"):
    shutil.copytree(root / name, out / name, dirs_exist_ok=True)
shutil.copy2(root / "index.html", out)
legacy = out / "v5"
legacy.mkdir(exist_ok=True)
def baseline(path):
    return subprocess.check_output(["git", "show", args.baseline + ":" + path], cwd=root).decode()
for name in ("assets", "vendor"):
    shutil.copytree(out / name, legacy / name, dirs_exist_ok=True,
                    ignore=shutil.ignore_patterns("night-aisle.glb", "night-fresh.glb"))
(legacy / "src").mkdir(exist_ok=True)
files = subprocess.check_output(["git","ls-tree","--name-only",args.baseline+":src"],cwd=root,text=True)
for name in files.splitlines():
    (legacy / "src" / name).write_text(baseline("src/"+name))
# Copy only the V6 camera coordinates; keep the published V5 production scene and lighting.
core = (root / "src/core.js").read_text()
old = (legacy / "src/core.js").read_text()
start, end = "  var views = {", "  S.isStoreView"
old = old[:old.index(start)] + core[core.index(start):core.index(end)] + old[old.index(end):]
(legacy / "src/core.js").write_text(old)
inject = """<script>addEventListener('load',function(){
var view=new URLSearchParams(location.search).get('view');
var btn=Array.from(document.querySelectorAll('[data-view]')).find(b=>b.dataset.view===view);
if(btn)btn.click();
document.getElementById('photo').click();
});</script>"""
(legacy / "index.html").write_text(baseline("index.html").replace("</body>",inject+"</body>"))

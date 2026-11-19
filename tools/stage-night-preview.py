"""Stage the static demo and a single-WebGL-context, fixed-camera V5/V6 comparison."""
import argparse
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("destination", type=Path)
args = parser.parse_args()
out = args.destination.resolve()
if root == out or root in out.parents:
    raise SystemExit("Specify a staging directory outside the source checkout")
out.mkdir(parents=True, exist_ok=True)
for name in ("assets", "src", "vendor", "compare"):
    shutil.copytree(root / name, out / name, dirs_exist_ok=True)
shutil.copy2(root / "index.html", out)

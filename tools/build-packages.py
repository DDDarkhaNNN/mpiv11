"""Create the downloadable Windows MPI packages for Modules 2, 3, 4, and 5."""

from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parent.parent
for module in (2, 3, 4, 5):
    source = ROOT / "downloads" / "code" / f"module-{module}"
    target = ROOT / "downloads" / f"module-{module}-variant-11.zip"
    with ZipFile(target, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(source.iterdir()):
            if path.is_file():
                archive.write(path, arcname=path.name)
    print(f"{target.name}: {target.stat().st_size} bytes")

Run a WebP asset migration against the given root directory.

ARGUMENTS: $ARGUMENTS

The backing script is `scripts/migrate-assets-to-webp.ps1`. It accepts:
- First positional argument: the root directory to scan (required)
- `-Execute` switch: apply changes (default is probe-only)
- `-Force` switch: re-convert even if a current .webp sibling already exists
- `-CwebpPath <path>`: explicit path to cwebp binary if not on PATH
- `-ArchiveRoot <path>`: override archive destination (default: `D:\Unity Apps\assets\immanence`)

**Step 1 — Probe run**

Parse `$ARGUMENTS` to extract the root directory and any extra flags. Then run:

```
powershell -ExecutionPolicy Bypass -File scripts/migrate-assets-to-webp.ps1 -RootDir "<rootDir>" [extra flags]
```

from the repo root `D:\Unity Apps\immanence-os`. Do NOT add `-Execute`; probe is the default.

Show the full probe output to the user.

**Step 2 — Ask before executing**

After showing the probe output, ask the user:
> The probe above shows what will change. Run with `-Execute` to apply? (yes / no)

If the user says yes, re-run the script with `-Execute` appended and show the full output.
If the user says no, stop.

**Notes**
- cwebp must be installed and on PATH (or pass `-CwebpPath`).
- Original .png/.jpg/.jpeg files are moved to the archive root; .webp siblings stay in place.
- Only static asset references in source files are rewritten; dynamic template patterns are reported but not changed.
- Run `scripts/verify-cwebp.ps1` first if you need to confirm the cwebp binary works.

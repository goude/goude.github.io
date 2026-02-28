#!/usr/bin/env bash
set -euo pipefail

# -------- Config --------
OUT_FILE="repomix-output.txt"

MAX_BYTES=4096          # threshold to consider file "large"
TRUNCATE_BYTES=1024     # actual truncation size (1 KB)

IGNORES=(
  "coverage/"
  "node_modules/"
  "public/fonts/"
  "src/pages/egghunt.astro"
)

WHITELIST=(
  "package.json"
)
# ------------------------

# Determine repo root
if git_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  repo_root="$git_root"
else
  script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
  repo_root="$(cd "$script_dir/.." && pwd)"
fi

out="$repo_root/$OUT_FILE"

tmp="$(mktemp -d)"
stage="$tmp/repomix-stage"
mkdir -p "$stage"

cleanup() { rm -rf "$tmp"; }
trap cleanup EXIT INT TERM

# Build rsync exclude args
rsync_excludes=("--exclude" ".git/")
for p in "${IGNORES[@]}"; do
  rsync_excludes+=("--exclude" "$p")
done

# Stage repo (no size filtering)
rsync -a --delete \
  "${rsync_excludes[@]}" \
  "$repo_root/" "$stage/"

# Force-include whitelist
for w in "${WHITELIST[@]}"; do
  src="$repo_root/$w"
  if [[ -e "$src" ]]; then
    mkdir -p "$stage/$(dirname "$w")"
    cp -p "$src" "$stage/$w"
  fi
done

# Cross-platform helpers
get_size() {
  stat -f%z "$1" 2>/dev/null || stat -c%s "$1"
}

sha256() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    sha256sum "$1" | awk '{print $1}'
  fi
}

is_text() {
  mime=$(file --mime-type -b "$1")
  [[ "$mime" == text/* || "$mime" == */json || "$mime" == */xml ]]
}

# Truncate large text files
while IFS= read -r -d '' file; do
  size=$(get_size "$file")

  if (( size > MAX_BYTES )); then
    if is_text "$file"; then
      hash=$(sha256 "$file")
      tmpfile="${file}.tmp"

      head -c "$TRUNCATE_BYTES" "$file" > "$tmpfile"

      cat >> "$tmpfile" <<EOF

<<< FILE TRUNCATED >>>
Original size: ${size} bytes
SHA256 (full file): ${hash}
Truncated to: ${TRUNCATE_BYTES} bytes
EOF

      mv "$tmpfile" "$file"
    fi
  fi
done < <(find "$stage" -type f -print0)

# Ensure repomix exists
command -v repomix >/dev/null 2>&1 || {
  echo "repomix not found in PATH" >&2
  exit 127
}

# Run repomix from staging dir
(
  cd "$stage"
  repomix -o "$out"
)

# Append filtering note
cat >> "$out" <<EOF

----
FILTERING NOTES (for LLM consumers)

This snapshot was produced from a filtered staging copy of the repository.

Excluded by path:
$(for p in "${IGNORES[@]}"; do printf '  - %s\n' "$p"; done)

Large file handling:
  - Files larger than ${MAX_BYTES} bytes were evaluated.
  - Text files exceeding that threshold were truncated to ${TRUNCATE_BYTES} bytes.
  - Each truncated file contains:
      * A truncation marker
      * Original byte size
      * SHA256 hash of the full file

Binary files were not modified.

Implication:
  - Large source files are partially represented.
  - If deeper inspection is required, request the specific file.

EOF

echo
echo "✔ Packed repository written to: $out"
echo "  (threshold: ${MAX_BYTES} bytes; truncated text to ${TRUNCATE_BYTES} bytes)"
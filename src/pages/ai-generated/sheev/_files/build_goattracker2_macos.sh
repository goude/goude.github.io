#!/usr/bin/env bash
# build_goattracker_macos.sh
#
# Builds GoatTracker2 from source on macOS (Intel or Apple Silicon).
# Works with both:
#   - joelricci Silver Fork: https://github.com/joelricci/goattracker2
#   - Upstream SVN trunk (2.77+): svn checkout https://svn.code.sf.net/p/goattracker2/code/
#
# Tested: macOS 15 (Tahoe), Apple Silicon, sdl12-compat 1.2.74, Xcode CLT 17
# Output: linux/goattrk2  (and companion tools gt2reloc, ins2snd2, sngspli2, mod2sng)
#
# Prerequisites (handled automatically if missing):
#   brew install sdl12-compat
#   xcode-select --install
#
# Usage: run from the repo root (where src/ lives, trunk/.../src/.. if from svn)
#   chmod +x build_goattracker_macos.sh
#   ./build_goattracker_macos.sh
#
# Getting the code (there seem to be no recent git mirrors):
#   svn checkout https://svn.code.sf.net/p/goattracker2/code/ goattracker2
#

set -euo pipefail

die() {
  echo "✗ $*" >&2
  exit 1
}
info() { echo "→ $*"; }

# ── sanity: must be run from repo root ───────────────────────────────────────
[[ -d src ]] || die "Run this from the repo root (no src/ dir found here)"

# ── check required tools ─────────────────────────────────────────────────────
for tool in brew cc make; do
  command -v "$tool" &>/dev/null || die "Missing: $tool"
done

# ── ensure sdl12-compat is installed and sdl-config resolves to SDL 1.x ──────
SDL_VER=$(sdl-config --version 2>/dev/null || echo "")
if [[ "$SDL_VER" != 1.* ]]; then
  info "SDL 1.x not found (got: '${SDL_VER:-nothing}'). Installing sdl12-compat..."
  brew install sdl12-compat
  BREW_PREFIX=$(brew --prefix)
  export PATH="$BREW_PREFIX/bin:$PATH"
  SDL_VER=$(sdl-config --version 2>/dev/null || echo "")
  [[ "$SDL_VER" == 1.* ]] || die "sdl-config still not SDL 1.x after install — check your PATH"
fi
info "SDL version: $SDL_VER"

SDL_CFLAGS=$(sdl-config --cflags)
SDL_LIBS=$(sdl-config --libs)

# Homebrew puts SDL headers at <prefix>/include/SDL/
# sdl-config --cflags gives -I<prefix>/include/SDL  (resolves <SDL_foo.h>)
# Upstream 2.77 source uses #include <SDL/SDL_foo.h>, needing one level up.
# Adding both covers both fork variants.
BREW_INC=$(brew --prefix)/include
EXTRA_INC="-I${BREW_INC}"

# ── ensure output dir exists (makefile writes to ../linux/ relative to src/) ─
mkdir -p linux

# ── step 1: build bme host tools (datafile + dat2inc) ────────────────────────
# Build-time utilities: datafile packs assets → goattrk2.dat,
# dat2inc converts that → goatdata.c for inclusion in the main build.
# Compiled directly rather than via bme/makefile to avoid GNU strip vs macOS strip issues.
info "Building bme tools..."
pushd src/bme >/dev/null
cc $SDL_CFLAGS $EXTRA_INC -o datafile datafile.c bme_end.c
cc $SDL_CFLAGS $EXTRA_INC $SDL_LIBS -o dat2inc dat2inc.c
popd >/dev/null
info "bme tools OK"

# ── step 2: build GoatTracker2 and companion utilities ───────────────────────
# Pass EXTRA_INC through CFLAGS so all .c/.cpp files see <SDL/SDL_foo.h> correctly.
# makefile.common appends to CFLAGS so prepending here is safe.
# The ld alignment warnings are benign — old C common-block layout vs Apple linker.
info "Building GoatTracker2..."
pushd src >/dev/null
make -f makefile CFLAGS="$EXTRA_INC -Ibme -Iasm -O3"
popd >/dev/null

# ── verify and report ─────────────────────────────────────────────────────────
BINARY="linux/goattrk2"
[[ -f "$BINARY" ]] || die "Expected binary not found at $BINARY — check output above"

info "Build complete."
echo ""
echo "  Binary : $PWD/$BINARY"
echo "  Run    : ./$BINARY"
echo ""
echo "  MacBook keyboard tip: hold FN for F1–F12, or enable function keys in"
echo "  System Settings → Keyboard → 'Use F keys as standard function keys'."

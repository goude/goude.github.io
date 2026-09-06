---
layout: ../../layouts/ContentLayout.astro
title: "Placeholder note"
description: "Placeholder — replace with a real note."
date: "2026-09-05"
thumb: "sketch"
---

Placeholder — replace with real content. This markdown note exists to prove
the dynamic Notes listing and the markdown pipeline work — and, now, to show
that a note can carry pictures too. Three kinds of image drop into the flow,
each framed to suit what it is.

First, a _scanned pencil sketch_ — the sort of thing torn from a notebook,
photographed or scanned, and taped in. It keeps a slight tilt so it reads as
a physical scrap, not a screenshot.

<figure class="paper-figure">
<div class="paper-figure__media paper-media--sketch is-tilted" style="--tilt: -1.6deg;">
<span class="paper-tape" aria-hidden="true"></span>
<button type="button" class="paper-figure__frame" data-lb>
<svg viewBox="0 0 400 300" width="100%" height="100%" fill="none" aria-hidden="true" style="color:var(--paper-ink-muted);display:block"><g stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M206 270 C198 214 216 172 202 126 S178 70 192 42"/><path d="M202 206 C170 194 150 206 138 230 C168 236 194 230 202 206 Z"/><path d="M205 172 C238 160 260 170 272 194 C242 202 216 196 205 172 Z"/><path d="M198 134 C167 122 148 134 138 158 C166 166 191 158 198 134 Z"/><path d="M193 96 C223 84 245 96 255 120 C227 128 203 120 193 96 Z"/><path d="M192 42 C184 32 188 21 198 19 C208 21 210 34 202 44" stroke-width="2"/></g></svg>
<span class="sr-only">Enlarge the sketch</span>
</button>
</div>
<figcaption class="paper-figcaption--hand">fig. 1 — a margin sketch, pencil, scanned and taped in</figcaption>
</figure>

Second, an _inline SVG_ — a vector figure, authored by hand or generated.
Because it is vector it stays crisp at any size and prints clean; a hairline
grid signals that it is precise rather than sketched.

<figure class="paper-figure">
<div class="paper-figure__media paper-media--svg">
<button type="button" class="paper-figure__frame" data-lb>
<svg viewBox="0 0 480 270" width="100%" height="100%" fill="none" aria-hidden="true" style="display:block"><g stroke="var(--paper-ink)" stroke-width="2"><rect x="40" y="52" width="96" height="60" rx="6"/><rect x="192" y="52" width="96" height="60" rx="6"/><rect x="344" y="52" width="96" height="60" rx="6"/><rect x="192" y="168" width="96" height="60" rx="6"/><path d="M136 82 H182"/><path d="M288 82 H334"/><path d="M240 112 V164"/></g><g fill="var(--paper-ink)"><path d="M182 76 L192 82 L182 88 Z"/><path d="M334 76 L344 82 L334 88 Z"/><path d="M234 158 L240 168 L246 158 Z"/></g><circle cx="88" cy="82" r="12" fill="var(--paper-ink)"/><path d="M240 70 l13 24 h-26 z" fill="var(--paper-seal)"/><rect x="380" y="70" width="24" height="24" rx="3" fill="var(--paper-gold)"/><circle cx="240" cy="198" r="11" fill="none" stroke="var(--paper-ink)" stroke-width="2.4"/></svg>
<span class="sr-only">Enlarge the diagram</span>
</button>
</div>
<figcaption class="paper-figcaption--type">Inline SVG &middot; fig. 2</figcaption>
</figure>

Third, a _photograph_ — matted like a print, with a caption line across the
bottom border. Use it for objects, places, and anything a sketch or diagram
would flatten.

<figure class="paper-figure">
<div class="paper-plate is-tilted" style="--tilt: 1.2deg;">
<span class="paper-tape" aria-hidden="true"></span>
<button type="button" class="paper-plate__inner" data-lb>
<svg viewBox="0 0 300 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="display:block"><defs><linearGradient id="ph-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3ead6"/><stop offset=".6" stop-color="#e9d1a4"/><stop offset="1" stop-color="#d9b681"/></linearGradient><linearGradient id="ph-hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b3894f"/><stop offset="1" stop-color="#7c5f3c"/></linearGradient></defs><rect width="300" height="200" fill="url(#ph-sky)"/><circle cx="212" cy="64" r="30" fill="#f1ddb0"/><path d="M0 150 Q70 120 150 140 T300 126 V200 H0 Z" fill="#c39a63"/><path d="M0 170 Q90 148 170 164 T300 154 V200 H0 Z" fill="url(#ph-hill)"/></svg>
<span class="sr-only">Enlarge the photograph</span>
</button>
<figcaption class="paper-plate__caption">PHOTOGRAPH &middot; PLACEHOLDER PLATE</figcaption>
</div>
</figure>

A note can also hold a small _table_, typed straight into the column. It
keeps the typed face, and its rules are drawn in pencil — so it sits on the
page rather than floating above it.

<table class="paper-table paper-table--type">
<thead>
<tr><th>Item</th><th>Kind</th><th>Note</th></tr>
</thead>
<tbody>
<tr><td>Margin sketch</td><td>scan</td><td>taped, tilted</td></tr>
<tr><td>Schematic</td><td>inline svg</td><td>vector, crisp</td></tr>
<tr><td>The workbench</td><td>photo</td><td>matted print</td></tr>
<tr><td>This grid</td><td>table</td><td>typed &amp; ruled</td></tr>
</tbody>
</table>

Table 1 — media a note can hold.

Captions carry the voice: a handwritten aside for sketches, a typed line for
prints and diagrams.

See also the [antilibrary](/notes/antilibrary) note, or
[placeholder essay I](/essays/placeholder-one).

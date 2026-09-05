---
layout: ../../layouts/ContentLayout.astro
title: "Placeholder note"
description: "Placeholder — replace with a real note."
date: "2026-09-05"
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
<span class="paper-media__label">[ scanned pencil sketch ]<br>drop a ~300&nbsp;dpi scan here<br>&middot; jpg / png &middot; grayscale ok &middot;</span>
<span class="sr-only">&mdash; click to enlarge</span>
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
<span class="paper-media__label">[ inline svg diagram ]<br>vector figure &middot; scales without blur<br>&middot; hand-drawn or generated &middot;</span>
<span class="sr-only">&mdash; click to enlarge</span>
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
<span class="paper-media__label">[ photograph ]<br>drop a jpg / webp here<br>&middot; matted or full-bleed &middot;</span>
<span class="sr-only">&mdash; click to enlarge</span>
</button>
<figcaption class="paper-plate__caption">PHOTOGRAPH &middot; REPLACE WITH A REAL PLATE</figcaption>
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

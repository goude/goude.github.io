/* ============================================================
   Hyaa — Þrjár tungur  |  app.js
   Depends on: data.js (svTokens, lines, wordData)
   ============================================================ */

"use strict";

// ── STATE ─────────────────────────────────────────────────────
let simulation = null;
let graphBuilt = false;
let graphData = null;
let graphZoom = null;
let graphSvg = null;
let graphG = null;
let controlsOpen = false;
let currentLayout = "wordorder"; // default view
let videoEl = null;
let videoTimer = null;

const activeNodeTypes = { sv: true, is: true, sv_correct: true, en: true };
const activeEdgeTypes = {
  wordorder: true,
  phonetic: true,
  correct: true,
  translation: true,
};

// ── VIEW IDS ──────────────────────────────────────────────────
const VIEW_IDS = ["poem", "realtranslation", "phonetic", "graph-view", "info"];

// ── DERIVE: unique word → first token index ───────────────────
// Used for phonetic table sort order
function firstOccurrenceMap() {
  const seen = {};
  svTokens.forEach((tok, i) => {
    if (!(tok.word in seen)) seen[tok.word] = i;
  });
  return seen;
}

// ── RENDER HELPER ─────────────────────────────────────────────
function fillColumns(colMap, lineMapper) {
  lines.forEach((line, idx) => {
    const mk = (text, cls) => {
      const d = document.createElement("div");
      d.className = "poem-line " + cls;
      d.textContent = text || "\u00a0";
      d.dataset.lineIdx = idx;
      return d;
    };
    const [isT, svT, enT] = lineMapper(line);
    colMap.is?.appendChild(mk(isT, "line-is"));
    colMap.sv?.appendChild(mk(svT, "line-sv"));
    colMap.en?.appendChild(mk(enT, "line-en"));
    colMap.isM?.appendChild(mk(isT, "line-is"));
    colMap.svM?.appendChild(mk(svT, "line-sv"));
    colMap.enM?.appendChild(mk(enT, "line-en"));
  });
}

// ── RENDER: POEM VIEW (IS | SV phonetic | EN of SV) ──────────
function renderPoem() {
  fillColumns(
    {
      is: document.getElementById("poem-is"),
      sv: document.getElementById("poem-sv"),
      en: document.getElementById("poem-en"),
      isM: document.getElementById("poem-is-m"),
      svM: document.getElementById("poem-sv-m"),
      enM: document.getElementById("poem-en-m"),
    },
    (line) => [line.is, line.sv, line.en]
  );
}

// ── RENDER: REAL TRANSLATION VIEW (IS | real SV | real EN) ───
function renderRealTranslation() {
  fillColumns(
    {
      is: document.getElementById("real-is"),
      sv: document.getElementById("real-sv"),
      en: document.getElementById("real-en"),
      isM: document.getElementById("real-is-m"),
      svM: document.getElementById("real-sv-m"),
      enM: document.getElementById("real-en-m"),
    },
    (line) => [line.is, line.realSv, line.realEn]
  );
}

// ── RENDER: PHONETIC TABLE (sorted by first occurrence) ───────
function renderPhoneticTable() {
  const tbody = document.getElementById("phonetic-tbody");
  if (!tbody) return;

  const order = firstOccurrenceMap();
  const sortedWords = Object.keys(wordData).sort(
    (a, b) => (order[a] ?? 9999) - (order[b] ?? 9999)
  );

  sortedWords.forEach((sv) => {
    const d = wordData[sv];
    const correctItems = (d.isCorrectSv || [])
      .map((x) => {
        const badge = x.canon
          ? `<span class="canonical-badge">★</span>`
          : `<span class="correct-badge">✓</span>`;
        return `${badge} ${x.sv}`;
      })
      .join("<br>");

    // Timestamp from first token occurrence
    const firstTok = svTokens.find((t) => t.word === sv);
    const tsStr = firstTok
      ? `<span class="ts-badge">${firstTok.t.toFixed(1)}s</span>`
      : "";

    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td class="col-ts">${tsStr}</td>` +
      `<td class="col-is">${d.is || "—"}</td>` +
      `<td class="col-sv-heard"><span class="phonetic-badge">≈</span>${sv}</td>` +
      `<td class="col-sv-correct">${correctItems}</td>` +
      `<td class="col-en">${d.en}</td>` +
      `<td class="col-note">${d.note}</td>`;

    // Click to seek video
    if (firstTok) {
      tr.style.cursor = "pointer";
      tr.title = `Jump to ${firstTok.t.toFixed(1)}s in video`;
      tr.addEventListener("click", () => seekVideo(firstTok.t));
    }

    tbody.appendChild(tr);
  });
}

// ── MOBILE LANGUAGE TABS ──────────────────────────────────────
function initLangTabs() {
  document.querySelectorAll("[data-tab-group]").forEach((group) => {
    const groupName = group.dataset.tabGroup;
    group.querySelectorAll(".lang-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        group
          .querySelectorAll(".lang-tab")
          .forEach((t) => t.classList.remove("active"));
        group
          .querySelectorAll(".lang-col-mobile")
          .forEach((c) => c.classList.remove("active"));
        tab.classList.add("active");
        group
          .querySelector(".lang-col-mobile." + tab.dataset.lang)
          ?.classList.add("active");
      });
    });
  });
}

// ── GRAPH: BUILD DATA ─────────────────────────────────────────
// SV nodes are canonical. Other nodes/edges derive from them.
// Node types: sv | is | sv_correct | en
// Edge types: wordorder | phonetic | correct | translation
function buildGraphData() {
  const nodes = [];
  const links = [];
  const nodeMap = {}; // id → node

  function ensureNode(id, label, type, extra = {}) {
    if (!nodeMap[id]) {
      const n = { id, label, type, ...extra };
      nodes.push(n);
      nodeMap[id] = n;
    }
    return nodeMap[id];
  }

  // ── 1. SV nodes — one per unique word ────────────────────────
  // These are the canonical vocabulary nodes. Note: repeated words
  // (hyaa×6, etc.) map to ONE sv node but MANY token positions.
  Object.keys(wordData).forEach((word) => {
    const d = wordData[word];
    ensureNode("sv_" + word, word, "sv", { wordKey: word, data: d });
  });

  // ── 2. Word-order edges — connect consecutive SV tokens ───────
  // Directed: token[i].word → token[i+1].word
  // Multiple transitions between the same pair get their edgeCount incremented
  const orderEdgeMap = {}; // "sv_X→sv_Y" → link object
  for (let i = 0; i < svTokens.length - 1; i++) {
    const src = "sv_" + svTokens[i].word;
    const tgt = "sv_" + svTokens[i + 1].word;
    if (src === tgt) continue; // skip self-loops (same word twice in a row would just vibrate)
    const key = src + "→" + tgt;
    if (!orderEdgeMap[key]) {
      const link = {
        source: src,
        target: tgt,
        type: "wordorder",
        count: 1,
        tokens: [i],
      };
      orderEdgeMap[key] = link;
      links.push(link);
    } else {
      orderEdgeMap[key].count++;
      orderEdgeMap[key].tokens.push(i);
    }
  }

  // ── 3. IS nodes + phonetic edges (IS → SV heard) ─────────────
  Object.keys(wordData).forEach((word) => {
    const d = wordData[word];
    const isId = "is_" + word;
    const svId = "sv_" + word;
    ensureNode(isId, d.is, "is", { wordKey: word, data: d });
    links.push({ source: isId, target: svId, type: "phonetic" });
  });

  // ── 4. SV_CORRECT nodes + correct edges (IS → SV correct) ────
  Object.keys(wordData).forEach((word) => {
    const d = wordData[word];
    const isId = "is_" + word;
    (d.isCorrectSv || []).forEach((ct, ci) => {
      const ctId = "svc_" + word + "_" + ci;
      ensureNode(ctId, ct.sv, "sv_correct", {
        wordKey: word,
        data: d,
        canonical: ct.canon,
      });
      links.push({
        source: isId,
        target: ctId,
        type: "correct",
        canonical: ct.canon,
      });
    });
  });

  // ── 5. EN nodes + translation edges (SV → EN) ────────────────
  Object.keys(wordData).forEach((word) => {
    const d = wordData[word];
    const svId = "sv_" + word;
    (d.meanings || []).forEach((m, i) => {
      const enId = "en_" + word + "_" + i;
      ensureNode(enId, m, "en", { wordKey: word });
      links.push({ source: svId, target: enId, type: "translation" });
    });
  });

  return { nodes, links, nodeMap };
}

// ── GRAPH: COLOURS & SIZES (for light background) ────────────
const NODE_COLOR = {
  sv: "#7b3f00", // dark sienna — SV heard (canonical, prominent)
  is: "#1a5276", // deep navy — Icelandic
  sv_correct: "#7d5a00", // dark gold — correct SV
  en: "#1a5c2a", // deep forest — English
};
const NODE_R = { sv: 10, is: 6, sv_correct: 5, en: 4 };
const EDGE_COLOR = {
  wordorder: "#7b3f00", // sienna — bold, main spine
  phonetic: "#5b2c8b", // deep violet
  correct: "#7d5a00", // dark gold
  translation: "#1a5c2a", // deep forest
};
const TYPE_LABEL = {
  sv: "Swedish (heard)",
  is: "Icelandic",
  sv_correct: "Swedish (correct)",
  en: "English meaning",
};

// ── GRAPH: INIT ───────────────────────────────────────────────
function initGraph() {
  const canvas = document.getElementById("graph-canvas");
  const W = canvas.offsetWidth || 900;
  const H = canvas.offsetHeight || 600;

  graphData = buildGraphData();

  graphSvg = d3.select("#graph-svg").attr("width", W).attr("height", H);
  graphSvg.selectAll("*").remove();

  // Arrowhead marker definitions
  const defs = graphSvg.append("defs");
  ["wordorder", "phonetic", "correct", "translation"].forEach((type) => {
    defs
      .append("marker")
      .attr("id", "arrow-" + type)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", EDGE_COLOR[type])
      .attr("fill-opacity", type === "wordorder" ? 0.8 : 0.5);
  });

  graphG = graphSvg.append("g").attr("class", "graph-root");

  graphZoom = d3
    .zoom()
    .scaleExtent([0.03, 8])
    .on("zoom", (e) => graphG.attr("transform", e.transform));
  graphSvg.call(graphZoom);
  if (!window.matchMedia("(hover: none)").matches)
    graphSvg.style("cursor", "grab");

  // Render with default layout
  applyLayout(currentLayout);
}

// ── GRAPH: LAYOUT ─────────────────────────────────────────────
function applyLayout(layoutName) {
  currentLayout = layoutName;
  if (!graphData) return;

  // Stop any existing simulation
  if (simulation) {
    simulation.stop();
    simulation = null;
  }

  const { nodes, links } = graphData;

  // Filter nodes/links by active types
  const visNodes = nodes.filter((n) => activeNodeTypes[n.type]);
  const visNodeIds = new Set(visNodes.map((n) => n.id));
  const visLinks = links.filter((l) => {
    if (!activeEdgeTypes[l.type]) return false;
    const sid = typeof l.source === "object" ? l.source.id : l.source;
    const tid = typeof l.target === "object" ? l.target.id : l.target;
    return visNodeIds.has(sid) && visNodeIds.has(tid);
  });

  const canvas = document.getElementById("graph-canvas");
  const W = canvas.offsetWidth || 900;
  const H = canvas.offsetHeight || 600;

  graphSvg.attr("width", W).attr("height", H);
  graphG.selectAll("*").remove();

  // Deep-copy nodes for this layout (D3 mutates positions)
  const lNodes = visNodes.map((n) => ({ ...n }));
  const lNodeMap = {};
  lNodes.forEach((n) => {
    lNodeMap[n.id] = n;
  });

  // Re-ref links to copied nodes
  const lLinks = visLinks
    .map((l) => ({
      ...l,
      source: lNodeMap[typeof l.source === "object" ? l.source.id : l.source],
      target: lNodeMap[typeof l.target === "object" ? l.target.id : l.target],
    }))
    .filter((l) => l.source && l.target);

  // ── Initial positions by layout ──────────────────────────────
  if (layoutName === "wordorder") {
    // Linear left-to-right by first occurrence time for SV nodes
    const svNodes = lNodes.filter((n) => n.type === "sv");
    const orderMap = firstOccurrenceMap();
    svNodes.sort(
      (a, b) => (orderMap[a.wordKey] ?? 999) - (orderMap[b.wordKey] ?? 999)
    );
    const cols = Math.ceil(Math.sqrt(svNodes.length * 2));
    svNodes.forEach((n, i) => {
      n.x = (i % cols) * (W / cols) + W / cols / 2;
      n.y = Math.floor(i / cols) * 60 + 80;
    });
    // IS/SV_correct/EN nodes get random positions near their sv parent
    lNodes
      .filter((n) => n.type !== "sv")
      .forEach((n) => {
        const svNode = lNodeMap["sv_" + n.wordKey];
        if (svNode) {
          n.x = (svNode.x || W / 2) + (Math.random() - 0.5) * 120;
          n.y = (svNode.y || H / 2) + (Math.random() - 0.5) * 60;
        } else {
          n.x = Math.random() * W;
          n.y = Math.random() * H;
        }
      });
  } else if (layoutName === "sequential") {
    // Spiral / timeline: SV nodes placed in a flowing horizontal strip
    const svNodes = lNodes.filter((n) => n.type === "sv");
    const orderMap = firstOccurrenceMap();
    svNodes.sort(
      (a, b) => (orderMap[a.wordKey] ?? 999) - (orderMap[b.wordKey] ?? 999)
    );
    const margin = 60,
      spacing = Math.min(
        120,
        (W - margin * 2) / Math.max(1, svNodes.length - 1)
      );
    svNodes.forEach((n, i) => {
      n.x = margin + i * spacing;
      n.y = H / 2 + Math.sin(i * 0.4) * 60;
    });
    lNodes
      .filter((n) => n.type !== "sv")
      .forEach((n) => {
        const svNode = lNodeMap["sv_" + n.wordKey];
        if (svNode) {
          n.x = svNode.x + (Math.random() - 0.5) * 80;
          n.y =
            svNode.y +
            (n.type === "is" ? -80 : 80) +
            (Math.random() - 0.5) * 30;
        } else {
          n.x = Math.random() * W;
          n.y = Math.random() * H;
        }
      });
  } else {
    // force / radial: random start
    lNodes.forEach((n) => {
      n.x = Math.random() * W;
      n.y = Math.random() * H;
    });
  }

  // ── Draw edges ────────────────────────────────────────────────
  const link = graphG
    .append("g")
    .attr("class", "edges")
    .selectAll("line")
    .data(lLinks)
    .join("line")
    .attr("class", (d) => "edge edge-" + d.type)
    .attr("stroke", (d) => EDGE_COLOR[d.type] || "#888")
    .attr("stroke-width", (d) => {
      if (d.type === "wordorder") return Math.min(3, 1 + (d.count || 1) * 0.4);
      return d.canonical ? 2 : 1.2;
    })
    .attr(
      "stroke-opacity",
      (d) =>
        ({ wordorder: 0.7, phonetic: 0.45, correct: 0.6, translation: 0.35 })[
          d.type
        ] || 0.4
    )
    .attr("stroke-dasharray", (d) => ({ phonetic: "5 3" })[d.type] || "none")
    .attr("marker-end", (d) => `url(#arrow-${d.type})`);

  // ── Draw nodes ────────────────────────────────────────────────
  const node = graphG
    .append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(lNodes)
    .join("g")
    .attr("class", (d) => "node node-" + d.type)
    .style("cursor", "pointer")
    .call(
      d3
        .drag()
        .filter(
          (ev) => !ev.ctrlKey && (ev.type !== "mousedown" || ev.button === 0)
        )
        .on("start", (ev, d) => {
          d._dragX = ev.x;
          d._dragY = ev.y;
          if (simulation && !ev.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (ev, d) => {
          d.fx = ev.x;
          d.fy = ev.y;
        })
        .on("end", (ev, d) => {
          if (simulation && !ev.active) simulation.alphaTarget(0);
          const dist = Math.hypot(ev.x - d._dragX, ev.y - d._dragY);
          if (dist < 6) showDetail(d);
          else {
            d.fx = null;
            d.fy = null;
          }
        })
    )
    .on("mouseover", showTooltip)
    .on("mousemove", moveTooltip)
    .on("mouseout", hideTooltip);

  node
    .append("circle")
    .attr("r", (d) => NODE_R[d.type] || 5)
    .attr("fill", (d) => NODE_COLOR[d.type] || "#555")
    .attr("fill-opacity", (d) => (d.type === "sv" ? 0.92 : 0.75))
    .attr("stroke", (d) => NODE_COLOR[d.type] || "#555")
    .attr("stroke-width", (d) => (d.canonical ? 2.5 : 1))
    .attr("stroke-opacity", 0.6);

  node
    .append("text")
    .attr("class", "node-label")
    .attr("dy", (d) => NODE_R[d.type] + 13)
    .style("font-size", (d) => (d.type === "sv" ? "12px" : "9px"))
    .style("fill", (d) => NODE_COLOR[d.type] || "#555")
    .style("fill-opacity", (d) => (d.type === "sv" ? 1 : 0.75))
    .style("font-weight", (d) => (d.type === "sv" ? "600" : "400"))
    .text((d) => {
      const l = d.label || "";
      return l.length > 24 ? l.slice(0, 22) + "…" : l;
    });

  // ── Tick function ────────────────────────────────────────────
  function tick() {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);
    node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
  }

  // ── Force simulation (for force/radial layouts) ───────────────
  if (layoutName === "force" || layoutName === "radial") {
    const forces = {
      link: d3
        .forceLink(lLinks)
        .id((d) => d.id)
        .distance(
          (d) =>
            ({ wordorder: 90, phonetic: 70, correct: 65, translation: 80 })[
              d.type
            ] || 75
        )
        .strength(
          (d) =>
            ({ wordorder: 0.5, phonetic: 0.7, correct: 0.6, translation: 0.3 })[
              d.type
            ] || 0.4
        ),
      charge: d3
        .forceManyBody()
        .strength(
          (d) =>
            ({ sv: -200, is: -80, sv_correct: -70, en: -40 })[d.type] || -80
        ),
      center: d3.forceCenter(W / 2, H / 2),
      collision: d3.forceCollide().radius((d) => NODE_R[d.type] + 20),
    };

    if (layoutName === "radial") {
      // Radial: sv nodes on outer ring, others pulled toward center
      const orderMap = firstOccurrenceMap();
      const svKeys = Object.keys(wordData);
      svKeys.sort((a, b) => (orderMap[a] ?? 999) - (orderMap[b] ?? 999));
      const R = Math.min(W, H) * 0.38;
      forces.radial = d3
        .forceRadial(
          (d) => {
            if (d.type === "sv") return R;
            if (d.type === "is") return R * 1.4;
            if (d.type === "sv_correct") return R * 1.2;
            return R * 0.5;
          },
          W / 2,
          H / 2
        )
        .strength(0.4);
    }

    simulation = d3
      .forceSimulation(lNodes)
      .force("link", forces.link)
      .force("charge", forces.charge)
      .force("center", forces.center)
      .force("collision", forces.collision);
    if (forces.radial) simulation.force("radial", forces.radial);
    simulation.on("tick", tick);
  } else {
    // Static layouts: just tick once to set positions
    tick();
  }

  // For static layouts, run a cooling force sim to untangle
  if (layoutName === "wordorder" || layoutName === "sequential") {
    simulation = d3
      .forceSimulation(lNodes)
      .force(
        "link",
        d3
          .forceLink(lLinks)
          .id((d) => d.id)
          .distance((d) => (d.type === "wordorder" ? 100 : 60))
          .strength((d) => (d.type === "wordorder" ? 0.6 : 0.3))
      )
      .force(
        "charge",
        d3.forceManyBody().strength((d) => (d.type === "sv" ? -150 : -60))
      )
      .force(
        "collision",
        d3.forceCollide().radius((d) => NODE_R[d.type] + 12)
      )
      .alphaDecay(0.03)
      .on("tick", tick);
    // Freeze after 150 ticks
    let ticks = 0;
    simulation.on("tick", () => {
      tick();
      if (++ticks > 150) simulation.stop();
    });
  }

  graphSvg.on("click", (e) => {
    if (e.target === graphSvg.node()) closePanel();
  });
  applyNodeFilters();
}

// ── GRAPH: NODE FILTERS ───────────────────────────────────────
function applyNodeFilters() {
  if (!graphG) return;
  const s = (
    document.getElementById("search-input")?.value || ""
  ).toLowerCase();

  graphG.selectAll(".node").each(function (d) {
    const typeOk = activeNodeTypes[d.type];
    const searchOk =
      !s ||
      (d.label || "").toLowerCase().includes(s) ||
      (d.data && d.data.en && d.data.en.toLowerCase().includes(s));
    d._visible = typeOk && (!s || searchOk);
    d3.select(this).attr("display", d._visible ? null : "none");
  });

  graphG.selectAll(".edge").each(function (d) {
    const edgeOk = activeEdgeTypes[d.type];
    const sid = typeof d.source === "object" ? d.source.id : d.source;
    const tid = typeof d.target === "object" ? d.target.id : d.target;
    const srcOk = graphData?.nodeMap[sid]?._visible !== false;
    const tgtOk = graphData?.nodeMap[tid]?._visible !== false;
    d3.select(this).attr("display", edgeOk && srcOk && tgtOk ? null : "none");
  });
}

// ── GRAPH: ZOOM CONTROLS ──────────────────────────────────────
function graphZoomIn() {
  if (!graphSvg || !graphZoom) return;
  graphSvg.transition().duration(300).call(graphZoom.scaleBy, 1.5);
}
function graphZoomOut() {
  if (!graphSvg || !graphZoom) return;
  graphSvg
    .transition()
    .duration(300)
    .call(graphZoom.scaleBy, 1 / 1.5);
}
function graphZoomFit() {
  if (!graphSvg || !graphZoom || !graphG) return;
  const canvas = document.getElementById("graph-canvas");
  const W = canvas.offsetWidth,
    H = canvas.offsetHeight;
  const bounds = graphG.node().getBBox();
  if (!bounds.width || !bounds.height) return;
  const scale = Math.min(
    (0.9 * W) / bounds.width,
    (0.9 * H) / bounds.height,
    3
  );
  const tx = W / 2 - scale * (bounds.x + bounds.width / 2);
  const ty = H / 2 - scale * (bounds.y + bounds.height / 2);
  graphSvg
    .transition()
    .duration(500)
    .call(graphZoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
}
function graphZoomReset() {
  if (!graphSvg || !graphZoom) return;
  graphSvg
    .transition()
    .duration(400)
    .call(graphZoom.transform, d3.zoomIdentity);
}

// ── TOOLTIP ───────────────────────────────────────────────────
function showTooltip(ev, d) {
  const tt = document.getElementById("graph-tooltip");
  if (!tt) return;
  const tsInfo = (() => {
    if (d.type !== "sv") return "";
    const tok = svTokens.find((t) => t.word === d.wordKey);
    return tok
      ? `<br><span style="opacity:0.6;font-size:0.7rem">~${tok.t}s</span>`
      : "";
  })();
  tt.innerHTML =
    `<strong>${d.label}</strong>${tsInfo}<br>` +
    `<span style="opacity:0.6;font-size:0.72rem">${TYPE_LABEL[d.type] || d.type}</span>` +
    (d.data
      ? `<br><span style="opacity:0.55;font-size:0.72rem">${d.data.en}</span>`
      : "");
  tt.style.display = "block";
  moveTooltip(ev);
}
function moveTooltip(ev) {
  const tt = document.getElementById("graph-tooltip");
  if (!tt) return;
  tt.style.left = ev.clientX + 14 + "px";
  tt.style.top = ev.clientY - 10 + "px";
}
function hideTooltip() {
  const tt = document.getElementById("graph-tooltip");
  if (tt) tt.style.display = "none";
}

// ── DETAIL PANEL ──────────────────────────────────────────────
function showDetail(d) {
  const panel = document.getElementById("detail-panel");
  const content = document.getElementById("dp-content");
  if (!panel || !content) return;

  let html = `<div class="dp-word ${d.type}">${d.label}</div>`;
  html += `<div class="dp-type">${TYPE_LABEL[d.type] || d.type}</div>`;

  const w = d.wordKey;
  const dat = d.data || (w ? wordData[w] : null);

  if (d.type === "sv" && dat) {
    // Timestamp
    const toks = svTokens.filter((t) => t.word === w);
    if (toks.length) {
      html += `<div class="dp-section">Timestamps in commentary</div>`;
      toks.forEach((t) => {
        html += `<div class="dp-item ts clickable" data-t="${t.t}">
          <span class="ts-dot"></span>${t.t.toFixed(1)}s
          <span class="ts-seek">▶ seek</span>
        </div>`;
      });
    }
    html += `<div class="dp-section">Icelandic original</div>`;
    html += `<div class="dp-item phonetic">${dat.is}</div>`;
    html += `<div class="dp-item note">${dat.note}</div>`;
    html += `<div class="dp-section">Correct Swedish</div>`;
    (dat.isCorrectSv || []).forEach((ct) => {
      html +=
        `<div class="dp-item correct-sv${ct.canon ? " canon" : ""}">` +
        (ct.canon ? `★ ` : "") +
        ct.sv +
        `</div>`;
    });
    html += `<div class="dp-section">English meanings</div>`;
    (dat.meanings || []).forEach((m) => {
      html += `<div class="dp-item">${m}</div>`;
    });
  } else if (d.type === "is" && dat) {
    html += `<div class="dp-section">Heard in Swedish as</div>`;
    html += `<div class="dp-item phonetic">${w}</div>`;
    html += `<div class="dp-item note">${dat.note}</div>`;
    html += `<div class="dp-section">English</div>`;
    html += `<div class="dp-item">${dat.en}</div>`;
  } else if (d.type === "sv_correct" && dat) {
    html += `<div class="dp-section">Correct translation of</div>`;
    html += `<div class="dp-item">${dat.is}</div>`;
    if (d.canonical)
      html += `<div class="dp-item note">★ Primary meaning in this context</div>`;
    html += `<div class="dp-item note">${dat.note}</div>`;
  } else if (d.type === "en") {
    html += `<div class="dp-section">Meaning of</div>`;
    html += `<div class="dp-item">${w || "—"}</div>`;
  }

  content.innerHTML = html;

  // Wire up timestamp seek buttons
  content.querySelectorAll(".ts.clickable").forEach((el) => {
    el.addEventListener("click", () => seekVideo(parseFloat(el.dataset.t)));
  });

  panel.classList.add("open");
}

function closePanel() {
  document.getElementById("detail-panel")?.classList.remove("open");
}

// ── GRAPH CONTROLS TOGGLE ────────────────────────────────────
function toggleControls() {
  controlsOpen = !controlsOpen;
  document
    .getElementById("controls-drawer")
    ?.classList.toggle("open", controlsOpen);
  document
    .getElementById("controls-icon")
    ?.classList.toggle("open", controlsOpen);
}

// ── LAYOUT SWITCHER ───────────────────────────────────────────
function setLayout(name) {
  currentLayout = name;
  document.querySelectorAll(".layout-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.layout === name);
  });
  if (graphBuilt) applyLayout(name);
}

// ── EXPORTS ───────────────────────────────────────────────────
function _download(filename, content, mime) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
}

function exportJSON() {
  if (!graphData) graphData = buildGraphData();
  const out = {
    metadata: {
      title: "Hyaa — Swedish phonetic commentary graph",
      source:
        "Guðmundur Benediktsson · Iceland 2–1 Austria · Euro 2016 · 22 June",
      credit: "Phonetic transcription by zimonitrome",
    },
    nodes: graphData.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      wordKey: n.wordKey,
      canonical: n.canonical || false,
      timestamp:
        n.type === "sv"
          ? (svTokens.find((t) => t.word === n.wordKey)?.t ?? null)
          : null,
    })),
    edges: graphData.links.map((l, i) => ({
      id: "e" + i,
      source: typeof l.source === "object" ? l.source.id : l.source,
      target: typeof l.target === "object" ? l.target.id : l.target,
      type: l.type,
      count: l.count || 1,
    })),
  };
  _download(
    "hyaa-graph.json",
    JSON.stringify(out, null, 2),
    "application/json"
  );
}

function exportGraphML() {
  if (!graphData) graphData = buildGraphData();
  const { nodes, links } = graphData;
  const esc = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/graphml">
  <key id="label"  for="node" attr.name="label"     attr.type="string"/>
  <key id="type"   for="node" attr.name="type"       attr.type="string"/>
  <key id="ts"     for="node" attr.name="timestamp"  attr.type="double"/>
  <key id="etype"  for="edge" attr.name="edge_type"  attr.type="string"/>
  <key id="ecount" for="edge" attr.name="count"      attr.type="int"/>
  <graph id="hyaa" edgedefault="directed">\n`;
  nodes.forEach((n) => {
    const ts =
      n.type === "sv"
        ? (svTokens.find((t) => t.word === n.wordKey)?.t ?? "")
        : "";
    xml += `    <node id="${esc(n.id)}">\n      <data key="label">${esc(n.label)}</data>\n      <data key="type">${n.type}</data>\n      <data key="ts">${ts}</data>\n    </node>\n`;
  });
  links.forEach((l, i) => {
    const s = typeof l.source === "object" ? l.source.id : l.source;
    const t = typeof l.target === "object" ? l.target.id : l.target;
    xml += `    <edge id="e${i}" source="${esc(s)}" target="${esc(t)}">\n      <data key="etype">${l.type}</data>\n      <data key="ecount">${l.count || 1}</data>\n    </edge>\n`;
  });
  xml += `  </graph>\n</graphml>`;
  _download("hyaa-graph.graphml", xml, "application/xml");
}

function exportCSV() {
  if (!graphData) graphData = buildGraphData();
  const { nodes, links } = graphData;
  const q = (s) => '"' + String(s || "").replace(/"/g, '""') + '"';
  let nc = "id,label,type,wordKey,timestamp\n";
  nodes.forEach((n) => {
    const ts =
      n.type === "sv"
        ? (svTokens.find((t) => t.word === n.wordKey)?.t ?? "")
        : "";
    nc += `${q(n.id)},${q(n.label)},${q(n.type)},${q(n.wordKey || "")},${q(ts)}\n`;
  });
  let ec = "source,target,type,count\n";
  links.forEach((l) => {
    const s = typeof l.source === "object" ? l.source.id : l.source;
    const t = typeof l.target === "object" ? l.target.id : l.target;
    ec += `${q(s)},${q(t)},${q(l.type)},${q(l.count || 1)}\n`;
  });
  _download("hyaa-nodes.csv", nc, "text/csv");
  setTimeout(() => _download("hyaa-edges.csv", ec, "text/csv"), 300);
}

// ── VIEW SWITCHING ────────────────────────────────────────────
function switchView(idx) {
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));
  document
    .querySelectorAll("#main-nav button")
    .forEach((b) => b.classList.remove("active"));
  const viewEl = document.getElementById(VIEW_IDS[idx]);
  if (viewEl) viewEl.classList.add("active");
  document.querySelectorAll("#main-nav button")[idx]?.classList.add("active");

  if (VIEW_IDS[idx] === "graph-view") {
    if (!graphBuilt) {
      graphBuilt = true;
      setTimeout(() => {
        initGraph();
        setTimeout(graphZoomFit, 800);
      }, 80);
    } else {
      setTimeout(() => {
        const c = document.getElementById("graph-canvas");
        graphSvg?.attr("width", c.offsetWidth).attr("height", c.offsetHeight);
        if (simulation)
          simulation
            .force(
              "center",
              d3.forceCenter(c.offsetWidth / 2, c.offsetHeight / 2)
            )
            .alpha(0.1)
            .restart();
      }, 60);
    }
  }

  if (VIEW_IDS[idx] === "phonetic") {
    const hint = document.getElementById("scroll-hint");
    if (hint && window.innerWidth < 640) hint.style.display = "block";
  }

  closePanel();
}

// ── FILTER BUTTONS ────────────────────────────────────────────
function initFilterButtons() {
  document.querySelectorAll(".filter-btn[data-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("on");
      activeNodeTypes[btn.dataset.type] = btn.classList.contains("on");
      if (graphBuilt) applyLayout(currentLayout);
    });
  });
  document.querySelectorAll(".filter-btn[data-edge]").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("on");
      activeEdgeTypes[btn.dataset.edge] = btn.classList.contains("on");
      if (graphBuilt) applyLayout(currentLayout);
    });
  });
  document.querySelectorAll(".layout-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLayout(btn.dataset.layout));
  });
  document.getElementById("search-input")?.addEventListener("input", () => {
    if (graphBuilt) applyNodeFilters();
  });
  document
    .getElementById("btn-zoom-in")
    ?.addEventListener("click", graphZoomIn);
  document
    .getElementById("btn-zoom-out")
    ?.addEventListener("click", graphZoomOut);
  document
    .getElementById("btn-zoom-fit")
    ?.addEventListener("click", graphZoomFit);
  document
    .getElementById("btn-zoom-reset")
    ?.addEventListener("click", graphZoomReset);
}

// ── VIDEO PLAYER ──────────────────────────────────────────────
function initVideoPlayer() {
  videoEl = document.getElementById("commentary-video");
  if (!videoEl) return;

  // Render interactive word tokens into the poem-video-words div
  const container = document.getElementById("poem-video-words");
  if (container) {
    svTokens.forEach((tok) => {
      const span = document.createElement("span");
      span.className = "video-word";
      span.textContent = tok.word;
      span.dataset.t = tok.t;
      span.dataset.tokenId = tok.id;
      span.title = `${tok.t.toFixed(1)}s — click to seek`;
      span.addEventListener("click", () => seekVideo(tok.t));
      container.appendChild(span);
      // Add a thin space between tokens
      container.appendChild(document.createTextNode(" "));
    });
  }

  // Update word highlighting on timeupdate
  videoEl.addEventListener("timeupdate", () => {
    const t = videoEl.currentTime;
    highlightWordsAtTime(t);
  });

  // If video ends, clear all highlights
  videoEl.addEventListener("ended", () => {
    document
      .querySelectorAll(".video-word.past, .video-word.current")
      .forEach((el) => el.classList.remove("past", "current"));
  });
}

function seekVideo(t) {
  if (!videoEl) return;
  videoEl.currentTime = t;
  videoEl.play().catch(() => {}); // may require user gesture; fail silently
  // Scroll video into view if needed
  videoEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function highlightWordsAtTime(t) {
  document.querySelectorAll(".video-word").forEach((el) => {
    const wt = parseFloat(el.dataset.t);
    el.classList.remove("past", "current", "upcoming");
    if (wt < t - 0.5) el.classList.add("past");
    else if (wt <= t + 0.5) el.classList.add("current");
  });

  // Also highlight lines in poem view
  const currentTok = svTokens.reduce((best, tok) => {
    if (tok.t <= t + 0.2) {
      return !best || tok.t > best.t ? tok : best;
    }
    return best;
  }, null);

  document
    .querySelectorAll(".poem-line")
    .forEach((el) => el.classList.remove("line-active"));
  if (currentTok !== null) {
    document
      .querySelectorAll(`.poem-line[data-line-idx="${currentTok.lineIdx}"]`)
      .forEach((el) => el.classList.add("line-active"));
  }
}

// ── RESIZE ────────────────────────────────────────────────────
function initResizeObserver() {
  const canvas = document.getElementById("graph-canvas");
  if (!canvas) return;
  const ro = new ResizeObserver(() => {
    if (!graphBuilt || !graphSvg) return;
    const W = canvas.offsetWidth,
      H = canvas.offsetHeight;
    graphSvg.attr("width", W).attr("height", H);
    if (simulation) simulation.force("center", d3.forceCenter(W / 2, H / 2));
  });
  ro.observe(canvas);
}

// ── BOOT ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderPoem();
  renderRealTranslation();
  renderPhoneticTable();
  initLangTabs();
  initFilterButtons();
  initResizeObserver();
  initVideoPlayer();

  document.querySelectorAll("#main-nav button").forEach((btn, i) => {
    btn.addEventListener("click", () => switchView(i));
  });
});

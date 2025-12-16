/* Bookmarklet loader (jsDelivr; cache-busted while iterating)
javascript:(()=>{const u='https://cdn.jsdelivr.net/gh/goude/goude.github.io@main/public/tools.js';const id='__dbgtools_loader__';document.getElementById(id)?.remove();const s=document.createElement('script');s.id=id;s.src=u+'?v='+Date.now();s.crossOrigin='anonymous';s.onerror=()=>alert('Failed to load '+u);document.documentElement.appendChild(s);})();
*/

(() => {
  "use strict";

  // ---------- Identity / persistence ----------
  const ROOT_ID = "__dbgtools_root__";
  const STYLE_ID = "__dbgtools_style__";
  const LS_KEY = "__dbgtools_state__";

  const loadState = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveState = (state) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {}
  };

  // ---------- Utils ----------
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const toast = (() => {
    let t;
    return (msg) => {
      if (!t) {
        t = document.createElement("div");
        t.className = "dbgtools-toast";
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(t._timer);
      t._timer = setTimeout(() => t.classList.remove("show"), 900);
    };
  })();

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast("Copied (fallback)");
    }
  };

  const cssPath = (el) => {
    if (!(el instanceof Element)) return "";
    if (el.id) return `#${CSS.escape(el.id)}`;

    const parts = [];
    let cur = el;
    while (cur && cur.nodeType === 1 && cur !== document.documentElement) {
      const tag = cur.tagName.toLowerCase();
      const cls = Array.from(cur.classList || []).filter(Boolean);
      let classPart = "";
      if (cls.length) {
        const pick = cls.slice().sort((a, b) => a.length - b.length)[0];
        classPart = `.${CSS.escape(pick)}`;
      }

      const parent = cur.parentElement;
      if (!parent) break;

      const siblingsSameTag = Array.from(parent.children).filter(
        (c) => c.tagName === cur.tagName,
      );
      let nth = "";
      if (siblingsSameTag.length > 1) {
        const idx = siblingsSameTag.indexOf(cur) + 1;
        nth = `:nth-of-type(${idx})`;
      }

      parts.unshift(`${tag}${classPart}${nth}`);

      // short-ish but stable-ish
      if (parts.length >= 4) break;
      cur = parent;
    }

    return parts.join(" > ");
  };

  // ---------- Modes (persist after UI close) ----------
  const MODE = {
    EDITABLE: "__dbgtools_editable__",
    OUTLINE: "__dbgtools_outline__",
    NO_ANIM: "__dbgtools_no_anim__",
    HIDE_IMGS: "__dbgtools_hide_imgs__",
    SHOW_FOCUS: "__dbgtools_show_focus__",
    HILITE_CLICKS: "__dbgtools_hilite_clicks__",
    UNHIDE_ALL: "__dbgtools_unhide_all__",
    DIM_OVERLAY: "__dbgtools_dim_overlay__",
  };

  const defaultState = {
    minimized: false,

    // high-signal toggles
    editable: false,
    outline: false,
    noanim: false,
    hideimgs: false,
    showfocus: false,
    hiliteclicks: false,
    unhideall: false,
    dim: false,

    // tools
    picker: false,
    measure: false,
  };

  const state = { ...defaultState, ...loadState() };

  const setModeClass = (cls, on) => {
    document.documentElement.classList.toggle(cls, !!on);
  };

  const applyEditable = (on) => {
    // Prefer designMode: applies broadly and keeps working after UI closes.
    // Some sites fight it; we also set body.contentEditable as a nudge.
    try {
      document.designMode = on ? "on" : "off";
    } catch {}
    try {
      if (document.body) document.body.contentEditable = on ? "true" : "false";
    } catch {}
  };

  // ---------- Picker ----------
  let pickerChip = null;
  let pickerEnabled = false;

  const ensurePickerChip = () => {
    if (pickerChip) return pickerChip;
    pickerChip = document.createElement("div");
    pickerChip.className = "__dbgtools_hoverchip__";
    document.body.appendChild(pickerChip);
    return pickerChip;
  };

  const clearPickerUI = () => {
    if (pickerChip) pickerChip.remove();
    pickerChip = null;
  };

  const onMouseMovePicker = (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest(`#${ROOT_ID}`)) return;

    const chip = ensurePickerChip();
    const rect = target.getBoundingClientRect();
    const label =
      `${target.tagName.toLowerCase()}` +
      `${target.id ? `#${target.id}` : ""}` +
      `${target.classList?.length ? "." + Array.from(target.classList).slice(0, 2).join(".") : ""}` +
      `  [${Math.round(rect.width)}×${Math.round(rect.height)}]`;

    chip.textContent = label;
    const x = Math.min(window.innerWidth - 10, e.clientX + 12);
    const y = Math.min(window.innerHeight - 10, e.clientY + 16);
    chip.style.left = `${x}px`;
    chip.style.top = `${y}px`;
  };

  const onClickPicker = async (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest(`#${ROOT_ID}`)) return;

    e.preventDefault();
    e.stopPropagation();

    const selector = cssPath(target);
    await copyText(selector);
    toast(selector);
  };

  const enablePicker = () => {
    if (pickerEnabled) return;
    pickerEnabled = true;
    document.addEventListener("mousemove", onMouseMovePicker, true);
    document.addEventListener("click", onClickPicker, true);
  };

  const disablePicker = () => {
    if (!pickerEnabled) return;
    pickerEnabled = false;
    document.removeEventListener("mousemove", onMouseMovePicker, true);
    document.removeEventListener("click", onClickPicker, true);
    clearPickerUI();
  };

  // ---------- Measure tool (shift+click to place points) ----------
  let measureEnabled = false;
  let measureLayer = null;
  let measureA = null;
  let measureB = null;

  const ensureMeasureLayer = () => {
    if (measureLayer) return measureLayer;
    measureLayer = document.createElement("div");
    measureLayer.className = "__dbgtools_measure_layer__";
    document.body.appendChild(measureLayer);
    return measureLayer;
  };

  const clearMeasure = () => {
    measureA = null;
    measureB = null;
    if (measureLayer) {
      measureLayer.remove();
      measureLayer = null;
    }
  };

  const px = (n) => `${Math.round(n)}px`;

  const drawMeasure = () => {
    const layer = ensureMeasureLayer();
    layer.innerHTML = "";

    if (!measureA) return;

    const dotA = document.createElement("div");
    dotA.className = "__dbgtools_measure_dot__";
    dotA.style.left = px(measureA.x);
    dotA.style.top = px(measureA.y);
    layer.appendChild(dotA);

    if (!measureB) return;

    const dotB = document.createElement("div");
    dotB.className = "__dbgtools_measure_dot__";
    dotB.style.left = px(measureB.x);
    dotB.style.top = px(measureB.y);
    layer.appendChild(dotB);

    const dx = measureB.x - measureA.x;
    const dy = measureB.y - measureA.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const line = document.createElement("div");
    line.className = "__dbgtools_measure_line__";
    line.style.left = px(measureA.x);
    line.style.top = px(measureA.y);
    line.style.width = px(dist);

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    line.style.transform = `rotate(${angle}deg)`;
    layer.appendChild(line);

    const label = document.createElement("div");
    label.className = "__dbgtools_measure_label__";
    label.textContent = `${Math.round(dist)}px  (dx ${Math.round(dx)}, dy ${Math.round(dy)})`;
    label.style.left = px((measureA.x + measureB.x) / 2 + 10);
    label.style.top = px((measureA.y + measureB.y) / 2 + 10);
    layer.appendChild(label);
  };

  const onClickMeasure = (e) => {
    if (!measureEnabled) return;
    if (!e.shiftKey) return;
    if (e.target && e.target.closest(`#${ROOT_ID}`)) return;

    e.preventDefault();
    e.stopPropagation();

    const p = { x: e.clientX, y: e.clientY };
    if (!measureA) {
      measureA = p;
      measureB = null;
      toast("Measure: A set (shift+click for B)");
    } else if (!measureB) {
      measureB = p;
      toast("Measure: B set (shift+click to reset A)");
    } else {
      measureA = p;
      measureB = null;
      toast("Measure: reset A");
    }
    drawMeasure();
  };

  const enableMeasure = () => {
    if (measureEnabled) return;
    measureEnabled = true;
    document.addEventListener("click", onClickMeasure, true);
    toast("Measure ON (shift+click)");
  };

  const disableMeasure = () => {
    if (!measureEnabled) return;
    measureEnabled = false;
    document.removeEventListener("click", onClickMeasure, true);
    clearMeasure();
    toast("Measure OFF");
  };

  // ---------- Apply state ----------
  const applyState = () => {
    // Persisted modes
    setModeClass(MODE.OUTLINE, state.outline);
    setModeClass(MODE.NO_ANIM, state.noanim);
    setModeClass(MODE.HIDE_IMGS, state.hideimgs);
    setModeClass(MODE.SHOW_FOCUS, state.showfocus);
    setModeClass(MODE.HILITE_CLICKS, state.hiliteclicks);
    setModeClass(MODE.UNHIDE_ALL, state.unhideall);
    setModeClass(MODE.DIM_OVERLAY, state.dim);

    applyEditable(state.editable);

    // Tools (need listeners)
    if (state.picker) enablePicker();
    else disablePicker();

    if (state.measure) enableMeasure();
    else disableMeasure();

    // UI minimized state (if UI exists)
    const body = document.getElementById("__dbgtools_body__");
    if (body) body.style.display = state.minimized ? "none" : "block";
  };

  const setState = (patch) => {
    Object.assign(state, patch);
    saveState(state);
    applyState();
    syncUI();
  };

  // ---------- Styles ----------
  const oldStyle = document.getElementById(STYLE_ID);
  if (oldStyle) oldStyle.remove();

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    :root {
      --dbg-panel: rgba(10,10,10,0.86);
      --dbg-line: rgba(40,255,140,0.28);
      --dbg-accent: rgba(40,255,140,0.95);
      --dbg-dim: rgba(180,255,210,0.65);
      --dbg-text: rgba(235,255,245,0.92);
      --dbg-shadow: 0 14px 40px rgba(0,0,0,0.55);
      --dbg-radius: 14px;
      --dbg-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }

    /* Persistent modes */
    html.${MODE.NO_ANIM} *, html.${MODE.NO_ANIM} *::before, html.${MODE.NO_ANIM} *::after {
      transition: none !important;
      animation: none !important;
      scroll-behavior: auto !important;
    }

    html.${MODE.HIDE_IMGS} img,
    html.${MODE.HIDE_IMGS} picture,
    html.${MODE.HIDE_IMGS} video,
    html.${MODE.HIDE_IMGS} svg image {
      visibility: hidden !important;
    }

    html.${MODE.OUTLINE} * {
      outline: 1px solid rgba(40,255,140,0.22) !important;
      outline-offset: -1px !important;
    }

    html.${MODE.SHOW_FOCUS} :focus,
    html.${MODE.SHOW_FOCUS} :focus-visible {
      outline: 2px solid rgba(40,255,140,0.9) !important;
      outline-offset: 2px !important;
    }

    html.${MODE.HILITE_CLICKS} a, html.${MODE.HILITE_CLICKS} button, html.${MODE.HILITE_CLICKS} [role="button"],
    html.${MODE.HILITE_CLICKS} input, html.${MODE.HILITE_CLICKS} select, html.${MODE.HILITE_CLICKS} textarea {
      box-shadow: 0 0 0 2px rgba(40,255,140,0.22) inset !important;
      border-radius: 6px !important;
    }

    html.${MODE.UNHIDE_ALL} [hidden] { display: initial !important; }
    html.${MODE.UNHIDE_ALL} *[style*="display: none"] { display: initial !important; }
    html.${MODE.UNHIDE_ALL} *[style*="visibility: hidden"] { visibility: visible !important; }

    /* Dim screen overlay (persistent) */
    html.${MODE.DIM_OVERLAY}::before {
      content: "";
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.35);
      pointer-events: none;
      z-index: 2147483645;
    }

    /* UI */
    #${ROOT_ID} {
      position: fixed;
      z-index: 2147483647;
      top: 18px;
      right: 18px;
      width: 360px;
      color: var(--dbg-text);
      font-family: var(--dbg-mono);
      user-select: none;
    }

    .dbgtools-panel {
      background: var(--dbg-panel);
      box-shadow: var(--dbg-shadow);
      border: 1px solid var(--dbg-line);
      border-radius: var(--dbg-radius);
      overflow: hidden;
      clip-path: polygon(
        14px 0%,
        calc(100% - 16px) 0%,
        100% 16px,
        100% calc(100% - 14px),
        calc(100% - 14px) 100%,
        16px 100%,
        0% calc(100% - 16px),
        0% 14px
      );
      position: relative;
    }

    .dbgtools-panel::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(to bottom, rgba(255,255,255,0.04), transparent 12%),
        repeating-linear-gradient(
          to bottom,
          rgba(0, 255, 120, 0.06),
          rgba(0, 255, 120, 0.06) 1px,
          transparent 1px,
          transparent 6px
        );
      pointer-events: none;
      mix-blend-mode: screen;
      opacity: 0.65;
    }

    .dbgtools-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid var(--dbg-line);
      background: rgba(0,0,0,0.25);
      cursor: grab;
    }

    .dbgtools-title {
      display: flex;
      gap: 10px;
      align-items: baseline;
      letter-spacing: 0.4px;
    }

    .dbgtools-title strong { color: var(--dbg-accent); font-weight: 700; }
    .dbgtools-title span { color: var(--dbg-dim); font-size: 12px; }

    .dbgtools-btns { display: flex; gap: 8px; align-items: center; }

    .dbgtools-iconbtn {
      border: 1px solid var(--dbg-line);
      background: rgba(0,0,0,0.35);
      color: var(--dbg-text);
      border-radius: 10px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
    }
    .dbgtools-iconbtn:hover { border-color: var(--dbg-accent); }

    .dbgtools-body { padding: 10px 12px 12px 12px; }

    .dbgtools-section {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(40,255,140,0.16);
    }

    .dbgtools-section:first-child {
      margin-top: 0;
      padding-top: 0;
      border-top: 0;
    }

    .dbgtools-section h4 {
      margin: 0 0 8px 0;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.4px;
      color: rgba(40,255,140,0.85);
    }

    .dbgtools-row {
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      padding: 7px 0;
      border-bottom: 1px dashed rgba(40,255,140,0.14);
    }
    .dbgtools-row:last-child { border-bottom: 0; }

    .dbgtools-label {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .dbgtools-label .name { font-size: 13px; }
    .dbgtools-label .hint {
      font-size: 11px;
      color: rgba(200,255,225,0.62);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 240px;
    }

    .dbgtools-toggle {
      width: 48px;
      height: 24px;
      border-radius: 14px;
      border: 1px solid var(--dbg-line);
      background: rgba(0,0,0,0.35);
      position: relative;
      cursor: pointer;
      flex: 0 0 auto;
    }
    .dbgtools-toggle::after {
      content: "";
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(200,255,225,0.72);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.35);
      transition: transform 120ms ease;
    }
    .dbgtools-toggle.on {
      border-color: rgba(40,255,140,0.6);
      box-shadow: 0 0 0 1px rgba(40,255,140,0.22) inset;
    }
    .dbgtools-toggle.on::after {
      transform: translateX(24px);
      background: var(--dbg-accent);
    }

    .dbgtools-footer {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(40,255,140,0.22);
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      user-select: text;
    }

    .dbgtools-kbd {
      font-size: 11px;
      color: rgba(200,255,225,0.65);
      line-height: 1.2;
    }

    .dbgtools-toast {
      position: fixed;
      z-index: 2147483647;
      left: 50%;
      bottom: 22px;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.78);
      border: 1px solid rgba(40,255,140,0.35);
      color: rgba(235,255,245,0.92);
      padding: 8px 12px;
      border-radius: 12px;
      font-family: var(--dbg-mono);
      font-size: 12px;
      opacity: 0;
      transition: opacity 120ms ease;
      pointer-events: none;
    }
    .dbgtools-toast.show { opacity: 1; }

    .__dbgtools_hoverchip__ {
      position: fixed;
      z-index: 2147483647;
      pointer-events: none;
      font-family: var(--dbg-mono);
      font-size: 12px;
      padding: 6px 8px;
      border-radius: 10px;
      border: 1px solid rgba(40,255,140,0.35);
      background: rgba(0,0,0,0.78);
      color: rgba(235,255,245,0.92);
      box-shadow: var(--dbg-shadow);
      max-width: 60vw;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .__dbgtools_measure_layer__ {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483646;
    }
    .__dbgtools_measure_dot__ {
      position: fixed;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-left: -5px;
      margin-top: -5px;
      background: rgba(40,255,140,0.95);
      box-shadow: 0 0 0 2px rgba(0,0,0,0.55);
    }
    .__dbgtools_measure_line__ {
      position: fixed;
      height: 2px;
      transform-origin: 0 0;
      background: rgba(40,255,140,0.85);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.45);
    }
    .__dbgtools_measure_label__ {
      position: fixed;
      font-family: var(--dbg-mono);
      font-size: 12px;
      padding: 6px 8px;
      border-radius: 10px;
      border: 1px solid rgba(40,255,140,0.35);
      background: rgba(0,0,0,0.78);
      color: rgba(235,255,245,0.92);
      box-shadow: var(--dbg-shadow);
      white-space: nowrap;
    }
  `;
  document.documentElement.appendChild(style);

  // ---------- Remove existing UI (do NOT undo modes) ----------
  const prevRoot = document.getElementById(ROOT_ID);
  if (prevRoot) prevRoot.remove();

  // ---------- UI ----------
  const root = document.createElement("div");
  root.id = ROOT_ID;

  root.innerHTML = `
    <div class="dbgtools-panel">
      <div class="dbgtools-header" id="__dbgtools_drag__">
        <div class="dbgtools-title">
          <strong>DBG</strong>
          <span>overlay</span>
        </div>
        <div class="dbgtools-btns">
          <button class="dbgtools-iconbtn" id="__dbgtools_min__" title="Minimize">_</button>
          <button class="dbgtools-iconbtn" id="__dbgtools_close__" title="Close overlay">×</button>
        </div>
      </div>

      <div class="dbgtools-body" id="__dbgtools_body__">
        <div class="dbgtools-section">
          <h4>Modes</h4>

          <div class="dbgtools-row">
            <div class="dbgtools-label">
              <div class="name">Editable</div>
              <div class="hint">document.designMode (sticks after closing)</div>
            </div>
            <div class="dbgtools-toggle" data-toggle="editable"></div>
          </div>

          <div class="dbgtools-row">
            <div class="dbgtools-label">
              <div class="name">Picker</div>
              <div class="hint">Click element → copy selector (Esc to exit)</div>
            </div>
            <div class="dbgtools-toggle" data-toggle="picker"></div>
          </div>

          <div class="dbgtools-row">
            <div class="dbgtools-label">
              <div class="name">Measure</div>
              <div class="hint">Shift+click points (sticks after closing)</div>
            </div>
            <div class="dbgtools-toggle" data-toggle="measure"></div>
          </div>

          <div class="dbgtools-row">
            <div class="dbgtools-label">
              <div class="name">No animations</div>
              <div class="hint">Kills transitions/animations</div>
            </div>
            <div class="dbgtools-toggle" data-toggle="noanim"></div>
          </div>

          <div class="dbgtools-row">
            <div class="dbgtools-label">
              <div class="name">Outlines</div>
              <div class="hint">Outline every element</div>
            </div>
            <div class="dbgtools-toggle" data-toggle="outline"></div>
          </div>

          <div class="dbgtools-row">
            <div class="dbgtools-label">
              <div class="name">Hide images</div>
              <div class="hint">Layout stress test</div>
            </div>
            <div class="dbgtools-toggle" data-toggle="hideimgs"></div>
          </div>

          <div class="dbgtools-row">
            <div class="dbgtools-label">
              <div class="name">Focus rings</div>
              <div class="hint">Force visible focus outlines</div>
            </div>
            <div class="dbgtools-toggle" data-toggle="showfocus"></div>
          </div>

          <div class="dbgtools-row">
            <div class="dbgtools-label">
              <div class="name">Highlight interactives</div>
              <div class="hint">Buttons/links/inputs visual scan</div>
            </div>
            <div class="dbgtools-toggle" data-toggle="hiliteclicks"></div>
          </div>

          <div class="dbgtools-row">
            <div class="dbgtools-label">
              <div class="name">Unhide everything</div>
              <div class="hint">Reveal [hidden], display:none, visibility:hidden</div>
            </div>
            <div class="dbgtools-toggle" data-toggle="unhideall"></div>
          </div>

          <div class="dbgtools-row">
            <div class="dbgtools-label">
              <div class="name">Dim screen</div>
              <div class="hint">Useful for presentations/screenshot focus</div>
            </div>
            <div class="dbgtools-toggle" data-toggle="dim"></div>
          </div>
        </div>

        <div class="dbgtools-section">
          <h4>Actions</h4>

          <div class="dbgtools-row">
            <div class="dbgtools-label">
              <div class="name">Copy page info</div>
              <div class="hint">title/url/UA + first 50 scripts/styles</div>
            </div>
            <button class="dbgtools-iconbtn" id="__dbgtools_copyinfo__">Copy</button>
          </div>

          <div class="dbgtools-row">
            <div class="dbgtools-label">
              <div class="name">Copy visible text</div>
              <div class="hint">Quick “what’s on this screen” scrape</div>
            </div>
            <button class="dbgtools-iconbtn" id="__dbgtools_copytext__">Copy</button>
          </div>

          <div class="dbgtools-row">
            <div class="dbgtools-label">
              <div class="name">Reset modes</div>
              <div class="hint">Turns off all toggles (keeps overlay)</div>
            </div>
            <button class="dbgtools-iconbtn" id="__dbgtools_reset__">Reset</button>
          </div>
        </div>

        <div class="dbgtools-footer">
          <div class="dbgtools-kbd">
            Esc: exits picker<br>
            Shift+click: measure points
          </div>
          <button class="dbgtools-iconbtn" id="__dbgtools_help__" title="Show quick help">Help</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  // ---------- UI wiring ----------
  const setToggleUI = (key, on) => {
    const el = $(`.dbgtools-toggle[data-toggle="${key}"]`, root);
    if (!el) return;
    el.classList.toggle("on", !!on);
  };

  const syncUI = () => {
    setToggleUI("editable", state.editable);
    setToggleUI("picker", state.picker);
    setToggleUI("measure", state.measure);
    setToggleUI("noanim", state.noanim);
    setToggleUI("outline", state.outline);
    setToggleUI("hideimgs", state.hideimgs);
    setToggleUI("showfocus", state.showfocus);
    setToggleUI("hiliteclicks", state.hiliteclicks);
    setToggleUI("unhideall", state.unhideall);
    setToggleUI("dim", state.dim);

    const body = $("#__dbgtools_body__", root);
    if (body) body.style.display = state.minimized ? "none" : "block";
  };

  // Dragging
  const dragHandle = $("#__dbgtools_drag__", root);
  let dragging = false;
  let startX = 0,
    startY = 0;
  let startTop = 0,
    startRight = 0;

  dragHandle.addEventListener("mousedown", (e) => {
    if (e.target && e.target.closest("button")) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = root.getBoundingClientRect();
    startTop = rect.top;
    startRight = window.innerWidth - rect.right;

    root.style.left = "auto";
    root.style.bottom = "auto";
    dragHandle.style.cursor = "grabbing";
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const top = Math.max(6, Math.min(window.innerHeight - 60, startTop + dy));
    const right = Math.max(
      6,
      Math.min(window.innerWidth - 60, startRight - dx),
    );

    root.style.top = `${top}px`;
    root.style.right = `${right}px`;
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    dragHandle.style.cursor = "grab";
  });

  // Hotkeys
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.picker) setState({ picker: false });
  });

  // Toggle clicks
  root.addEventListener("click", (e) => {
    const t = e.target;
    const toggle = t && t.closest && t.closest(".dbgtools-toggle");
    if (!toggle) return;

    const key = toggle.getAttribute("data-toggle");
    if (!key) return;

    setState({ [key]: !state[key] });

    const msg = {
      editable: state.editable ? "Editable ON" : "Editable OFF",
      picker: state.picker ? "Picker ON" : "Picker OFF",
      measure: state.measure ? "Measure ON" : "Measure OFF",
      noanim: state.noanim ? "Animations OFF" : "Animations ON",
      outline: state.outline ? "Outlines ON" : "Outlines OFF",
      hideimgs: state.hideimgs ? "Images HIDDEN" : "Images VISIBLE",
      showfocus: state.showfocus ? "Focus rings ON" : "Focus rings OFF",
      hiliteclicks: state.hiliteclicks
        ? "Interactives highlighted"
        : "Interactives normal",
      unhideall: state.unhideall
        ? "Hidden elements revealed"
        : "Hidden elements normal",
      dim: state.dim ? "Dim ON" : "Dim OFF",
    }[key];

    if (msg) toast(msg);
  });

  // Buttons
  $("#__dbgtools_close__", root).addEventListener("click", () => {
    // Important: do NOT undo modes; only remove the overlay.
    root.remove();
    toast("Overlay closed (modes kept)");
  });

  $("#__dbgtools_min__", root).addEventListener("click", () => {
    setState({ minimized: !state.minimized });
  });

  $("#__dbgtools_help__", root).addEventListener("click", () => {
    toast(
      "Modes persist. Reset turns them off. Esc exits Picker. Shift+click measures.",
    );
  });

  $("#__dbgtools_reset__", root).addEventListener("click", () => {
    setState({
      editable: false,
      picker: false,
      measure: false,
      noanim: false,
      outline: false,
      hideimgs: false,
      showfocus: false,
      hiliteclicks: false,
      unhideall: false,
      dim: false,
    });
    toast("Reset done");
  });

  $("#__dbgtools_copyinfo__", root).addEventListener("click", async () => {
    const info = {
      title: document.title,
      url: location.href,
      userAgent: navigator.userAgent,
      scripts: $$("script[src]")
        .map((s) => s.src)
        .slice(0, 50),
      styles: $$("link[rel=stylesheet]")
        .map((l) => l.href)
        .slice(0, 50),
    };
    await copyText(JSON.stringify(info, null, 2));
  });

  $("#__dbgtools_copytext__", root).addEventListener("click", async () => {
    // visible-ish text: not perfect, but practical
    const text = (document.body?.innerText || "").trim();
    await copyText(text.slice(0, 200000)); // avoid clipboard abuse on massive pages
  });

  // ---------- Expose API ----------
  window.__DBGTOOLS__ = {
    version: "0.2",
    get: () => ({ ...state }),
    set: (patch) => setState(patch),
    reset: () => $("#__dbgtools_reset__")?.click(),
    cssPath,
    closeOverlay: () => $("#__dbgtools_close__")?.click(),
  };

  // ---------- Start ----------
  applyState();
  syncUI();
  toast("DBG loaded");
})();

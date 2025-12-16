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
        (c) => c.tagName === cur.tagName
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
    html.${MODE.HILITE_CLICKS} input, html.${MODE.HILITE_CLICKS} select, html.${
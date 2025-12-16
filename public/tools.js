(() => {
  "use strict";

  // Idempotent reload: if already present, remove old UI/styles before re-adding.
  const ROOT_ID = "__dbgtools_root__";
  const STYLE_ID = "__dbgtools_style__";

  const prev = document.getElementById(ROOT_ID);
  if (prev) prev.remove();

  const prevStyle = document.getElementById(STYLE_ID);
  if (prevStyle) prevStyle.remove();

  // --------- Utilities ----------
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard");
    } catch {
      // Fallback for restricted clipboard contexts
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

  const saveState = (state) => {
    try {
      localStorage.setItem("__dbgtools_state__", JSON.stringify(state));
    } catch {}
  };
  const loadState = () => {
    try {
      const raw = localStorage.getItem("__dbgtools_state__");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  // Make a reasonably stable CSS selector.
  const cssPath = (el) => {
    if (!(el instanceof Element)) return "";
    if (el.id) return `#${CSS.escape(el.id)}`;

    const parts = [];
    let cur = el;

    while (cur && cur.nodeType === 1 && cur !== document.documentElement) {
      const tag = cur.tagName.toLowerCase();

      // Prefer a single, distinctive class if present
      const cls = Array.from(cur.classList || []).filter(Boolean);
      let classPart = "";
      if (cls.length) {
        // pick shortest class name (often BEM-ish but stable)
        const pick = cls.slice().sort((a, b) => a.length - b.length)[0];
        classPart = `.${CSS.escape(pick)}`;
      }

      // nth-of-type when needed
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

      // If we reached something with a class, that's often good enough already
      if (classPart && parts.length >= 3) break;

      cur = parent;
    }

    return parts.join(" > ");
  };

  // --------- Styles ----------
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    :root {
      --dbg-bg: rgba(0,0,0,0.72);
      --dbg-panel: rgba(10,10,10,0.86);
      --dbg-line: rgba(40,255,140,0.28);
      --dbg-accent: rgba(40,255,140,0.95);
      --dbg-dim: rgba(180,255,210,0.65);
      --dbg-text: rgba(235,255,245,0.92);
      --dbg-shadow: 0 14px 40px rgba(0,0,0,0.55);
      --dbg-radius: 14px;
      --dbg-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }

    #${ROOT_ID} {
      position: fixed;
      z-index: 2147483647;
      top: 18px;
      right: 18px;
      width: 340px;
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
    }

    .dbgtools-title {
      display: flex;
      gap: 10px;
      align-items: baseline;
      letter-spacing: 0.4px;
    }

    .dbgtools-title strong {
      color: var(--dbg-accent);
      font-weight: 700;
    }

    .dbgtools-title span {
      color: var(--dbg-dim);
      font-size: 12px;
    }

    .dbgtools-btns {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .dbgtools-iconbtn {
      border: 1px solid var(--dbg-line);
      background: rgba(0,0,0,0.35);
      color: var(--dbg-text);
      border-radius: 10px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
    }
    .dbgtools-iconbtn:hover {
      border-color: var(--dbg-accent);
    }

    .dbgtools-body {
      padding: 10px 12px 12px 12px;
    }

    .dbgtools-row {
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed rgba(40,255,140,0.18);
    }
    .dbgtools-row:last-child { border-bottom: 0; }

    .dbgtools-label {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .dbgtools-label .name {
      font-size: 13px;
    }
    .dbgtools-label .hint {
      font-size: 11px;
      color: rgba(200,255,225,0.62);
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

    /* Effects toggles */
    html.__dbgtools_no_anim__ *, html.__dbgtools_no_anim__ *::before, html.__dbgtools_no_anim__ *::after {
      transition: none !important;
      animation: none !important;
      scroll-behavior: auto !important;
    }

    html.__dbgtools_hide_imgs__ img,
    html.__dbgtools_hide_imgs__ picture,
    html.__dbgtools_hide_imgs__ video {
      visibility: hidden !important;
    }

    html.__dbgtools_outline__ * {
      outline: 1px solid rgba(40,255,140,0.22) !important;
      outline-offset: -1px !important;
    }

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
  `;
  document.documentElement.appendChild(style);

  // --------- UI ----------
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
          <button class="dbgtools-iconbtn" id="__dbgtools_close__" title="Close">×</button>
        </div>
      </div>

      <div class="dbgtools-body" id="__dbgtools_body__">
        <div class="dbgtools-row">
          <div class="dbgtools-label">
            <div class="name">Contenteditable</div>
            <div class="hint">Toggle edit mode (whole document)</div>
          </div>
          <div class="dbgtools-toggle" data-toggle="editable"></div>
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
            <div class="name">No animations</div>
            <div class="hint">Disable CSS transitions/animations</div>
          </div>
          <div class="dbgtools-toggle" data-toggle="noanim"></div>
        </div>

        <div class="dbgtools-row">
          <div class="dbgtools-label">
            <div class="name">Hide images</div>
            <div class="hint">Stress-test layout without media</div>
          </div>
          <div class="dbgtools-toggle" data-toggle="hideimgs"></div>
        </div>

        <div class="dbgtools-row">
          <div class="dbgtools-label">
            <div class="name">Picker mode</div>
            <div class="hint">Click element → copy selector</div>
          </div>
          <div class="dbgtools-toggle" data-toggle="picker"></div>
        </div>

        <div class="dbgtools-footer">
          <div class="dbgtools-kbd">
            Hotkeys: <span style="color:rgba(40,255,140,0.9)">Esc</span> closes picker
          </div>
          <button class="dbgtools-iconbtn" id="__dbgtools_copyinfo__" title="Copy page info">Copy info</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  // --------- Dragging (simple) ----------
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
  });

  // --------- State + toggles ----------
  const state = {
    editable: false,
    outline: false,
    noanim: false,
    hideimgs: false,
    picker: false,
    minimized: false,
    ...loadState(),
  };

  const setToggleUI = (key, on) => {
    const el = $(`.dbgtools-toggle[data-toggle="${key}"]`, root);
    if (!el) return;
    el.classList.toggle("on", !!on);
  };

  const applyState = () => {
    document.documentElement.classList.toggle(
      "__dbgtools_outline__",
      !!state.outline,
    );
    document.documentElement.classList.toggle(
      "__dbgtools_no_anim__",
      !!state.noanim,
    );
    document.documentElement.classList.toggle(
      "__dbgtools_hide_imgs__",
      !!state.hideimgs,
    );

    // contenteditable: prefer the simplest, least surprising switch
    document.body &&
      (document.body.contentEditable = state.editable ? "true" : "false");

    setToggleUI("editable", state.editable);
    setToggleUI("outline", state.outline);
    setToggleUI("noanim", state.noanim);
    setToggleUI("hideimgs", state.hideimgs);
    setToggleUI("picker", state.picker);

    const body = $("#__dbgtools_body__", root);
    body.style.display = state.minimized ? "none" : "block";
  };

  const setState = (patch) => {
    Object.assign(state, patch);
    saveState(state);
    applyState();
  };

  // --------- Picker mode ----------
  let hoverChip = null;
  let lastHoverEl = null;

  const ensureHoverChip = () => {
    if (hoverChip) return hoverChip;
    hoverChip = document.createElement("div");
    hoverChip.className = "__dbgtools_hoverchip__";
    document.body.appendChild(hoverChip);
    return hoverChip;
  };

  const clearPickerUI = () => {
    if (hoverChip) hoverChip.remove();
    hoverChip = null;
    lastHoverEl = null;
  };

  const onMouseMovePicker = (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    // Ignore our own overlay
    if (target.closest(`#${ROOT_ID}`)) return;

    lastHoverEl = target;

    const chip = ensureHoverChip();
    const rect = target.getBoundingClientRect();
    const label = `${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ""}${target.classList?.length ? "." + Array.from(target.classList).slice(0, 2).join(".") : ""}  [${Math.round(rect.width)}×${Math.round(rect.height)}]`;
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

    // keep picker on (useful), but you can Esc out
  };

  const enablePicker = () => {
    document.addEventListener("mousemove", onMouseMovePicker, true);
    document.addEventListener("click", onClickPicker, true);
  };

  const disablePicker = () => {
    document.removeEventListener("mousemove", onMouseMovePicker, true);
    document.removeEventListener("click", onClickPicker, true);
    clearPickerUI();
  };

  const setPicker = (on) => {
    if (on === state.picker) return;
    setState({ picker: on });
    if (on) {
      enablePicker();
      toast("Picker ON: click element to copy selector");
    } else {
      disablePicker();
      toast("Picker OFF");
    }
  };

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.picker) setPicker(false);
  });

  // Toggle click handlers
  root.addEventListener("click", (e) => {
    const t = e.target;
    const toggle = t && t.closest && t.closest(".dbgtools-toggle");
    if (toggle) {
      const key = toggle.getAttribute("data-toggle");
      if (!key) return;

      if (key === "picker") {
        setPicker(!state.picker);
        return;
      }

      setState({ [key]: !state[key] });

      if (key === "editable")
        toast(state.editable ? "Editable ON" : "Editable OFF");
      if (key === "outline")
        toast(state.outline ? "Outlines ON" : "Outlines OFF");
      if (key === "noanim")
        toast(state.noanim ? "Animations OFF" : "Animations ON");
      if (key === "hideimgs")
        toast(state.hideimgs ? "Images HIDDEN" : "Images VISIBLE");
    }
  });

  // Buttons
  $("#__dbgtools_close__", root).addEventListener("click", () => {
    disablePicker();
    document.documentElement.classList.remove(
      "__dbgtools_outline__",
      "__dbgtools_no_anim__",
      "__dbgtools_hide_imgs__",
    );
    document.body && (document.body.contentEditable = "false");
    root.remove();
    style.remove();
  });

  $("#__dbgtools_min__", root).addEventListener("click", () => {
    setState({ minimized: !state.minimized });
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

  // Apply initial state
  applyState();
  if (state.picker) enablePicker();

  // Expose a tiny API for future expansion
  window.__DBGTOOLS__ = {
    version: "0.1",
    set: setState,
    get: () => ({ ...state }),
    cssPath,
    close: () => $("#__dbgtools_close__", root).click(),
  };

  toast("DBG loaded");
})();

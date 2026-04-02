(function () {
  const SERVICE_URL = "https://cop.daniel-goude.workers.dev/cop";
  const MAX_CHARS_UI = 2048;

  const statusEl = document.getElementById("cop-status");
  const inputEl = document.getElementById("cop-input");
  const charCountEl = document.getElementById("cop-charcount");
  const copyBtn = document.getElementById("cop-copy-btn");
  const updateBtn = document.getElementById("cop-update-btn");
  const qrCanvas = document.getElementById("cop-qr-canvas");
  const urlLink = document.getElementById("cop-url-link");

  function utf8ToBase64(text) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToUtf8_safe(b64) {
    try {
      const binary = atob(b64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch {
      return b64;
    }
  }

  function updateCharCount() {
    if (!inputEl || !charCountEl) return;
    const len = inputEl.value.length;
    charCountEl.textContent = len + " / " + MAX_CHARS_UI;
  }

  function clearQR() {
    if (!qrCanvas) return;
    const ctx = qrCanvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
    }
  }

  function renderQR(value) {
    if (!qrCanvas || !window.QRCode) return;
    if (!value) {
      clearQR();
      return;
    }
    window.QRCode.toCanvas(qrCanvas, value, {
      margin: 0,
      width: 300,
    });
  }

  function setUrl(url) {
    if (!urlLink) return;
    if (!url) {
      urlLink.textContent = "";
      urlLink.removeAttribute("href");
      return;
    }
    urlLink.href = url;
    urlLink.textContent = url;
  }

  async function refreshFromServer() {
    if (!statusEl || !inputEl) return;

    statusEl.textContent = "Fetching from cloud clipboard…";
    inputEl.value = "";
    updateCharCount();
    clearQR();
    setUrl("");

    try {
      const res = await fetch(SERVICE_URL, {
        method: "GET",
        mode: "cors",
      });
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }

      const encoded = await res.text();
      const txt = base64ToUtf8_safe(encoded.trim());
      const url = txt || "";

      inputEl.value = txt.slice(0, MAX_CHARS_UI);
      updateCharCount();

      if (url) {
        renderQR(url);
        setUrl(url);
      } else {
        clearQR();
        setUrl("");
      }

      statusEl.textContent =
        "Loaded " + inputEl.value.length + " characters from cloud clipboard.";
    } catch {
      statusEl.textContent = "Failed to fetch from cloud clipboard.";
      inputEl.placeholder = "(error fetching value)";
    }
  }

  function setupCopy() {
    if (!copyBtn || !inputEl || !statusEl) return;

    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(inputEl.value);
        statusEl.textContent = "Copied to local clipboard.";
      } catch {
        statusEl.textContent = "Failed to copy to clipboard.";
      }
    });
  }

  function setupUpdate() {
    if (!updateBtn || !inputEl || !statusEl) return;

    inputEl.addEventListener("input", () => {
      if (inputEl.value.length > MAX_CHARS_UI) {
        inputEl.value = inputEl.value.slice(0, MAX_CHARS_UI);
      }
      updateCharCount();
    });

    updateBtn.addEventListener("click", async () => {
      const txt = inputEl.value.slice(0, MAX_CHARS_UI);
      const encoded = utf8ToBase64(txt);

      statusEl.textContent = "Updating cloud clipboard…";
      updateBtn.disabled = true;

      try {
        const res = await fetch(SERVICE_URL, {
          method: "POST",
          mode: "cors",
          body: encoded,
        });
        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }

        statusEl.textContent =
          "Updated cloud clipboard with " + txt.length + " characters.";

        await refreshFromServer();
      } catch {
        statusEl.textContent = "Failed to update cloud clipboard.";
      } finally {
        updateBtn.disabled = false;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupCopy();
    setupUpdate();
    refreshFromServer();
  });
})();

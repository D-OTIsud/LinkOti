(() => {
  const STORAGE_KEY = "oti.pageData.v1"; // local fallback only
  const TOKEN_KEY = "oti.adminToken.v1"; // sessionStorage

  const $ = (sel) => document.querySelector(sel);

  const el = {
    jsonInput: $("#jsonInput"),
    status: $("#status"),
    modeLabel: $("#modeLabel"),
    autoPreview: $("#autoPreview"),
    btnLoad: $("#btnLoad"),
    btnSave: $("#btnSave"),
    btnReset: $("#btnReset"),
    btnExport: $("#btnExport"),
    btnCopy: $("#btnCopy"),
    btnPreviewNow: $("#btnPreviewNow"),
    fileImport: $("#fileImport"),
    previewFrame: $("#previewFrame"),
    adminToken: $("#adminToken")
  };

  function deepMerge(base, override) {
    if (override == null) return base;
    if (Array.isArray(base) || Array.isArray(override)) return override;
    if (typeof base !== "object" || typeof override !== "object") return override;
    const out = { ...base };
    for (const [k, v] of Object.entries(override)) {
      out[k] = k in base ? deepMerge(base[k], v) : v;
    }
    return out;
  }

  function canUseStorage() {
    try {
      const k = "__oti_test__";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return true;
    } catch (_) {
      return false;
    }
  }

  const storageOk = canUseStorage();
  let apiOk = false;

  function setModeLabel() {
    el.modeLabel.textContent = apiOk ? "serveur (API)" : "local (fallback navigateur)";
  }

  function setStatus(message, kind = "info") {
    const color =
      kind === "ok"
        ? "rgba(170,255,210,0.95)"
        : kind === "warn"
          ? "rgba(255,240,190,0.95)"
          : kind === "error"
            ? "rgba(255,190,190,0.95)"
            : "rgba(255,255,255,0.9)";

    el.status.firstChild.textContent = message + " ";
    el.status.style.color = color;
  }

  function formatJson(obj) {
    return JSON.stringify(obj, null, 2);
  }

  function safeParseJson(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") throw new Error("Le JSON doit être un objet.");
    return parsed;
  }

  function postPreview(data) {
    try {
      el.previewFrame?.contentWindow?.postMessage({ type: "oti-page-data-preview", data }, "*");
    } catch (_) {}
  }

  function loadLocalSavedData() {
    if (!storageOk) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function getEffectiveLocalData() {
    return deepMerge(window.DEFAULT_PAGE_DATA || {}, loadLocalSavedData() || {});
  }

  function getToken() {
    const fromInput = String(el.adminToken?.value || "").trim();
    if (fromInput) return fromInput;
    try {
      return String(sessionStorage.getItem(TOKEN_KEY) || "").trim();
    } catch (_) {
      return "";
    }
  }

  function persistToken() {
    const t = String(el.adminToken?.value || "");
    try {
      if (t) sessionStorage.setItem(TOKEN_KEY, t);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch (_) {}
  }

  async function apiFetch(url, opts = {}) {
    const token = getToken();
    const headers = {
      Accept: "application/json",
      ...(opts.headers || {})
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { ...opts, headers, cache: "no-store" });
    const json = await res.json().catch(() => null);
    return { res, json };
  }

  async function detectApi() {
    try {
      const { res, json } = await apiFetch("/api/health", { method: "GET" });
      apiOk = res.ok && json && json.ok === true;
    } catch (_) {
      apiOk = false;
    }
    setModeLabel();
  }

  async function loadEditor() {
    if (apiOk) {
      try {
        const { res, json } = await apiFetch("/api/page-data", { method: "GET" });
        if (!res.ok || !json || json.ok !== true) throw new Error(json?.error || `HTTP ${res.status}`);
        el.jsonInput.value = formatJson(json.data);
        setStatus("Chargé (serveur).", "ok");
        if (el.autoPreview.checked) postPreview(json.data);
        return;
      } catch (err) {
        setStatus(`Erreur API, fallback local: ${err?.message || err}`, "warn");
      }
    }

    const data = getEffectiveLocalData();
    el.jsonInput.value = formatJson(data);
    setStatus(storageOk ? "Chargé (local)." : "Chargé (local, sans localStorage).", storageOk ? "ok" : "warn");
    if (el.autoPreview.checked) postPreview(data);
  }

  async function saveFromEditor() {
    try {
      const data = safeParseJson(el.jsonInput.value);

      if (apiOk) {
        const { res, json } = await apiFetch("/api/page-data", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        if (res.status === 401) {
          setStatus("Non autorisé (token manquant / incorrect).", "error");
          el.adminToken?.focus();
          return;
        }
        if (!res.ok || !json || json.ok !== true) throw new Error(json?.error || `HTTP ${res.status}`);

        setStatus("Sauvegardé (serveur).", "ok");
        postPreview(data);
        return;
      }

      if (!storageOk) {
        setStatus("Impossible de sauvegarder en local (localStorage indisponible). Utilisez Exporter.", "error");
        return;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStatus("Sauvegardé (local).", "ok");
      postPreview(data);
    } catch (err) {
      setStatus(`JSON invalide: ${err?.message || err}`, "error");
    }
  }

  async function resetSaved() {
    const ok = confirm("Reset: revenir aux données par défaut ?");
    if (!ok) return;

    if (apiOk) {
      const { res, json } = await apiFetch("/api/page-data", { method: "DELETE" });
      if (res.status === 401) {
        setStatus("Non autorisé (token manquant / incorrect).", "error");
        el.adminToken?.focus();
        return;
      }
      if (!res.ok || !json || json.ok !== true) {
        setStatus(`Reset impossible (API): ${json?.error || `HTTP ${res.status}`}`, "error");
        return;
      }
      setStatus("Reset effectué (serveur).", "ok");
      await loadEditor();
      return;
    }

    if (!storageOk) {
      setStatus("Reset impossible en local (localStorage indisponible).", "error");
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    setStatus("Reset effectué (local).", "ok");
    await loadEditor();
  }

  function exportJson() {
    try {
      const data = safeParseJson(el.jsonInput.value);
      const blob = new Blob([formatJson(data)], { type: "application/json;charset=utf-8" });
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.href = URL.createObjectURL(blob);
      a.download = `oti-page-data-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      setStatus("Export prêt (fichier téléchargé).", "ok");
    } catch (err) {
      setStatus(`Impossible d'exporter: JSON invalide (${err?.message || err}).`, "error");
    }
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(el.jsonInput.value);
      setStatus("Copié dans le presse-papier.", "ok");
    } catch (_) {
      setStatus("Copie impossible (autorisation navigateur).", "warn");
    }
  }

  function importJsonFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      el.jsonInput.value = text;
      try {
        const data = safeParseJson(text);
        setStatus("Import OK (pensez à Sauvegarder).", "ok");
        if (el.autoPreview.checked) postPreview(data);
      } catch (err) {
        setStatus(`Importé mais JSON invalide: ${err?.message || err}`, "error");
      }
    };
    reader.onerror = () => setStatus("Erreur lors de la lecture du fichier.", "error");
    reader.readAsText(file);
  }

  let previewTimer = null;
  function scheduleAutoPreview() {
    if (!el.autoPreview.checked) return;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      try {
        const data = safeParseJson(el.jsonInput.value);
        postPreview(data);
        setStatus("Aperçu mis à jour.", "info");
      } catch (err) {
        setStatus(`JSON invalide: ${err?.message || err}`, "error");
      }
    }, 250);
  }

  function bind() {
    el.adminToken?.addEventListener("input", persistToken);
    try {
      const t = sessionStorage.getItem(TOKEN_KEY);
      if (t && el.adminToken) el.adminToken.value = t;
    } catch (_) {}

    el.btnLoad.addEventListener("click", loadEditor);
    el.btnSave.addEventListener("click", saveFromEditor);
    el.btnReset.addEventListener("click", resetSaved);
    el.btnExport.addEventListener("click", exportJson);
    el.btnCopy.addEventListener("click", copyJson);
    el.btnPreviewNow.addEventListener("click", () => {
      try {
        const data = safeParseJson(el.jsonInput.value);
        postPreview(data);
        setStatus("Aperçu actualisé.", "ok");
      } catch (err) {
        setStatus(`JSON invalide: ${err?.message || err}`, "error");
      }
    });

    el.jsonInput.addEventListener("input", scheduleAutoPreview);

    el.fileImport.addEventListener("change", () => {
      const file = el.fileImport.files?.[0];
      el.fileImport.value = "";
      if (!file) return;
      importJsonFile(file);
    });
  }

  async function init() {
    bind();
    await detectApi();
    await loadEditor();
  }

  init();
})();


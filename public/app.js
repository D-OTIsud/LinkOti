(() => {
  const STORAGE_KEY = "oti.pageData.v1"; // local fallback only

  const $ = (sel, root = document) => root.querySelector(sel);

  const el = {
    hero: $("#hero"),
    carousel: $("#carousel"),
    heroTagline: $("#heroTagline"),
    logoBox: $("#logoLeftBox"),
    logoPlaceholder: $("#logoLeftPlaceholder"),
    socials: $("#socials"),
    sections: $("#sections"),
    footerLine: $("#footerLine"),
    footerLinks: $("#footerLinks"),
    langTrigger: $("#langTrigger"),
    langMenu: $("#langMenu"),
    currentLangLabel: $("#currentLangLabel"),
    shareBtn: $("#shareBtn"),
    toast: $("#toast"),
    modal: $("#infoModal"),
    modalBackdrop: $("#modalBackdrop"),
    modalClose: $("#modalClose"),
    modalTitle: $("#modalTitle"),
    modalBody: $("#modalBody")
  };

  let D = window.DEFAULT_PAGE_DATA || {};
  let currentLang = D.lang || "fr";
  let carouselTimer = null;
  let carouselObserver = null;

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

  function loadLocalFallback() {
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

  async function fetchJson(url, { timeoutMs = 2500 } = {}) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: ctrl.signal
      });
      const json = await res.json().catch(() => null);
      return { ok: res.ok, status: res.status, json };
    } finally {
      clearTimeout(t);
    }
  }

  async function loadServerData() {
    try {
      const out = await fetchJson("/api/page-data", { timeoutMs: 2500 });
      if (!out.ok) return null;
      if (!out.json || out.json.ok !== true) return null;
      if (!out.json.data || typeof out.json.data !== "object") return null;
      return out.json.data;
    } catch (_) {
      return null;
    }
  }

  function setDocumentMeta() {
    const meta = D.meta || {};

    const title = meta.title || document.title;
    if (title) document.title = title;

    const setMeta = (id, content) => {
      if (!content) return;
      const node = $(id);
      if (node) node.setAttribute("content", content);
    };

    setMeta("#metaDescription", meta.description);
    setMeta("#metaOgTitle", meta.ogTitle);
    setMeta("#metaOgDescription", meta.ogDescription);
    setMeta("#metaOgImage", meta.ogImage);
    setMeta("#metaThemeColor", meta.themeColor);
  }

  function applyThemeVars() {
    const t = D.theme || {};
    const root = document.documentElement;

    if (t.brandTeal) root.style.setProperty("--brand-teal", String(t.brandTeal));
    if (t.brandTealDark) root.style.setProperty("--brand-teal-dark", String(t.brandTealDark));
    if (t.brandTealDarker) root.style.setProperty("--brand-teal-darker", String(t.brandTealDarker));
  }

  function localePack(lang = currentLang) {
    return D.i18n?.[lang] || D.i18n?.fr || {};
  }

  function tr(path, fallback = "") {
    const keys = Array.isArray(path) ? path : String(path).split(".");
    const get = (obj) => keys.reduce((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), obj);
    return get(localePack(currentLang)) ?? get(localePack("fr")) ?? fallback;
  }

  function pickText(value, fallback = "") {
    if (value == null) return fallback;
    if (typeof value === "string") return value;
    return value[currentLang] ?? value.fr ?? Object.values(value)[0] ?? fallback;
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const locale = currentLang === "en" ? "en-GB" : "fr-FR";
    return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  }

  function cssUrl(value) {
    return value ? `url("${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")` : "none";
  }

  function isInIframe() {
    try {
      return window.self !== window.top;
    } catch (_) {
      return true;
    }
  }

  function isExternalHttpUrl(url) {
    return /^https?:/i.test(String(url || ""));
  }

  function isLikelyMobile() {
    return window.matchMedia?.("(pointer: coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  function isFacebookUrl(url) {
    try {
      const u = new URL(String(url || ""), window.location.href);
      return /(^|\.)facebook\.com$/i.test(u.hostname);
    } catch (_) {
      return false;
    }
  }

  function normalizeExternalUrl(url, type = "") {
    try {
      const u = new URL(String(url || ""), window.location.href);
      if (String(type).toLowerCase() === "facebook" && /(^|\.)facebook\.com$/i.test(u.hostname)) {
        u.hostname = isLikelyMobile() ? "m.facebook.com" : "www.facebook.com";
        if (!u.pathname) u.pathname = "/";
      }
      return u.toString();
    } catch (_) {
      return String(url || "");
    }
  }

  function facebookMobileFallbackUrl(url) {
    try {
      const u = new URL(String(url || ""), window.location.href);
      if (/(^|\.)facebook\.com$/i.test(u.hostname)) {
        u.hostname = "m.facebook.com";
      }
      return u.toString();
    } catch (_) {
      return String(url || "");
    }
  }

  function extTarget(url) {
    if (!isExternalHttpUrl(url)) return "_self";
    return isInIframe() ? "_top" : "_blank";
  }

  function openExternalSafely(url) {
    url = String(url || "");
    if (!isExternalHttpUrl(url)) return false;

    if (isInIframe()) {
      try {
        window.top.location.href = url;
        return true;
      } catch (_) {}
    }

    try {
      const popup = window.open(url, "_blank", "noopener,noreferrer");
      if (popup) return true;
    } catch (_) {}

    try {
      const a = document.createElement("a");
      a.href = url;
      a.target = extTarget(url);
      if (a.target === "_blank") a.rel = "noopener noreferrer";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    } catch (_) {}

    try {
      window.parent.postMessage({ type: "oti-open-external", url }, "*");
      return true;
    } catch (_) {}

    return false;
  }

  function handleFramedExternalLinkClick(e) {
    if (!isInIframe()) return;
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const anchor = e.target.closest("a[href]");
    if (!anchor) return;
    if ((anchor.target || "").toLowerCase() === "_top") return;

    const href = anchor.getAttribute("href") || "";
    if (!isExternalHttpUrl(href)) return;

    e.preventDefault();
    openExternalSafely(href);
  }

  function isUnmodifiedPrimaryActivation(e) {
    const noModifier = !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
    if (!noModifier) return false;
    if (e.type === "touchend" || e.type === "pointerup") return true;
    if (typeof e.button === "undefined") return true;
    return e.button === 0;
  }

  function sortByOrder(items) {
    return [...items].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
  }

  function groupLinksBySection(items) {
    return sortByOrder(items).reduce((acc, item) => {
      const sectionLabel = pickText(item.section, "Autres");
      (acc[sectionLabel] ||= []).push(item);
      return acc;
    }, {});
  }

  function renderLanguageMenu() {
    el.currentLangLabel.textContent = String(currentLang).toUpperCase();
    el.langMenu.innerHTML = "";

    for (const [code, label] of D.languages || []) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `lang-opt${code === currentLang ? " selected" : ""}`;
      btn.textContent = label;
      btn.setAttribute("role", "menuitemradio");
      btn.setAttribute("aria-checked", code === currentLang ? "true" : "false");

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        currentLang = code;
        renderLanguageMenu();
        renderPage();
        closeLangMenu();
      });

      el.langMenu.appendChild(btn);
    }
  }

  function renderPage() {
    el.heroTagline.textContent = pickText(D.fixedText?.tagline, "");
    renderSections();
    renderFooter();
  }

  function renderSections() {
    const groups = groupLinksBySection(D.links || []);
    el.sections.innerHTML = "";

    let animIdx = 0;
    for (const [sectionLabel, items] of Object.entries(groups)) {
      const section = document.createElement("section");
      section.className = "section";

      const h2 = document.createElement("h2");
      h2.className = "section-title";
      h2.textContent = sectionLabel;

      const cards = document.createElement("div");
      cards.className = "cards";

      for (const item of items) {
        const a = document.createElement("a");
        a.className = "link-card";
        a.href = item.url || "#";
        a.target = extTarget(item.url || "");
        if (a.target === "_blank") a.rel = "noopener noreferrer";
        a.style.animationDelay = `${100 + animIdx * 50}ms`;
        animIdx++;

        const thumb = item.image
          ? `<img class="thumb" src="${item.image}" alt="" loading="lazy" decoding="async">`
          : '<div class="thumb fallback">IMG</div>';

        a.innerHTML = `
          ${thumb}
          <div class="card-main">
            <div class="card-title">${pickText(item.title)}</div>
            ${item.description ? `<div class="card-desc">${pickText(item.description)}</div>` : ""}
            ${item.publishedAt ? `<div class="card-meta">${formatDate(item.publishedAt)}</div>` : ""}
          </div>
          <div class="card-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M13.2 5.3 20 12l-6.8 6.7-1.4-1.4 4.4-4.3H4v-2h12.2l-4.4-4.3 1.4-1.4Z"/></svg>
          </div>
        `;

        cards.appendChild(a);
      }

      section.append(h2, cards);
      el.sections.appendChild(section);
    }
  }

  function renderFooter() {
    el.footerLine.textContent = tr("footerText");
    el.footerLinks.innerHTML = "";

    (D.footerLinks || []).forEach((item, i) => {
      if (i > 0) el.footerLinks.appendChild(document.createTextNode(" · "));

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "footer-link-btn";
      btn.textContent = item.label;

      btn.addEventListener("click", () => {
        if (item.action === "modal") openModal(item.modalKey);
        if (item.action === "url" && item.url) openExternalSafely(item.url);
      });

      el.footerLinks.appendChild(btn);
    });

    const params = new URLSearchParams(window.location.search);
    const showAdmin = params.get("admin") === "1";
    if (showAdmin) {
      if ((D.footerLinks || []).length) el.footerLinks.appendChild(document.createTextNode(" · "));
      const a = document.createElement("a");
      a.href = "admin.html";
      a.textContent = "Admin";
      a.target = "_self";
      el.footerLinks.appendChild(a);
    }

    el.footerLinks.hidden = !(el.footerLinks.childNodes && el.footerLinks.childNodes.length);
  }

  function setupCarousel() {
    const images = D.assets?.heroImages || [];
    el.carousel.innerHTML = "";
    if (!images.length) return;

    images.forEach((src, index) => {
      const slide = document.createElement("div");
      slide.className = `slide${index === 0 ? " active" : ""}`;
      slide.style.backgroundImage = cssUrl(src);
      el.carousel.appendChild(slide);
    });

    if (images.length < 2) return;

    if ("IntersectionObserver" in window) {
      carouselObserver?.disconnect();
      carouselObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) startCarousel();
        else stopCarousel();
      }, { threshold: 0.15 });
      carouselObserver.observe(el.hero);
    } else {
      startCarousel();
    }
  }

  function startCarousel() {
    if (carouselTimer) return;

    carouselTimer = setInterval(() => {
      const slides = el.carousel.children;
      if (!slides.length) return;

      const activeIndex = Array.from(slides).findIndex((s) => s.classList.contains("active"));
      const i = activeIndex < 0 ? 0 : activeIndex;

      slides[i]?.classList.remove("active");
      slides[(i + 1) % slides.length]?.classList.add("active");
    }, 5000);
  }

  function stopCarousel() {
    if (!carouselTimer) return;
    clearInterval(carouselTimer);
    carouselTimer = null;
  }

  function setupLogo() {
    const src = D.assets?.logoMain;
    if (!src) return;

    const img = document.createElement("img");
    img.src = src;
    img.alt = D.assets?.logoAlt || "Logo";

    img.onerror = () => {
      if (el.logoPlaceholder) el.logoPlaceholder.style.display = "block";
      img.remove();
    };

    el.logoBox.innerHTML = "";
    el.logoBox.appendChild(img);
  }

  function setupSocials() {
    el.socials.innerHTML = "";

    for (const [type, url, icon] of (D.socials || [])) {
      const normalizedUrl = normalizeExternalUrl(url, type);
      const linkType = String(type || "").toLowerCase();
      const isFacebook = linkType === "facebook" || isFacebookUrl(normalizedUrl);
      const isMobile = isLikelyMobile();

      const href = isFacebook && isMobile ? facebookMobileFallbackUrl(normalizedUrl) : normalizedUrl;

      const a = document.createElement("a");
      a.href = href;

      if (isFacebook && isMobile) {
        a.target = isInIframe() ? "_top" : "_self";
      } else {
        a.target = extTarget(href);
      }

      if (a.target === "_blank") a.rel = "noopener noreferrer";

      a.dataset.linkType = linkType;
      a.dataset.isFacebook = isFacebook ? "1" : "0";
      a.dataset.mobileHref = href;

      a.addEventListener(
        "click",
        (e) => {
          a.classList.add("is-loading");
          clearTimeout(a._loadingTimer);
          a._loadingTimer = setTimeout(() => a.classList.remove("is-loading"), 2000);

          const isPrimary = isUnmodifiedPrimaryActivation(e);

          if (a.dataset.isFacebook === "1" && isMobile && isPrimary && isInIframe()) {
            e.preventDefault();
            const ok = openExternalSafely(a.dataset.mobileHref || href);
            if (!ok) a.classList.remove("is-loading");
          }
        },
        true
      );

      const img = document.createElement("img");
      img.src = icon;
      img.alt = type;
      img.width = 64;
      img.height = 64;
      img.loading = "lazy";
      img.decoding = "async";

      a.appendChild(img);
      el.socials.appendChild(a);
    }
  }

  function openModal(modalKey) {
    const modalData = D.modals?.[modalKey];
    if (!modalData) return;

    el.modalTitle.textContent = modalData.title || "";
    el.modalBody.innerHTML = modalData.html || "";
    el.modal.hidden = false;

    requestAnimationFrame(() => {
      el.modal.classList.add("open");
      document.body.classList.add("modal-open");
    });
  }

  function closeModal() {
    el.modal.classList.remove("open");
    document.body.classList.remove("modal-open");
    setTimeout(() => {
      el.modal.hidden = true;
    }, 300);
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("visible");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => el.toast.classList.remove("visible"), 3000);
  }

  async function onShareClick() {
    const shareData = {
      title: tr("shareTitle"),
      text: pickText(D.fixedText?.tagline, ""),
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (_) {}
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(tr("shareSuccess"));
    } catch (_) {
      alert(tr("shareCopyError", "Impossible de copier le lien."));
    }
  }

  function openLangMenu() {
    el.langMenu.classList.add("open");
    el.langTrigger.classList.add("active");
    el.langTrigger.setAttribute("aria-expanded", "true");
  }

  function closeLangMenu() {
    el.langMenu.classList.remove("open");
    el.langTrigger.classList.remove("active");
    el.langTrigger.setAttribute("aria-expanded", "false");
  }

  function bindEventsOnce() {
    if (window.__otiBindingsDone) return;
    window.__otiBindingsDone = true;

    document.addEventListener(
      "pointerdown",
      (e) => {
        const a = e.target.closest(".socials a, .link-card");
        if (!a) return;

        a.classList.add("is-loading");
        clearTimeout(a._loadingTimer);
        a._loadingTimer = setTimeout(() => a.classList.remove("is-loading"), 1800);
      },
      true
    );

    el.langTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      el.langMenu.classList.contains("open") ? closeLangMenu() : openLangMenu();
    });

    document.addEventListener("click", closeLangMenu);
    document.addEventListener("click", handleFramedExternalLinkClick, true);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopCarousel();
      else if (el.hero && (D.assets?.heroImages || []).length > 1) startCarousel();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeLangMenu();
        if (!el.modal.hidden) closeModal();
      }
    });

    el.modalClose.addEventListener("click", closeModal);
    el.modalBackdrop.addEventListener("click", closeModal);
    el.shareBtn.addEventListener("click", onShareClick);

    window.addEventListener("storage", (e) => {
      if (e.key !== STORAGE_KEY) return;
      const local = loadLocalFallback() || {};
      setData(deepMerge(window.DEFAULT_PAGE_DATA || {}, local), { preserveLang: true });
    });

    window.addEventListener("message", (event) => {
      const msg = event?.data;
      if (!msg || typeof msg !== "object") return;
      if (msg.type !== "oti-page-data-preview") return;
      if (!msg.data || typeof msg.data !== "object") return;
      setData(deepMerge(window.DEFAULT_PAGE_DATA || {}, msg.data), { preserveLang: true });
    });
  }

  function setData(nextData, opts = {}) {
    const preserveLang = Boolean(opts.preserveLang);
    D = nextData || {};

    if (!preserveLang) currentLang = D.lang || "fr";
    else {
      const available = new Set((D.languages || []).map(([code]) => code));
      if (!available.has(currentLang)) currentLang = D.lang || "fr";
    }

    stopCarousel();
    carouselObserver?.disconnect();
    carouselObserver = null;

    setDocumentMeta();
    applyThemeVars();
    setupCarousel();
    setupLogo();
    setupSocials();
    renderLanguageMenu();
    renderPage();
  }

  async function init() {
    bindEventsOnce();

    const server = await loadServerData();
    if (server) {
      setData(deepMerge(window.DEFAULT_PAGE_DATA || {}, server), { preserveLang: false });
      return;
    }

    const local = loadLocalFallback();
    if (local) {
      setData(deepMerge(window.DEFAULT_PAGE_DATA || {}, local), { preserveLang: false });
      return;
    }

    setData(window.DEFAULT_PAGE_DATA || {}, { preserveLang: false });
  }

  init();
})();


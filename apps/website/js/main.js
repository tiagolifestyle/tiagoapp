(function () {
  "use strict";

  const CONFIG = window.SITE_CONFIG;
  const I18N = window.I18N;
  const LANGS = ["pt", "es", "en"];
  const STORAGE_KEY = "tls-lang";

  let lang = detectLang();
  let shopFilter = "all";
  // Escolha do plano Basic (treino / nutrição), guardada entre mudanças de língua.
  const planChoice = { basic: "training" };

  // ---------- Língua ----------

  function detectLang() {
    const fromUrl = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(fromUrl)) return fromUrl;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (LANGS.includes(saved)) return saved;
    } catch (e) {}
    const nav = (navigator.language || "pt").slice(0, 2).toLowerCase();
    return LANGS.includes(nav) ? nav : "pt";
  }

  function t(path) {
    const value = path.split(".").reduce((obj, key) => (obj == null ? obj : obj[key]), I18N[lang]);
    return value == null ? "" : value;
  }

  function fill(template, vars) {
    return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? "" : vars[k]));
  }

  function formatPrice(value) {
    const locale = { pt: "pt-PT", es: "es-ES", en: "en-IE" }[lang];
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  }

  function setLang(next) {
    lang = next;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
    applyTranslations();
  }

  function applyTranslations() {
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("meta.description"));

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":");
        el.setAttribute(attr.trim(), t(key.trim()));
      });
    });
    document.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
    });

    renderTicker();
    renderPlans();
    renderProducts();
    updateStoreButtons();
    updateStaticLinks();
  }

  // ---------- WhatsApp ----------

  function waUrl(message) {
    const number = (CONFIG.whatsappNumber || "").replace(/\D/g, "");
    return "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
  }

  function updateStaticLinks() {
    document.querySelectorAll("[data-wa]").forEach((el) => {
      el.href = waUrl(t("wa." + el.dataset.wa));
    });
    document.querySelectorAll("[data-instagram]").forEach((el) => {
      el.href = CONFIG.instagram.url;
    });
    document.querySelectorAll(".ig-handle").forEach((el) => {
      el.textContent = "@" + CONFIG.instagram.handle;
    });
  }

  // ---------- Faixa animada ----------

  function renderTicker() {
    const track = document.getElementById("ticker");
    const words = t("ticker");
    const row = words.map((w) => "<span>" + w + "</span><i>◆</i>").join("");
    // Duplicado para o loop contínuo.
    track.innerHTML = row + row + row + row;
  }

  // ---------- Planos ----------

  const planTextKey = { basic: "basic", premium: "premium", vip: "vipPlan" };

  function planMessage(plan) {
    const name = t("plans." + planTextKey[plan.id] + ".name");
    const price = formatPrice(plan.price);
    if (plan.choice) {
      const choice = t("plans." + planChoice[plan.id]);
      return fill(t("wa.planChoice"), { plan: name, choice: choice, price: price });
    }
    return fill(t("wa.plan"), { plan: name, price: price });
  }

  function renderPlans() {
    const grid = document.getElementById("plans-grid");
    grid.innerHTML = "";

    CONFIG.plans.forEach((plan) => {
      const key = "plans." + planTextKey[plan.id];
      const texts = t(key);
      const features = Object.keys(texts)
        .filter((k) => /^f\d+$/.test(k))
        .map((k) => '<li><svg><use href="#i-check"/></svg><span>' + texts[k] + "</span></li>")
        .join("");

      let badge = "";
      if (plan.badge === "popular") badge = '<span class="plan-badge">' + t("plans.popular") + "</span>";
      if (plan.badge === "vip") badge = '<span class="plan-badge plan-badge-vip"><svg><use href="#i-crown"/></svg>' + t("plans.vip") + "</span>";

      let choice = "";
      if (plan.choice) {
        choice =
          '<div class="plan-choice" role="radiogroup"><span>' +
          t("plans.choose") +
          "</span>" +
          ["training", "nutrition"]
            .map(
              (opt) =>
                '<button type="button" role="radio" data-choice="' +
                opt +
                '" aria-checked="' +
                (planChoice[plan.id] === opt) +
                '">' +
                t("plans." + opt) +
                "</button>"
            )
            .join("") +
          "</div>";
      }

      const card = document.createElement("article");
      card.className = "plan plan-" + plan.id + " is-visible";
      card.innerHTML =
        badge +
        '<h3 class="plan-name">' +
        texts.name +
        "</h3>" +
        '<p class="plan-tagline">' +
        texts.tagline +
        "</p>" +
        '<div class="plan-price"><strong>' +
        formatPrice(plan.price) +
        "</strong><span>" +
        t("plans.perMonth") +
        "</span></div>" +
        choice +
        '<ul class="plan-features">' +
        features +
        "</ul>" +
        '<a class="btn ' +
        (plan.badge === "popular" ? "btn-gold" : "btn-dark") +
        ' plan-cta" target="_blank" rel="noopener"><svg><use href="#i-whatsapp"/></svg><span>' +
        t("plans.cta") +
        "</span></a>";

      const cta = card.querySelector(".plan-cta");
      cta.href = waUrl(planMessage(plan));

      card.querySelectorAll("[data-choice]").forEach((btn) => {
        btn.addEventListener("click", () => {
          planChoice[plan.id] = btn.dataset.choice;
          card.querySelectorAll("[data-choice]").forEach((b) => b.setAttribute("aria-checked", String(b === btn)));
          cta.href = waUrl(planMessage(plan));
        });
      });

      grid.appendChild(card);
    });
  }

  // ---------- Loja ----------

  const productIcons = {
    tshirt:
      '<path d="M22 8 12 13l-6 10 9 4 3-5v34h28V22l3 5 9-4-6-10-10-5c-1 4-5 7-10 7s-9-3-10-7Z"/>',
    hoodie:
      '<path d="M24 9c0-1 4-3 8-3s8 2 8 3l10 5 7 12-8 4-3-5v31H18V25l-3 5-8-4 7-12 10-5Z"/><path d="M24 9c0 6 3 11 8 11s8-5 8-11"/><path d="M29 20v9M35 20v9"/><path d="M24 44h16"/>',
    leggings:
      '<path d="M20 6h24l2 52h-10l-4-36-4 36H18l2-52Z"/><path d="M20 12h24"/>',
    cap:
      '<path d="M10 38c0-13 10-22 22-22s22 9 22 22H10Z"/><path d="M10 38c10 2 32 2 48 0l2 4c-16 3-38 3-52 0Z"/><path d="M32 16v4"/>',
    towel:
      '<rect x="14" y="8" width="36" height="48" rx="3"/><path d="M14 46h36M14 50h36"/><path d="M24 8v-2h16v2"/>',
    bottle:
      '<path d="M26 4h12v6H26z"/><path d="M24 10h16c2 0 4 2 4 4v42c0 2-2 4-4 4H24c-2 0-4-2-4-4V14c0-2 2-4 4-4Z"/><path d="M20 24h24"/>',
    shaker:
      '<path d="M22 6h20l-2 8H24Z"/><path d="M20 14h24l-4 44H24Z"/><path d="M22 26h20M23 36h18"/>',
    bag:
      '<rect x="6" y="22" width="52" height="30" rx="6"/><path d="M22 22v-6c0-2 2-4 4-4h12c2 0 4 2 4 4v6"/><path d="M6 34h52"/>',
  };

  function productMessage(product, size) {
    const name = t("shop.products." + product.id + ".name");
    if (product.price == null) return fill(t("wa.notify"), { product: name });
    const sizeText = size ? fill(t("wa.sizeSuffix"), { size: size }) : "";
    return fill(t("wa.order"), { product: name, size: sizeText });
  }

  function renderProducts() {
    const wrap = document.getElementById("products");
    wrap.innerHTML = "";

    CONFIG.products
      .filter((p) => shopFilter === "all" || p.category === shopFilter)
      .forEach((product) => {
        const texts = t("shop.products." + product.id);
        const available = product.price != null;
        let selectedSize = product.sizes[Math.min(1, product.sizes.length - 1)] || null;

        const sizes = product.sizes.length
          ? '<div class="sizes" role="radiogroup" aria-label="' +
            t("shop.size") +
            '">' +
            product.sizes
              .map(
                (s) =>
                  '<button type="button" role="radio" data-size="' +
                  s +
                  '" aria-checked="' +
                  (s === selectedSize) +
                  '">' +
                  s +
                  "</button>"
              )
              .join("") +
            "</div>"
          : "";

        const card = document.createElement("article");
        card.className = "product is-visible";
        card.innerHTML =
          '<div class="product-media tone-' +
          product.tone +
          '">' +
          (available ? "" : '<span class="product-soon">' + t("shop.soon") + "</span>") +
          '<svg class="product-icon" viewBox="0 0 64 64" aria-hidden="true">' +
          productIcons[product.icon] +
          "</svg>" +
          '<img class="product-logo" src="assets/img/logo-mark-sm.png" alt="" width="28" height="30" loading="lazy"/>' +
          "</div>" +
          '<div class="product-body">' +
          '<div class="product-top"><h3>' +
          texts.name +
          "</h3><span class=\"product-price\">" +
          (available ? formatPrice(product.price) : t("shop.soon")) +
          "</span></div>" +
          "<p>" +
          texts.desc +
          "</p>" +
          sizes +
          '<a class="btn btn-outline-dark btn-sm product-cta" target="_blank" rel="noopener"><svg><use href="#i-whatsapp"/></svg><span>' +
          (available ? t("shop.order") : t("shop.notify")) +
          "</span></a>" +
          "</div>";

        const cta = card.querySelector(".product-cta");
        cta.href = waUrl(productMessage(product, selectedSize));

        card.querySelectorAll("[data-size]").forEach((btn) => {
          btn.addEventListener("click", () => {
            selectedSize = btn.dataset.size;
            card.querySelectorAll("[data-size]").forEach((b) => b.setAttribute("aria-checked", String(b === btn)));
            cta.href = waUrl(productMessage(product, selectedSize));
          });
        });

        wrap.appendChild(card);
      });
  }

  // ---------- App ----------

  function updateStoreButtons() {
    document.querySelectorAll("[data-store]").forEach((btn) => {
      const url = CONFIG.appLinks[btn.dataset.store];
      btn.classList.toggle("is-soon", !url);
      if (url) {
        btn.href = url;
        btn.target = "_blank";
        btn.rel = "noopener";
      } else {
        // Sem link ainda: leva ao WhatsApp para pedir acesso.
        btn.href = waUrl(t("wa.app"));
        btn.target = "_blank";
        btn.rel = "noopener";
      }
    });
  }

  // ---------- Interações ----------

  function setupInteractions() {
    document.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.dataset.lang));
    });

    document.querySelectorAll("[data-filter]").forEach((chip) => {
      chip.addEventListener("click", () => {
        shopFilter = chip.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach((c) => c.classList.toggle("is-active", c === chip));
        renderProducts();
      });
    });

    const header = document.querySelector(".site-header");
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
      document.body.classList.toggle("show-float", window.scrollY > window.innerHeight * 0.6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const toggle = document.querySelector(".menu-toggle");
    const nav = document.getElementById("main-nav");
    const closeMenu = () => {
      document.body.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

    // Animação de entrada ao fazer scroll.
    const items = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px" }
      );
      items.forEach((el) => io.observe(el));
    } else {
      items.forEach((el) => el.classList.add("is-visible"));
    }

    document.getElementById("year").textContent = new Date().getFullYear();
  }

  setupInteractions();
  applyTranslations();
})();

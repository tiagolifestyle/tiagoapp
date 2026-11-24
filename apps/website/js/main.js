(function () {
  "use strict";

  const CONFIG = window.SITE_CONFIG;
  const I18N = window.I18N;
  const LANGS = ["pt", "es", "en"];
  const STORAGE_KEY = "tls-lang";

  let lang = detectLang();
  // Escolha treino / nutrição de cada plano, guardada entre mudanças de língua.
  const planChoice = {};
  CONFIG.plans.forEach((p) => {
    if (p.choice) planChoice[p.id] = "training";
  });
  // Cartão visível em cada grupo de planos que desliza (ex.: Basic / Basic 3 meses).
  const planSlide = {};
  let planSliders = [];

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
    renderShop();
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

  const planTextKey = { basic: "basic", basic3: "basic3", premium: "premium", vip: "vipPlan" };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function planMessage(plan) {
    const name = t("plans." + planTextKey[plan.id] + ".name");
    const price = formatPrice(plan.price);
    const choice = plan.choice ? t("plans." + planChoice[plan.id]) : "";
    if (plan.months) return fill(t("wa.planBundle"), { plan: name, choice: choice, price: price });
    if (plan.choice) return fill(t("wa.planChoice"), { plan: name, choice: choice, price: price });
    return fill(t("wa.plan"), { plan: name, price: price });
  }

  function planPriceHtml(plan) {
    if (!plan.comparePrice) {
      return (
        '<div class="plan-price"><strong>' +
        formatPrice(plan.price) +
        "</strong><span>" +
        t("plans.perMonth") +
        "</span></div>"
      );
    }
    const note =
      fill(t("plans.monthly"), { price: formatPrice(plan.price / plan.months) }) +
      " · " +
      fill(t("plans.youSave"), { amount: formatPrice(plan.comparePrice - plan.price) });
    return (
      '<div class="plan-price plan-price-deal"><del>' +
      formatPrice(plan.comparePrice) +
      "</del><strong>" +
      formatPrice(plan.price) +
      "</strong><span>" +
      fill(t("plans.forMonths"), { n: plan.months }) +
      '</span><small class="plan-price-note">' +
      note +
      "</small></div>"
    );
  }

  function buildPlanCard(plan) {
    const texts = t("plans." + planTextKey[plan.id]);
    const features = Object.keys(texts)
      .filter((k) => /^f\d+$/.test(k))
      .map((k) => '<li><svg><use href="#i-check"/></svg><span>' + texts[k] + "</span></li>")
      .join("");

    let badge = "";
    if (plan.badge === "popular") badge = '<span class="plan-badge">' + t("plans.popular") + "</span>";
    if (plan.badge === "vip") badge = '<span class="plan-badge plan-badge-vip"><svg><use href="#i-crown"/></svg>' + t("plans.vip") + "</span>";
    if (plan.badge === "discount") {
      const pct = Math.round((1 - plan.price / plan.comparePrice) * 100);
      badge = '<span class="plan-badge">' + fill(t("plans.discount"), { pct: pct }) + "</span>";
    }

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
      planPriceHtml(plan) +
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

    return card;
  }

  // Coluna com vários cartões que desliza: com o dedo no telemóvel, com as setas no computador.
  function buildPlanSlider(groupId, plans) {
    const slider = document.createElement("div");
    slider.className = "plan-slider";
    const track = document.createElement("div");
    track.className = "plan-track";
    const cards = plans.map(buildPlanCard);
    cards.forEach((c) => track.appendChild(c));

    const nav = document.createElement("div");
    nav.className = "plan-slider-nav";
    nav.innerHTML =
      '<button type="button" class="plan-arrow plan-arrow-prev" aria-label="' +
      t("plans.prevPlan") +
      '"><svg><use href="#i-arrow"/></svg></button><div class="plan-dots">' +
      plans
        .map(
          (p, i) =>
            '<button type="button" class="plan-dot" data-index="' +
            i +
            '" aria-label="' +
            t("plans." + planTextKey[p.id] + ".name") +
            '"></button>'
        )
        .join("") +
      '</div><button type="button" class="plan-arrow plan-arrow-next" aria-label="' +
      t("plans.nextPlan") +
      '"><svg><use href="#i-arrow"/></svg></button>';

    slider.appendChild(track);
    slider.appendChild(nav);

    const prev = nav.querySelector(".plan-arrow-prev");
    const next = nav.querySelector(".plan-arrow-next");
    const dots = nav.querySelectorAll(".plan-dot");

    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const index = max > 0 ? Math.round((track.scrollLeft / max) * (cards.length - 1)) : 0;
      planSlide[groupId] = index;
      dots.forEach((d, i) => d.setAttribute("aria-current", String(i === index)));
      prev.disabled = index === 0;
      next.disabled = index === cards.length - 1;
    };

    const go = (index, smooth) => {
      const i = Math.max(0, Math.min(cards.length - 1, index));
      const left = cards[i].offsetLeft - parseFloat(getComputedStyle(track).paddingLeft);
      track.scrollTo({ left: left, behavior: smooth && !reduceMotion ? "smooth" : "auto" });
    };

    prev.addEventListener("click", () => go((planSlide[groupId] || 0) - 1, true));
    next.addEventListener("click", () => go((planSlide[groupId] || 0) + 1, true));
    dots.forEach((d) => d.addEventListener("click", () => go(Number(d.dataset.index), true)));
    track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });

    const realign = () => {
      go(planSlide[groupId] || 0, false);
      update();
    };
    return { el: slider, realign: realign };
  }

  function renderPlans() {
    const grid = document.getElementById("plans-grid");
    grid.innerHTML = "";
    planSliders = [];

    const done = {};
    CONFIG.plans.forEach((plan) => {
      if (!plan.group) {
        grid.appendChild(buildPlanCard(plan));
        return;
      }
      if (done[plan.group]) return;
      done[plan.group] = true;
      const slider = buildPlanSlider(
        plan.group,
        CONFIG.plans.filter((p) => p.group === plan.group)
      );
      grid.appendChild(slider.el);
      planSliders.push(slider);
    });

    grid.classList.toggle("has-slider", planSliders.length > 0);
    planSliders.forEach((s) => s.realign());
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

  // Tamanho escolhido em cada peça, guardado entre mudanças de língua.
  const shopSize = {};

  // Código promocional aplicado ({ code, percent }), válido em todas as peças durante a visita.
  const PROMO_KEY = "tls-promo";
  let promo = null;
  try {
    promo = JSON.parse(sessionStorage.getItem(PROMO_KEY));
  } catch (e) {}

  function savePromo() {
    try {
      if (promo) sessionStorage.setItem(PROMO_KEY, JSON.stringify(promo));
      else sessionStorage.removeItem(PROMO_KEY);
    } catch (e) {}
  }

  function normalizeCode(value) {
    return value.replace(/\s+/g, "").toUpperCase();
  }

  // Os códigos estão guardados cifrados em config.js (SHA-256), por isso compara-se o código cifrado.
  async function findPromo(code) {
    if (!code || !window.crypto || !crypto.subtle) return null;
    const data = new TextEncoder().encode("tiagolifestyle:" + code);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return (CONFIG.promoCodes || []).find((c) => c.hash === hash) || null;
  }

  function finalPrice(product) {
    if (!promo) return product.price;
    return Math.round(product.price * (100 - promo.percent)) / 100;
  }

  function promoHtml() {
    if (promo) {
      return (
        '<div class="promo-applied" role="status"><span>' +
        fill(t("shop.promoApplied"), { code: promo.code, percent: promo.percent }) +
        '</span><button type="button" class="promo-remove">' +
        t("shop.promoRemove") +
        "</button></div>"
      );
    }
    return (
      '<form class="promo" novalidate><label class="pdp-label" for="promo-code">' +
      t("shop.promoLabel") +
      '</label><div class="promo-row"><input id="promo-code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' +
      t("shop.promoPlaceholder") +
      '"/><button type="submit" class="btn btn-dark btn-sm">' +
      t("shop.promoApply") +
      '</button></div><p class="promo-msg" role="status"></p></form>'
    );
  }

  // A loja tem 3 vistas, escolhidas pelo endereço: #shop (categorias),
  // #shop-<categoria> ou #shop-<categoria>-<tipo> (peças) e #shop-<peça> (detalhe da peça).
  function shopRoute() {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash.indexOf("shop-") === 0) {
      const id = hash.slice(5);
      for (const cat of CONFIG.shopCategories) {
        if (id === cat.id) return { view: "category", id: cat.id };
        const type = id.slice(cat.id.length + 1);
        if (id.indexOf(cat.id + "-") === 0 && typesIn(cat.id).includes(type)) {
          return { view: "category", id: cat.id, type: type };
        }
      }
      if (CONFIG.products.some((p) => p.id === id)) return { view: "product", id: id };
    }
    return { view: "categories" };
  }

  function productsIn(categoryId, type) {
    return CONFIG.products.filter((p) => p.category === categoryId && (!type || p.type === type));
  }

  // Tipos de uma categoria (ex.: manga curta), pela ordem em que aparecem nos produtos.
  function typesIn(categoryId) {
    const types = [];
    productsIn(categoryId).forEach((p) => {
      if (p.type && !types.includes(p.type)) types.push(p.type);
    });
    return types;
  }

  function collectionName(categoryId, type) {
    const name = t("shop.categories." + categoryId);
    return type ? name + " · " + t("shop.types." + type) : name;
  }

  function collectionHref(categoryId, type) {
    return "#shop-" + categoryId + (type ? "-" + type : "");
  }

  function itemsCount(n) {
    return fill(t(n === 1 ? "shop.itemsOne" : "shop.itemsMany"), { n: n });
  }

  function tagsHtml(product) {
    return (
      (product.limited ? '<span class="shop-tag is-limited">' + t("shop.categories.limited") + "</span>" : "") +
      (product.type ? '<span class="shop-tag">' + t("shop.types." + product.type) + "</span>" : "")
    );
  }

  // Unidades de uma edição limitada: "Restam 6 de 7", ou "Esgotado".
  function stockText(product) {
    if (!product.limited) return "";
    if (product.limited.left <= 0) return t("shop.soldOut");
    return fill(t("shop.unitsLeft"), { left: product.limited.left, total: product.limited.total });
  }

  function isSoldOut(product) {
    return Boolean(product.limited) && product.limited.left <= 0;
  }

  function categoriesHtml() {
    const cards = CONFIG.shopCategories.filter((cat) => !cat.hidden).map((cat) => {
      const name = t("shop.categories." + cat.id);
      const items = productsIn(cat.id);
      if (items.length) {
        // Um cartão por tipo: selo com a categoria (ex.: T-shirts) e título com o tipo (ex.: Manga curta).
        const types = typesIn(cat.id);
        return (types.length ? types : [null])
          .map((type) => {
            const group = productsIn(cat.id, type);
            return (
              '<a class="shop-cat" href="' +
              collectionHref(cat.id, type) +
              '"><div class="shop-cat-media"><img src="' +
              group[0].images[0] +
              '" alt="" width="1024" height="1024" loading="lazy"/>' +
              (type ? '<span class="product-soon">' + name + "</span>" : "") +
              '</div><div class="shop-cat-body"><h3>' +
              (type ? t("shop.types." + type) : name) +
              "</h3><span>" +
              itemsCount(group.length) +
              " · " +
              t("shop.viewItems") +
              '<svg><use href="#i-arrow"/></svg></span></div></a>'
            );
          })
          .join("");
      }
      // Sem peças ainda: "Em breve", e o cartão pede para ser avisado pelo WhatsApp.
      return (
        '<a class="shop-cat is-soon" target="_blank" rel="noopener" href="' +
        waUrl(fill(t("wa.notifyCategory"), { category: name })) +
        '"><div class="shop-cat-media product-media tone-' +
        cat.tone +
        '"><span class="product-soon">' +
        t("shop.soon") +
        '</span><svg class="product-icon" viewBox="0 0 64 64" aria-hidden="true">' +
        productIcons[cat.icon] +
        '</svg><img class="product-logo" src="assets/img/logo-mark-sm.png" alt="" width="28" height="30" loading="lazy"/></div><div class="shop-cat-body"><h3>' +
        name +
        "</h3><span>" +
        t("shop.notify") +
        "</span></div></a>"
      );
    });
    return '<div class="shop-cats">' + cards.join("") + "</div>";
  }

  function categoryHtml(id, type) {
    const items = productsIn(id, type);
    const cards = items.map((p) => {
      const texts = t("shop.products." + p.id);
      return (
        '<a class="shop-item" href="#shop-' +
        p.id +
        '"><div class="shop-item-media"><img src="' +
        p.images[0] +
        '" alt="' +
        texts.name +
        '" width="1024" height="1024" loading="lazy"/>' +
        (p.images[1]
          ? '<img class="shop-item-alt" src="' + p.images[1] + '" alt="" width="1024" height="1024" loading="lazy"/>'
          : "") +
        '</div><div class="shop-item-body"><div class="shop-tags">' +
        tagsHtml(p) +
        "</div><h4>" +
        texts.name +
        '</h4><span class="shop-item-price">' +
        formatPrice(p.price) +
        "</span>" +
        (p.limited ? '<span class="shop-stock">' + stockText(p) + "</span>" : "") +
        "</div></a>"
      );
    });
    return (
      '<div class="shop-bar"><a class="shop-back" href="#shop"><svg><use href="#i-arrow"/></svg>' +
      t("shop.allCategories") +
      '</a><h3 class="shop-bar-title">' +
      collectionName(id, type) +
      " <small>" +
      itemsCount(items.length) +
      '</small></h3></div><div class="shop-grid">' +
      cards.join("") +
      "</div>"
    );
  }

  function productHtml(id) {
    const p = CONFIG.products.find((x) => x.id === id);
    const texts = t("shop.products." + id);
    const sides = [t("shop.front"), t("shop.back")];
    const slides = p.images
      .map(
        (src, i) =>
          '<img src="' +
          src +
          '" alt="' +
          texts.name +
          (sides[i] ? " — " + sides[i] : "") +
          '" width="1024" height="1024"' +
          (i ? ' loading="lazy"' : "") +
          "/>"
      )
      .join("");
    const thumbs =
      p.images.length > 1
        ? '<div class="pdp-thumbs">' +
          p.images
            .map(
              (src, i) =>
                '<button type="button" data-slide="' +
                i +
                '" aria-label="' +
                (sides[i] || String(i + 1)) +
                '"><img src="' +
                src +
                '" alt="" width="1024" height="1024"/></button>'
            )
            .join("") +
          "</div>"
        : "";
    const soldOut = p.soldOut || [];
    const sizes = p.sizes
      .map(
        (s) =>
          '<button type="button" role="radio" data-size="' +
          s +
          '" aria-checked="' +
          (shopSize[id] === s) +
          '"' +
          (soldOut.includes(s) || isSoldOut(p) ? ' disabled title="' + t("shop.soldOut") + '"' : "") +
          ">" +
          s +
          "</button>"
      )
      .join("");
    return (
      '<div class="shop-bar"><a class="shop-back" href="' +
      collectionHref(p.category, p.type) +
      '"><svg><use href="#i-arrow"/></svg>' +
      collectionName(p.category, p.type) +
      '</a></div><div class="pdp"><div class="pdp-gallery"><div class="pdp-track">' +
      slides +
      "</div>" +
      thumbs +
      '</div><div class="pdp-info"><div class="shop-tags">' +
      tagsHtml(p) +
      '</div><h3 class="pdp-name">' +
      texts.name +
      '</h3><div class="pdp-price">' +
      (promo ? "<del>" + formatPrice(p.price) + "</del>" + formatPrice(finalPrice(p)) : formatPrice(p.price)) +
      "</div>" +
      (p.limited
        ? '<div class="shop-stock pdp-stock">' +
          fill(t("shop.editionOf"), { total: p.limited.total }) +
          " · " +
          stockText(p) +
          "</div>"
        : "") +
      promoHtml() +
      '<p class="pdp-desc">' +
      texts.desc +
      '</p><div class="pdp-label">' +
      t("shop.color") +
      ": <b>" +
      texts.color +
      '</b><span class="pdp-swatch" style="background:' +
      p.swatch +
      '"></span></div><div class="pdp-label">' +
      t("shop.size") +
      '</div><div class="sizes pdp-sizes" role="radiogroup" aria-label="' +
      t("shop.size") +
      '">' +
      sizes +
      '</div><a class="btn btn-gold pdp-cta" target="_blank" rel="noopener"><svg><use href="#i-whatsapp"/></svg><span></span></a><p class="pdp-note">' +
      t("shop.orderNote") +
      "</p></div></div>"
    );
  }

  function setupProduct(view, id) {
    const p = CONFIG.products.find((x) => x.id === id);
    const texts = t("shop.products." + id);
    const cta = view.querySelector(".pdp-cta");
    const label = cta.querySelector("span");
    const sizeButtons = view.querySelectorAll("[data-size]");

    // O botão só encomenda depois de escolher o tamanho (e enquanto houver unidades).
    const updateCta = () => {
      const size = isSoldOut(p) ? null : shopSize[id];
      if (isSoldOut(p)) {
        cta.removeAttribute("href");
        cta.classList.add("is-disabled");
        cta.setAttribute("aria-disabled", "true");
        label.textContent = t("shop.soldOut");
      } else if (size) {
        const template = (p.limited ? "wa.orderLimited" : "wa.order") + (promo ? "Promo" : "");
        cta.href = waUrl(
          fill(t(template), {
            product: texts.name,
            color: texts.color,
            size: size,
            price: formatPrice(p.price),
            code: promo ? promo.code : "",
            percent: promo ? promo.percent : "",
            final: formatPrice(finalPrice(p)),
          })
        );
        cta.classList.remove("is-disabled");
        cta.removeAttribute("aria-disabled");
        label.textContent = t("shop.order");
      } else {
        cta.removeAttribute("href");
        cta.classList.add("is-disabled");
        cta.setAttribute("aria-disabled", "true");
        label.textContent = t("shop.chooseSize");
      }
    };

    const promoForm = view.querySelector(".promo");
    if (promoForm) {
      promoForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = promoForm.querySelector("input");
        const msg = promoForm.querySelector(".promo-msg");
        const code = normalizeCode(input.value);
        if (!code) return;
        const match = await findPromo(code);
        if (match) {
          promo = { code: code, percent: match.percent };
          savePromo();
          renderShop();
        } else {
          msg.textContent = t("shop.promoInvalid");
          msg.classList.add("is-error");
        }
      });
    }
    const promoRemove = view.querySelector(".promo-remove");
    if (promoRemove) {
      promoRemove.addEventListener("click", () => {
        promo = null;
        savePromo();
        renderShop();
      });
    }

    sizeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        shopSize[id] = btn.dataset.size;
        sizeButtons.forEach((b) => b.setAttribute("aria-checked", String(b === btn)));
        updateCta();
      });
    });
    cta.addEventListener("click", (e) => {
      if (shopSize[id]) return;
      e.preventDefault();
      const first = view.querySelector("[data-size]:not(:disabled)");
      if (first) first.focus();
    });
    updateCta();

    const track = view.querySelector(".pdp-track");
    const thumbs = view.querySelectorAll("[data-slide]");
    const setActive = () => {
      const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      thumbs.forEach((b, j) => b.setAttribute("aria-current", String(i === j)));
    };
    thumbs.forEach((b) => {
      b.addEventListener("click", () => {
        track.scrollTo({
          left: track.children[Number(b.dataset.slide)].offsetLeft,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      });
    });
    track.addEventListener("scroll", () => requestAnimationFrame(setActive), { passive: true });
    setActive();
  }

  function renderShop() {
    const view = document.getElementById("shop-view");
    const route = shopRoute();
    document.getElementById("drop-banner").hidden = route.view !== "categories";
    view.dataset.view = route.view;
    if (route.view === "category") {
      view.innerHTML = categoryHtml(route.id, route.type);
    } else if (route.view === "product") {
      view.innerHTML = productHtml(route.id);
      setupProduct(view, route.id);
    } else {
      view.innerHTML = categoriesHtml();
    }
  }

  function showShopFromHash(instant) {
    renderShop();
    if (shopRoute().view !== "categories") {
      const smooth = instant !== true && !reduceMotion;
      document.getElementById("shop-view").scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
    }
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

    window.addEventListener("hashchange", showShopFromHash);

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

    window.addEventListener("resize", () => planSliders.forEach((s) => s.realign()));
  }

  setupInteractions();
  applyTranslations();
  // Link direto para uma categoria ou peça: vai lá depois de a página carregar (fotos e letras incluídas).
  if (shopRoute().view !== "categories") {
    if (document.readyState === "complete") showShopFromHash(true);
    else window.addEventListener("load", () => showShopFromHash(true), { once: true });
  }
})();

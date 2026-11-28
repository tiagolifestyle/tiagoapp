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
    renderCart();
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
      const account = CONFIG.instagram.find((a) => a.id === el.dataset.instagram);
      el.href = account.url;
      const handle = el.querySelector(".ig-handle");
      if (handle) handle.textContent = "@" + account.handle;
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

  function promoHtml(place) {
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
      '<form class="promo" novalidate><label class="pdp-label" for="promo-code-' +
      place +
      '">' +
      t("shop.promoLabel") +
      '</label><div class="promo-row"><input id="promo-code-' +
      place +
      '" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' +
      t("shop.promoPlaceholder") +
      '"/><button type="submit" class="btn btn-dark btn-sm">' +
      t("shop.promoApply") +
      '</button></div><p class="promo-msg" role="status"></p></form>'
    );
  }

  // A caixa do código funciona igual na página da peça e no carrinho.
  function bindPromo(root) {
    const form = root.querySelector(".promo");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = form.querySelector("input");
        const msg = form.querySelector(".promo-msg");
        const code = normalizeCode(input.value);
        if (!code) return;
        const match = await findPromo(code);
        if (match) {
          promo = { code: code, percent: match.percent };
          savePromo();
          renderShop();
          renderCart();
        } else {
          msg.textContent = t("shop.promoInvalid");
          msg.classList.add("is-error");
        }
      });
    }
    const remove = root.querySelector(".promo-remove");
    if (remove) {
      remove.addEventListener("click", () => {
        promo = null;
        savePromo();
        renderShop();
        renderCart();
      });
    }
  }

  // ---------- Carrinho ----------

  // Linhas do carrinho: { id, size, qty }. Fica guardado no browser do cliente.
  const CART_KEY = "tls-cart";
  let cart = loadCart();
  // Quantidade escolhida na página de cada peça (volta a 1 depois de adicionar).
  const shopQty = {};
  let toastTimer = null;

  function productById(id) {
    return CONFIG.products.find((p) => p.id === id);
  }

  // Edição limitada: não deixa pôr no carrinho mais do que as unidades que restam.
  function maxQty(product) {
    return product.limited ? product.limited.left : Infinity;
  }

  function cartQtyOf(id) {
    return cart.filter((line) => line.id === id).reduce((sum, line) => sum + line.qty, 0);
  }

  function loadCart() {
    let lines = [];
    try {
      lines = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {}
    if (!Array.isArray(lines)) return [];
    // Ignora peças que já não existem, tamanhos que já não há e edições esgotadas.
    const clean = [];
    lines.forEach((line) => {
      const p = line && productById(line.id);
      if (!p || !p.sizes.includes(line.size) || isSoldOut(p)) return;
      const used = clean.filter((l) => l.id === p.id).reduce((sum, l) => sum + l.qty, 0);
      const qty = Math.min(Math.max(1, Math.floor(Number(line.qty)) || 1), maxQty(p) - used);
      if (qty > 0) clean.push({ id: p.id, size: line.size, qty: qty });
    });
    return clean;
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {}
  }

  function addToCart(id, size, qty) {
    const p = productById(id);
    const add = Math.min(qty, maxQty(p) - cartQtyOf(id));
    if (add <= 0) return 0;
    const line = cart.find((l) => l.id === id && l.size === size);
    if (line) line.qty += add;
    else cart.push({ id: id, size: size, qty: add });
    saveCart();
    renderCart();
    return add;
  }

  // Valores em cêntimos, para as contas não terem erros de arredondamento.
  function cents(price) {
    return Math.round(price * 100);
  }

  function money(amountCents) {
    return formatPrice(amountCents / 100);
  }

  function cartTotals() {
    const subtotal = cart.reduce((sum, line) => sum + cents(productById(line.id).price) * line.qty, 0);
    const discount = promo ? Math.round((subtotal * promo.percent) / 100) : 0;
    return { subtotal: subtotal, discount: discount, total: subtotal - discount };
  }

  function cartMessage() {
    const totals = cartTotals();
    const lines = [t("wa.cartIntro")];
    cart.forEach((line, i) => {
      const p = productById(line.id);
      const texts = t("shop.products." + p.id);
      let text = fill(t("wa.cartLine"), {
        n: i + 1,
        product: texts.name + (p.limited ? t("wa.limitedSuffix") : ""),
        color: texts.color,
        size: line.size,
        qty: line.qty,
        price: money(cents(p.price)),
      });
      if (line.qty > 1) text += fill(t("wa.cartLineTotal"), { total: money(cents(p.price) * line.qty) });
      lines.push(text);
    });
    lines.push("");
    lines.push(fill(t("wa.cartSubtotal"), { amount: money(totals.subtotal) }));
    lines.push(t("wa.cartShipping"));
    if (promo) {
      lines.push(fill(t("wa.cartPromo"), { code: promo.code, percent: promo.percent, amount: money(totals.discount) }));
    }
    lines.push(fill(t("wa.cartTotal"), { amount: money(totals.total) }));
    return lines.join("\n");
  }

  function updateCartCount() {
    const count = cart.reduce((sum, line) => sum + line.qty, 0);
    const badge = document.querySelector(".cart-count");
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }

  function qtyHtml(value, minusDisabled, plusDisabled) {
    return (
      '<div class="qty"><button type="button" data-qty="-1" aria-label="' +
      t("shop.decrease") +
      '"' +
      (minusDisabled ? " disabled" : "") +
      '><svg><use href="#i-minus"/></svg></button><span class="qty-value">' +
      value +
      '</span><button type="button" data-qty="1" aria-label="' +
      t("shop.increase") +
      '"' +
      (plusDisabled ? " disabled" : "") +
      '><svg><use href="#i-plus"/></svg></button></div>'
    );
  }

  function renderCart() {
    const body = document.getElementById("cart-body");
    updateCartCount();

    if (!cart.length) {
      body.innerHTML =
        '<div class="cart-empty"><svg><use href="#i-bag"/></svg><p>' +
        t("shop.cartEmpty") +
        '</p><a class="btn btn-dark btn-sm" href="#shop" data-cart-close>' +
        t("shop.cartBrowse") +
        "</a></div>";
      return;
    }

    const items = cart
      .map((line, i) => {
        const p = productById(line.id);
        const texts = t("shop.products." + p.id);
        const full = cartQtyOf(p.id) >= maxQty(p);
        return (
          '<li class="cart-item" data-index="' +
          i +
          '"><img src="' +
          p.images[0] +
          '" alt="" width="1024" height="1024"/><div class="cart-item-info"><h3>' +
          texts.name +
          "</h3><p>" +
          (p.limited ? t("shop.categories.limited") + " · " : "") +
          texts.color +
          " · " +
          line.size +
          '</p><div class="cart-item-row">' +
          qtyHtml(line.qty, line.qty <= 1, full) +
          "<strong>" +
          money(cents(p.price) * line.qty) +
          '</strong></div></div><button type="button" class="cart-remove" aria-label="' +
          t("shop.cartRemove") +
          " " +
          texts.name +
          '"><svg><use href="#i-trash"/></svg></button></li>'
        );
      })
      .join("");

    const totals = cartTotals();
    body.innerHTML =
      '<ul class="cart-items">' +
      items +
      '</ul><div class="cart-summary">' +
      promoHtml("cart") +
      '<dl class="cart-totals"><div><dt>' +
      t("shop.subtotal") +
      "</dt><dd>" +
      money(totals.subtotal) +
      "</dd></div><div><dt>" +
      t("shop.shipping") +
      '</dt><dd class="is-free">' +
      t("shop.shippingFree") +
      "</dd></div>" +
      (promo
        ? '<div class="is-discount"><dt>' +
          fill(t("shop.discount"), { code: promo.code, percent: promo.percent }) +
          "</dt><dd>-" +
          money(totals.discount) +
          "</dd></div>"
        : "") +
      '<div class="cart-total"><dt>' +
      t("shop.total") +
      "</dt><dd>" +
      money(totals.total) +
      '</dd></div></dl><a class="btn btn-gold cart-checkout" target="_blank" rel="noopener" href="' +
      waUrl(cartMessage()) +
      '"><svg><use href="#i-whatsapp"/></svg><span>' +
      t("shop.checkout") +
      '</span></a><p class="cart-note">' +
      t("shop.cartNote") +
      "</p></div>";

    body.querySelectorAll(".cart-item").forEach((row) => {
      const line = cart[Number(row.dataset.index)];
      row.querySelectorAll("[data-qty]").forEach((btn) => {
        btn.addEventListener("click", () => {
          line.qty = Math.max(1, line.qty + Number(btn.dataset.qty));
          const p = productById(line.id);
          const over = cartQtyOf(p.id) - maxQty(p);
          if (over > 0) line.qty -= over;
          saveCart();
          renderCart();
        });
      });
      row.querySelector(".cart-remove").addEventListener("click", () => {
        cart.splice(cart.indexOf(line), 1);
        saveCart();
        renderCart();
        renderShop();
      });
    });
    bindPromo(body);
  }

  function openCart() {
    document.body.classList.add("cart-open");
    document.querySelector(".cart-toggle").setAttribute("aria-expanded", "true");
    hideToast();
    setTimeout(() => document.querySelector(".cart-close").focus(), 50);
  }

  function closeCart() {
    if (!document.body.classList.contains("cart-open")) return;
    const wasInside = document.getElementById("cart").contains(document.activeElement);
    document.body.classList.remove("cart-open");
    const toggle = document.querySelector(".cart-toggle");
    toggle.setAttribute("aria-expanded", "false");
    if (wasInside) toggle.focus();
  }

  function showToast() {
    const toast = document.getElementById("cart-toast");
    toast.innerHTML =
      '<svg><use href="#i-check"/></svg><span>' +
      t("shop.added") +
      '</span><button type="button">' +
      t("shop.viewCart") +
      "</button>";
    toast.querySelector("button").addEventListener("click", openCart);
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 4000);
  }

  function hideToast() {
    clearTimeout(toastTimer);
    document.getElementById("cart-toast").classList.remove("is-visible");
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
        // Sem tipo, o título repete a categoria (ex.: Leggings).
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
              '<span class="product-soon">' +
              name +
              "</span>" +
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
      promoHtml("product") +
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
      '</div><div class="pdp-label">' +
      t("shop.quantity") +
      '</div><div class="pdp-qty">' +
      qtyHtml(1, true, false) +
      '</div><button type="button" class="btn btn-gold pdp-cta"><svg><use href="#i-bag"/></svg><span></span></button><p class="pdp-note">' +
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

    const qtyValue = view.querySelector(".pdp-qty .qty-value");
    const minus = view.querySelector('.pdp-qty [data-qty="-1"]');
    const plus = view.querySelector('.pdp-qty [data-qty="1"]');

    // Quantas ainda se podem pôr no carrinho (só conta na edição limitada).
    const room = () => Math.max(1, maxQty(p) - cartQtyOf(id));

    // O botão só adiciona depois de escolher o tamanho (e enquanto houver unidades).
    const updateCta = () => {
      const qty = Math.min(shopQty[id] || 1, room());
      shopQty[id] = qty;
      qtyValue.textContent = String(qty);
      minus.disabled = qty <= 1 || isSoldOut(p);
      plus.disabled = qty >= room() || isSoldOut(p);
      if (isSoldOut(p)) {
        cta.classList.add("is-disabled");
        cta.setAttribute("aria-disabled", "true");
        label.textContent = t("shop.soldOut");
      } else if (shopSize[id]) {
        cta.classList.remove("is-disabled");
        cta.removeAttribute("aria-disabled");
        label.textContent = t("shop.addToCart");
      } else {
        cta.classList.add("is-disabled");
        cta.setAttribute("aria-disabled", "true");
        label.textContent = t("shop.chooseSize");
      }
    };

    bindPromo(view);

    sizeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        shopSize[id] = btn.dataset.size;
        sizeButtons.forEach((b) => b.setAttribute("aria-checked", String(b === btn)));
        updateCta();
      });
    });
    [minus, plus].forEach((btn) => {
      btn.addEventListener("click", () => {
        shopQty[id] = Math.max(1, (shopQty[id] || 1) + Number(btn.dataset.qty));
        updateCta();
      });
    });
    cta.addEventListener("click", () => {
      if (isSoldOut(p)) return;
      if (!shopSize[id]) {
        const first = view.querySelector("[data-size]:not(:disabled)");
        if (first) first.focus();
        return;
      }
      const added = addToCart(id, shopSize[id], shopQty[id] || 1);
      shopQty[id] = 1;
      updateCta();
      if (added) showToast();
      else openCart();
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

    document.querySelector(".cart-toggle").addEventListener("click", () => {
      if (document.body.classList.contains("cart-open")) closeCart();
      else openCart();
    });
    // Fecha com o ✕, tocando fora do carrinho, em "Ver a loja" ou com a tecla Esc.
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-cart-close]")) closeCart();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeCart();
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

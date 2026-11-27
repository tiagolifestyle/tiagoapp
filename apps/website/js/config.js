/*
 * TiagoLifeStyle — configuração do site.
 * Este é o ficheiro a editar para mudar contactos, preços e produtos.
 * Os textos traduzidos estão em js/i18n.js.
 */
window.SITE_CONFIG = {
  // Número de WhatsApp em formato internacional, só dígitos, sem "+" nem espaços.
  // Ex.: Portugal 351912345678 · Espanha 34612345678
  whatsappNumber: "351966530401",

  // Contas de Instagram. O "id" liga aos textos em i18n.js (final.ig<Id>) e aos botões do site.
  instagram: [
    { id: "postpartum", handle: "tiagolifestyle_93", url: "https://www.instagram.com/tiagolifestyle_93/" },
    { id: "hypertrophy", handle: "tiagolifestyle_100", url: "https://www.instagram.com/tiagolifestyle_100/" },
  ],

  // Links da app. Deixa "" enquanto não estiverem publicados — aparece "Em breve".
  appLinks: {
    appStore: "",
    googlePlay: "",
    web: "https://tiagolifestyle-app.vercel.app/login",
  },

  // Planos. O "id" liga aos textos em i18n.js (plans.<id>.*).
  // Na base de dados, "basic" corresponde ao tier interno "free".
  // Planos com o mesmo "group" partilham a mesma coluna e deslizam lado a lado.
  // "comparePrice" mostra o preço riscado; "months" é a duração do pagamento único.
  plans: [
    { id: "basic", price: 29.99, badge: null, choice: true, group: "basic" },
    { id: "basic3", price: 71, comparePrice: 89.97, months: 3, badge: "discount", choice: true, group: "basic" },
    { id: "premium", price: 45, badge: "popular", choice: false },
    { id: "vip", price: 89.99, badge: "vip", choice: false },
  ],

  // Códigos promocionais da loja (valem para todas as peças).
  // Cada código fica guardado cifrado, para não se ler no código do site:
  //   hash = SHA-256 de "tiagolifestyle:" + CÓDIGO EM MAIÚSCULAS
  // Para criar, mudar ou apagar um código, pede ao Claude.
  promoCodes: [
    { hash: "cd4043ebc51e5aa4da5a7e985506e4ffe22862c08ca6fca3298572399492aaf0", percent: 10 },
    { hash: "627b8c2f8d6690d13a022c3209dbc8da63208b6c5d58fd438ae0cb22882c3c37", percent: 15 },
  ],

  // Categorias da loja, pela ordem em que aparecem.
  // Uma categoria sem produtos aparece como "Em breve".
  // "hidden": não aparece nos cartões (a Edição Limitada abre pelo cartão dourado da loja).
  //  - icon (para "Em breve"): tshirt | hoodie | leggings | towel | bottle | bag | cap | shaker
  //  - tone: cor do fundo do cartão — "black" | "cream" | "sand"
  shopCategories: [
    { id: "tshirts", icon: "tshirt", tone: "black" },
    { id: "leggings", icon: "leggings", tone: "black" },
    { id: "pants", icon: "leggings", tone: "sand" },
    { id: "hoodies", icon: "hoodie", tone: "black" },
    { id: "towels", icon: "towel", tone: "cream" },
    { id: "accessories", icon: "bottle", tone: "sand" },
    { id: "limited", hidden: true },
  ],

  // Produtos da loja. Textos de cada produto em i18n.js → shop.products.<id>.
  //  - category: id de uma categoria acima
  //  - price: em euros
  //  - sizes: tamanhos à venda; soldOut: tamanhos esgotados (aparecem riscados)
  //  - swatch: cor da bolinha de cor
  //  - type: tipo dentro da categoria (ex.: manga curta). Cada tipo tem o seu cartão na loja.
  //    Textos em i18n.js → shop.types
  //  - images: fotos, a primeira é a capa
  //  - limited: edição limitada — total de unidades e quantas restam (atualizar a cada venda)
  products: [
    {
      id: "just-lift-tee",
      category: "tshirts",
      price: 35,
      sizes: ["S", "M", "L", "XL", "XXL"],
      soldOut: [],
      swatch: "#111111",
      type: "short-sleeve",
      images: ["assets/img/shop/just-lift-front.webp", "assets/img/shop/just-lift-back.webp"],
    },
    {
      id: "no-days-off-tee",
      category: "tshirts",
      price: 32.99,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      soldOut: [],
      swatch: "#111111",
      type: "short-sleeve",
      images: ["assets/img/shop/no-days-off-front.webp", "assets/img/shop/no-days-off-back.webp"],
    },
    {
      id: "leggings-tls",
      category: "leggings",
      price: 34.99,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      soldOut: [],
      swatch: "#111111",
      images: ["assets/img/shop/leggings-tls-front.webp", "assets/img/shop/leggings-tls-back.webp"],
    },
    {
      id: "dios-posible",
      category: "limited",
      price: 119.99,
      sizes: ["S", "M", "L", "XL", "XXL"],
      soldOut: [],
      swatch: "#111111",
      limited: { total: 7, left: 6 },
      images: ["assets/img/shop/dios-posible-front.webp", "assets/img/shop/dios-posible-back.webp"],
    },
  ],
};

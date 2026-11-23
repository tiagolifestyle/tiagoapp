/*
 * TiagoLifeStyle — configuração do site.
 * Este é o ficheiro a editar para mudar contactos, preços e produtos.
 * Os textos traduzidos estão em js/i18n.js.
 */
window.SITE_CONFIG = {
  // Número de WhatsApp em formato internacional, só dígitos, sem "+" nem espaços.
  // Ex.: Portugal 351912345678 · Espanha 34612345678
  whatsappNumber: "351966530401",

  instagram: {
    handle: "tiagolifestyle_93",
    url: "https://www.instagram.com/tiagolifestyle_93/",
  },

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

  // Categorias da loja, pela ordem em que aparecem.
  // Uma categoria sem produtos aparece como "Em breve".
  //  - icon (para "Em breve"): tshirt | hoodie | leggings | towel | bottle | bag | cap | shaker
  //  - tone: cor do fundo do cartão — "black" | "cream" | "sand"
  shopCategories: [
    { id: "tshirts", icon: "tshirt", tone: "black" },
    { id: "pants", icon: "leggings", tone: "sand" },
    { id: "hoodies", icon: "hoodie", tone: "black" },
    { id: "towels", icon: "towel", tone: "cream" },
    { id: "accessories", icon: "bottle", tone: "sand" },
  ],

  // Produtos da loja. Textos de cada produto em i18n.js → shop.products.<id>.
  //  - category: id de uma categoria acima
  //  - price: em euros
  //  - sizes: tamanhos à venda; soldOut: tamanhos esgotados (aparecem riscados)
  //  - swatch: cor da bolinha de cor
  //  - tags: etiquetas (textos em i18n.js → shop.tags)
  //  - images: fotos, a primeira é a capa
  products: [
    {
      id: "just-lift-tee",
      category: "tshirts",
      price: 35,
      sizes: ["S", "M", "L", "XL", "XXL"],
      soldOut: [],
      swatch: "#111111",
      tags: ["shortSleeve"],
      images: ["assets/img/shop/just-lift-front.webp", "assets/img/shop/just-lift-back.webp"],
    },
  ],
};

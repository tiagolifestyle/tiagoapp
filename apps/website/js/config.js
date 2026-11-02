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
  plans: [
    { id: "basic", price: 29.99, badge: null, choice: true },
    { id: "premium", price: 45, badge: "popular", choice: false },
    { id: "vip", price: 89.99, badge: "vip", choice: false },
  ],

  // Produtos da loja.
  //  - category: "apparel" | "towels" | "accessories"
  //  - icon: tshirt | hoodie | leggings | towel | bottle | bag | cap | shaker
  //  - price: número em euros, ou null para mostrar "Em breve"
  //  - sizes: lista de tamanhos, ou [] se não se aplica
  //  - tone: cor do fundo do cartão — "black" | "cream" | "sand"
  products: [
    { id: "tee-essential", category: "apparel", icon: "tshirt", price: null, sizes: ["S", "M", "L", "XL", "XXL"], tone: "black" },
    { id: "hoodie-signature", category: "apparel", icon: "hoodie", price: null, sizes: ["S", "M", "L", "XL", "XXL"], tone: "sand" },
    { id: "leggings-sculpt", category: "apparel", icon: "leggings", price: null, sizes: ["XS", "S", "M", "L", "XL"], tone: "black" },
    { id: "cap-classic", category: "apparel", icon: "cap", price: null, sizes: [], tone: "cream" },
    { id: "towel-gym", category: "towels", icon: "towel", price: null, sizes: [], tone: "black" },
    { id: "towel-premium", category: "towels", icon: "towel", price: null, sizes: [], tone: "sand" },
    { id: "bottle-thermal", category: "accessories", icon: "bottle", price: null, sizes: [], tone: "cream" },
    { id: "shaker", category: "accessories", icon: "shaker", price: null, sizes: [], tone: "black" },
    { id: "bag-duffel", category: "accessories", icon: "bag", price: null, sizes: [], tone: "sand" },
  ],
};

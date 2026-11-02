# TiagoLifeStyle — site

Site público da marca: apresentação, app, planos e preços, pós-parto e loja.
É um site estático (HTML, CSS e JavaScript simples), sem build e sem ligação
à Supabase — não afeta a app nem o painel de admin.

## Estrutura

```
index.html        Página (todas as secções)
css/styles.css    Design (cores, tipografia, responsivo)
js/config.js      ← WhatsApp, Instagram, links da app, preços e produtos
js/i18n.js        ← Todos os textos em PT / ES / EN
js/main.js        Lógica (línguas, planos, loja, links de WhatsApp)
assets/img/       Logo, ícones e fotos
assets/video/     Animação do logo (convertida do GIF para MP4)
```

## Editar o mais comum

Tudo em `js/config.js`:

- **WhatsApp** — `whatsappNumber`, só dígitos com indicativo (ex.: `351912345678`).
  Enquanto estiver vazio, os botões abrem o WhatsApp para escolher o contacto.
- **Preços** — `plans[].price`.
- **App** — `appLinks.appStore` / `googlePlay` / `web`. Vazio = mostra "Em breve"
  e o botão leva ao WhatsApp para pedir acesso.
- **Produtos** — `products[]`. Com `price: null` aparece "Em breve" e o botão
  "Avisa-me quando chegar"; com preço aparece "Encomendar por WhatsApp".
  Textos de cada produto em `js/i18n.js` → `shop.products`.

Textos (títulos, descrições, FAQ, mensagens de WhatsApp) em `js/i18n.js` —
cada chave existe nas 3 línguas.

## Língua

O site escolhe a língua por esta ordem: `?lang=pt|es|en` no link, a última
escolha do visitante, a língua do telemóvel/browser, e por fim português.
Para partilhar no Instagram para público espanhol: `…/?lang=es`.

## Fotos a substituir quando houver originais

- `assets/img/plan-mom.webp`, `plan-group.webp`, `gym-top.webp` — recortadas
  da imagem de preços do Instagram (baixa resolução).
- Secção "Sobre mim" — usa o logo; trocar por uma foto tua no `index.html`
  (comentário na secção `#about`).

## Ver localmente

```bash
cd apps/website
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Publicar (grátis) — Cloudflare Pages

1. Cloudflare → Workers & Pages → Create → Pages → ligar ao repositório GitHub.
2. Build command: *(vazio)* · Build output directory: `apps/website`.
3. Depois, em Custom domains, ligar o domínio (ex.: `tiagolifestyle.com`).

# public/

Servido tal e qual na raiz do site (`expo export -p web`). Falta adicionar,
a partir do logo definitivo:

- `favicon.png` — 48×48 ou 64×64
- `apple-touch-icon.png` — 180×180, sem transparência (ícone ao "Adicionar ao
  Ecrã Principal" no iOS)
- `icon-192.png` — 192×192 (manifest PWA)
- `icon-512.png` — 512×512 (manifest PWA)

Referenciados em `manifest.json` e `app/+html.tsx`.

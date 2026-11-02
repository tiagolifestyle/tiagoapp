// No fundo claro, as cores (sobretudo o amarelo) escurecem um pouco para se lerem bem.
export function darkenColor(hex: string, amount = 0.25) {
  const channel = (start: number) =>
    Math.round(parseInt(hex.slice(start, start + 2), 16) * (1 - amount))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}

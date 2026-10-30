import type { TipoPonto } from '../domain/types';

const traco = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const cheio = { fill: 'currentColor', stroke: 'none' } as const;

/** Desenho de cada tipo de ponto, centrado em (0,0). A cor vem de `color` no elemento pai. */
export function Glyph({ tipo, sonoRuim }: { tipo: TipoPonto; sonoRuim: boolean | null }) {
  switch (tipo) {
    case 'crise':
      return <path {...traco} strokeWidth={2.8} d="M-5 -5L5 5M5 -5L-5 5" />;
    case 'conquista':
      return <path {...cheio} d="M0 -6L6 0L0 6L-6 0Z" />;
    case 'funcionou':
      return <circle {...traco} r={4.5} />;
    case 'sono':
      return <path {...traco} strokeWidth={3.2} d={sonoRuim ? 'M-7 0H-2M2 0H7' : 'M-7 0H7'} />;
    case 'comida':
      return (
        <>
          <circle {...cheio} cx={-3} r={2.3} />
          <circle {...cheio} cx={3} r={2.3} />
        </>
      );
    case 'nota':
      return <path {...traco} d="M0 -5V5" />;
  }
}

import type { CSSProperties } from 'react';
import type { TipoPonto } from '../../domain/types';
import { ROTULO_TIPO, TIPOS } from '../../domain/rules';
import { Glyph } from '../../tapestry/Glyph';
import css from './ponto.module.css';

const DICAS: Record<TipoPonto, string> = {
  crise: 'Algo difícil aconteceu',
  conquista: 'Fez algo novo',
  funcionou: 'Uma estratégia que ajudou',
  sono: 'Como foi a noite',
  comida: 'Refeição ou recusa',
  nota: 'Qualquer outra coisa',
};

export function TipoGrid({ cor, valor, onMudar }: { cor: string; valor: TipoPonto | null; onMudar: (t: TipoPonto) => void }) {
  return (
    <div className={css.grade} role="group" aria-label="Tipo do ponto" style={{ '--cor': cor } as CSSProperties}>
      {TIPOS.map(t => (
        <button key={t} type="button" className={css.tipo} aria-pressed={valor === t} onClick={() => onMudar(t)}>
          <svg width="28" height="28" viewBox="-10 -10 20 20" aria-hidden="true" style={{ color: cor }}>
            <Glyph tipo={t} sonoRuim={false} />
          </svg>
          <span className={css.nomeTipo}>{ROTULO_TIPO[t]}</span>
          <span className={css.dica}>{DICAS[t]}</span>
        </button>
      ))}
    </div>
  );
}

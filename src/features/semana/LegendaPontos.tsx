import type { TipoPonto } from '../../domain/types';
import { Glyph } from '../../tapestry/Glyph';
import css from './semana.module.css';

const ITENS: Array<{ tipo: TipoPonto; sonoRuim: boolean | null; rotulo: string }> = [
  { tipo: 'crise', sonoRuim: null, rotulo: 'Crise' },
  { tipo: 'conquista', sonoRuim: null, rotulo: 'Conquista' },
  { tipo: 'funcionou', sonoRuim: null, rotulo: 'Funcionou' },
  { tipo: 'sono', sonoRuim: false, rotulo: 'Dormiu bem' },
  { tipo: 'sono', sonoRuim: true, rotulo: 'Noite ruim' },
  { tipo: 'comida', sonoRuim: null, rotulo: 'Comida' },
  { tipo: 'nota', sonoRuim: null, rotulo: 'Nota' },
];

export function LegendaPontos() {
  return (
    <ul className={css.legendaPontos} aria-label="O que cada ponto quer dizer">
      {ITENS.map(i => (
        <li key={i.rotulo}>
          <svg width="16" height="16" viewBox="-8 -8 16 16" aria-hidden="true" style={{ color: '#C9CEE3' }}>
            <Glyph tipo={i.tipo} sonoRuim={i.sonoRuim} />
          </svg>
          {i.rotulo}
        </li>
      ))}
    </ul>
  );
}

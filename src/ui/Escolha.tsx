import { useId } from 'react';
import css from './escolha.module.css';

/** Grupo de opções exclusivas, com alvos de toque grandes. */
export function Escolha<T extends string>({
  legenda, opcoes, valor, onMudar,
}: { legenda: string; opcoes: Array<{ valor: T; rotulo: string }>; valor: T | null; onMudar: (v: T) => void }) {
  const nome = useId();
  return (
    <fieldset className={css.grupo}>
      <legend className={css.legenda}>{legenda}</legend>
      <div className={css.opcoes}>
        {opcoes.map(o => (
          <label key={o.valor} className={css.opcao}>
            <input type="radio" name={nome} value={o.valor} checked={valor === o.valor} onChange={() => onMudar(o.valor)} />
            <span>{o.rotulo}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

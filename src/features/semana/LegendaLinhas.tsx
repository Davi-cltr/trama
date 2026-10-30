import type { LinhaInfo } from '../../tapestry/layout';
import css from './semana.module.css';

export function LegendaLinhas({ linhas }: { linhas: LinhaInfo[] }) {
  if (linhas.length === 0) return null;
  return (
    <ul className={css.legendaLinhas} aria-label="Quem é cada linha">
      {linhas.map(l => (
        <li key={l.membroId}>
          <span className={css.fio} style={{ background: l.corTear }} aria-hidden="true" />
          {l.rotulo}{l.ativa ? '' : ' (saiu)'}
        </li>
      ))}
    </ul>
  );
}

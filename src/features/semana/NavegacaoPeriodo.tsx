import { Link } from 'react-router';
import type { Periodo } from '../../tapestry/time';
import css from './semana.module.css';

export function NavegacaoPeriodo({
  cadernoId, periodo, anterior, proximo, ehAtual,
}: { cadernoId: string; periodo: Periodo; anterior: string; proximo: string; ehAtual: boolean }) {
  const semana = periodo.tipo === 'semana';
  const rotulos = semana ? ['Semana anterior', 'Próxima semana'] : ['Mês anterior', 'Próximo mês'];
  const base = `/c/${cadernoId}/${periodo.tipo}`;
  return (
    <div className={css.controles}>
      <nav aria-label="Período" className={css.seletor}>
        {semana ? <span aria-current="page">Semana</span> : <Link to={`/c/${cadernoId}/semana`}>Semana</Link>}
        {semana ? <Link to={`/c/${cadernoId}/mes`}>Mês</Link> : <span aria-current="page">Mês</span>}
      </nav>
      <div className={css.setas}>
        <Link className={css.seta} to={`${base}?inicio=${anterior}`} aria-label={rotulos[0]}>‹</Link>
        {ehAtual ? (
          <button type="button" className={css.seta} disabled aria-label={rotulos[1]}>›</button>
        ) : (
          <Link className={css.seta} to={`${base}?inicio=${proximo}`} aria-label={rotulos[1]}>›</Link>
        )}
      </div>
    </div>
  );
}

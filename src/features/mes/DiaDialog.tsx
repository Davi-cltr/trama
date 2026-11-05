import type { Membro, Ponto } from '../../domain/types';
import { horaLocal } from '../../tapestry/time';
import { DIAS_SEMANA_EXTENSO, MESES } from '../../tapestry/time';
import { descreverTipo, formatarHora } from '../../tapestry/TapestrySvg';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import css from './mes.module.css';

export function tituloDoDia(dia: string): string {
  const [a, m, d] = dia.split('-').map(Number);
  return `${DIAS_SEMANA_EXTENSO[new Date(a, m - 1, d, 12).getDay()]}, ${d} de ${MESES[m - 1].toLowerCase()}`;
}

/** Lista os pontos de um dia do mês, com alvos de toque grandes, e anda entre os dias. */
export function DiaDialog({
  dia, dias, pontos, membros, fuso, onMudarDia, onEscolher, onFechar,
}: {
  dia: string | null;
  dias: string[];
  pontos: Ponto[];
  membros: Membro[];
  fuso: string;
  onMudarDia: (dia: string) => void;
  onEscolher: (p: Ponto) => void;
  onFechar: () => void;
}) {
  const i = dia ? dias.indexOf(dia) : -1;
  const rotulo = new Map(membros.map(m => [m.id, m.rotulo]));
  return (
    <Dialog titulo={dia ? tituloDoDia(dia) : ''} aberto={dia !== null} onFechar={onFechar}>
      {pontos.length === 0 ? (
        <p style={{ margin: 0 }}>Nenhum ponto neste dia.</p>
      ) : (
        <ul className={css.lista}>
          {pontos.map(p => (
            <li key={p.id}>
              <button type="button" className={css.item} onClick={() => onEscolher(p)}>
                {descreverTipo(p)} · {rotulo.get(p.membroId) ?? 'Alguém que saiu'} · {formatarHora(horaLocal(p.ocorreuEm, fuso))}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variante="secundario" disabled={i <= 0} onClick={() => onMudarDia(dias[i - 1])}>Dia anterior</Button>
        <Button variante="secundario" disabled={i < 0 || i >= dias.length - 1} onClick={() => onMudarDia(dias[i + 1])}>Próximo dia</Button>
      </div>
      <Button variante="texto" onClick={onFechar}>Fechar</Button>
    </Dialog>
  );
}

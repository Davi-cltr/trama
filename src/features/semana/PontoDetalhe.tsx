import { Link } from 'react-router';
import type { Membro, Ponto } from '../../domain/types';
import { ROTULO_TIPO } from '../../domain/rules';
import { DIAS_SEMANA_EXTENSO, MESES, diaLocal, horaLocal } from '../../tapestry/time';
import { formatarHora } from '../../tapestry/TapestrySvg';
import { Dialog } from '../../ui/Dialog';
import { Button, classesDeBotao } from '../../ui/Button';
import css from './semana.module.css';

export function quandoDoPonto(p: Ponto, fuso: string): string {
  const dia = diaLocal(p.ocorreuEm, fuso);
  const hora = horaLocal(p.ocorreuEm, fuso);
  const [a, m, d] = dia.split('-').map(Number);
  const semana = DIAS_SEMANA_EXTENSO[new Date(a, m - 1, d, 12).getDay()];
  const fora = hora < 6 ? ' (antes das 6h)' : hora > 22 ? ' (depois das 22h)' : '';
  return `${semana}, ${d} de ${MESES[m - 1].toLowerCase()}, às ${formatarHora(hora)}${fora}`;
}

export function PontoDetalhe({
  ponto, membro, fuso, podeEditar, cadernoId, onFechar,
}: { ponto: Ponto | null; membro: Membro | undefined; fuso: string; podeEditar: boolean; cadernoId: string; onFechar: () => void }) {
  const titulo = !ponto ? '' : ponto.tipo === 'sono' ? `Sono, ${ponto.sonoRuim ? 'noite ruim' : 'dormiu bem'}` : ROTULO_TIPO[ponto.tipo];
  return (
    <Dialog titulo={titulo} aberto={ponto !== null} onFechar={onFechar}>
      {ponto && (
        <>
          <dl className={css.detalhe}>
            <dt>Quem registrou</dt>
            <dd>{membro?.rotulo ?? 'Alguém que saiu'}</dd>
            <dt>Quando</dt>
            <dd>{quandoDoPonto(ponto, fuso)}</dd>
            {ponto.texto && (
              <>
                <dt>O que aconteceu</dt>
                <dd style={{ whiteSpace: 'pre-wrap' }}>{ponto.texto}</dd>
              </>
            )}
          </dl>
          <div style={{ display: 'flex', gap: 10 }}>
            {podeEditar && <Link className={classesDeBotao.botao} to={`/c/${cadernoId}/ponto/${ponto.id}`}>Editar</Link>}
            <Button variante="secundario" onClick={onFechar}>Fechar</Button>
          </div>
        </>
      )}
    </Dialog>
  );
}

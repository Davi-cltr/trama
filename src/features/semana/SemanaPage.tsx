import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { usePontos } from '../../data/queries';
import { corDoMembro } from '../../domain/palette';
import { doApelido } from '../../domain/rules';
import type { Ponto } from '../../domain/types';
import { layoutTrama, DIM_SEMANA } from '../../tapestry/layout';
import { detectarPadroes } from '../../tapestry/patterns';
import { TapestrySvg } from '../../tapestry/TapestrySvg';
import { MESES, diasDoPeriodo, type Periodo } from '../../tapestry/time';
import { Carregando } from '../auth/AuthGate';
import { Marca } from '../auth/Marca';
import { LegendaLinhas } from './LegendaLinhas';
import { LegendaPontos } from './LegendaPontos';
import { NavegacaoPeriodo } from './NavegacaoPeriodo';
import { PadraoCard } from './PadraoCard';
import { PontoDetalhe } from './PontoDetalhe';
import { useDadosDoCaderno, usePeriodo } from './useTrama';
import css from './semana.module.css';

function diaEMes(dia: string): { d: number; mes: string } {
  const [, m, d] = dia.split('-').map(Number);
  return { d, mes: MESES[m - 1].toLowerCase() };
}

export function subtituloDaSemana(inicio: string, pontos: Ponto[]): string {
  const dias = diasDoPeriodo({ tipo: 'semana', inicio, fuso: 'UTC' });
  const a = diaEMes(dias[0]);
  const b = diaEMes(dias[6]);
  const datas = a.mes === b.mes ? `${a.d} a ${b.d} de ${b.mes}` : `${a.d} de ${a.mes} a ${b.d} de ${b.mes}`;
  if (pontos.length === 0) return `${datas}.`;
  const pessoas = new Set(pontos.map(p => p.membroId)).size;
  const n = pontos.length;
  return `${datas}. ${n} ${n === 1 ? 'ponto dado' : 'pontos dados'} por ${pessoas} ${pessoas === 1 ? 'pessoa' : 'pessoas'}.`;
}

// O tecer só acontece na primeira vez que a semana atual aparece na sessão.
let jaTeceu = false;

export function SemanaPage() {
  const { cadernoId = '' } = useParams();
  const { usuarioId, caderno, membros } = useDadosDoCaderno(cadernoId);
  const fuso = caderno.data?.fuso ?? 'America/Sao_Paulo';
  const { periodo, ehAtual, anterior, proximo } = usePeriodo('semana', fuso);
  const pontos = usePontos(cadernoId, periodo);
  const [mostrando, setMostrando] = useState(false);
  const [selecionado, setSelecionado] = useState<Ponto | null>(null);
  const animar = useRef<boolean | null>(null);

  const dados = useMemo(() => {
    if (!caderno.data || !membros.data || !pontos.data) return null;
    const layout = layoutTrama({ periodo, membros: membros.data, pontos: pontos.data, dim: DIM_SEMANA });
    const [padrao] = detectarPadroes({ pontos: pontos.data, membros: membros.data, caderno: caderno.data, periodoTipo: 'semana' });
    return { layout, padrao: padrao ?? null };
  }, [caderno.data, membros.data, pontos.data, periodo.inicio]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!caderno.data || !membros.data || !dados || pontos.isLoading) return <Carregando />;

  if (animar.current === null) {
    animar.current = ehAtual && !jaTeceu && (pontos.data?.length ?? 0) > 0;
    if (animar.current) jaTeceu = true;
  }

  const c = caderno.data;
  const eu = membros.data.find(m => m.ativo && m.perfilId === usuarioId);
  const souDona = c.donaId === usuarioId;
  const membroDoSelecionado = selecionado ? membros.data.find(m => m.id === selecionado.membroId) : undefined;
  const podeEditar = !!selecionado && (souDona || membroDoSelecionado?.perfilId === usuarioId);
  const lista = pontos.data ?? [];

  return (
    <main className="pagina">
      <div className={css.topo}>
        <Link to="/" aria-label="Trama: seus cadernos" style={{ textDecoration: 'none' }}><Marca /></Link>
        <Link to={`/c/${c.id}/pessoas`} className={css.icone} aria-label="Pessoas da trama">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 20c0-3.5 3.1-6 7-6s7 2.5 7 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M19 7v6M16 10h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </Link>
      </div>

      <div>
        <h1 style={{ fontSize: 32, letterSpacing: '-0.01em' }}>A semana {doApelido(c)}</h1>
        <p className={css.subtitulo}>{subtituloDaSemana(periodo.inicio, lista)}</p>
      </div>

      <NavegacaoPeriodo cadernoId={c.id} periodo={periodo} anterior={anterior} proximo={proximo} ehAtual={ehAtual} />

      <section className={css.tear} aria-label="A trama da semana">
        <LegendaLinhas linhas={dados.layout.linhas} />
        {lista.length === 0 && <p className={css.vazio}>Nenhum ponto nesta semana. Dê o primeiro.</p>}
        <TapestrySvg
          layout={dados.layout}
          variante="semana"
          destaque={mostrando ? dados.padrao : null}
          animar={animar.current}
          onSelecionar={setSelecionado}
          ariaLabel={descreverTrama(periodo, lista.length)}
        />
        <LegendaPontos />
      </section>

      {dados.padrao && <PadraoCard padrao={dados.padrao} mostrando={mostrando} onAlternar={() => setMostrando(m => !m)} />}

      <nav aria-label="Mais" className={css.links}>
        {souDona && <Link to={`/c/${c.id}/resumo`}>Resumo para a consulta</Link>}
        <Link to={`/c/${c.id}/pessoas`}>Pessoas</Link>
        <Link to="/conta">Sua conta</Link>
      </nav>

      {eu && (
        <div className={css.flutuante}>
          <Link to={`/c/${c.id}/ponto`} className={css.dar} style={{ background: corDoMembro(eu, 'claro') }}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20L17 7" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              <circle cx="18.5" cy="5.5" r="2" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
              <path d="M18.5 7.5C21 12 13 13 9 18" fill="none" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 2.5" />
            </svg>
            Dar um ponto
          </Link>
        </div>
      )}

      <PontoDetalhe
        ponto={selecionado}
        membro={membroDoSelecionado}
        fuso={c.fuso}
        podeEditar={podeEditar}
        cadernoId={c.id}
        onFechar={() => setSelecionado(null)}
      />
    </main>
  );
}

function descreverTrama(p: Periodo, n: number): string {
  const unidade = p.tipo === 'semana' ? 'Trama da semana: uma faixa por dia' : 'Trama do mês: uma faixa por dia';
  const dica = p.tipo === 'semana' ? 'Toque num ponto para ver o detalhe.' : 'Toque num dia para ver os pontos.';
  return `${unidade}, uma linha por pessoa, das 6h às 22h. ${n} ${n === 1 ? 'ponto' : 'pontos'}. ${dica}`;
}

export { descreverTrama };

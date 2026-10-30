import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { usePontos } from '../../data/queries';
import { doApelido } from '../../domain/rules';
import type { Ponto } from '../../domain/types';
import { layoutTrama, DIM_MES } from '../../tapestry/layout';
import { TapestrySvg } from '../../tapestry/TapestrySvg';
import { nomeDoMes } from '../../tapestry/time';
import { Button } from '../../ui/Button';
import { Carregando } from '../auth/AuthGate';
import { Marca } from '../auth/Marca';
import { LegendaLinhas } from '../semana/LegendaLinhas';
import { LegendaPontos } from '../semana/LegendaPontos';
import { NavegacaoPeriodo } from '../semana/NavegacaoPeriodo';
import { PontoDetalhe } from '../semana/PontoDetalhe';
import { descreverTrama } from '../semana/SemanaPage';
import { useDadosDoCaderno, usePeriodo } from '../semana/useTrama';
import css from '../semana/semana.module.css';
import { PosterDialog } from './PosterDialog';

export function MesPage() {
  const { cadernoId = '' } = useParams();
  const { usuarioId, caderno, membros } = useDadosDoCaderno(cadernoId);
  const fuso = caderno.data?.fuso ?? 'America/Sao_Paulo';
  const { periodo, ehAtual, anterior, proximo } = usePeriodo('mes', fuso);
  const pontos = usePontos(cadernoId, periodo);
  const [poster, setPoster] = useState(false);
  const [selecionado, setSelecionado] = useState<Ponto | null>(null);

  const layout = useMemo(
    () => (membros.data && pontos.data ? layoutTrama({ periodo, membros: membros.data, pontos: pontos.data, dim: DIM_MES }) : null),
    [membros.data, pontos.data, periodo.inicio], // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!caderno.data || !membros.data || !layout || pontos.isLoading) return <Carregando />;

  const c = caderno.data;
  const lista = pontos.data ?? [];
  const pessoas = new Set(lista.map(p => p.membroId)).size;
  const membrosNaTrama = layout.linhas.map(l => membros.data!.find(m => m.id === l.membroId)!).filter(Boolean);
  const membroDoSelecionado = selecionado ? membros.data.find(m => m.id === selecionado.membroId) : undefined;
  const podeEditar = !!selecionado && (c.donaId === usuarioId || membroDoSelecionado?.perfilId === usuarioId);

  return (
    <main className="pagina">
      <div className={css.topo}>
        <Link to="/" aria-label="Seus cadernos" style={{ textDecoration: 'none' }}><Marca /></Link>
      </div>
      <div>
        <h1 style={{ fontSize: 32 }}>O mês {doApelido(c)}</h1>
        <p className={css.subtitulo}>
          {nomeDoMes(periodo)} de {periodo.inicio.slice(0, 4)}.{' '}
          {lista.length === 0
            ? 'Nenhum ponto neste mês.'
            : `${lista.length} ${lista.length === 1 ? 'ponto dado' : 'pontos dados'} por ${pessoas} ${pessoas === 1 ? 'pessoa' : 'pessoas'}.`}
        </p>
      </div>

      <NavegacaoPeriodo cadernoId={c.id} periodo={periodo} anterior={anterior} proximo={proximo} ehAtual={ehAtual} />

      <section className={css.tear} aria-label="A trama do mês">
        <LegendaLinhas linhas={layout.linhas} />
        <TapestrySvg layout={layout} variante="mes" ariaLabel={descreverTrama(periodo, lista.length)} onSelecionar={setSelecionado} />
        <LegendaPontos />
      </section>

      <Button largo onClick={() => setPoster(true)} disabled={lista.length === 0}>Compartilhar pôster</Button>

      <PosterDialog
        aberto={poster}
        onFechar={() => setPoster(false)}
        caderno={c}
        periodo={periodo}
        layout={layout}
        membros={membrosNaTrama}
        total={lista.length}
      />
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

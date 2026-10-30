import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { buscarPontosEntre, useCaderno, useConsentimento, useMembros, useSessao } from '../../data/queries';
import { useAceitarConsentimento } from '../../data/mutations';
import { gerarResumo } from '../../data/resumo';
import { doApelido } from '../../domain/rules';
import { detectarPadroes, type Padrao } from '../../tapestry/patterns';
import { recolocarRotulos } from '../../../supabase/functions/_shared/pseudonimizar';
import { Button } from '../../ui/Button';
import { Escolha } from '../../ui/Escolha';
import { Carregando } from '../auth/AuthGate';
import { ConsentimentoDialog } from './ConsentimentoDialog';
import './resumo.print.css';

type Janela = '7' | '14' | '30';
const JANELAS: Array<{ valor: Janela; rotulo: string }> = [
  { valor: '7', rotulo: 'Última semana' },
  { valor: '14', rotulo: 'Últimas 2 semanas' },
  { valor: '30', rotulo: 'Último mês' },
];

const MENSAGENS: Record<string, string> = {
  limite_mensal: 'Este caderno já gerou 10 resumos neste mês. Tente de novo no mês que vem.',
  falha_resumo: 'Não foi possível gerar o resumo agora. Seus registros estão salvos. Tente de novo em alguns minutos.',
};

/** Markdown mínimo da resposta: "## título", "- item" e parágrafos. */
function renderizar(texto: string): ReactNode[] {
  const blocos: ReactNode[] = [];
  let itens: string[] = [];
  const fecharLista = () => {
    if (itens.length) blocos.push(<ul key={`l${blocos.length}`}>{itens.map((i, k) => <li key={k}>{i}</li>)}</ul>);
    itens = [];
  };
  for (const bruta of texto.split('\n')) {
    const linha = bruta.trim();
    if (!linha) { fecharLista(); continue; }
    const titulo = /^#{1,6}\s+(.*)$/.exec(linha);
    const item = /^[-*•]\s+(.*)$/.exec(linha);
    if (titulo) { fecharLista(); blocos.push(<h2 key={`h${blocos.length}`} style={{ fontSize: 22, marginTop: 12 }}>{titulo[1].replace(/\*\*/g, '')}</h2>); }
    else if (item) itens.push(item[1].replace(/\*\*/g, ''));
    else { fecharLista(); blocos.push(<p key={`p${blocos.length}`} style={{ margin: 0 }}>{linha.replace(/\*\*/g, '')}</p>); }
  }
  fecharLista();
  return blocos;
}

export function ResumoPage() {
  const { cadernoId = '' } = useParams();
  const { usuarioId } = useSessao();
  const caderno = useCaderno(cadernoId);
  const membros = useMembros(cadernoId);
  const souDona = !!caderno.data && caderno.data.donaId === usuarioId;
  const consentimento = useConsentimento(cadernoId, souDona);
  const aceitar = useAceitarConsentimento();

  const [janela, setJanela] = useState<Janela>('7');
  const [pedindo, setPedindo] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ texto: string; padroes: Padrao[]; periodo: string } | null>(null);

  if (!caderno.data || !membros.data) return <Carregando />;
  const c = caderno.data;
  const todos = membros.data;

  if (!souDona) {
    return (
      <main className="pagina">
        <Link to={`/c/${cadernoId}/semana`}>‹ A trama {doApelido(c)}</Link>
        <p>Só a responsável pelo caderno pode gerar o resumo.</p>
      </main>
    );
  }

  async function gerar() {
    setErro(null);
    setGerando(true);
    const ate = new Date();
    const de = new Date(ate.getTime() - Number(janela) * 864e5);
    try {
      const [r, pontos] = await Promise.all([
        gerarResumo({ cadernoId, de: de.toISOString(), ate: ate.toISOString() }),
        buscarPontosEntre(cadernoId, de.toISOString(), ate.toISOString()),
      ]);
      const padroes = detectarPadroes({ pontos, membros: todos, caderno: c, periodoTipo: janela === '30' ? 'mes' : 'semana' });
      setResultado({
        texto: recolocarRotulos(r.texto, r.aliases, todos),
        padroes,
        periodo: `${de.toLocaleDateString('pt-BR')} a ${ate.toLocaleDateString('pt-BR')}`,
      });
    } catch (e) {
      const codigo = e && typeof e === 'object' && 'message' in e ? String(e.message) : '';
      if (codigo === 'sem_consentimento') setPedindo(true);
      else setErro(MENSAGENS[codigo] ?? MENSAGENS.falha_resumo);
    } finally {
      setGerando(false);
    }
  }

  function pedirResumo() {
    if (consentimento.data) void gerar();
    else setPedindo(true);
  }

  return (
    <main className="pagina resumo-impresso">
      <Link to={`/c/${cadernoId}/semana`} className="sem-impressao">‹ A trama {doApelido(c)}</Link>
      <h1 style={{ fontSize: 32 }}>Resumo para a consulta</h1>

      <div className="sem-impressao" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ margin: 0, color: 'var(--texto-2)' }}>Um texto curto com o que foi registrado, para levar à consulta ou à reunião da escola.</p>
        <Escolha legenda="Período" opcoes={JANELAS} valor={janela} onMudar={setJanela} />
        <Button largo onClick={pedirResumo} disabled={gerando}>Gerar resumo</Button>
        <p role="status" style={{ margin: 0 }}>{gerando ? 'Escrevendo o resumo…' : ''}</p>
        {erro && <p role="alert" className="erro">{erro}</p>}
      </div>

      {resultado && (
        <article style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, color: 'var(--texto-2)' }}>Registros de {resultado.periodo}.</p>
          {renderizar(resultado.texto)}
          <h2 style={{ fontSize: 22, marginTop: 12 }}>Padrões encontrados</h2>
          {resultado.padroes.length > 0 ? (
            <ul>{resultado.padroes.map(p => <li key={p.tipo}>{p.frase}</li>)}</ul>
          ) : (
            <p style={{ margin: 0 }}>Nenhum padrão automático no período.</p>
          )}
          <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--texto-3)' }}>Este resumo descreve registros. Não é diagnóstico.</p>
          <Button className="sem-impressao" variante="secundario" onClick={() => window.print()}>Imprimir ou salvar PDF</Button>
        </article>
      )}

      <ConsentimentoDialog
        aberto={pedindo}
        onRecusar={() => setPedindo(false)}
        onAceitar={async () => {
          setPedindo(false);
          try {
            await aceitar.mutateAsync({ cadernoId });
          } catch {
            setErro(MENSAGENS.falha_resumo);
            return;
          }
          await gerar();
        }}
      />
    </main>
  );
}

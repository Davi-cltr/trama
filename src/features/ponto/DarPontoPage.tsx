import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import { useCaderno, useMembros, usePonto, useSessao } from '../../data/queries';
import { enviarPonto, useApagarPonto, useDarPonto, useEditarPonto, type NovoPonto } from '../../data/mutations';
import { enviarRascunhos, listarRascunhos, salvarRascunho } from '../../data/draftQueue';
import { ehErroDeRede, mensagemDeErro } from '../../data/convite';
import { corDoMembro } from '../../domain/palette';
import { contarCaracteres, doApelido, juntarNomes, LIMITES, primeiroNome, validarPonto } from '../../domain/rules';
import type { Caderno, Membro, Ponto, TipoPonto } from '../../domain/types';
import { Glyph } from '../../tapestry/Glyph';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { Field, TextArea } from '../../ui/Field';
import { Carregando } from '../auth/AuthGate';
import { TipoGrid } from './TipoGrid';
import css from './ponto.module.css';

type Fase = 'editando' | 'enviando' | 'rascunho' | 'feito';

const FORMATO_ENTRADA = "yyyy-MM-dd'T'HH:mm";

function paraEntrada(d: Date, fuso: string): string {
  return format(new TZDate(d, fuso), FORMATO_ENTRADA);
}

function deEntrada(v: string, fuso: string): Date {
  const [dia, hora] = v.split('T');
  const [a, m, d] = dia.split('-').map(Number);
  const [h, mi] = hora.split(':').map(Number);
  return new Date(new TZDate(a, m - 1, d, h, mi, 0, fuso).getTime());
}

export function DarPontoPage() {
  const { cadernoId = '', pontoId } = useParams();
  const { usuarioId } = useSessao();
  const caderno = useCaderno(cadernoId);
  const membros = useMembros(cadernoId);
  const existente = usePonto(pontoId);

  if (caderno.isLoading || membros.isLoading || (pontoId && existente.isLoading) || !caderno.data || !membros.data) {
    return <Carregando />;
  }
  if (pontoId && !existente.data) {
    return (
      <main className="pagina">
        <Link to={`/c/${cadernoId}/semana`}>‹ Voltar para a trama</Link>
        <p>Este ponto não existe mais.</p>
      </main>
    );
  }
  return (
    <Formulario
      key={pontoId ?? 'novo'}
      caderno={caderno.data}
      membros={membros.data}
      usuarioId={usuarioId}
      existente={existente.data ?? null}
    />
  );
}

function Formulario({ caderno, membros, usuarioId, existente }: { caderno: Caderno; membros: Membro[]; usuarioId: string | null; existente: Ponto | null }) {
  const navegar = useNavigate();
  const qc = useQueryClient();
  const dar = useDarPonto();
  const editar = useEditarPonto();
  const apagar = useApagarPonto();

  const ativos = membros.filter(m => m.ativo);
  const eu = ativos.find(m => m.perfilId === usuarioId) ?? null;
  const souDona = caderno.donaId === usuarioId;
  const autor = existente ? membros.find(m => m.id === existente.membroId) ?? null : eu;
  const corLinha = autor ? corDoMembro(autor, 'claro') : '#5A6080';
  const outros = ativos.filter(m => m.id !== eu?.id);

  const [tipo, setTipo] = useState<TipoPonto | null>(existente?.tipo ?? null);
  const [sonoRuim, setSonoRuim] = useState<boolean | null>(existente?.sonoRuim ?? null);
  const [texto, setTexto] = useState(existente?.texto ?? '');
  const [momento, setMomento] = useState<string | null>(existente ? paraEntrada(new Date(existente.ocorreuEm), caderno.fuso) : null);
  const [mudandoHorario, setMudandoHorario] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
  const [fase, setFase] = useState<Fase>('editando');
  const [ultimo, setUltimo] = useState<{ tipo: TipoPonto; sonoRuim: boolean | null } | null>(null);
  const [confirmandoApagar, setConfirmandoApagar] = useState(false);
  const [rascunhoId, setRascunhoId] = useState<string | null>(null);
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  async function tentarRascunhos() {
    const r = await enviarRascunhos(async p => {
      await enviarPonto(p);
    });
    if (r.enviados > 0) await qc.invalidateQueries({ queryKey: ['pontos', caderno.id] });
    // Decide pelo rascunho desta tela, não pelo resto da fila.
    const recusado = r.descartados.find(d => d.id === rascunhoId);
    if (recusado) {
      setErros([mensagemDeErro(recusado.erro)]);
      setFase('editando');
    } else if (!listarRascunhos().some(d => d.id === rascunhoId)) {
      setFase(f => (f === 'rascunho' ? 'feito' : f));
    }
  }

  useEffect(() => {
    if (fase !== 'rascunho') return;
    const aoVoltar = () => void tentarRascunhos();
    window.addEventListener('online', aoVoltar);
    return () => window.removeEventListener('online', aoVoltar);
  });

  if (existente && !(souDona || (autor && autor.perfilId === usuarioId))) {
    return (
      <main className="pagina">
        <Link to={`/c/${caderno.id}/semana`}>‹ Voltar para a trama</Link>
        <p>Só quem deu o ponto ou a responsável pode mudar este ponto.</p>
      </main>
    );
  }
  if (!existente && !eu) {
    return (
      <main className="pagina">
        <Link to="/">‹ Seus cadernos</Link>
        <p>Você não tem mais acesso ao caderno {doApelido(caderno)}.</p>
      </main>
    );
  }

  const quandoEscolhido = momento ? deEntrada(momento, caderno.fuso) : agora;
  const total = contarCaracteres(texto);

  async function enviar() {
    if (!tipo) {
      setErros(['Escolha o tipo do ponto.']);
      return;
    }
    const textoLimpo = texto.trim() || null;
    const ocorreuEm = momento ? deEntrada(momento, caderno.fuso) : new Date();
    const problemas = validarPonto({ tipo, sonoRuim: tipo === 'sono' ? sonoRuim : null, texto: textoLimpo, ocorreuEm }, new Date());
    setErros(problemas);
    if (problemas.length > 0) return;

    if (existente) {
      try {
        await editar.mutateAsync({ ...existente, tipo, sonoRuim: tipo === 'sono' ? sonoRuim : null, texto: textoLimpo, ocorreuEm: ocorreuEm.toISOString() });
        navegar(`/c/${caderno.id}/semana`, { replace: true });
      } catch (e) {
        setErros([mensagemDeErro(e)]);
      }
      return;
    }

    const novo: NovoPonto & { id: string } = {
      id: crypto.randomUUID(),
      cadernoId: caderno.id,
      membroId: eu!.id,
      tipo,
      sonoRuim: tipo === 'sono' ? sonoRuim : null,
      texto: textoLimpo,
      ocorreuEm: ocorreuEm.toISOString(),
    };
    setFase('enviando');
    setUltimo({ tipo, sonoRuim: novo.sonoRuim });
    try {
      await dar.mutateAsync(novo);
      setFase('feito');
    } catch (e) {
      if (ehErroDeRede(e) || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
        salvarRascunho(novo);
        setRascunhoId(novo.id);
        setFase('rascunho');
      } else {
        setErros([mensagemDeErro(e)]);
        setFase('editando');
      }
    }
  }

  function darOutro() {
    setTipo(null);
    setSonoRuim(null);
    setTexto('');
    setMomento(null);
    setMudandoHorario(false);
    setErros([]);
    setFase('editando');
  }

  const estiloCor = { '--cor': corLinha } as CSSProperties;

  if (fase === 'feito' && ultimo) {
    return (
      <main className="pagina" style={estiloCor}>
        <svg viewBox="0 0 350 80" width="100%" aria-hidden="true" style={{ marginTop: 32 }}>
          <line x1="0" y1="40" x2="350" y2="40" stroke={corLinha} strokeWidth={1} strokeOpacity={0.3} />
          <path className={css.fioFeito} d="M0 40C60 40 110 40 175 40" stroke={corLinha} />
          <g className={css.bordado} transform="translate(175 40) scale(2.2)" style={{ color: corLinha }}>
            <Glyph tipo={ultimo.tipo} sonoRuim={ultimo.sonoRuim} />
          </g>
        </svg>
        <div role="status"><h1 style={{ fontSize: 30 }}>Ponto dado.</h1></div>
        <p style={{ margin: 0, fontSize: 16, color: 'var(--texto-2)' }}>
          {outros.length > 0
            ? `Já aparece na trama ${doApelido(caderno)} para ${juntarNomes(outros.map(m => primeiroNome(m.rotulo)))}.`
            : `Já aparece na trama ${doApelido(caderno)}.`}
        </p>
        <Link to={`/c/${caderno.id}/semana`} className={css.dar} style={{ background: 'var(--jenipapo)' }}>Ver na trama</Link>
        <Button variante="secundario" onClick={darOutro}>Dar outro ponto</Button>
      </main>
    );
  }

  const textoAgora = `Agora, ${format(new TZDate(agora, caderno.fuso), "H'h'mm")}`;
  const minimo = paraEntrada(new Date(agora.getTime() - LIMITES.diasRetroativos * 864e5), caderno.fuso);
  const maximo = paraEntrada(agora, caderno.fuso);

  return (
    <main className="pagina" style={estiloCor}>
      <Link to={`/c/${caderno.id}/semana`} aria-label="Voltar para a trama">‹ Trama</Link>
      <div>
        <h1 style={{ fontSize: 30 }}>{existente ? 'Editar ponto' : 'Que ponto você quer dar?'}</h1>
        {autor && (
          <p className={css.linhaDe}>
            <span className={css.fio} style={{ background: corLinha }} aria-hidden="true" />
            Na trama {doApelido(caderno)}, pela linha de {autor.rotulo}.
          </p>
        )}
      </div>

      <TipoGrid cor={corLinha} valor={tipo} onMudar={t => { setTipo(t); setErros([]); }} />

      {tipo === 'sono' && (
        <div className={css.noite} role="group" aria-label="Como foi a noite?">
          <button type="button" aria-pressed={sonoRuim === false} onClick={() => setSonoRuim(false)}>Dormiu bem</button>
          <button type="button" aria-pressed={sonoRuim === true} onClick={() => setSonoRuim(true)}>Noite ruim</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <TextArea rotulo="Conte em poucas palavras (opcional)" rows={2} value={texto} onChange={e => setTexto(e.target.value)} />
        <span className={`${css.contador} ${total > LIMITES.texto ? css.contadorErro : ''}`} aria-live="polite">
          {total}/{LIMITES.texto}
        </span>
      </div>

      {mudandoHorario ? (
        <Field
          rotulo="Dia e hora"
          type="datetime-local"
          min={minimo}
          max={maximo}
          value={momento ?? maximo}
          onChange={e => setMomento(e.target.value || null)}
        />
      ) : (
        <div className={css.horario}>
          <span>{momento ? format(new TZDate(quandoEscolhido, caderno.fuso), "dd/MM 'às' H'h'mm") : textoAgora}</span>
          <Button variante="secundario" onClick={() => setMudandoHorario(true)}>Mudar horário</Button>
        </div>
      )}

      {!existente && (
        <p className={css.quemVe}>
          {outros.length > 0 ? (
            <>
              <span className={css.bolinhas} aria-hidden="true">
                {outros.map(m => <span key={m.id} style={{ background: corDoMembro(m, 'claro') }} />)}
              </span>
              {juntarNomes(outros.map(m => primeiroNome(m.rotulo)))} {outros.length === 1 ? 'vê' : 'veem'} este ponto na hora.
            </>
          ) : (
            'Por enquanto só você vê esta trama.'
          )}
        </p>
      )}

      {erros.length > 0 && (
        <div role="alert">
          {erros.map(e => <p key={e} className="erro">{e}</p>)}
        </div>
      )}

      {fase === 'rascunho' && (
        <div className={css.aviso} role="status">
          <span>Sem conexão. O ponto será dado quando a internet voltar.</span>
          <Button variante="secundario" onClick={() => void tentarRascunhos()}>Tentar agora</Button>
        </div>
      )}

      {fase !== 'rascunho' && (
        <button type="button" className={css.dar} onClick={() => void enviar()} disabled={fase === 'enviando'}>
          {existente ? 'Salvar' : 'Dar o ponto'}
        </button>
      )}

      {existente && (
        <>
          <Button variante="texto" onClick={() => setConfirmandoApagar(true)}>Apagar ponto</Button>
          <Dialog titulo="Apagar ponto" aberto={confirmandoApagar} onFechar={() => setConfirmandoApagar(false)}>
            <p style={{ margin: 0 }}>Apagar este ponto? Ele sai da trama para todo mundo.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                variante="perigo"
                onClick={async () => {
                  try {
                    await apagar.mutateAsync({ id: existente.id, cadernoId: caderno.id });
                    navegar(`/c/${caderno.id}/semana`, { replace: true });
                  } catch (e) {
                    setConfirmandoApagar(false);
                    setErros([mensagemDeErro(e)]);
                  }
                }}
              >
                Apagar
              </Button>
              <Button variante="secundario" onClick={() => setConfirmandoApagar(false)}>Cancelar</Button>
            </div>
          </Dialog>
        </>
      )}
    </main>
  );
}

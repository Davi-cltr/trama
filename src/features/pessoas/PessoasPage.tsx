import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useCaderno, useConvites, useMembros, useSessao } from '../../data/queries';
import { useCancelarConvite, useMudarPapel, useRemoverMembro, useSairDoCaderno } from '../../data/mutations';
import { mensagemDeErro } from '../../data/convite';
import { corDoMembro } from '../../domain/palette';
import { LIMITES, ROTULO_PAPEL, doApelido } from '../../domain/rules';
import type { Membro } from '../../domain/types';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { Carregando } from '../auth/AuthGate';
import { esquecerCaderno } from '../caderno/conhecidos';
import { ConvidarDialog } from './ConvidarDialog';
import { OPCOES_PAPEL, type PapelConvidado } from './papeis';
import css from './pessoas.module.css';

export function PessoasPage() {
  const { cadernoId = '' } = useParams();
  const navegar = useNavigate();
  const { usuarioId } = useSessao();
  const caderno = useCaderno(cadernoId);
  const membros = useMembros(cadernoId);
  const souDona = !!caderno.data && caderno.data.donaId === usuarioId;
  const convites = useConvites(cadernoId, souDona);
  const remover = useRemoverMembro();
  const sair = useSairDoCaderno();
  const cancelar = useCancelarConvite();
  const mudarPapel = useMudarPapel();

  const [convidando, setConvidando] = useState(false);
  const [removendo, setRemovendo] = useState<Membro | null>(null);
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (caderno.isLoading || membros.isLoading || !caderno.data) return <Carregando />;

  const ativos = (membros.data ?? []).filter(m => m.ativo);
  const eu = ativos.find(m => m.perfilId === usuarioId);
  const cheio = ativos.length >= LIMITES.linhasAtivas;

  async function tentar(acao: () => Promise<unknown>) {
    setErro(null);
    try {
      await acao();
      return true;
    } catch (err) {
      setErro(mensagemDeErro(err));
      return false;
    }
  }

  return (
    <main className="pagina">
      <Link to={`/c/${cadernoId}/semana`}>‹ A trama {doApelido(caderno.data)}</Link>
      <h1 style={{ fontSize: 32 }}>Pessoas</h1>
      <p style={{ margin: 0, color: 'var(--texto-2)' }}>Cada pessoa que cuida é uma linha da trama.</p>

      <ul className={css.lista}>
        {ativos.map(m => (
          <li key={m.id} className={css.pessoa} aria-label={m.rotulo}>
            <span className={css.fio} style={{ background: corDoMembro(m, 'claro') }} aria-hidden="true" />
            <span className={css.nome}>
              <strong>{m.rotulo}{m.id === eu?.id ? ' (você)' : ''}</strong>
              <span className={css.papel}>{ROTULO_PAPEL[m.papel]}</span>
            </span>
            {souDona && m.papel !== 'responsavel' && (
              <>
                <label className="visualmente-oculto" htmlFor={`papel-${m.id}`}>Papel de {m.rotulo}</label>
                <select
                  id={`papel-${m.id}`}
                  className={css.select}
                  value={m.papel}
                  onChange={e => tentar(() => mudarPapel.mutateAsync({ id: m.id, cadernoId, papel: e.target.value as PapelConvidado }))}
                >
                  {OPCOES_PAPEL.map(o => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
                </select>
                <Button variante="secundario" onClick={() => setRemovendo(m)}>Remover</Button>
              </>
            )}
          </li>
        ))}
      </ul>

      {erro && <p role="alert" className="erro">{erro}</p>}

      {souDona && (
        <>
          <Button largo disabled={cheio} onClick={() => setConvidando(true)}>Convidar</Button>
          {cheio && <p className={css.limite}>Este caderno já tem 6 linhas. Remova alguém para convidar outra pessoa.</p>}

          {convites.data && convites.data.length > 0 && (
            <section aria-labelledby="titulo-convites" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2 id="titulo-convites" style={{ fontSize: 20 }}>Convites pendentes</h2>
              <ul className={css.lista}>
                {convites.data.map(c => (
                  <li key={c.id} className={css.pessoa}>
                    <span className={css.nome}>
                      <strong>{c.rotulo}</strong>
                      <span className={css.papel}>{ROTULO_PAPEL[c.papel]} · vale até {new Date(c.expiraEm).toLocaleDateString('pt-BR')}</span>
                    </span>
                    <Button
                      variante="secundario"
                      aria-label={`Cancelar convite de ${c.rotulo}`}
                      onClick={() => tentar(() => cancelar.mutateAsync({ id: c.id, cadernoId }))}
                    >
                      Cancelar
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <ConvidarDialog caderno={caderno.data} aberto={convidando} onFechar={() => setConvidando(false)} />
        </>
      )}

      {!souDona && eu && (
        <Button variante="secundario" largo onClick={() => setSaindo(true)}>Sair do caderno</Button>
      )}

      <Dialog titulo="Remover pessoa" aberto={removendo !== null} onFechar={() => setRemovendo(null)}>
        <p style={{ margin: 0 }}>
          Remover {removendo?.rotulo}? Ela deixa de ver o caderno; os pontos dela continuam na trama.
        </p>
        <div className="acoes" style={{ display: 'flex', gap: 10 }}>
          <Button
            variante="perigo"
            onClick={async () => {
              const m = removendo!;
              if (await tentar(() => remover.mutateAsync({ id: m.id, cadernoId }))) setRemovendo(null);
            }}
          >
            Remover
          </Button>
          <Button variante="secundario" onClick={() => setRemovendo(null)}>Cancelar</Button>
        </div>
      </Dialog>

      <Dialog titulo="Sair do caderno" aberto={saindo} onFechar={() => setSaindo(false)}>
        <p style={{ margin: 0 }}>Você deixa de ver a trama {doApelido(caderno.data)}. Seus pontos continuam nela.</p>
        <div className="acoes" style={{ display: 'flex', gap: 10 }}>
          <Button
            variante="perigo"
            onClick={async () => {
              if (await tentar(() => sair.mutateAsync({ membroId: eu!.id }))) {
                esquecerCaderno(cadernoId);
                navegar('/', { replace: true });
              }
            }}
          >
            Sair do caderno
          </Button>
          <Button variante="secundario" onClick={() => setSaindo(false)}>Cancelar</Button>
        </div>
      </Dialog>
    </main>
  );
}

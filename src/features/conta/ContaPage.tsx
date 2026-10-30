import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCadernos, useConsentimento, usePerfil, useSessao } from '../../data/queries';
import { useApagarCaderno, useApagarMinhaConta, useRevogarConsentimento } from '../../data/mutations';
import { exportarCaderno } from '../../data/exportar';
import { mensagemDeErro } from '../../data/convite';
import { supabase } from '../../data/supabase';
import { doApelido } from '../../domain/rules';
import type { Caderno } from '../../domain/types';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { Carregando } from '../auth/AuthGate';
import { esquecerCaderno } from '../caderno/conhecidos';
import { ApagarCadernoDialog } from './ApagarCadernoDialog';

function CadernoDaDona({ caderno, onErro }: { caderno: Caderno; onErro: (m: string | null) => void }) {
  const consentimento = useConsentimento(caderno.id);
  const revogar = useRevogarConsentimento();
  const apagar = useApagarCaderno();
  const [apagando, setApagando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const nome = doApelido(caderno);

  async function tentar(acao: () => Promise<unknown>, ok: string) {
    onErro(null);
    try {
      await acao();
      setAviso(ok);
    } catch (e) {
      onErro(mensagemDeErro(e));
    }
  }

  return (
    <li style={{ background: '#fff', border: '1px solid var(--borda-cartao)', borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <strong style={{ fontFamily: 'var(--fonte-titulo)', fontWeight: 400, fontSize: 20 }}>Caderno {nome}</strong>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Button variante="secundario" aria-label={`Exportar dados ${nome}`} onClick={() => tentar(() => exportarCaderno(caderno), 'Arquivo baixado.')}>
          Exportar dados
        </Button>
        {consentimento.data && (
          <Button
            variante="secundario"
            aria-label={`Revogar consentimento da IA ${nome}`}
            onClick={() => tentar(() => revogar.mutateAsync({ cadernoId: caderno.id }), 'Consentimento revogado. Nenhum registro será enviado à IA.')}
          >
            Revogar consentimento da IA
          </Button>
        )}
        <Button variante="perigo" aria-label={`Apagar o caderno ${nome}`} onClick={() => setApagando(true)}>Apagar caderno</Button>
      </div>
      <p role="status" style={{ margin: 0, fontSize: 14 }}>{aviso}</p>
      <ApagarCadernoDialog
        caderno={caderno}
        aberto={apagando}
        onFechar={() => setApagando(false)}
        onConfirmar={async () => {
          try {
            await apagar.mutateAsync({ cadernoId: caderno.id });
            esquecerCaderno(caderno.id);
            setApagando(false);
          } catch (e) {
            setApagando(false);
            onErro(mensagemDeErro(e));
          }
        }}
      />
    </li>
  );
}

export function ContaPage() {
  const navegar = useNavigate();
  const { usuarioId } = useSessao();
  const perfil = usePerfil(usuarioId);
  const cadernos = useCadernos();
  const apagarConta = useApagarMinhaConta();
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (perfil.isLoading || cadernos.isLoading) return <Carregando />;
  const meus = (cadernos.data ?? []).filter(c => c.donaId === usuarioId);

  return (
    <main className="pagina">
      <Link to="/">‹ Seus cadernos</Link>
      <h1 style={{ fontSize: 32 }}>Sua conta</h1>
      {perfil.data && <p style={{ margin: 0 }}>Você aparece como {perfil.data.nomeExibicao}.</p>}

      {meus.length > 0 && (
        <section aria-labelledby="titulo-meus" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 id="titulo-meus" style={{ fontSize: 22 }}>Cadernos em que você é a responsável</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {meus.map(c => <CadernoDaDona key={c.id} caderno={c} onErro={setErro} />)}
          </ul>
        </section>
      )}

      {erro && <p role="alert" className="erro">{erro}</p>}

      <section aria-labelledby="titulo-sessao" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 id="titulo-sessao" style={{ fontSize: 22 }}>Sessão e dados</h2>
        <Button variante="secundario" onClick={async () => { await supabase.auth.signOut(); navegar('/entrar', { replace: true }); }}>
          Sair desta conta
        </Button>
        <Button variante="perigo" onClick={() => { setErro(null); setConfirmando(true); }}>Apagar minha conta</Button>
        <Link to="/privacidade">Privacidade</Link>
      </section>

      <Dialog titulo="Apagar sua conta" aberto={confirmando} onFechar={() => setConfirmando(false)}>
        <p style={{ margin: 0 }}>Você sai de todos os cadernos e seus dados de acesso são apagados. Os pontos que você deu continuam nas tramas, sem o seu nome de usuária.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Button
            variante="perigo"
            onClick={async () => {
              try {
                await apagarConta.mutateAsync();
                navegar('/entrar', { replace: true });
              } catch (e) {
                setConfirmando(false);
                setErro(mensagemDeErro(e));
              }
            }}
          >
            Apagar minha conta
          </Button>
          <Button variante="secundario" onClick={() => setConfirmando(false)}>Cancelar</Button>
        </div>
      </Dialog>
    </main>
  );
}

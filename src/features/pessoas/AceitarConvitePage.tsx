import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAceitarConvite } from '../../data/mutations';
import { mensagemDeErro } from '../../data/convite';
import { classesDeBotao } from '../../ui/Button';
import { Marca } from '../auth/Marca';

export function AceitarConvitePage() {
  const navegar = useNavigate();
  const aceitar = useAceitarConvite();
  const [erro, setErro] = useState<{ codigo: string; texto: string } | null>(null);
  const iniciado = useRef(false);

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    const token = window.location.hash.replace(/^#/, '');
    if (!token) {
      setErro({ codigo: 'convite_invalido', texto: mensagemDeErro({ message: 'convite_invalido' }) });
      return;
    }
    aceitar
      .mutateAsync({ token })
      .then(cadernoId => navegar(`/c/${cadernoId}/semana`, { replace: true }))
      .catch((e: unknown) => {
        const codigo = e && typeof e === 'object' && 'message' in e ? String(e.message) : '';
        setErro({ codigo, texto: mensagemDeErro(e) });
      });
  }, [aceitar, navegar]);

  return (
    <main className="pagina">
      <Marca />
      <h1 style={{ fontSize: 32 }}>Convite</h1>
      {!erro && <p role="status">Abrindo a trama…</p>}
      {erro && (
        <>
          <p role="alert" style={{ margin: 0 }}>{erro.texto}</p>
          <Link to="/" className={`${classesDeBotao.botao} ${classesDeBotao.largo}`}>
            {erro.codigo.includes('ja_membro') ? 'Abrir a trama' : 'Ir para seus cadernos'}
          </Link>
        </>
      )}
    </main>
  );
}

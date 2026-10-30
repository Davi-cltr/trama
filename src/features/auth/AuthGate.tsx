import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { usePerfil, useSessao } from '../../data/queries';
import { esquecerVolta, voltaGuardada } from './volta';

export function Carregando() {
  return (
    <main className="pagina">
      <p role="status">Carregando…</p>
    </main>
  );
}

/** Protege rotas: sem sessão vai para /entrar; sem perfil vai para /nome. */
export function AuthGate({ exigirPerfil = true }: { exigirPerfil?: boolean }) {
  const local = useLocation();
  const { usuarioId, carregando } = useSessao();
  const perfil = usePerfil(usuarioId);
  // O retorno do link mágico traz #access_token=…; isso nunca pode virar rota de volta.
  const hash = /access_token=|error_description=/.test(local.hash) ? '' : local.hash;
  const aqui = local.pathname + local.search + hash;

  useEffect(() => {
    if (hash) esquecerVolta(local.pathname + hash);
  }, [local.pathname, hash]);

  if (carregando) return <Carregando />;
  if (!usuarioId) return <Navigate to={`/entrar?volta=${encodeURIComponent(aqui)}`} replace />;
  if (exigirPerfil) {
    if (perfil.isLoading) return <Carregando />;
    if (!perfil.data) return <Navigate to={`/nome?volta=${encodeURIComponent(aqui)}`} replace />;
  }
  if (!hash) {
    const guardada = voltaGuardada(local.pathname);
    if (guardada) return <Navigate to={guardada} replace />;
  }
  return <Outlet />;
}

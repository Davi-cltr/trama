import { Navigate, Outlet, useLocation } from 'react-router';
import { usePerfil, useSessao } from '../../data/queries';
import { voltaGuardada } from './volta';

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
  const aqui = local.pathname + local.search + local.hash;

  if (carregando) return <Carregando />;
  if (!usuarioId) return <Navigate to={`/entrar?volta=${encodeURIComponent(aqui)}`} replace />;
  if (exigirPerfil) {
    if (perfil.isLoading) return <Carregando />;
    if (!perfil.data) return <Navigate to={`/nome?volta=${encodeURIComponent(aqui)}`} replace />;
  }
  if (!local.hash) {
    const guardada = voltaGuardada(local.pathname);
    if (guardada) return <Navigate to={guardada} replace />;
  }
  return <Outlet />;
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthGate } from './features/auth/AuthGate';
import { EntrarPage } from './features/auth/EntrarPage';
import { NomePage } from './features/auth/NomePage';
import { CadernosPage } from './features/caderno/CadernosPage';
import { NovoCadernoPage } from './features/caderno/NovoCadernoPage';
import { PessoasPage } from './features/pessoas/PessoasPage';
import { AceitarConvitePage } from './features/pessoas/AceitarConvitePage';
import { DarPontoPage } from './features/ponto/DarPontoPage';
import { SincronizarRascunhos } from './features/ponto/SincronizarRascunhos';
import { SemanaPage } from './features/semana/SemanaPage';
import { MesPage } from './features/mes/MesPage';
import { ResumoPage } from './features/resumo/ResumoPage';
import { ContaPage } from './features/conta/ContaPage';
import { PrivacidadePage } from './features/conta/PrivacidadePage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true } },
});

export function Rotas() {
  return (
    <Routes>
      <Route path="/entrar" element={<EntrarPage />} />
      <Route path="/privacidade" element={<PrivacidadePage />} />
      <Route element={<AuthGate exigirPerfil={false} />}>
        <Route path="/nome" element={<NomePage />} />
      </Route>
      <Route element={<AuthGate />}>
        <Route path="/" element={<CadernosPage />} />
        <Route path="/novo" element={<NovoCadernoPage />} />
        <Route path="/c/:cadernoId/semana" element={<SemanaPage />} />
        <Route path="/c/:cadernoId/mes" element={<MesPage />} />
        <Route path="/c/:cadernoId/ponto" element={<DarPontoPage />} />
        <Route path="/c/:cadernoId/ponto/:pontoId" element={<DarPontoPage />} />
        <Route path="/c/:cadernoId/pessoas" element={<PessoasPage />} />
        <Route path="/c/:cadernoId/resumo" element={<ResumoPage />} />
        <Route path="/convite" element={<AceitarConvitePage />} />
        <Route path="/conta" element={<ContaPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SincronizarRascunhos />
      <BrowserRouter>
        <Rotas />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

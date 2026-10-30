import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthGate } from './features/auth/AuthGate';
import { EntrarPage } from './features/auth/EntrarPage';
import { NomePage } from './features/auth/NomePage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true } },
});

function EmConstrucao({ titulo }: { titulo: string }) {
  return (
    <main className="pagina">
      <h1>{titulo}</h1>
    </main>
  );
}

export function Rotas() {
  return (
    <Routes>
      <Route path="/entrar" element={<EntrarPage />} />
      <Route path="/privacidade" element={<EmConstrucao titulo="Privacidade" />} />
      <Route element={<AuthGate exigirPerfil={false} />}>
        <Route path="/nome" element={<NomePage />} />
      </Route>
      <Route element={<AuthGate />}>
        <Route path="/" element={<EmConstrucao titulo="Seus cadernos" />} />
        <Route path="/novo" element={<EmConstrucao titulo="Novo caderno" />} />
        <Route path="/c/:cadernoId/semana" element={<EmConstrucao titulo="Semana" />} />
        <Route path="/c/:cadernoId/mes" element={<EmConstrucao titulo="Mês" />} />
        <Route path="/c/:cadernoId/ponto" element={<EmConstrucao titulo="Dar um ponto" />} />
        <Route path="/c/:cadernoId/ponto/:pontoId" element={<EmConstrucao titulo="Editar ponto" />} />
        <Route path="/c/:cadernoId/pessoas" element={<EmConstrucao titulo="Pessoas" />} />
        <Route path="/c/:cadernoId/resumo" element={<EmConstrucao titulo="Resumo" />} />
        <Route path="/convite" element={<EmConstrucao titulo="Convite" />} />
        <Route path="/conta" element={<EmConstrucao titulo="Sua conta" />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Rotas />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

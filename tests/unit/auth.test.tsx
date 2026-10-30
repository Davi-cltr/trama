import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'vitest-axe';

const sessao = vi.hoisted(() => ({ usuarioId: null as string | null, carregando: false }));
const perfil = vi.hoisted(() => ({ data: null as { nomeExibicao: string } | null, isLoading: false }));
const signInWithOtp = vi.hoisted(() => vi.fn(async (_: unknown) => ({ data: {}, error: null })));
const salvarPerfil = vi.hoisted(() => vi.fn(async (_: unknown) => undefined));

vi.mock('../../src/data/queries', () => ({
  useSessao: () => sessao,
  usePerfil: () => perfil,
}));
vi.mock('../../src/data/supabase', () => ({ supabase: { auth: { signInWithOtp } } }));
vi.mock('../../src/data/mutations', () => ({
  useSalvarPerfil: () => ({ mutateAsync: salvarPerfil, isPending: false }),
}));

import { AuthGate } from '../../src/features/auth/AuthGate';
import { EntrarPage } from '../../src/features/auth/EntrarPage';
import { NomePage } from '../../src/features/auth/NomePage';

function Onde() {
  const l = useLocation();
  return <p data-testid="onde">{l.pathname + l.search + l.hash}</p>;
}

function montar(rota: string) {
  return render(
    <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[rota]}>
        <Routes>
          <Route path="/entrar" element={<><EntrarPage /><Onde /></>} />
          <Route element={<AuthGate exigirPerfil={false} />}>
            <Route path="/nome" element={<><NomePage /><Onde /></>} />
          </Route>
          <Route element={<AuthGate />}>
            <Route path="/" element={<p>Lista</p>} />
            <Route path="/c/:cadernoId/semana" element={<p>Semana</p>} />
            <Route path="/convite" element={<><p>Convite</p><Onde /></>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
    </StrictMode>,
  );
}

beforeEach(() => {
  sessao.usuarioId = null;
  sessao.carregando = false;
  perfil.data = null;
  signInWithOtp.mockClear();
  salvarPerfil.mockClear();
  localStorage.clear();
});

it('sem sessão vai para /entrar preservando a volta', () => {
  montar('/c/abc/semana');
  expect(screen.getByTestId('onde')).toHaveTextContent('/entrar?volta=%2Fc%2Fabc%2Fsemana');
  expect(screen.getByRole('heading', { name: 'Entre na Trama' })).toBeInTheDocument();
});

it('com sessão e sem perfil vai para /nome', () => {
  sessao.usuarioId = 'u1';
  montar('/c/abc/semana');
  expect(screen.getByTestId('onde')).toHaveTextContent('/nome?volta=%2Fc%2Fabc%2Fsemana');
  expect(screen.getByRole('heading', { name: 'Como você quer ser chamada?' })).toBeInTheDocument();
});

it('com sessão e perfil entra na rota', () => {
  sessao.usuarioId = 'u1';
  perfil.data = { nomeExibicao: 'Ana' };
  montar('/c/abc/semana');
  expect(screen.getByText('Semana')).toBeInTheDocument();
});

it('enviar e-mail chama signInWithOtp com a rota de volta', async () => {
  montar('/entrar?volta=%2Fc%2Fabc%2Fsemana');
  await userEvent.type(screen.getByLabelText('Seu e-mail'), 'ana@exemplo.com');
  await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }));
  expect(signInWithOtp).toHaveBeenCalledWith({
    email: 'ana@exemplo.com',
    options: { emailRedirectTo: `${window.location.origin}/c/abc/semana` },
  });
  expect(await screen.findByText('Enviamos um link para ana@exemplo.com. Abra no celular para entrar.')).toBeInTheDocument();
});

it('convite: o fragmento fica guardado no aparelho e volta depois de entrar', async () => {
  montar('/entrar?volta=%2Fconvite%23tok123');
  await userEvent.type(screen.getByLabelText('Seu e-mail'), 'ze@exemplo.com');
  await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }));
  expect(signInWithOtp).toHaveBeenCalledWith({ email: 'ze@exemplo.com', options: { emailRedirectTo: `${window.location.origin}/convite` } });

  sessao.usuarioId = 'u3';
  perfil.data = { nomeExibicao: 'Zé' };
  montar('/convite');
  await waitFor(() => expect(screen.getAllByTestId('onde').at(-1)).toHaveTextContent('/convite#tok123'));
});

it('nome vazio ou com 41 caracteres mostra erro', async () => {
  sessao.usuarioId = 'u1';
  montar('/nome');
  await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.getByText('Escreva seu nome.')).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText('Seu nome'), 'a'.repeat(41));
  await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.getByText('Use até 40 caracteres.')).toBeInTheDocument();
  expect(salvarPerfil).not.toHaveBeenCalled();
});

it('nome válido salva e segue para a volta', async () => {
  sessao.usuarioId = 'u1';
  montar('/nome?volta=%2Fc%2Fabc%2Fsemana');
  await userEvent.type(screen.getByLabelText('Seu nome'), ' Ana ');
  await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(salvarPerfil).toHaveBeenCalledWith({ usuarioId: 'u1', nomeExibicao: 'Ana' });
});

it('telas de entrada sem violações de acessibilidade', async () => {
  const { container } = montar('/entrar');
  expect(await axe(container)).toHaveNoViolations();
});

it('o fragmento do link mágico nunca vai para a volta', () => {
  sessao.usuarioId = 'u1';
  montar('/convite#access_token=segredo&type=magiclink');
  expect(screen.getByTestId('onde')).toHaveTextContent('/nome?volta=%2Fconvite');
  expect(screen.getByTestId('onde').textContent).not.toContain('segredo');
});

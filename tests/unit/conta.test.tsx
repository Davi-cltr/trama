import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { axe } from 'vitest-axe';

const fns = vi.hoisted(() => ({
  apagarConta: vi.fn(async (_?: unknown) => undefined),
  apagarCaderno: vi.fn(async (_: unknown) => undefined),
  revogar: vi.fn(async (_: unknown) => undefined),
  exportar: vi.fn(async (_: unknown) => undefined),
  sair: vi.fn(async () => ({ error: null })),
}));

vi.mock('../../src/data/queries', async () => {
  const f = await import('./fixtures/semana-theo');
  return {
    useSessao: () => ({ usuarioId: 'perfil-ana', carregando: false }),
    usePerfil: () => ({ data: { nomeExibicao: 'Ana' }, isLoading: false }),
    useCadernos: () => ({ data: [f.theo], isLoading: false }),
    useConsentimento: () => ({ data: true, isLoading: false }),
  };
});
vi.mock('../../src/data/mutations', () => ({
  useApagarMinhaConta: () => ({ mutateAsync: fns.apagarConta, isPending: false }),
  useApagarCaderno: () => ({ mutateAsync: fns.apagarCaderno, isPending: false }),
  useRevogarConsentimento: () => ({ mutateAsync: fns.revogar, isPending: false }),
}));
vi.mock('../../src/data/exportar', async orig => ({
  ...(await orig<typeof import('../../src/data/exportar')>()),
  exportarCaderno: fns.exportar,
}));
vi.mock('../../src/data/supabase', () => ({ supabase: { auth: { signOut: fns.sair } } }));

import { ContaPage } from '../../src/features/conta/ContaPage';
import { PrivacidadePage } from '../../src/features/conta/PrivacidadePage';

function Onde() {
  return <p data-testid="onde">{useLocation().pathname}</p>;
}

function montar(rota = '/conta') {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route path="/conta" element={<ContaPage />} />
        <Route path="/privacidade" element={<PrivacidadePage />} />
        <Route path="*" element={<Onde />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => Object.values(fns).forEach(f => f.mockClear()));

it('exportar dados do caderno', async () => {
  montar();
  await userEvent.click(screen.getByRole('button', { name: 'Exportar dados do Theo' }));
  expect(fns.exportar).toHaveBeenCalledWith(expect.objectContaining({ id: 'cad-theo' }));
});

it('botão de apagar só habilita com o apelido exato', async () => {
  montar();
  await userEvent.click(screen.getByRole('button', { name: 'Apagar o caderno do Theo' }));
  const dialogo = screen.getByRole('dialog');
  const botao = within(dialogo).getByRole('button', { name: 'Apagar para sempre' });
  expect(botao).toBeDisabled();
  const campo = within(dialogo).getByLabelText('Digite Theo para confirmar');
  await userEvent.type(campo, 'theo');
  expect(botao).toBeDisabled();
  await userEvent.clear(campo);
  await userEvent.type(campo, 'Theo');
  expect(botao).toBeEnabled();
  await userEvent.click(botao);
  expect(fns.apagarCaderno).toHaveBeenCalledWith({ cadernoId: 'cad-theo' });
});

it('erro dona_de_caderno mostra a frase e não navega', async () => {
  fns.apagarConta.mockRejectedValueOnce({ message: 'dona_de_caderno' });
  montar();
  await userEvent.click(screen.getByRole('button', { name: 'Apagar minha conta' }));
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Apagar minha conta' }));
  expect(await screen.findByText('Antes de apagar sua conta, apague os cadernos em que você é a responsável.')).toBeInTheDocument();
  expect(screen.queryByTestId('onde')).toBeNull();
});

it('revogar consentimento da IA', async () => {
  montar();
  await userEvent.click(screen.getByRole('button', { name: 'Revogar consentimento da IA do Theo' }));
  expect(fns.revogar).toHaveBeenCalledWith({ cadernoId: 'cad-theo' });
});

it('privacidade em linguagem simples', () => {
  montar('/privacidade');
  expect(screen.getByRole('heading', { level: 1, name: 'Privacidade' })).toBeInTheDocument();
  expect(screen.getByText(/dados pessoais sensíveis/)).toBeInTheDocument();
});

it('axe sem violações', async () => {
  const { container } = montar();
  expect(await axe(container)).toHaveNoViolations();
});

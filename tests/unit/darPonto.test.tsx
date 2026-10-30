import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { axe } from 'vitest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theo, membros } from './fixtures/semana-theo';
import { listarRascunhos } from '../../src/data/draftQueue';

const estado = vi.hoisted(() => ({ usuarioId: 'perfil-ana', ponto: null as unknown }));
const fns = vi.hoisted(() => ({
  dar: vi.fn(async (p: unknown) => p),
  editar: vi.fn(async (p: unknown) => p),
  apagar: vi.fn(async (_: unknown) => undefined),
  enviarPonto: vi.fn(async (p: unknown) => p),
}));

vi.mock('../../src/data/queries', async () => {
  const f = await import('./fixtures/semana-theo');
  return {
    useSessao: () => ({ usuarioId: estado.usuarioId, carregando: false }),
    useCaderno: () => ({ data: f.theo, isLoading: false }),
    useMembros: () => ({ data: f.membros, isLoading: false }),
    usePonto: () => ({ data: estado.ponto, isLoading: false }),
  };
});
vi.mock('../../src/data/mutations', () => ({
  useDarPonto: () => ({ mutateAsync: fns.dar, isPending: false }),
  useEditarPonto: () => ({ mutateAsync: fns.editar, isPending: false }),
  useApagarPonto: () => ({ mutateAsync: fns.apagar, isPending: false }),
  enviarPonto: fns.enviarPonto,
}));

import { DarPontoPage } from '../../src/features/ponto/DarPontoPage';

function Onde() {
  return <p data-testid="onde">{useLocation().pathname}</p>;
}

function montar(rota = '/c/cad-theo/ponto') {
  return render(
    <QueryClientProvider client={new QueryClient()}>
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route path="/c/:cadernoId/ponto" element={<DarPontoPage />} />
        <Route path="/c/:cadernoId/ponto/:pontoId" element={<DarPontoPage />} />
        <Route path="*" element={<Onde />} />
      </Routes>
    </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  estado.usuarioId = 'perfil-ana';
  estado.ponto = null;
  Object.values(fns).forEach(f => { f.mockReset(); });
  fns.dar.mockImplementation(async p => p);
  fns.editar.mockImplementation(async p => p);
  fns.enviarPonto.mockImplementation(async p => p);
  localStorage.clear();
});

it('mostra quem registra e em qual trama', () => {
  montar();
  expect(screen.getByRole('heading', { name: 'Que ponto você quer dar?' })).toBeInTheDocument();
  expect(screen.getByText('Na trama do Theo, pela linha de Ana, mãe.')).toBeInTheDocument();
  expect(screen.getByText('Júlia, Rafa e Cida veem este ponto na hora.')).toBeInTheDocument();
});

it('fluxo completo em 2 toques: tipo e "Dar o ponto"', async () => {
  montar();
  await userEvent.click(screen.getByRole('button', { name: /Crise/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Dar o ponto' }));
  expect(fns.dar).toHaveBeenCalledTimes(1);
  const enviado = fns.dar.mock.calls[0][0] as Record<string, unknown>;
  expect(enviado).toMatchObject({ cadernoId: 'cad-theo', membroId: 'ana', tipo: 'crise', sonoRuim: null, texto: null });
  expect(enviado.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(await screen.findByRole('heading', { name: 'Ponto dado.' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ver na trama' })).toHaveAttribute('href', '/c/cad-theo/semana');
  await userEvent.click(screen.getByRole('button', { name: 'Dar outro ponto' }));
  expect(screen.getByRole('heading', { name: 'Que ponto você quer dar?' })).toBeInTheDocument();
});

it('botões de tipo usam aria-pressed', async () => {
  montar();
  const conquista = screen.getByRole('button', { name: /Conquista/ });
  expect(conquista).toHaveAttribute('aria-pressed', 'false');
  await userEvent.click(conquista);
  expect(conquista).toHaveAttribute('aria-pressed', 'true');
});

it('sem tipo escolhido não envia', async () => {
  montar();
  await userEvent.click(screen.getByRole('button', { name: 'Dar o ponto' }));
  expect(screen.getByText('Escolha o tipo do ponto.')).toBeInTheDocument();
  expect(fns.dar).not.toHaveBeenCalled();
});

it('sono sem escolha não envia; com "Noite ruim" envia', async () => {
  montar();
  await userEvent.click(screen.getByRole('button', { name: /Sono/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Dar o ponto' }));
  expect(screen.getByText('Escolha como foi a noite.')).toBeInTheDocument();
  expect(fns.dar).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Noite ruim' }));
  await userEvent.click(screen.getByRole('button', { name: 'Dar o ponto' }));
  expect(fns.dar).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'sono', sonoRuim: true }));
});

it('281 caracteres bloqueia o envio e mostra o erro', async () => {
  montar();
  await userEvent.click(screen.getByRole('button', { name: /Nota/ }));
  const campo = screen.getByLabelText('Conte em poucas palavras (opcional)');
  await userEvent.click(campo);
  await userEvent.paste('a'.repeat(281));
  expect(screen.getByText('281/280')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Dar o ponto' }));
  expect(screen.getByText('O texto pode ter até 280 caracteres.')).toBeInTheDocument();
  expect(fns.dar).not.toHaveBeenCalled();
});

it('falha de rede salva rascunho e mostra a frase', async () => {
  fns.dar.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  montar();
  await userEvent.click(screen.getByRole('button', { name: /Comida/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Dar o ponto' }));
  expect(await screen.findByText('Sem conexão. O ponto será dado quando a internet voltar.')).toBeInTheDocument();
  expect(listarRascunhos()).toHaveLength(1);
  expect(listarRascunhos()[0]).toMatchObject({ tipo: 'comida', membroId: 'ana' });
});

it('"Tentar agora" duas vezes chama o envio uma vez', async () => {
  fns.dar.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  let liberar: () => void = () => {};
  fns.enviarPonto.mockImplementation(() => new Promise(r => { liberar = () => r(undefined); }));
  montar();
  await userEvent.click(screen.getByRole('button', { name: /Comida/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Dar o ponto' }));
  const tentar = await screen.findByRole('button', { name: 'Tentar agora' });
  await userEvent.click(tentar);
  await userEvent.click(tentar);
  liberar();
  expect(await screen.findByRole('heading', { name: 'Ponto dado.' })).toBeInTheDocument();
  expect(fns.enviarPonto).toHaveBeenCalledTimes(1);
  expect(listarRascunhos()).toEqual([]);
});

it('editar: autora salva e pode apagar com confirmação', async () => {
  estado.ponto = { id: 'p1', cadernoId: 'cad-theo', membroId: 'ana', tipo: 'nota', sonoRuim: null, texto: 'antes', ocorreuEm: new Date().toISOString() };
  montar('/c/cad-theo/ponto/p1');
  const campo = screen.getByLabelText('Conte em poucas palavras (opcional)');
  expect(campo).toHaveValue('antes');
  await userEvent.clear(campo);
  await userEvent.type(campo, 'depois');
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
  expect(fns.editar).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1', texto: 'depois' }));
  expect(await screen.findByTestId('onde')).toHaveTextContent('/c/cad-theo/semana');
});

it('editar: apagar pede confirmação', async () => {
  estado.ponto = { id: 'p1', cadernoId: 'cad-theo', membroId: 'ana', tipo: 'nota', sonoRuim: null, texto: null, ocorreuEm: new Date().toISOString() };
  montar('/c/cad-theo/ponto/p1');
  await userEvent.click(screen.getByRole('button', { name: 'Apagar ponto' }));
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Apagar' }));
  expect(fns.apagar).toHaveBeenCalledWith({ id: 'p1', cadernoId: 'cad-theo' });
});

it('editar: quem não é autor nem dona não edita', () => {
  estado.usuarioId = 'perfil-rafa';
  estado.ponto = { id: 'p1', cadernoId: 'cad-theo', membroId: 'julia', tipo: 'nota', sonoRuim: null, texto: null, ocorreuEm: new Date().toISOString() };
  montar('/c/cad-theo/ponto/p1');
  expect(screen.getByText('Só quem deu o ponto ou a responsável pode mudar este ponto.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull();
});

it('sem violações do axe', async () => {
  const { container } = montar();
  await userEvent.click(screen.getByRole('button', { name: /Sono/ }));
  expect(await axe(container)).toHaveNoViolations();
});

void theo; void membros;

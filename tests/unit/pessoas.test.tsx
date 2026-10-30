import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { axe } from 'vitest-axe';
import type { Caderno, Membro } from '../../src/domain/types';

const estado = vi.hoisted(() => ({
  usuarioId: 'perfil-ana' as string | null,
  caderno: null as unknown,
  membros: [] as unknown[],
  convites: [] as unknown[],
  cadernos: [] as unknown[],
}));
const fns = vi.hoisted(() => ({
  criarCaderno: vi.fn(async (_: unknown) => 'novo-id'),
  aceitar: vi.fn(async (_: unknown): Promise<string> => 'cad-theo'),
  remover: vi.fn(async (_: unknown) => undefined),
  sair: vi.fn(async (_: unknown) => undefined),
  criarConvite: vi.fn(async (_: unknown) => ({ token: 't', link: 'http://localhost/convite#t' })),
  cancelarConvite: vi.fn(async (_: unknown) => undefined),
  mudarPapel: vi.fn(async (_: unknown) => undefined),
}));

vi.mock('../../src/data/queries', () => ({
  useSessao: () => ({ usuarioId: estado.usuarioId, carregando: false }),
  usePerfil: () => ({ data: { nomeExibicao: 'Ana' }, isLoading: false }),
  useCaderno: () => ({ data: estado.caderno, isLoading: false }),
  useMembros: () => ({ data: estado.membros, isLoading: false }),
  useConvites: () => ({ data: estado.convites, isLoading: false }),
  useCadernos: () => ({ data: estado.cadernos, isLoading: false }),
}));
const mut = vi.hoisted(() => (fn: (v: unknown) => Promise<unknown>) => () => ({ mutateAsync: fn, isPending: false }));
vi.mock('../../src/data/mutations', () => ({
  useCriarCaderno: mut(fns.criarCaderno),
  useAceitarConvite: mut(fns.aceitar),
  useRemoverMembro: mut(fns.remover),
  useSairDoCaderno: mut(fns.sair),
  useCriarConvite: mut(fns.criarConvite),
  useCancelarConvite: mut(fns.cancelarConvite),
  useMudarPapel: mut(fns.mudarPapel),
}));

import { NovoCadernoPage } from '../../src/features/caderno/NovoCadernoPage';
import { CadernosPage } from '../../src/features/caderno/CadernosPage';
import { PessoasPage } from '../../src/features/pessoas/PessoasPage';
import { AceitarConvitePage } from '../../src/features/pessoas/AceitarConvitePage';

const theo: Caderno = { id: 'cad-theo', apelido: 'Theo', tratamento: 'o', nascimento: null, donaId: 'perfil-ana', fuso: 'America/Sao_Paulo' };
const membro = (i: number, extra: Partial<Membro> = {}): Membro => ({
  id: `m${i}`, cadernoId: 'cad-theo', perfilId: `perfil-${i}`, papel: 'cuidador', rotulo: `Pessoa ${i}`, cor: i, ativo: true,
  entrouEm: `2026-09-0${i + 1}T00:00:00Z`, ...extra,
});
const ana = membro(0, { perfilId: 'perfil-ana', papel: 'responsavel', rotulo: 'Ana, mãe' });
const julia = membro(1, { perfilId: 'perfil-julia', papel: 'escola', rotulo: 'Júlia, professora' });

function Onde() {
  const l = useLocation();
  return <p data-testid="onde">{l.pathname}</p>;
}

function montar(rota: string) {
  return render(
    <StrictMode>
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route path="/" element={<CadernosPage />} />
        <Route path="/novo" element={<NovoCadernoPage />} />
        <Route path="/c/:cadernoId/pessoas" element={<PessoasPage />} />
        <Route path="/convite" element={<AceitarConvitePage />} />
        <Route path="*" element={<Onde />} />
      </Routes>
    </MemoryRouter>
    </StrictMode>,
  );
}

beforeEach(() => {
  estado.usuarioId = 'perfil-ana';
  estado.caderno = theo;
  estado.membros = [ana, julia];
  estado.convites = [];
  estado.cadernos = [theo];
  Object.values(fns).forEach(f => f.mockClear());
  localStorage.clear();
});

it('criar caderno envia o tratamento escolhido e vai para a semana', async () => {
  montar('/novo');
  expect(screen.getByRole('heading', { name: 'Para quem é este caderno?' })).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText('Apelido'), 'Maria');
  await userEvent.click(screen.getByRole('radio', { name: 'a Maria' }));
  expect(screen.getByLabelText('Como você aparece na trama')).toHaveValue('Ana, mãe');
  await userEvent.click(screen.getByRole('button', { name: 'Criar caderno' }));
  expect(fns.criarCaderno).toHaveBeenCalledWith({ apelido: 'Maria', tratamento: 'a', nascimento: null, rotulo: 'Ana, mãe' });
  expect(await screen.findByTestId('onde')).toHaveTextContent('/c/novo-id/semana');
});

it('apelido é obrigatório', async () => {
  montar('/novo');
  await userEvent.click(screen.getByRole('button', { name: 'Criar caderno' }));
  expect(screen.getByText('Escreva o apelido.')).toBeInTheDocument();
  expect(fns.criarCaderno).not.toHaveBeenCalled();
});

it('nascimento vira o primeiro dia do mês', async () => {
  montar('/novo');
  await userEvent.type(screen.getByLabelText('Apelido'), 'Theo');
  await userEvent.type(screen.getByLabelText('Mês e ano de nascimento (opcional)'), '2019-03');
  await userEvent.click(screen.getByRole('button', { name: 'Criar caderno' }));
  expect(fns.criarCaderno).toHaveBeenCalledWith(expect.objectContaining({ nascimento: '2019-03-01', tratamento: 'o' }));
});

it('dona vê "Remover" nas outras pessoas e confirma antes', async () => {
  montar('/c/cad-theo/pessoas');
  const linhaJulia = screen.getByRole('listitem', { name: 'Júlia, professora' });
  await userEvent.click(within(linhaJulia).getByRole('button', { name: 'Remover' }));
  const dialogo = screen.getByRole('dialog');
  expect(dialogo).toHaveTextContent('Remover Júlia, professora? Ela deixa de ver o caderno; os pontos dela continuam na trama.');
  await userEvent.click(within(dialogo).getByRole('button', { name: 'Remover' }));
  expect(fns.remover).toHaveBeenCalledWith({ id: 'm1', cadernoId: 'cad-theo' });
  expect(within(screen.getByRole('listitem', { name: 'Ana, mãe' })).queryByRole('button', { name: 'Remover' })).toBeNull();
});

it('membro não vê "Remover" e pode sair do caderno', async () => {
  estado.usuarioId = 'perfil-julia';
  montar('/c/cad-theo/pessoas');
  expect(screen.queryByRole('button', { name: 'Remover' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Convidar' })).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Sair do caderno' }));
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sair do caderno' }));
  expect(fns.sair).toHaveBeenCalledWith({ membroId: 'm1' });
});

it('com 6 ativos "Convidar" está desabilitado e a frase aparece', () => {
  estado.membros = [ana, ...[1, 2, 3, 4, 5].map(i => membro(i))];
  montar('/c/cad-theo/pessoas');
  expect(screen.getByRole('button', { name: 'Convidar' })).toBeDisabled();
  expect(screen.getByText('Este caderno já tem 6 linhas. Remova alguém para convidar outra pessoa.')).toBeInTheDocument();
});

it('convidar: papel, rótulo, depois WhatsApp e copiar', async () => {
  montar('/c/cad-theo/pessoas');
  await userEvent.click(screen.getByRole('button', { name: 'Convidar' }));
  const dialogo = screen.getByRole('dialog');
  await userEvent.click(within(dialogo).getByRole('radio', { name: 'Terapia' }));
  await userEvent.type(within(dialogo).getByLabelText('Como a pessoa aparece'), 'Rafa, fono');
  await userEvent.click(within(dialogo).getByRole('button', { name: 'Criar convite' }));
  expect(fns.criarConvite).toHaveBeenCalledWith({ cadernoId: 'cad-theo', papel: 'terapia', rotulo: 'Rafa, fono' });
  const whats = await within(dialogo).findByRole('link', { name: 'Enviar pelo WhatsApp' });
  expect(decodeURIComponent(whats.getAttribute('href')!)).toContain('trama do Theo');
  expect(within(dialogo).getByRole('button', { name: 'Copiar link' })).toBeInTheDocument();
});

it('convites pendentes podem ser cancelados', async () => {
  estado.convites = [{ id: 'v1', papel: 'escola', rotulo: 'Bia, mediadora', expiraEm: '2026-11-05T00:00:00Z' }];
  montar('/c/cad-theo/pessoas');
  await userEvent.click(screen.getByRole('button', { name: 'Cancelar convite de Bia, mediadora' }));
  expect(fns.cancelarConvite).toHaveBeenCalledWith({ id: 'v1', cadernoId: 'cad-theo' });
});

it('aceitar com ja_membro mostra a frase e o botão', async () => {
  fns.aceitar.mockRejectedValueOnce({ message: 'ja_membro' });
  window.location.hash = '#tok';
  montar('/convite');
  expect(await screen.findByText('Você já faz parte desta trama.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Abrir a trama' })).toBeInTheDocument();
  expect(fns.aceitar).toHaveBeenCalledTimes(1);
});

it('aceitar com sucesso vai para a semana', async () => {
  window.location.hash = '#tok';
  montar('/convite');
  expect(await screen.findByTestId('onde')).toHaveTextContent('/c/cad-theo/semana');
  expect(fns.aceitar).toHaveBeenCalledWith({ token: 'tok' });
});

it('convite inválido mostra a frase do spec', async () => {
  fns.aceitar.mockRejectedValueOnce({ message: 'convite_invalido' });
  window.location.hash = '#velho';
  montar('/convite');
  expect(await screen.findByText('Este convite não vale mais. Peça um novo para quem te convidou.')).toBeInTheDocument();
});

it('lista de cadernos avisa quando a pessoa perdeu acesso', async () => {
  localStorage.setItem('trama:cadernos-conhecidos', JSON.stringify({ 'cad-x': { apelido: 'Bento', tratamento: 'o' }, 'cad-theo': { apelido: 'Theo', tratamento: 'o' } }));
  montar('/');
  expect(await screen.findByText('Você não tem mais acesso ao caderno do Bento.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Theo/ })).toHaveAttribute('href', '/c/cad-theo/semana');
});

it('pessoas sem violações de acessibilidade', async () => {
  const { container } = montar('/c/cad-theo/pessoas');
  expect(await axe(container)).toHaveNoViolations();
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { axe } from 'vitest-axe';

const estado = vi.hoisted(() => ({ consentido: false }));
const fns = vi.hoisted(() => ({
  gerar: vi.fn(async (_: unknown) => ({
    texto: '## Visão geral\nA escola 1 e a responsável registraram a semana.\n- terapia 1 viu avanço',
    aliases: { 'responsável': 'ana', 'escola 1': 'julia', 'terapia 1': 'rafa', 'cuidador 1': 'cida' } as Record<string, string>,
  })),
  aceitar: vi.fn(async (_: unknown) => undefined),
}));

vi.mock('../../src/data/queries', async () => {
  const f = await import('./fixtures/semana-theo');
  return {
    useSessao: () => ({ usuarioId: 'perfil-ana', carregando: false }),
    useCaderno: () => ({ data: f.theo, isLoading: false }),
    useMembros: () => ({ data: f.membros, isLoading: false }),
    useConsentimento: () => ({ data: estado.consentido, isLoading: false }),
    buscarPontosEntre: async () => f.pontosTheo,
  };
});
vi.mock('../../src/data/mutations', () => ({
  useAceitarConsentimento: () => ({ mutateAsync: fns.aceitar, isPending: false }),
}));
vi.mock('../../src/data/resumo', () => ({ gerarResumo: fns.gerar }));

import { ResumoPage } from '../../src/features/resumo/ResumoPage';

function montar() {
  return render(
    <MemoryRouter initialEntries={['/c/cad-theo/resumo']}>
      <Routes><Route path="/c/:cadernoId/resumo" element={<ResumoPage />} /></Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  estado.consentido = false;
  fns.gerar.mockClear();
  fns.aceitar.mockClear();
});

it('sem consentimento abre o diálogo; "Agora não" não chama a função', async () => {
  montar();
  await userEvent.click(screen.getByRole('button', { name: 'Gerar resumo' }));
  const dialogo = screen.getByRole('dialog');
  expect(dialogo).toHaveTextContent('nomes são trocados por papéis');
  await userEvent.click(within(dialogo).getByRole('button', { name: 'Agora não' }));
  expect(fns.gerar).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('"Aceitar e gerar" registra o consentimento e gera', async () => {
  montar();
  await userEvent.click(screen.getByRole('radio', { name: 'Últimas 2 semanas' }));
  await userEvent.click(screen.getByRole('button', { name: 'Gerar resumo' }));
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aceitar e gerar' }));
  expect(fns.aceitar).toHaveBeenCalledWith({ cadernoId: 'cad-theo' });
  expect(fns.gerar).toHaveBeenCalledTimes(1);
  const { de, ate } = fns.gerar.mock.calls[0][0] as { de: string; ate: string };
  expect(Date.parse(ate) - Date.parse(de)).toBe(14 * 864e5);
});

it('aliases são trocados pelos rótulos na tela e os padrões entram no fim', async () => {
  estado.consentido = true;
  montar();
  await userEvent.click(screen.getByRole('button', { name: 'Gerar resumo' }));
  expect(await screen.findByRole('heading', { name: 'Visão geral' })).toBeInTheDocument();
  expect(screen.getByText('A Júlia, professora e a Ana, mãe registraram a semana.')).toBeInTheDocument();
  expect(screen.getByText('Rafa, fono viu avanço')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Padrões encontrados' })).toBeInTheDocument();
  expect(screen.getByText('Nas 3 vezes em que dormiu mal, o Theo teve crise no mesmo dia.')).toBeInTheDocument();
  expect(screen.getByText('Este resumo descreve registros. Não é diagnóstico.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Imprimir ou salvar PDF' })).toBeInTheDocument();
});

it('resposta 429 mostra a frase do limite', async () => {
  estado.consentido = true;
  fns.gerar.mockRejectedValueOnce({ message: 'limite_mensal' });
  montar();
  await userEvent.click(screen.getByRole('button', { name: 'Gerar resumo' }));
  expect(await screen.findByText('Este caderno já gerou 10 resumos neste mês. Tente de novo no mês que vem.')).toBeInTheDocument();
});

it('outras falhas mostram a frase do spec', async () => {
  estado.consentido = true;
  fns.gerar.mockRejectedValueOnce({ message: 'falha_resumo' });
  montar();
  await userEvent.click(screen.getByRole('button', { name: 'Gerar resumo' }));
  expect(await screen.findByText('Não foi possível gerar o resumo agora. Seus registros estão salvos. Tente de novo em alguns minutos.')).toBeInTheDocument();
});

it('axe sem violações', async () => {
  const { container } = montar();
  expect(await axe(container)).toHaveNoViolations();
});

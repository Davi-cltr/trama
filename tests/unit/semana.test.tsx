import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { axe } from 'vitest-axe';
import { pontosTheo, ponto } from './fixtures/semana-theo';
import type { Ponto } from '../../src/domain/types';

const estado = vi.hoisted(() => ({ usuarioId: 'perfil-ana', pontos: [] as unknown[] }));

vi.mock('../../src/data/queries', async () => {
  const f = await import('./fixtures/semana-theo');
  return {
    useSessao: () => ({ usuarioId: estado.usuarioId, carregando: false }),
    useCaderno: () => ({ data: f.theo, isLoading: false }),
    useMembros: () => ({ data: f.membros, isLoading: false }),
    usePontos: () => ({ data: estado.pontos, isLoading: false }),
  };
});

import { SemanaPage, subtituloDaSemana } from '../../src/features/semana/SemanaPage';

function montar(rota = '/c/cad-theo/semana?inicio=2026-10-19') {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route path="/c/:cadernoId/semana" element={<SemanaPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  estado.usuarioId = 'perfil-ana';
  estado.pontos = pontosTheo;
});

it('título e subtítulo com o fixture', () => {
  montar();
  expect(screen.getByRole('heading', { level: 1, name: 'A semana do Theo' })).toBeInTheDocument();
  expect(screen.getByText('19 a 25 de outubro. 30 pontos dados por 4 pessoas.')).toBeInTheDocument();
});

it('subtítulo no singular e entre meses', () => {
  expect(subtituloDaSemana('2026-10-26', [pontosTheo[0]])).toBe('26 de outubro a 1 de novembro. 1 ponto dado por 1 pessoa.');
});

it('cartão mostra a frase do padrão 1 e alterna o destaque', async () => {
  const { container } = montar();
  expect(screen.getByRole('heading', { name: 'Nas 3 vezes em que dormiu mal, o Theo teve crise no mesmo dia.' })).toBeInTheDocument();
  expect(screen.getByText('Leitura automática dos registros. Não substitui avaliação profissional.')).toBeInTheDocument();
  const botao = screen.getByRole('button', { name: 'Mostrar o padrão' });
  expect(botao).toHaveAttribute('aria-pressed', 'false');
  expect(container.querySelectorAll('[data-ligacao]')).toHaveLength(0);
  await userEvent.click(botao);
  expect(screen.getByRole('button', { name: 'Esconder o padrão' })).toHaveAttribute('aria-pressed', 'true');
  expect(container.querySelectorAll('[data-ligacao]')).toHaveLength(3);
});

it('semana sem padrão não mostra cartão', () => {
  estado.pontos = pontosTheo.filter(p => p.tipo !== 'crise');
  montar();
  expect(screen.queryByRole('button', { name: 'Mostrar o padrão' })).toBeNull();
});

it('semana vazia mostra a frase', () => {
  estado.pontos = [];
  montar();
  expect(screen.getByText('Nenhum ponto nesta semana. Dê o primeiro.')).toBeInTheDocument();
});

it('detalhe de ponto às 23h30 diz "depois das 22h" e oferece editar à dona', async () => {
  const tarde: Ponto = { ...ponto('julia', '2026-10-21', '12:00', 'nota', { texto: 'Dormiu tarde.', id: 'tarde' }), ocorreuEm: '2026-10-22T02:30:00Z' };
  estado.pontos = [...pontosTheo, tarde];
  montar();
  await userEvent.click(screen.getByRole('button', { name: 'Nota, Júlia, professora, quarta às 23h30' }));
  const dialogo = screen.getByRole('dialog');
  expect(dialogo).toHaveTextContent('quarta, 21 de outubro, às 23h30 (depois das 22h)');
  expect(dialogo).toHaveTextContent('Júlia, professora');
  expect(dialogo).toHaveTextContent('Dormiu tarde.');
  expect(within(dialogo).getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/c/cad-theo/ponto/tarde');
});

it('quem não é autor nem dona não vê "Editar"', async () => {
  estado.usuarioId = 'perfil-rafa';
  montar();
  await userEvent.click(screen.getByRole('button', { name: 'Crise, Júlia, professora, terça às 10h' }));
  expect(within(screen.getByRole('dialog')).queryByRole('link', { name: 'Editar' })).toBeNull();
});

it('setas de semana; próxima desabilitada na semana atual', () => {
  montar();
  expect(screen.getByRole('link', { name: 'Semana anterior' })).toHaveAttribute('href', '/c/cad-theo/semana?inicio=2026-10-12');
  expect(screen.getByRole('link', { name: 'Próxima semana' })).toHaveAttribute('href', '/c/cad-theo/semana?inicio=2026-10-26');
  estado.pontos = [];
  montar('/c/cad-theo/semana');
  expect(screen.getAllByRole('button', { name: 'Próxima semana' }).at(-1)).toBeDisabled();
});

it('botão "Dar um ponto" leva ao registro', () => {
  montar();
  expect(screen.getByRole('link', { name: 'Dar um ponto' })).toHaveAttribute('href', '/c/cad-theo/ponto');
});

it('axe sem violações', async () => {
  const { container } = montar();
  expect(await axe(container)).toHaveNoViolations();
});

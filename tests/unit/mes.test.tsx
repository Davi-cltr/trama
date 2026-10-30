import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { axe } from 'vitest-axe';

vi.mock('../../src/data/queries', async () => {
  const f = await import('./fixtures/semana-theo');
  return {
    useSessao: () => ({ usuarioId: 'perfil-ana', carregando: false }),
    useCaderno: () => ({ data: f.theo, isLoading: false }),
    useMembros: () => ({ data: f.membros, isLoading: false }),
    usePontos: () => ({ data: f.pontosTheo, isLoading: false }),
  };
});

import { MesPage } from '../../src/features/mes/MesPage';

function montar() {
  return render(
    <MemoryRouter initialEntries={['/c/cad-theo/mes?inicio=2026-10-01']}>
      <Routes><Route path="/c/:cadernoId/mes" element={<MesPage />} /></Routes>
    </MemoryRouter>,
  );
}

it('31 faixas em outubro', () => {
  const { container } = montar();
  expect(screen.getByRole('heading', { level: 1, name: 'O mês do Theo' })).toBeInTheDocument();
  expect(screen.getByText('Outubro de 2026. 30 pontos dados por 4 pessoas.')).toBeInTheDocument();
  const rotulos = [...container.querySelectorAll('svg text')].map(t => t.textContent);
  expect(rotulos).toEqual(Array.from({ length: 31 }, (_, i) => String(i + 1)));
});

it('"Compartilhar pôster" abre o diálogo com as duas opções desmarcadas', async () => {
  montar();
  await userEvent.click(screen.getByRole('button', { name: 'Compartilhar pôster' }));
  const dialogo = screen.getByRole('dialog');
  expect(within(dialogo).getByRole('checkbox', { name: 'Esconder nomes' })).not.toBeChecked();
  expect(within(dialogo).getByRole('checkbox', { name: 'Esconder o apelido' })).not.toBeChecked();
  expect(dialogo).toHaveTextContent('O pôster nunca mostra o que foi escrito nos pontos.');
});

it('axe sem violações', async () => {
  const { container } = montar();
  expect(await axe(container)).toHaveNoViolations();
});

import { render, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { salvarRascunho, listarRascunhos } from '../../src/data/draftQueue';

const enviarPonto = vi.hoisted(() => vi.fn(async (_: unknown) => undefined));
vi.mock('../../src/data/mutations', () => ({ enviarPonto }));

import { SincronizarRascunhos } from '../../src/features/ponto/SincronizarRascunhos';

const r = { id: 'r1', cadernoId: 'c', membroId: 'm', tipo: 'nota' as const, sonoRuim: null, texto: null, ocorreuEm: '2026-10-29T12:00:00Z' };

beforeEach(() => { localStorage.clear(); enviarPonto.mockReset(); });

it('envia rascunhos ao abrir o app', async () => {
  salvarRascunho(r);
  render(<QueryClientProvider client={new QueryClient()}><SincronizarRascunhos /></QueryClientProvider>);
  await waitFor(() => expect(listarRascunhos()).toEqual([]));
  expect(enviarPonto).toHaveBeenCalledTimes(1);
});

it('envia de novo quando a internet volta', async () => {
  enviarPonto.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  salvarRascunho(r);
  render(<QueryClientProvider client={new QueryClient()}><SincronizarRascunhos /></QueryClientProvider>);
  await waitFor(() => expect(enviarPonto).toHaveBeenCalledTimes(1));
  expect(listarRascunhos()).toHaveLength(1);
  await act(async () => { window.dispatchEvent(new Event('online')); });
  await waitFor(() => expect(listarRascunhos()).toEqual([]));
});

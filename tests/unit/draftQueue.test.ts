import { salvarRascunho, listarRascunhos, enviarRascunhos } from '../../src/data/draftQueue';
import type { NovoPonto } from '../../src/data/mutations';

const rascunho = (id: string): NovoPonto & { id: string } => ({
  id, cadernoId: 'c', membroId: 'm', tipo: 'nota', sonoRuim: null, texto: null, ocorreuEm: '2026-10-29T12:00:00Z',
});

beforeEach(() => localStorage.clear());

it('guarda e lista rascunhos sem duplicar o mesmo id', () => {
  salvarRascunho(rascunho('a'));
  salvarRascunho(rascunho('a'));
  salvarRascunho(rascunho('b'));
  expect(listarRascunhos().map(r => r.id)).toEqual(['a', 'b']);
});

it('rascunho enviado sai da fila; falha fica', async () => {
  salvarRascunho(rascunho('ok'));
  salvarRascunho(rascunho('falha'));
  const enviar = vi.fn(async (p: NovoPonto & { id: string }) => {
    if (p.id === 'falha') throw new TypeError('Failed to fetch');
  });
  expect(await enviarRascunhos(enviar)).toEqual({ enviados: 1, falhas: 1 });
  expect(listarRascunhos().map(r => r.id)).toEqual(['falha']);
});

it('duas chamadas simultâneas não enviam o mesmo rascunho duas vezes', async () => {
  const enviar = vi.fn(() => new Promise<void>(r => setTimeout(r, 10)));
  salvarRascunho(rascunho('r1'));
  await Promise.all([enviarRascunhos(enviar), enviarRascunhos(enviar)]);
  expect(enviar).toHaveBeenCalledTimes(1);
  expect(listarRascunhos()).toEqual([]);
});

it('fila corrompida no aparelho vira fila vazia', () => {
  localStorage.setItem('trama:rascunhos', '{não é json');
  expect(listarRascunhos()).toEqual([]);
});

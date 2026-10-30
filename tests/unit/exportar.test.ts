import { montarExportacao, nomeDaExportacao } from '../../src/data/exportar';
import { theo, membros, pontosTheo } from './fixtures/semana-theo';

it('exportação contém caderno, pessoas, todos os pontos e versão 1', () => {
  const e = montarExportacao(theo, membros, pontosTheo);
  expect(e.versao).toBe(1);
  expect(e.caderno).toEqual(theo);
  expect(e.membros).toHaveLength(4);
  expect(e.pontos).toHaveLength(30);
  expect(Number.isNaN(Date.parse(e.exportadoEm))).toBe(false);
});

it('nome do arquivo com apelido e data', () => {
  expect(nomeDaExportacao(theo, new Date('2026-10-30T12:00:00Z'))).toBe('trama-theo-2026-10-30.json');
  expect(nomeDaExportacao({ ...theo, apelido: 'Ana Júlia' }, new Date('2026-10-30T12:00:00Z'))).toBe('trama-ana-julia-2026-10-30.json');
});

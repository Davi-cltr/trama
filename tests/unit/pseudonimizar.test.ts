import { pseudonimizar, recolocarRotulos } from '../../supabase/functions/_shared/pseudonimizar';
import { membros, ponto, SP } from './fixtures/semana-theo';

it('troca apelido e rótulos no texto livre', () => {
  const { linhas } = pseudonimizar({ apelido: 'Theo', membros, pontos: [ponto('julia', '2026-10-20', '10:05', 'nota', { texto: 'Júlia viu o Theo calmo' })], fuso: SP });
  expect(linhas[0]).toBe('2026-10-20 10h05 | escola 1 | nota | escola 1 viu o a criança calmo');
  expect(linhas.join()).not.toMatch(/Theo|Júlia/);
});

it('troca o rótulo inteiro antes do primeiro nome, sem diferenciar maiúsculas', () => {
  const { linhas } = pseudonimizar({ apelido: 'Theo', membros, pontos: [ponto('ana', '2026-10-20', '20:00', 'nota', { texto: 'CIDA, AVÓ buscou; theo dormiu. Falei com Rafa.' })], fuso: SP });
  expect(linhas[0]).toContain('cuidador 1 buscou; a criança dormiu. Falei com terapia 1.');
});

it('não troca pedaço de palavra', () => {
  const { linhas } = pseudonimizar({ apelido: 'Ana', membros: [], pontos: [ponto('ana', '2026-10-20', '20:00', 'comida', { texto: 'Comeu banana e Ana viu' })], fuso: SP });
  expect(linhas[0]).toContain('Comeu banana e a criança viu');
});

it('marca noite ruim e usa o dia local', () => {
  const p = { ...ponto('ana', '2026-10-20', '06:30', 'sono', { sonoRuim: true }), ocorreuEm: '2026-10-21T02:30:00Z' };
  const { linhas } = pseudonimizar({ apelido: 'Theo', membros, pontos: [p], fuso: SP });
  expect(linhas[0]).toBe('2026-10-20 23h30 | responsável | sono (noite ruim) | ');
});

it('aliases por papel e ordem de entrada', () => {
  const { aliases } = pseudonimizar({ apelido: 'Theo', membros, pontos: [], fuso: SP });
  expect(Object.keys(aliases)).toEqual(['responsável', 'escola 1', 'terapia 1', 'cuidador 1']);
  expect(aliases['escola 1']).toBe('julia');
});

it('recoloca os rótulos no texto da resposta', () => {
  const { aliases } = pseudonimizar({ apelido: 'Theo', membros, pontos: [], fuso: SP });
  expect(recolocarRotulos('A escola 1 e a responsável notaram. Escola 10 não existe.', aliases, membros))
    .toBe('A Júlia, professora e a Ana, mãe notaram. Escola 10 não existe.');
});

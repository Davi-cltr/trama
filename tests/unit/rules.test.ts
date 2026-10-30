import { contarCaracteres, validarPonto, nomeComArtigo, doApelido, pronome, LIMITES, ROTULO_TIPO, ROTULO_PAPEL } from '../../src/domain/rules';

const agora = new Date('2026-10-29T15:00:00Z');

it('conta emoji como no Postgres (code points)', () => {
  expect(contarCaracteres('👍🏽')).toBe(2);
  expect(contarCaracteres('ação')).toBe(4);
});

it('recusa texto acima de 280', () => {
  expect(validarPonto({ tipo: 'nota', sonoRuim: null, texto: 'a'.repeat(281), ocorreuEm: agora }, agora))
    .toContain('O texto pode ter até 280 caracteres.');
  expect(validarPonto({ tipo: 'nota', sonoRuim: null, texto: 'a'.repeat(280), ocorreuEm: agora }, agora)).toEqual([]);
});

it('sono exige bem ou ruim; outros tipos não aceitam', () => {
  expect(validarPonto({ tipo: 'sono', sonoRuim: null, texto: null, ocorreuEm: agora }, agora))
    .toContain('Escolha como foi a noite.');
  expect(validarPonto({ tipo: 'sono', sonoRuim: false, texto: null, ocorreuEm: agora }, agora)).toEqual([]);
  expect(validarPonto({ tipo: 'crise', sonoRuim: true, texto: null, ocorreuEm: agora }, agora)).not.toEqual([]);
});

it('aceita até 7 dias atrás e até 5 minutos à frente', () => {
  const ok = (d: Date) => validarPonto({ tipo: 'nota', sonoRuim: null, texto: null, ocorreuEm: d }, agora);
  expect(ok(new Date('2026-10-22T15:00:00Z'))).toEqual([]);
  expect(ok(new Date('2026-10-22T14:59:00Z'))).toContain('Só dá para registrar até 7 dias atrás.');
  expect(ok(new Date('2026-10-29T15:05:00Z'))).toEqual([]);
  expect(ok(new Date('2026-10-29T15:06:00Z'))).toContain('Esse horário ainda não chegou.');
});

it('usa o artigo escolhido', () => {
  expect(nomeComArtigo({ apelido: 'Theo', tratamento: 'o' })).toBe('o Theo');
  expect(nomeComArtigo({ apelido: 'Kim', tratamento: '' })).toBe('Kim');
  expect(doApelido({ apelido: 'Theo', tratamento: 'o' })).toBe('do Theo');
  expect(doApelido({ apelido: 'Maria', tratamento: 'a' })).toBe('da Maria');
  expect(doApelido({ apelido: 'Kim', tratamento: '' })).toBe('de Kim');
});

it('limites e rótulos do spec', () => {
  expect(LIMITES).toEqual({ apelido: 30, rotulo: 40, nome: 40, texto: 280, linhasAtivas: 6, diasRetroativos: 7, toleranciaFuturoMin: 5, conviteDias: 7, resumosPorMes: 10 });
  expect(Object.values(ROTULO_TIPO)).toEqual(['Crise', 'Conquista', 'Funcionou', 'Sono', 'Comida', 'Nota']);
  expect(Object.values(ROTULO_PAPEL)).toEqual(['Responsável', 'Cuidador', 'Escola', 'Terapia']);
});

it('pronome segue o tratamento', () => {
  expect(pronome({ tratamento: 'o' })).toBe('dele');
  expect(pronome({ tratamento: 'a' })).toBe('dela');
  expect(pronome({ tratamento: '' })).toBe('dele ou dela');
});

it('primeiro nome e lista de nomes', async () => {
  const { primeiroNome, juntarNomes } = await import('../../src/domain/rules');
  expect(primeiroNome('Júlia, professora')).toBe('Júlia');
  expect(primeiroNome('Cida')).toBe('Cida');
  expect(juntarNomes(['Júlia', 'Rafa', 'Cida'])).toBe('Júlia, Rafa e Cida');
  expect(juntarNomes(['Júlia'])).toBe('Júlia');
});

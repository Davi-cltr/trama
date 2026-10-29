import { detectarPadroes } from '../../src/tapestry/patterns';
import { semanaDoConceito, membros, theo, ponto } from './fixtures/semana-theo';

const base = { membros, caderno: theo, periodoTipo: 'semana' as const };

it('encontra noite ruim seguida de crise em 3 dias', () => {
  const [p] = detectarPadroes(semanaDoConceito);
  expect(p.tipo).toBe('noite-ruim-crise');
  expect(p.frase).toBe('Nas 3 vezes em que dormiu mal, o Theo teve crise no mesmo dia.');
  expect(p.ligacoes).toHaveLength(3);
  expect(p.pontoIds).toHaveLength(6);
});

it('semana do conceito só tem o padrão 1', () => {
  expect(detectarPadroes(semanaDoConceito).map(p => p.tipo)).toEqual(['noite-ruim-crise']);
});

it('liga a noite ruim mais cedo à primeira crise do dia', () => {
  const pontos = ['2026-10-20', '2026-10-21', '2026-10-22'].flatMap(dia => [
    ponto('ana', dia, '06:30', 'sono', { sonoRuim: true, id: `s-${dia}` }),
    ponto('julia', dia, '15:00', 'crise', { id: `c2-${dia}` }),
    ponto('julia', dia, '10:00', 'crise', { id: `c1-${dia}` }),
  ]);
  const [p] = detectarPadroes({ ...base, pontos });
  expect(p.ligacoes[0]).toEqual(['s-2026-10-20', 'c1-2026-10-20']);
});

it('crise depois das 18h não conta', () => {
  const pontos = [
    ponto('ana', '2026-10-20', '06:30', 'sono', { sonoRuim: true }),
    ponto('julia', '2026-10-20', '10:00', 'crise'),
    ponto('ana', '2026-10-21', '06:30', 'sono', { sonoRuim: true }),
    ponto('julia', '2026-10-21', '10:00', 'crise'),
    ponto('ana', '2026-10-22', '06:30', 'sono', { sonoRuim: true }),
    ponto('ana', '2026-10-22', '19:00', 'crise'),
  ];
  expect(detectarPadroes({ ...base, pontos }).map(p => p.tipo)).not.toContain('noite-ruim-crise');
});

it('com 2 ocorrências não há padrão', () => {
  const doisDias = [
    ponto('ana', '2026-10-20', '06:30', 'sono', { sonoRuim: true }),
    ponto('julia', '2026-10-20', '10:00', 'crise'),
    ponto('ana', '2026-10-21', '06:30', 'sono', { sonoRuim: true }),
    ponto('julia', '2026-10-21', '14:00', 'crise'),
  ];
  expect(detectarPadroes({ ...base, pontos: doisDias })).toEqual([]);
});

it('horário de crise: 3 crises entre 9h e 11h', () => {
  const pontos = [
    ponto('julia', '2026-10-19', '09:10', 'crise'),
    ponto('julia', '2026-10-20', '10:40', 'crise'),
    ponto('julia', '2026-10-22', '09:50', 'crise'),
    ponto('ana', '2026-10-23', '19:00', 'crise'),
  ];
  const [p] = detectarPadroes({ ...base, pontos });
  expect(p.tipo).toBe('horario-crise');
  expect(p.frase).toBe('3 das crises da semana foram entre 9h e 11h.');
  expect(p.pontoIds).toHaveLength(3);
  expect(p.ligacoes).toHaveLength(2);
});

it('horário de crise no mês e empate pela janela mais cedo', () => {
  const pontos = [
    ...['2026-10-05', '2026-10-06', '2026-10-07'].map(d => ponto('julia', d, '15:20', 'crise')),
    ...['2026-10-08', '2026-10-09', '2026-10-12'].map(d => ponto('julia', d, '08:20', 'crise')),
  ];
  const [p] = detectarPadroes({ ...base, periodoTipo: 'mes', pontos });
  expect(p.frase).toBe('3 das crises do mês foram entre 8h e 10h.');
});

it('funcionou repetido usa o rótulo da pessoa', () => {
  const pontos = ['2026-10-19', '2026-10-21', '2026-10-21', '2026-10-23'].map(d => ponto('julia', d, '10:00', 'funcionou'));
  const [p] = detectarPadroes({ ...base, pontos });
  expect(p.tipo).toBe('funcionou-repete');
  expect(p.frase).toBe('Júlia, professora marcou o que funcionou em 3 dias. Vale todos tentarem.');
  expect(p.pontoIds).toHaveLength(4);
  expect(p.ligacoes).toHaveLength(3);
});

it('funcionou: vence quem tem mais dias; empate pela entrada', () => {
  const dias = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'];
  const pontos = [
    ...dias.slice(0, 3).map(d => ponto('cida', d, '10:00', 'funcionou')),
    ...dias.slice(0, 3).map(d => ponto('rafa', d, '10:00', 'funcionou')),
  ];
  expect(detectarPadroes({ ...base, pontos })[0].frase).toMatch(/^Rafa, fono/);
  pontos.push(ponto('cida', dias[3], '10:00', 'funcionou'));
  expect(detectarPadroes({ ...base, pontos })[0].frase).toMatch(/^Cida, avó marcou o que funcionou em 4 dias/);
});

it('frase com tratamento vazio', () => {
  const [p] = detectarPadroes({ ...semanaDoConceito, caderno: { ...theo, apelido: 'Kim', tratamento: '' } });
  expect(p.frase).toBe('Nas 3 vezes em que dormiu mal, Kim teve crise no mesmo dia.');
});

it('ordem de prioridade', () => {
  const todos = detectarPadroes({
    ...base,
    pontos: [
      ...semanaDoConceito.pontos,
      ponto('julia', '2026-10-19', '10:30', 'crise'),
      ponto('julia', '2026-10-21', '10:30', 'funcionou'),
    ],
  });
  expect(todos.map(p => p.tipo)).toEqual(['noite-ruim-crise', 'horario-crise', 'funcionou-repete']);
});

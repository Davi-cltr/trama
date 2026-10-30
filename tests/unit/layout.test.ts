import { layoutTrama, DIM_SEMANA, DIM_MES } from '../../src/tapestry/layout';
import type { Membro } from '../../src/domain/types';
import { membros, pontosTheo, semanaTheo, ponto, SP } from './fixtures/semana-theo';

const semana = { tipo: 'semana' as const, inicio: '2026-10-26', fuso: SP };
const m = (id: string, cor: number, entrouEm: string, ativo = true): Membro => ({
  id, cadernoId: 'cad-theo', perfilId: ativo ? `perfil-${id}` : null, papel: 'cuidador',
  rotulo: `Rótulo ${id}`, cor, ativo, entrouEm,
});

it('posiciona 6h30 em x = 61 na semana', () => {
  const layout = layoutTrama({ periodo: semana, membros: [m('ana', 0, '2026-01-01')], pontos: [ponto('ana', '2026-10-27', '06:30', 'sono')], dim: DIM_SEMANA });
  const p = layout.faixas[1].pontos[0];
  expect(p.x).toBe(61);
  expect(p.fora).toBeNull();
});

it('ordena linhas: ativos por entrada, depois inativos com pontos', () => {
  const ms = [
    m('ex', 4, '2026-01-01', false),
    m('cida', 2, '2026-03-01'),
    m('ana', 0, '2026-01-02'),
    m('julia', 1, '2026-02-01'),
  ];
  const layout = layoutTrama({ periodo: semana, membros: ms, pontos: [ponto('ex', '2026-10-27', '10:00', 'nota')], dim: DIM_SEMANA });
  expect(layout.linhas.map(l => l.membroId)).toEqual(['ana', 'julia', 'cida', 'ex']);
  const linhaEx = layout.linhas[3];
  expect(linhaEx.corTear).toBe('#8D96B8');
  expect(linhaEx.ativa).toBe(false);
  expect(layout.faixas[1].pontos[0].cor).toBe('#8D96B8');
});

it('membro inativo sem pontos no período não aparece', () => {
  const ms = [m('ana', 0, '2026-01-02'), m('ex', 4, '2026-01-01', false)];
  const layout = layoutTrama({ periodo: semana, membros: ms, pontos: [ponto('ex', '2026-10-12', '10:00', 'nota')], dim: DIM_SEMANA });
  expect(layout.linhas.map(l => l.membroId)).toEqual(['ana']);
  expect(layout.faixas.flatMap(f => f.pontos)).toEqual([]);
});

it('ponto às 23h30 local fica no dia certo e na borda direita', () => {
  const layout = layoutTrama({
    periodo: semana, membros: [m('ana', 0, '2026-01-01')],
    pontos: [{ ...ponto('ana', '2026-10-28', '12:00', 'nota'), ocorreuEm: '2026-10-29T02:30:00Z' }], dim: DIM_SEMANA,
  });
  const f = layout.faixas.find(f => f.dia === '2026-10-28')!;
  expect(f.pontos[0]).toMatchObject({ x: 340, fora: 'depois' });
  expect(layout.faixas.find(f => f.dia === '2026-10-29')!.pontos).toEqual([]);
});

it('ponto antes das 6h vai para a borda esquerda', () => {
  const layout = layoutTrama({ periodo: semana, membros: [m('ana', 0, '2026-01-01')], pontos: [ponto('ana', '2026-10-27', '04:10', 'sono')], dim: DIM_SEMANA });
  expect(layout.faixas[1].pontos[0]).toMatchObject({ x: 52, fora: 'antes' });
});

it('trecho vai do primeiro ao último ponto com 30 min de margem', () => {
  const layout = layoutTrama({
    periodo: semana, membros: [m('ana', 0, '2026-01-01')],
    pontos: [ponto('ana', '2026-10-27', '08:00', 'nota'), ponto('ana', '2026-10-27', '12:00', 'nota')], dim: DIM_SEMANA,
  });
  const [t] = layout.faixas[1].trechos;
  expect(t).toMatchObject({ x1: 79, x2: 169, membroId: 'ana', cor: '#E8678C' });
  expect(t.y).toBe(layout.faixas[1].y + 11);
});

it('trecho não passa das 6h nem das 22h', () => {
  const layout = layoutTrama({
    periodo: semana, membros: [m('ana', 0, '2026-01-01')],
    pontos: [ponto('ana', '2026-10-27', '06:10', 'nota'), ponto('ana', '2026-10-27', '21:50', 'nota')], dim: DIM_SEMANA,
  });
  expect(layout.faixas[1].trechos[0]).toMatchObject({ x1: 52, x2: 340 });
});

it('três pontos no mesmo minuto ficam afastados', () => {
  const ps = ['a', 'b', 'c'].map(id => ponto('ana', '2026-10-27', '10:00', 'nota', { id }));
  const layout = layoutTrama({ periodo: semana, membros: [m('ana', 0, '2026-01-01')], pontos: ps, dim: DIM_SEMANA });
  const faixa = layout.faixas[1];
  const xs = faixa.pontos.map(p => p.x);
  expect(faixa.pontos.map(p => p.ponto.id)).toEqual(['a', 'b', 'c']);
  expect(xs[1] - xs[0]).toBeGreaterThanOrEqual(10);
  expect(xs[2] - xs[1]).toBeGreaterThanOrEqual(10);
});

it('pontos amontoados às 21h59 voltam para a esquerda sem passar de xFim', () => {
  const ps = ['a', 'b', 'c', 'd'].map(id => ponto('ana', '2026-10-27', '21:59', 'nota', { id }));
  const layout = layoutTrama({ periodo: semana, membros: [m('ana', 0, '2026-01-01')], pontos: ps, dim: DIM_SEMANA });
  const xs = layout.faixas[1].pontos.map(p => p.x);
  expect(Math.max(...xs)).toBeLessThanOrEqual(340);
  for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(10);
});

it('6 linhas cabem na faixa da semana', () => {
  const ms = [0, 1, 2, 3, 4, 5].map(i => m(`m${i}`, i, `2026-01-0${i + 1}`));
  const layout = layoutTrama({ periodo: semana, membros: ms, pontos: [ponto('m5', '2026-10-26', '10:00', 'nota')], dim: DIM_SEMANA });
  const faixa = layout.faixas[0];
  const ultimaLinhaY = faixa.pontos[0].y;
  expect(ultimaLinhaY - faixa.y).toBeLessThanOrEqual(56 - 11);
});

it('semana do conceito: 7 faixas, 30 pontos, 4 linhas espaçadas de 11', () => {
  const layout = layoutTrama({ periodo: semanaTheo, membros, pontos: pontosTheo, dim: DIM_SEMANA });
  expect(layout.faixas).toHaveLength(7);
  expect(layout.faixas.map(f => f.rotulo)).toEqual(['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']);
  expect(layout.faixas.flatMap(f => f.pontos)).toHaveLength(30);
  const ter = layout.faixas[1];
  const ys = ter.pontos.map(p => p.y - ter.y).sort((a, b) => a - b);
  expect(ys).toEqual([11, 11, 22, 44]);
  expect(layout.x(12)).toBe(160);
});

it('mês de outubro tem 31 faixas', () => {
  const layoutMes = layoutTrama({ periodo: { tipo: 'mes', inicio: '2026-10-01', fuso: SP }, membros, pontos: pontosTheo, dim: DIM_MES });
  expect(layoutMes.faixas).toHaveLength(31);
  expect(layoutMes.faixas[4].rotulo).toBe('5');
  expect(layoutMes.altura).toBe(31 * 26);
});

it('guarda a hora local real de cada ponto', () => {
  const layout = layoutTrama({
    periodo: semana, membros: [m('ana', 0, '2026-01-01')],
    pontos: [{ ...ponto('ana', '2026-10-28', '12:00', 'nota'), ocorreuEm: '2026-10-29T02:30:00Z' }], dim: DIM_SEMANA,
  });
  expect(layout.faixas[2].pontos[0].hora).toBeCloseTo(23.5);
});

it('expõe largura e o deslocamento de cada linha na faixa', () => {
  const layout = layoutTrama({ periodo: semanaTheo, membros, pontos: pontosTheo, dim: DIM_SEMANA });
  expect(layout.largura).toBe(350);
  expect(layout.linhas.map(l => l.dy)).toEqual([11, 22, 33, 44]);
});

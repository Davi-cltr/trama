import { LINHAS, LINHA_ANTIGA, corDoMembro, proximaCorLivre } from '../../src/domain/palette';
import { contraste } from './contraste';

it('tem 6 linhas com os tons do spec', () => {
  expect(LINHAS.map(l => l.tear)).toEqual(['#E8678C', '#6E8BFF', '#F2B33D', '#4CC392', '#F08A4B', '#B98CF2']);
  expect(LINHAS.map(l => l.claro)).toEqual(['#B3264E', '#3552C4', '#8A5E07', '#226B4C', '#9A4413', '#7A4FC0']);
});

it('todo tom tem contraste ≥ 4,5 com o fundo onde aparece', () => {
  for (const l of [...LINHAS, LINHA_ANTIGA]) {
    expect(contraste(l.tear, '#1C2238')).toBeGreaterThanOrEqual(4.5);
    expect(contraste(l.claro, '#E9ECF0')).toBeGreaterThanOrEqual(4.5);
  }
});

it('membro inativo usa a linha antiga', () => {
  expect(corDoMembro({ cor: 0, ativo: false }, 'tear')).toBe('#8D96B8');
  expect(corDoMembro({ cor: 0, ativo: false }, 'claro')).toBe('#5A6080');
});

it('membro ativo usa a cor da própria linha', () => {
  expect(corDoMembro({ cor: 1, ativo: true }, 'tear')).toBe('#6E8BFF');
  expect(corDoMembro({ cor: 1, ativo: true }, 'claro')).toBe('#3552C4');
});

it('próxima cor livre é a menor não usada; null com 6 ativas', () => {
  expect(proximaCorLivre([{ cor: 0 }, { cor: 2 }])).toBe(1);
  expect(proximaCorLivre([0, 1, 2, 3, 4, 5].map(cor => ({ cor })))).toBeNull();
});

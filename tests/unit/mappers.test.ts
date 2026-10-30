import { paraCaderno, paraMembro, paraPonto, paraConvite, pontoParaLinha } from '../../src/data/mappers';

it('caderno: snake_case para camelCase, nascimento nulo', () => {
  expect(paraCaderno({
    id: 'c', apelido: 'Theo', tratamento: 'o', nascimento: null, dona_id: 'd', fuso: 'America/Sao_Paulo', criado_em: '2026-10-01T00:00:00Z',
  })).toEqual({ id: 'c', apelido: 'Theo', tratamento: 'o', nascimento: null, donaId: 'd', fuso: 'America/Sao_Paulo' });
});

it('caderno: tratamento desconhecido vira vazio', () => {
  expect(paraCaderno({
    id: 'c', apelido: 'Kim', tratamento: 'x', nascimento: '2019-03-01', dona_id: 'd', fuso: 'America/Sao_Paulo', criado_em: '',
  }).tratamento).toBe('');
});

it('membro', () => {
  expect(paraMembro({
    id: 'm', caderno_id: 'c', perfil_id: null, papel: 'escola', rotulo: 'Júlia, professora', cor: 1, ativo: false, entrou_em: '2026-10-01T00:00:00Z',
  })).toEqual({ id: 'm', cadernoId: 'c', perfilId: null, papel: 'escola', rotulo: 'Júlia, professora', cor: 1, ativo: false, entrouEm: '2026-10-01T00:00:00Z' });
});

it('ponto com sono_ruim nulo', () => {
  expect(paraPonto({
    id: 'p', caderno_id: 'c', membro_id: 'm', tipo: 'nota', sono_ruim: null, texto: null,
    ocorreu_em: '2026-10-20T13:00:00Z', criado_em: '', editado_em: null,
  })).toEqual({ id: 'p', cadernoId: 'c', membroId: 'm', tipo: 'nota', sonoRuim: null, texto: null, ocorreuEm: '2026-10-20T13:00:00Z' });
});

it('ponto de volta para a linha do banco', () => {
  expect(pontoParaLinha({ id: 'p', cadernoId: 'c', membroId: 'm', tipo: 'sono', sonoRuim: true, texto: 'x', ocorreuEm: '2026-10-20T13:00:00Z' }))
    .toEqual({ id: 'p', caderno_id: 'c', membro_id: 'm', tipo: 'sono', sono_ruim: true, texto: 'x', ocorreu_em: '2026-10-20T13:00:00Z' });
});

it('convite pendente', () => {
  expect(paraConvite({
    id: 'v', caderno_id: 'c', token_hash: 'h', papel: 'terapia', rotulo: 'Rafa, fono',
    criado_em: '', expira_em: '2026-11-01T00:00:00Z', usado_em: null, cancelado_em: null,
  })).toEqual({ id: 'v', papel: 'terapia', rotulo: 'Rafa, fono', expiraEm: '2026-11-01T00:00:00Z' });
});

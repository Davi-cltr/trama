// Os 30 pontos da tela "A semana do Theo" do conceito (docs/conceito/Main.dc.html),
// na semana de segunda 19 a domingo 25 de outubro de 2026. Horários em São Paulo (UTC−3).
import type { Caderno, Membro, Ponto, TipoPonto } from '../../../src/domain/types';
import type { Periodo } from '../../../src/tapestry/time';

export const SP = 'America/Sao_Paulo';

export const theo: Caderno = {
  id: 'cad-theo', apelido: 'Theo', tratamento: 'o', nascimento: '2019-03-01', donaId: 'perfil-ana', fuso: SP,
};

export const membros: Membro[] = [
  { id: 'ana', cadernoId: 'cad-theo', perfilId: 'perfil-ana', papel: 'responsavel', rotulo: 'Ana, mãe', cor: 0, ativo: true, entrouEm: '2026-09-01T12:00:00Z' },
  { id: 'julia', cadernoId: 'cad-theo', perfilId: 'perfil-julia', papel: 'escola', rotulo: 'Júlia, professora', cor: 1, ativo: true, entrouEm: '2026-09-02T12:00:00Z' },
  { id: 'rafa', cadernoId: 'cad-theo', perfilId: 'perfil-rafa', papel: 'terapia', rotulo: 'Rafa, fono', cor: 2, ativo: true, entrouEm: '2026-09-03T12:00:00Z' },
  { id: 'cida', cadernoId: 'cad-theo', perfilId: 'perfil-cida', papel: 'cuidador', rotulo: 'Cida, avó', cor: 3, ativo: true, entrouEm: '2026-09-04T12:00:00Z' },
];

export const semanaTheo: Periodo = { tipo: 'semana', inicio: '2026-10-19', fuso: SP };

let n = 0;
/** Cria um ponto no dia local `dia` às `hora` (ex. '06:30') em São Paulo. */
export function ponto(
  membroId: string, dia: string, hora: string, tipo: TipoPonto,
  extra: { sonoRuim?: boolean; texto?: string; id?: string } = {},
): Ponto {
  n += 1;
  return {
    id: extra.id ?? `p${String(n).padStart(2, '0')}`,
    cadernoId: 'cad-theo',
    membroId,
    tipo,
    sonoRuim: tipo === 'sono' ? (extra.sonoRuim ?? false) : null,
    texto: extra.texto ?? null,
    ocorreuEm: new Date(`${dia}T${hora}:00-03:00`).toISOString(),
  };
}

export const pontosTheo: Ponto[] = [
  // segunda
  ponto('ana', '2026-10-19', '06:30', 'sono'),
  ponto('julia', '2026-10-19', '10:00', 'funcionou', { texto: 'Fone no recreio ajudou.' }),
  ponto('rafa', '2026-10-19', '14:30', 'conquista', { texto: 'Pediu água falando.' }),
  ponto('cida', '2026-10-19', '15:30', 'comida'),
  ponto('ana', '2026-10-19', '20:00', 'nota'),
  // terça
  ponto('ana', '2026-10-20', '06:30', 'sono', { sonoRuim: true, texto: 'Acordou três vezes.' }),
  ponto('julia', '2026-10-20', '10:00', 'crise', { texto: 'Chorou muito na entrada da sala.' }),
  ponto('cida', '2026-10-20', '15:00', 'funcionou'),
  ponto('ana', '2026-10-20', '20:00', 'nota'),
  // quarta
  ponto('ana', '2026-10-21', '06:30', 'sono'),
  ponto('julia', '2026-10-21', '09:00', 'conquista'),
  ponto('rafa', '2026-10-21', '14:30', 'funcionou'),
  ponto('ana', '2026-10-21', '19:30', 'comida'),
  // quinta
  ponto('ana', '2026-10-22', '06:30', 'sono', { sonoRuim: true }),
  ponto('julia', '2026-10-22', '09:30', 'crise'),
  ponto('julia', '2026-10-22', '11:00', 'funcionou'),
  ponto('cida', '2026-10-22', '16:00', 'nota'),
  ponto('ana', '2026-10-22', '21:00', 'nota'),
  // sexta
  ponto('ana', '2026-10-23', '06:45', 'sono', { sonoRuim: true }),
  ponto('julia', '2026-10-23', '11:00', 'crise'),
  ponto('rafa', '2026-10-23', '15:30', 'conquista'),
  ponto('cida', '2026-10-23', '17:00', 'comida'),
  // sábado
  ponto('ana', '2026-10-24', '06:30', 'sono'),
  ponto('cida', '2026-10-24', '11:00', 'conquista'),
  ponto('cida', '2026-10-24', '13:00', 'comida'),
  ponto('ana', '2026-10-24', '19:00', 'funcionou'),
  // domingo
  ponto('ana', '2026-10-25', '07:00', 'sono'),
  ponto('cida', '2026-10-25', '11:00', 'nota'),
  ponto('ana', '2026-10-25', '17:00', 'conquista'),
  ponto('ana', '2026-10-25', '19:00', 'comida'),
];

export const semanaDoConceito = {
  pontos: pontosTheo,
  membros,
  caderno: theo,
  periodoTipo: 'semana' as const,
};

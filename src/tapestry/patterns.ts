import type { Caderno, Membro, Ponto } from '../domain/types';
import { nomeComArtigo } from '../domain/rules';
import { diaLocal, horaLocal, type Periodo } from './time';

export type TipoPadrao = 'noite-ruim-crise' | 'horario-crise' | 'funcionou-repete';

export interface Padrao {
  tipo: TipoPadrao;
  frase: string;
  pontoIds: string[];
  ligacoes: Array<[string, string]>;
}

const MINIMO = 3;
const HORA_LIMITE_CRISE = 18;

interface PontoLocal { p: Ponto; dia: string; hora: number }

const porHorario = (a: PontoLocal, b: PontoLocal) => a.p.ocorreuEm.localeCompare(b.p.ocorreuEm) || a.p.id.localeCompare(b.p.id);

function consecutivos(ids: string[]): Array<[string, string]> {
  return ids.slice(1).map((id, i) => [ids[i], id]);
}

function maiusculaInicial(s: string): string {
  return s.charAt(0).toLocaleUpperCase('pt-BR') + s.slice(1);
}

export function detectarPadroes(input: {
  pontos: Ponto[];
  membros: Membro[];
  caderno: Pick<Caderno, 'apelido' | 'tratamento' | 'fuso'>;
  periodoTipo: Periodo['tipo'];
}): Padrao[] {
  const { caderno } = input;
  const locais: PontoLocal[] = input.pontos
    .map(p => ({ p, dia: diaLocal(p.ocorreuEm, caderno.fuso), hora: horaLocal(p.ocorreuEm, caderno.fuso) }))
    .sort(porHorario);

  return [
    noiteRuimCrise(locais, caderno),
    horarioCrise(locais, input.periodoTipo),
    funcionouRepete(locais, input.membros),
  ].filter((p): p is Padrao => p !== null);
}

function noiteRuimCrise(locais: PontoLocal[], caderno: Pick<Caderno, 'apelido' | 'tratamento'>): Padrao | null {
  const ligacoes: Array<[string, string]> = [];
  const dias = [...new Set(locais.map(e => e.dia))];
  for (const dia of dias) {
    const doDia = locais.filter(e => e.dia === dia);
    const noite = doDia.find(e => e.p.tipo === 'sono' && e.p.sonoRuim === true);
    const crise = doDia.find(e => e.p.tipo === 'crise' && e.hora < HORA_LIMITE_CRISE);
    if (noite && crise) ligacoes.push([noite.p.id, crise.p.id]);
  }
  if (ligacoes.length < MINIMO) return null;
  return {
    tipo: 'noite-ruim-crise',
    frase: maiusculaInicial(`Nas ${ligacoes.length} vezes em que dormiu mal, ${nomeComArtigo(caderno)} teve crise no mesmo dia.`),
    pontoIds: ligacoes.flat(),
    ligacoes,
  };
}

function horarioCrise(locais: PontoLocal[], periodoTipo: Periodo['tipo']): Padrao | null {
  const crises = locais.filter(e => e.p.tipo === 'crise');
  let melhor: { inicio: number; dentro: PontoLocal[] } | null = null;
  for (const c of crises) {
    const inicio = Math.floor(c.hora);
    const dentro = crises.filter(e => e.hora >= inicio && e.hora < inicio + 2);
    if (!melhor || dentro.length > melhor.dentro.length || (dentro.length === melhor.dentro.length && inicio < melhor.inicio)) {
      melhor = { inicio, dentro };
    }
  }
  if (!melhor || melhor.dentro.length < MINIMO) return null;
  const ids = melhor.dentro.map(e => e.p.id);
  const periodo = periodoTipo === 'semana' ? 'da semana' : 'do mês';
  return {
    tipo: 'horario-crise',
    frase: `${ids.length} das crises ${periodo} foram entre ${melhor.inicio}h e ${melhor.inicio + 2}h.`,
    pontoIds: ids,
    ligacoes: consecutivos(ids),
  };
}

function funcionouRepete(locais: PontoLocal[], membros: Membro[]): Padrao | null {
  const ordem = [...membros].sort((a, b) => a.entrouEm.localeCompare(b.entrouEm) || a.id.localeCompare(b.id));
  let melhor: { membro: Membro; dias: number; pontos: PontoLocal[] } | null = null;
  for (const membro of ordem) {
    const pontos = locais.filter(e => e.p.tipo === 'funcionou' && e.p.membroId === membro.id);
    const dias = new Set(pontos.map(e => e.dia)).size;
    if (dias >= MINIMO && (!melhor || dias > melhor.dias)) melhor = { membro, dias, pontos };
  }
  if (!melhor) return null;
  const ids = melhor.pontos.map(e => e.p.id);
  return {
    tipo: 'funcionou-repete',
    frase: maiusculaInicial(`${melhor.membro.rotulo} marcou o que funcionou em ${melhor.dias} dias. Vale todos tentarem.`),
    pontoIds: ids,
    ligacoes: consecutivos(ids),
  };
}

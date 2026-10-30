import type { Membro, Ponto } from '../domain/types';
import { corDoMembro } from '../domain/palette';
import { diaLocal, diasDoPeriodo, horaLocal, rotuloDoDia, type Periodo } from './time';

export interface Dimensoes {
  largura: number;
  xInicio: number;
  xFim: number;
  topo: number;
  alturaFaixa: number;
  margemLinha: number;
  espacoLinhaMax: number;
  afastamentoMin: number;
}

export const DIM_SEMANA: Dimensoes = {
  largura: 350, xInicio: 52, xFim: 340, topo: 16, alturaFaixa: 56, margemLinha: 11, espacoLinhaMax: 11, afastamentoMin: 10,
};

export const DIM_MES: Dimensoes = {
  largura: 904, xInicio: 44, xFim: 904, topo: 0, alturaFaixa: 26, margemLinha: 5, espacoLinhaMax: 6, afastamentoMin: 8,
};

export interface LinhaInfo { membroId: string; rotulo: string; corTear: string; corClara: string; ativa: boolean; /** Distância do topo da faixa até a linha. */ dy: number }
export interface Trecho { membroId: string; x1: number; x2: number; y: number; cor: string }
export interface PontoPosicionado { ponto: Ponto; x: number; y: number; cor: string; fora: 'antes' | 'depois' | null; /** Hora local real (decimal). */ hora: number }
export interface Faixa { dia: string; rotulo: string; y: number; trechos: Trecho[]; pontos: PontoPosicionado[] }
export interface LayoutTrama { linhas: LinhaInfo[]; faixas: Faixa[]; largura: number; altura: number; x: (hora: number) => number }

export const HORA_INICIO = 6;
export const HORA_FIM = 22;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const porEntrada = (a: Membro, b: Membro) => a.entrouEm.localeCompare(b.entrouEm) || a.id.localeCompare(b.id);

export function layoutTrama(input: { periodo: Periodo; membros: Membro[]; pontos: Ponto[]; dim: Dimensoes }): LayoutTrama {
  const { periodo, membros, dim } = input;
  const dias = diasDoPeriodo(periodo);
  const diasSet = new Set(dias);

  const pontos = input.pontos
    .map(p => ({ p, dia: diaLocal(p.ocorreuEm, periodo.fuso), hora: horaLocal(p.ocorreuEm, periodo.fuso) }))
    .filter(e => diasSet.has(e.dia));

  const comPontos = new Set(pontos.map(e => e.p.membroId));
  const ordenados = [
    ...membros.filter(m => m.ativo).sort(porEntrada),
    ...membros.filter(m => !m.ativo && comPontos.has(m.id)).sort(porEntrada),
  ];
  const n = ordenados.length;
  const espaco = n <= 1 ? 0 : Math.min(dim.espacoLinhaMax, (dim.alturaFaixa - 2 * dim.margemLinha) / (n - 1));
  const linhas: LinhaInfo[] = ordenados.map((m, i) => ({
    membroId: m.id,
    rotulo: m.rotulo,
    corTear: corDoMembro(m, 'tear'),
    corClara: corDoMembro(m, 'claro'),
    ativa: m.ativo,
    dy: dim.margemLinha + i * espaco,
  }));
  const indice = new Map(linhas.map((l, i) => [l.membroId, i]));
  const escala = (dim.xFim - dim.xInicio) / (HORA_FIM - HORA_INICIO);
  const x = (hora: number) => dim.xInicio + (clamp(hora, HORA_INICIO, HORA_FIM) - HORA_INICIO) * escala;

  const faixas: Faixa[] = dias.map((dia, f) => {
    const y = dim.topo + f * dim.alturaFaixa;
    const yLinha = (i: number) => y + linhas[i].dy;
    const doDia = pontos.filter(e => e.dia === dia && indice.has(e.p.membroId));

    const trechos: Trecho[] = [];
    const posicionados: PontoPosicionado[] = [];
    linhas.forEach((linha, i) => {
      const daLinha = doDia
        .filter(e => e.p.membroId === linha.membroId)
        .sort((a, b) => a.p.ocorreuEm.localeCompare(b.p.ocorreuEm) || a.p.id.localeCompare(b.p.id));
      if (daLinha.length === 0) return;

      const horas = daLinha.map(e => e.hora);
      trechos.push({
        membroId: linha.membroId,
        x1: x(Math.min(...horas) - 0.5),
        x2: x(Math.max(...horas) + 0.5),
        y: yLinha(i),
        cor: linha.corTear,
      });

      const xs = afastar(daLinha.map(e => x(e.hora)), dim);
      daLinha.forEach((e, k) => {
        posicionados.push({
          ponto: e.p,
          x: xs[k],
          y: yLinha(i),
          cor: linha.corTear,
          fora: e.hora < HORA_INICIO ? 'antes' : e.hora > HORA_FIM ? 'depois' : null,
          hora: e.hora,
        });
      });
    });

    return { dia, rotulo: rotuloDoDia(dia, periodo.tipo), y, trechos, pontos: posicionados };
  });

  return { linhas, faixas, largura: dim.largura, altura: dim.topo + dias.length * dim.alturaFaixa, x };
}

/** Afasta pontos amontoados na mesma linha, sem passar do fim da trama. */
function afastar(xs: number[], dim: Dimensoes): number[] {
  const out = [...xs];
  for (let i = 1; i < out.length; i++) {
    if (out[i] < out[i - 1] + dim.afastamentoMin) out[i] = out[i - 1] + dim.afastamentoMin;
  }
  if (out.length > 0 && out[out.length - 1] > dim.xFim) {
    out[out.length - 1] = dim.xFim;
    for (let i = out.length - 2; i >= 0; i--) {
      out[i] = Math.min(xs[i], out[i + 1] - dim.afastamentoMin);
    }
  }
  return out;
}

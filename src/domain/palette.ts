import type { Membro } from './types';

export interface Linha {
  nome: string;
  /** Tom usado sobre o tear escuro. */
  tear: string;
  /** Tom usado sobre fundos claros. */
  claro: string;
}

export const LINHAS: ReadonlyArray<Linha> = [
  { nome: 'Pau-brasil', tear: '#E8678C', claro: '#B3264E' },
  { nome: 'Anil', tear: '#6E8BFF', claro: '#3552C4' },
  { nome: 'Cúrcuma', tear: '#F2B33D', claro: '#8A5E07' },
  { nome: 'Erva', tear: '#4CC392', claro: '#226B4C' },
  { nome: 'Urucum', tear: '#F08A4B', claro: '#9A4413' },
  { nome: 'Ipê', tear: '#B98CF2', claro: '#7A4FC0' },
];

export const LINHA_ANTIGA = { nome: 'Linha antiga', tear: '#8D96B8', claro: '#5A6080' } as const;

export function corDoMembro(m: Pick<Membro, 'cor' | 'ativo'>, fundo: 'tear' | 'claro'): string {
  const linha = m.ativo ? (LINHAS[m.cor] ?? LINHA_ANTIGA) : LINHA_ANTIGA;
  return linha[fundo];
}

export function proximaCorLivre(ativos: Pick<Membro, 'cor'>[]): number | null {
  const usadas = new Set(ativos.map(m => m.cor));
  for (let i = 0; i < LINHAS.length; i++) if (!usadas.has(i)) return i;
  return null;
}

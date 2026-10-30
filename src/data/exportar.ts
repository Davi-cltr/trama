import type { Caderno, Membro, Ponto } from '../domain/types';
import { supabase } from './supabase';
import { paraMembro, paraPonto } from './mappers';

export function montarExportacao(c: Caderno, membros: Membro[], pontos: Ponto[]) {
  return { versao: 1 as const, exportadoEm: new Date().toISOString(), caderno: c, membros, pontos };
}

export function nomeDaExportacao(c: Pick<Caderno, 'apelido'>, hoje = new Date()): string {
  const apelido = c.apelido
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `trama-${apelido || 'caderno'}-${hoje.toISOString().slice(0, 10)}.json`;
}

const PAGINA = 1000;

/** Baixa um JSON com o caderno, as pessoas e todos os pontos, sem filtro de período. */
export async function exportarCaderno(c: Caderno): Promise<void> {
  const { data: m, error: erroMembros } = await supabase.from('membros').select('*').eq('caderno_id', c.id).order('entrou_em');
  if (erroMembros) throw erroMembros;
  const pontos: Ponto[] = [];
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await supabase
      .from('pontos').select('*').eq('caderno_id', c.id).order('ocorreu_em').order('id').range(inicio, inicio + PAGINA - 1);
    if (error) throw error;
    pontos.push(...(data ?? []).map(paraPonto));
    if (!data || data.length < PAGINA) break;
  }
  const json = JSON.stringify(montarExportacao(c, (m ?? []).map(paraMembro), pontos), null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeDaExportacao(c);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

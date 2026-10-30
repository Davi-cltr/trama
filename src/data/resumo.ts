import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface ResumoGerado { texto: string; aliases: Record<string, string> }

/** Chama a Edge Function. Erros saem com `message` igual ao código ('limite_mensal', 'sem_consentimento', 'falha_resumo'). */
export async function gerarResumo(v: { cadernoId: string; de: string; ate: string }): Promise<ResumoGerado> {
  const { data, error } = await supabase.functions.invoke<ResumoGerado>('gerar-resumo', { body: v });
  if (error) {
    let codigo = 'falha_resumo';
    if (error instanceof FunctionsHttpError) {
      try {
        const corpo = (await error.context.json()) as { erro?: string };
        if (corpo.erro) codigo = corpo.erro;
      } catch {
        // corpo ilegível: fica a falha genérica
      }
    }
    throw new Error(codigo);
  }
  if (!data) throw new Error('falha_resumo');
  return data;
}

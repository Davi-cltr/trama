import { useEffect, useState } from 'react';
import { useQuery, type QueryKey } from '@tanstack/react-query';
import { supabase } from './supabase';
import { paraCaderno, paraConvite, paraMembro, paraPonto } from './mappers';
import { limitesUtc, type Periodo } from '../tapestry/time';

export const chaves = {
  perfil: (usuarioId: string | null): QueryKey => ['perfil', usuarioId],
  cadernos: (): QueryKey => ['cadernos'],
  caderno: (id: string): QueryKey => ['caderno', id],
  membros: (id: string): QueryKey => ['membros', id],
  pontos: (id: string, p?: Periodo): QueryKey => (p ? ['pontos', id, p.tipo, p.inicio] : ['pontos', id]),
  convites: (id: string): QueryKey => ['convites', id],
};

function falhou(error: { message: string } | null): void {
  if (error) throw error;
}

export function useSessao(): { usuarioId: string | null; carregando: boolean } {
  const [estado, setEstado] = useState<{ usuarioId: string | null; carregando: boolean }>({ usuarioId: null, carregando: true });
  useEffect(() => {
    let vivo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (vivo) setEstado({ usuarioId: data.session?.user.id ?? null, carregando: false });
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      setEstado({ usuarioId: sessao?.user.id ?? null, carregando: false });
    });
    return () => {
      vivo = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return estado;
}

export function usePerfil(usuarioId: string | null) {
  return useQuery({
    queryKey: chaves.perfil(usuarioId),
    enabled: usuarioId !== null,
    queryFn: async () => {
      const { data, error } = await supabase.from('perfis').select('nome_exibicao').eq('id', usuarioId!).maybeSingle();
      falhou(error);
      return data ? { nomeExibicao: data.nome_exibicao } : null;
    },
  });
}

export function useCadernos() {
  return useQuery({
    queryKey: chaves.cadernos(),
    queryFn: async () => {
      const { data, error } = await supabase.from('cadernos').select('*').order('criado_em');
      falhou(error);
      return (data ?? []).map(paraCaderno);
    },
  });
}

export function useCaderno(id: string) {
  return useQuery({
    queryKey: chaves.caderno(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('cadernos').select('*').eq('id', id).single();
      falhou(error);
      return paraCaderno(data!);
    },
  });
}

/** Membros ativos e inativos (os inativos aparecem como linha antiga). */
export function useMembros(cadernoId: string) {
  return useQuery({
    queryKey: chaves.membros(cadernoId),
    queryFn: async () => {
      const { data, error } = await supabase.from('membros').select('*').eq('caderno_id', cadernoId).order('entrou_em');
      falhou(error);
      return (data ?? []).map(paraMembro);
    },
  });
}

export function usePontos(cadernoId: string, p: Periodo) {
  return useQuery({
    queryKey: chaves.pontos(cadernoId, p),
    queryFn: async () => {
      const { de, ate } = limitesUtc(p);
      const { data, error } = await supabase
        .from('pontos')
        .select('*')
        .eq('caderno_id', cadernoId)
        .gte('ocorreu_em', de)
        .lt('ocorreu_em', ate)
        .order('ocorreu_em');
      falhou(error);
      return (data ?? []).map(paraPonto);
    },
  });
}

/** Convites ainda válidos (não usados, não cancelados, não expirados). */
export function useConvites(cadernoId: string, habilitado = true) {
  return useQuery({
    queryKey: chaves.convites(cadernoId),
    enabled: habilitado,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('convites')
        .select('*')
        .eq('caderno_id', cadernoId)
        .is('usado_em', null)
        .is('cancelado_em', null)
        .gt('expira_em', new Date().toISOString())
        .order('criado_em');
      falhou(error);
      return (data ?? []).map(paraConvite);
    },
  });
}

export function usePonto(id: string | undefined) {
  return useQuery({
    queryKey: ['ponto', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('pontos').select('*').eq('id', id!).maybeSingle();
      falhou(error);
      return data ? paraPonto(data) : null;
    },
  });
}

/** true quando a dona aceitou o envio para a IA e não revogou. */
export function useConsentimento(cadernoId: string, habilitado = true) {
  return useQuery({
    queryKey: ['consentimento', cadernoId],
    enabled: habilitado,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consentimentos_ia').select('aceito_em, revogado_em').eq('caderno_id', cadernoId).maybeSingle();
      falhou(error);
      return !!data?.aceito_em && !data.revogado_em;
    },
  });
}

export async function buscarPontosEntre(cadernoId: string, de: string, ate: string) {
  const { data, error } = await supabase
    .from('pontos').select('*').eq('caderno_id', cadernoId).gte('ocorreu_em', de).lt('ocorreu_em', ate).order('ocorreu_em');
  falhou(error);
  return (data ?? []).map(paraPonto);
}

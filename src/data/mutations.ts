import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { chaves } from './queries';
import { paraPonto, pontoParaLinha } from './mappers';
import { gerarToken, hashToken, linkDoConvite } from './convite';
import type { Papel, Ponto, Tratamento } from '../domain/types';

export type NovoPonto = Omit<Ponto, 'id'> & { id?: string };

function falhou(error: { message: string } | null): void {
  if (error) throw error;
}

/** Grava um ponto. O id nasce no aparelho, então reenviar o mesmo ponto não duplica. */
export async function enviarPonto(p: NovoPonto & { id: string }): Promise<Ponto> {
  const { data, error } = await supabase
    .from('pontos')
    .upsert(pontoParaLinha(p), { onConflict: 'id', ignoreDuplicates: true })
    .select();
  falhou(error);
  return data && data.length > 0 ? paraPonto(data[0]) : p;
}

export function useDarPonto() {
  const qc = useQueryClient();
  return useMutation<Ponto, Error, NovoPonto>({
    mutationFn: p => enviarPonto({ ...p, id: p.id ?? crypto.randomUUID() }),
    onSuccess: p => qc.invalidateQueries({ queryKey: chaves.pontos(p.cadernoId) }),
  });
}

export function useEditarPonto() {
  const qc = useQueryClient();
  return useMutation<Ponto, Error, Ponto>({
    mutationFn: async p => {
      const { data, error } = await supabase
        .from('pontos')
        .update({ tipo: p.tipo, sono_ruim: p.sonoRuim, texto: p.texto, ocorreu_em: p.ocorreuEm })
        .eq('id', p.id)
        .select()
        .single();
      falhou(error);
      return paraPonto(data!);
    },
    onSuccess: p => qc.invalidateQueries({ queryKey: chaves.pontos(p.cadernoId) }),
  });
}

export function useApagarPonto() {
  const qc = useQueryClient();
  return useMutation<void, Error, Pick<Ponto, 'id' | 'cadernoId'>>({
    mutationFn: async p => {
      const { error } = await supabase.from('pontos').delete().eq('id', p.id);
      falhou(error);
    },
    onSuccess: (_r, p) => qc.invalidateQueries({ queryKey: chaves.pontos(p.cadernoId) }),
  });
}

export function useSalvarPerfil() {
  const qc = useQueryClient();
  return useMutation<void, Error, { usuarioId: string; nomeExibicao: string }>({
    mutationFn: async ({ usuarioId, nomeExibicao }) => {
      const { error } = await supabase.from('perfis').upsert({ id: usuarioId, nome_exibicao: nomeExibicao.trim() });
      falhou(error);
    },
    onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: chaves.perfil(v.usuarioId) }),
  });
}

export function useCriarCaderno() {
  const qc = useQueryClient();
  return useMutation<string, Error, { apelido: string; tratamento: Tratamento; nascimento: string | null; rotulo: string }>({
    mutationFn: async v => {
      const { data, error } = await supabase.rpc('criar_caderno', {
        p_apelido: v.apelido,
        p_tratamento: v.tratamento,
        p_nascimento: v.nascimento as string,
        p_rotulo: v.rotulo,
      });
      falhou(error);
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.cadernos() }),
  });
}

export function useCriarConvite() {
  const qc = useQueryClient();
  return useMutation<{ token: string; link: string }, Error, { cadernoId: string; papel: Exclude<Papel, 'responsavel'>; rotulo: string }>({
    mutationFn: async v => {
      const token = gerarToken();
      const { error } = await supabase.from('convites').insert({
        caderno_id: v.cadernoId,
        token_hash: await hashToken(token),
        papel: v.papel,
        rotulo: v.rotulo.trim(),
      });
      falhou(error);
      return { token, link: linkDoConvite(token, window.location.origin) };
    },
    onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: chaves.convites(v.cadernoId) }),
  });
}

export function useCancelarConvite() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; cadernoId: string }>({
    mutationFn: async v => {
      const { error } = await supabase.from('convites').update({ cancelado_em: new Date().toISOString() }).eq('id', v.id);
      falhou(error);
    },
    onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: chaves.convites(v.cadernoId) }),
  });
}

async function desativarMembro(id: string): Promise<void> {
  const { error } = await supabase.from('membros').update({ ativo: false }).eq('id', id);
  falhou(error);
}

export function useRemoverMembro() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; cadernoId: string }>({
    mutationFn: v => desativarMembro(v.id),
    onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: chaves.membros(v.cadernoId) }),
  });
}

export function useSairDoCaderno() {
  const qc = useQueryClient();
  return useMutation<void, Error, { membroId: string }>({
    mutationFn: v => desativarMembro(v.membroId),
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.cadernos() }),
  });
}

export function useApagarCaderno() {
  const qc = useQueryClient();
  return useMutation<void, Error, { cadernoId: string }>({
    mutationFn: async v => {
      const { error } = await supabase.from('cadernos').delete().eq('id', v.cadernoId);
      falhou(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.cadernos() }),
  });
}

export function useAceitarConvite() {
  const qc = useQueryClient();
  return useMutation<string, Error, { token: string }>({
    mutationFn: async v => {
      const { data, error } = await supabase.rpc('aceitar_convite', { p_token: v.token });
      falhou(error);
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.cadernos() }),
  });
}

export function useApagarMinhaConta() {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const { error } = await supabase.rpc('apagar_minha_conta');
      falhou(error);
      await supabase.auth.signOut();
    },
  });
}

import type { Caderno } from '../domain/types';
import { doApelido, pronome } from '../domain/rules';

/** 32 bytes aleatórios em base64url. */
export function gerarToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** SHA-256 em hex minúsculo, igual a encode(digest(token, 'sha256'), 'hex') no pgcrypto. */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

/** O token vai no fragmento (#) para nunca chegar aos logs do servidor. */
export function linkDoConvite(token: string, origem: string): string {
  return `${origem}/convite#${token}`;
}

export function linkWhatsApp(link: string, _rotulo: string, c: Pick<Caderno, 'apelido' | 'tratamento'>): string {
  const texto = `Oi! Te convidei para a trama ${doApelido(c)}, onde a gente registra o dia a dia ${pronome(c)} junto. Entre por aqui: ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

const MENSAGENS: Record<string, string> = {
  convite_invalido: 'Este convite não vale mais. Peça um novo para quem te convidou.',
  sem_linha_livre: 'Este caderno já tem 6 linhas. Remova alguém para convidar outra pessoa.',
  ja_membro: 'Você já faz parte desta trama.',
  dona_de_caderno: 'Antes de apagar sua conta, apague os cadernos em que você é a responsável.',
  sem_perfil: 'Antes, conte como você quer ser chamada.',
  so_a_dona: 'Só a responsável pelo caderno pode fazer isso.',
  dona_nao_sai: 'A responsável não pode sair do próprio caderno.',
  ocorreu_em_fora_do_limite: 'Só dá para registrar até 7 dias atrás.',
  texto_longo: 'O texto pode ter até 280 caracteres.',
  sono_ruim_invalido: 'Escolha como foi a noite.',
  limite_mensal: 'Este caderno já gerou 10 resumos neste mês. Tente de novo no mês que vem.',
};

function mensagemOriginal(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') return e.message;
  return '';
}

export function ehErroDeRede(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  return /failed to fetch|networkerror|network request failed|load failed/i.test(mensagemOriginal(e));
}

export function mensagemDeErro(e: unknown): string {
  const original = mensagemOriginal(e);
  const codigo = Object.keys(MENSAGENS).find(c => original === c || original.includes(c));
  if (codigo) return MENSAGENS[codigo];
  if (ehErroDeRede(e)) return 'Sem conexão. Tente de novo quando a internet voltar.';
  return 'Algo deu errado. Tente de novo.';
}

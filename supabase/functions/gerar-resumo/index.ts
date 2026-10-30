// POST /gerar-resumo  { cadernoId, de, ate }
// 200 { texto, aliases } | 400 | 401 | 403 | 409 'sem_consentimento' | 429 'limite_mensal' | 502 'falha_resumo'
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { pseudonimizar, type MembroResumo, type PontoResumo } from '../_shared/pseudonimizar.ts';

const LIMITE_MENSAL = 10;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function resposta(status: number, corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

const INSTRUCOES = `Você escreve resumos para uma família levar a uma consulta ou reunião escolar.
Recebe registros do dia a dia de uma criança, um por linha, no formato "dia hora | quem | tipo | texto".
Escreva em português do Brasil, em frases simples, com estas seções, nesta ordem, cada uma começando com "## ":
## Visão geral
## Crises
## Conquistas
## O que funcionou
## O que cada pessoa observou
Em "Crises", diga quantas foram, quando aconteceram e o que veio antes delas segundo os registros.
Descreva o que foi registrado. Nunca diagnostique, nunca sugira causas e nunca recomende tratamentos.
Refira-se às pessoas só pelos nomes que aparecem nos registros (como "responsável", "escola 1", "terapia 1") e à criança como "a criança".
Se uma seção não tiver registros, escreva "Nada registrado no período."`;

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return resposta(405, { erro: 'metodo' });

  const auth = req.headers.get('Authorization');
  if (!auth) return resposta(401, { erro: 'sem_sessao' });

  let corpo: { cadernoId?: string; de?: string; ate?: string };
  try {
    corpo = await req.json();
  } catch {
    return resposta(400, { erro: 'corpo_invalido' });
  }
  const { cadernoId, de, ate } = corpo;
  if (!cadernoId || !de || !ate || Number.isNaN(Date.parse(de)) || Number.isNaN(Date.parse(ate))) {
    return resposta(400, { erro: 'corpo_invalido' });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  // Cliente com o JWT de quem pediu: toda leitura passa pela RLS.
  const usuario = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const servico = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: quem, error: erroUsuario } = await usuario.auth.getUser();
  if (erroUsuario || !quem.user) return resposta(401, { erro: 'sem_sessao' });

  const { data: dona } = await usuario.rpc('sou_dona', { p_caderno: cadernoId });
  if (dona !== true) return resposta(403, { erro: 'so_a_dona' });

  const { data: consentimento } = await usuario
    .from('consentimentos_ia').select('aceito_em, revogado_em').eq('caderno_id', cadernoId).maybeSingle();
  if (!consentimento?.aceito_em || consentimento.revogado_em) return resposta(409, { erro: 'sem_consentimento' });

  const agora = new Date();
  const inicioDoMes = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1)).toISOString();
  const { count } = await servico
    .from('resumos_gerados').select('id', { count: 'exact', head: true })
    .eq('caderno_id', cadernoId).gte('criado_em', inicioDoMes);
  if ((count ?? 0) >= LIMITE_MENSAL) return resposta(429, { erro: 'limite_mensal' });

  const [{ data: caderno }, { data: membros }, { data: pontos }] = await Promise.all([
    usuario.from('cadernos').select('apelido, fuso').eq('id', cadernoId).single(),
    usuario.from('membros').select('id, papel, rotulo, entrou_em').eq('caderno_id', cadernoId),
    usuario.from('pontos').select('membro_id, tipo, sono_ruim, texto, ocorreu_em')
      .eq('caderno_id', cadernoId).gte('ocorreu_em', de).lt('ocorreu_em', ate).order('ocorreu_em'),
  ]);
  if (!caderno || !membros || !pontos) return resposta(502, { erro: 'falha_resumo' });

  const { linhas, aliases } = pseudonimizar({
    apelido: caderno.apelido,
    fuso: caderno.fuso,
    membros: membros.map(m => ({ id: m.id, papel: m.papel, rotulo: m.rotulo, entrouEm: m.entrou_em }) as MembroResumo),
    pontos: pontos.map(p => ({
      membroId: p.membro_id, tipo: p.tipo, sonoRuim: p.sono_ruim, texto: p.texto, ocorreuEm: p.ocorreu_em,
    }) as PontoResumo),
  });

  if (linhas.length === 0) {
    return resposta(200, { texto: '## Visão geral\nNenhum registro no período escolhido.', aliases });
  }

  const cliente = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
  let texto: string;
  try {
    const msg = await cliente.beta.messages.create({
      model: Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-5-5',
      max_tokens: 4000,
      output_config: { effort: 'low' },
      // Se o modelo recusar por política, o próprio servidor tenta outro modelo.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: INSTRUCOES,
      messages: [{ role: 'user', content: `Registros do período:\n${linhas.join('\n')}` }],
    } as Parameters<typeof cliente.beta.messages.create>[0]);

    if (msg.stop_reason === 'refusal') return resposta(502, { erro: 'falha_resumo' });
    texto = msg.content.flatMap(b => (b.type === 'text' ? [b.text] : [])).join('\n').trim();
    if (!texto) return resposta(502, { erro: 'falha_resumo' });
  } catch (e) {
    console.error('gerar-resumo: falha na API', e instanceof Anthropic.APIError ? e.status : e);
    return resposta(502, { erro: 'falha_resumo' });
  }

  await servico.from('resumos_gerados').insert({ caderno_id: cadernoId });
  return resposta(200, { texto, aliases });
});

// TS puro, sem APIs do Deno: roda na Edge Function e nos testes do Vitest.
// Os tipos repetem só o formato de Membro e Ponto do app (src/domain/types.ts),
// porque a função publicada não enxerga arquivos fora de supabase/functions.

export interface MembroResumo {
  id: string;
  papel: 'responsavel' | 'cuidador' | 'escola' | 'terapia';
  rotulo: string;
  entrouEm: string;
}

export interface PontoResumo {
  membroId: string;
  tipo: 'crise' | 'conquista' | 'funcionou' | 'sono' | 'comida' | 'nota';
  sonoRuim: boolean | null;
  texto: string | null;
  ocorreuEm: string;
}

const NOME_DO_PAPEL: Record<MembroResumo['papel'], string> = {
  responsavel: 'responsável',
  cuidador: 'cuidador',
  escola: 'escola',
  terapia: 'terapia',
};

function escapar(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Troca `de` por `para` só como palavra inteira, sem diferenciar maiúsculas. */
function trocarPalavra(texto: string, de: string, para: string): string {
  if (!de.trim()) return texto;
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapar(de)}(?![\\p{L}\\p{N}])`, 'giu');
  return texto.replace(re, para);
}

function diaEHora(iso: string, fuso: string): string {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    })
      .formatToParts(new Date(iso))
      .map(p => [p.type, p.value]),
  );
  return `${partes.year}-${partes.month}-${partes.day} ${Number(partes.hour)}h${partes.minute}`;
}

/** Alias por papel, na ordem de entrada: "responsável", "escola 1", "escola 2", "terapia 1"… */
export function criarAliases(membros: MembroResumo[]): Record<string, string> {
  const ordem = [...membros].sort((a, b) => a.entrouEm.localeCompare(b.entrouEm) || a.id.localeCompare(b.id));
  const contagem: Record<string, number> = {};
  const aliases: Record<string, string> = {};
  for (const m of ordem) {
    const base = NOME_DO_PAPEL[m.papel];
    let alias: string;
    if (m.papel === 'responsavel' && !(base in aliases)) {
      alias = base;
    } else {
      contagem[base] = (contagem[base] ?? 0) + 1;
      alias = `${base} ${contagem[base]}`;
    }
    aliases[alias] = m.id;
  }
  return aliases;
}

export function pseudonimizar(input: { apelido: string; membros: MembroResumo[]; pontos: PontoResumo[]; fuso: string }): {
  linhas: string[];
  aliases: Record<string, string>;
} {
  const aliases = criarAliases(input.membros);
  const aliasDoMembro = new Map(Object.entries(aliases).map(([alias, id]) => [id, alias]));

  // Rótulos inteiros antes dos primeiros nomes, e os mais longos primeiro.
  const trocas: Array<[string, string]> = [];
  for (const m of input.membros) {
    const alias = aliasDoMembro.get(m.id)!;
    trocas.push([m.rotulo, alias]);
    const primeiro = m.rotulo.split(',')[0].trim();
    if (primeiro && primeiro !== m.rotulo) trocas.push([primeiro, alias]);
  }
  trocas.sort((a, b) => b[0].length - a[0].length);

  const limpar = (texto: string) => {
    let t = texto;
    for (const [de, para] of trocas) t = trocarPalavra(t, de, para);
    return trocarPalavra(t, input.apelido, 'a criança');
  };

  const linhas = [...input.pontos]
    .sort((a, b) => a.ocorreuEm.localeCompare(b.ocorreuEm))
    .map(p => {
      const alias = aliasDoMembro.get(p.membroId) ?? 'pessoa que saiu';
      const tipo = p.tipo === 'sono' && p.sonoRuim ? 'sono (noite ruim)' : p.tipo;
      return `${diaEHora(p.ocorreuEm, input.fuso)} | ${alias} | ${tipo} | ${p.texto ? limpar(p.texto) : ''}`;
    });

  return { linhas, aliases };
}

/** Na tela, devolve a cada alias o rótulo da pessoa. */
export function recolocarRotulos(texto: string, aliases: Record<string, string>, membros: Pick<MembroResumo, 'id' | 'rotulo'>[]): string {
  const rotulo = new Map(membros.map(m => [m.id, m.rotulo]));
  let t = texto;
  for (const alias of Object.keys(aliases).sort((a, b) => b.length - a.length)) {
    const r = rotulo.get(aliases[alias]);
    if (r) t = trocarPalavra(t, alias, r);
  }
  return t;
}

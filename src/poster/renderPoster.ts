import type { Caderno, Membro } from '../domain/types';
import { corDoMembro } from '../domain/palette';
import { doApelido, pronome, ROTULO_PAPEL } from '../domain/rules';
import { nomeDoMes, type Periodo } from '../tapestry/time';

export interface OpcoesPoster { esconderNomes: boolean; esconderApelido: boolean }

export interface TextosDoPoster {
  titulo: string;
  subtitulo: string;
  legenda: Array<{ cor: string; texto: string }>;
  rodape: readonly ['Feito no Trama', 'Nenhum registro aparece aqui. Só a trama.'];
}

/** Textos do pôster. Nunca recebe nem devolve texto de registros nem tipos de ponto. */
export function textosDoPoster(c: Caderno, p: Periodo, membros: Membro[], total: number, o: OpcoesPoster): TextosDoPoster {
  const mes = nomeDoMes(p);
  const m = membros.length;
  return {
    titulo: o.esconderApelido ? mes : `${mes} ${doApelido(c)}`,
    subtitulo:
      `${total} ${total === 1 ? 'ponto, tecido' : 'pontos, tecidos'} por ${m} ${m === 1 ? 'pessoa que cuida' : 'pessoas que cuidam'} ${pronome(c)}.`,
    legenda: membros.map(mb => ({
      cor: corDoMembro(mb, 'tear'),
      texto: o.esconderNomes ? ROTULO_PAPEL[mb.papel] : mb.rotulo,
    })),
    rodape: ['Feito no Trama', 'Nenhum registro aparece aqui. Só a trama.'],
  };
}

export function nomeDoArquivo(p: Periodo): string {
  return `trama-${nomeDoMes(p).toLowerCase()}-${p.inicio.slice(0, 4)}.png`;
}

const LARGURA = 1080;
const ALTURA = 1350;
const MARGEM_X = 88;
const MARGEM_Y = 80;
const TRAMA = { largura: 904, altura: 806 };
// título (92px) + subtítulo (28px) + 44px de respiro, como na prancha.
const TOPO_TRAMA = 264;
const TITULO = "'Young Serif', Georgia, serif";
const TEXTO = "'Atkinson Hyperlegible', system-ui, sans-serif";

function carregarImagem(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível desenhar a trama.'));
    img.src = url;
  });
}

/** PNG 1080×1350 igual à prancha "O mês do Theo". */
export async function renderPoster(svgMarkup: string, textos: TextosDoPoster): Promise<Blob> {
  await Promise.all([
    document.fonts.load(`92px ${TITULO}`),
    document.fonts.load(`28px ${TEXTO}`),
    document.fonts.load(`700 20px ${TEXTO}`),
  ]).catch(() => undefined);

  const canvas = document.createElement('canvas');
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Este navegador não consegue gerar o pôster.');

  ctx.fillStyle = '#1C2238';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#F3F4F8';
  ctx.font = `92px ${TITULO}`;
  ctx.fillText(textos.titulo, MARGEM_X, MARGEM_Y + 78, LARGURA - 2 * MARGEM_X);

  ctx.fillStyle = '#C9CEE3';
  ctx.font = `28px ${TEXTO}`;
  ctx.fillText(textos.subtitulo, MARGEM_X, MARGEM_Y + 92 + 18 + 28, LARGURA - 2 * MARGEM_X);

  const svg = svgMarkup.replace('<svg ', `<svg width="${TRAMA.largura}" height="${TRAMA.altura}" `);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = await carregarImagem(url);
    ctx.drawImage(img, MARGEM_X, TOPO_TRAMA, TRAMA.largura, TRAMA.altura);
  } finally {
    URL.revokeObjectURL(url);
  }

  const baseRodape = TOPO_TRAMA + TRAMA.altura + 44;
  ctx.font = `20px ${TEXTO}`;
  textos.legenda.slice(0, 6).forEach((item, i) => {
    const x = MARGEM_X + (i % 2) * 300;
    const y = baseRodape + 14 + Math.floor(i / 2) * 34;
    ctx.fillStyle = item.cor;
    ctx.fillRect(x, y - 8, 30, 4);
    ctx.fillStyle = '#DDE1EE';
    ctx.fillText(item.texto, x + 42, y, 240);
  });

  ctx.textAlign = 'right';
  ctx.fillStyle = '#F3F4F8';
  ctx.font = `30px ${TITULO}`;
  ctx.fillText(textos.rodape[0], LARGURA - MARGEM_X, ALTURA - MARGEM_Y - 30);
  ctx.fillStyle = '#A9B0CC';
  ctx.font = `18px ${TEXTO}`;
  ctx.fillText(textos.rodape[1], LARGURA - MARGEM_X, ALTURA - MARGEM_Y);

  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Não foi possível gerar o pôster.'))), 'image/png'),
  );
}

/** Compartilha pelo sistema quando possível; senão, baixa o arquivo. */
export async function compartilharOuBaixar(png: Blob, nome: string): Promise<'compartilhado' | 'baixado'> {
  const arquivo = new File([png], nome, { type: 'image/png' });
  if (navigator.canShare?.({ files: [arquivo] })) {
    await navigator.share({ files: [arquivo] });
    return 'compartilhado';
  }
  const url = URL.createObjectURL(png);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'baixado';
}

import { renderToStaticMarkup } from 'react-dom/server';
import { textosDoPoster, nomeDoArquivo } from '../../src/poster/renderPoster';
import { TapestrySvg } from '../../src/tapestry/TapestrySvg';
import { layoutTrama, DIM_MES } from '../../src/tapestry/layout';
import { theo, membros, pontosTheo, SP } from './fixtures/semana-theo';

const outubro = { tipo: 'mes' as const, inicio: '2026-10-01', fuso: SP };
const opcoes = { esconderNomes: false, esconderApelido: false };

it('título e subtítulo com artigo', () => {
  const t = textosDoPoster(theo, outubro, membros, 214, opcoes);
  expect(t.titulo).toBe('Outubro do Theo');
  expect(t.subtitulo).toBe('214 pontos, tecidos por 4 pessoas que cuidam dele.');
  expect(t.rodape).toEqual(['Feito no Trama', 'Nenhum registro aparece aqui. Só a trama.']);
});

it('pronome e singular', () => {
  const t = textosDoPoster({ ...theo, apelido: 'Maria', tratamento: 'a' }, outubro, membros.slice(0, 1), 1, opcoes);
  expect(t.titulo).toBe('Outubro da Maria');
  expect(t.subtitulo).toBe('1 ponto, tecido por 1 pessoa que cuida dela.');
});

it('esconder o apelido deixa só o mês', () => {
  expect(textosDoPoster(theo, outubro, membros, 3, { ...opcoes, esconderApelido: true }).titulo).toBe('Outubro');
});

it('esconder nomes troca rótulos por papéis', () => {
  const t = textosDoPoster(theo, outubro, membros, 214, { ...opcoes, esconderNomes: true });
  expect(t.legenda.map(l => l.texto)).toEqual(['Responsável', 'Escola', 'Terapia', 'Cuidador']);
  expect(t.legenda[0].cor).toBe('#E8678C');
});

it('nenhum texto de ponto entra no pôster', () => {
  const layoutComTextos = layoutTrama({ periodo: outubro, membros, pontos: pontosTheo, dim: DIM_MES });
  const svg = renderToStaticMarkup(<TapestrySvg layout={layoutComTextos} variante="mes" ariaLabel="" />);
  expect(svg).not.toContain('Chorou');
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  const t = textosDoPoster(theo, outubro, membros, 30, opcoes);
  expect(JSON.stringify(t)).not.toContain('Chorou');
  expect(JSON.stringify(t)).not.toMatch(/Crise|Conquista|Funcionou/);
});

it('nome do arquivo', () => {
  expect(nomeDoArquivo(outubro)).toBe('trama-outubro-2026.png');
});

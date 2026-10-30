// Carregado só quando alguém gera o pôster: traz react-dom/server, que não
// precisa estar no carregamento inicial do app.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Caderno, Membro } from '../domain/types';
import type { LayoutTrama } from '../tapestry/layout';
import { TapestrySvg } from '../tapestry/TapestrySvg';
import type { Periodo } from '../tapestry/time';
import { renderPoster, textosDoPoster, type OpcoesPoster } from './renderPoster';

export async function gerarPoster(a: {
  caderno: Caderno; periodo: Periodo; layout: LayoutTrama; membros: Membro[]; total: number; opcoes: OpcoesPoster;
}): Promise<Blob> {
  const svg = renderToStaticMarkup(createElement(TapestrySvg, { layout: a.layout, variante: 'mes', ariaLabel: '' }));
  return renderPoster(svg, textosDoPoster(a.caderno, a.periodo, a.membros, a.total, a.opcoes));
}

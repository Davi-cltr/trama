import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { Glyph } from '../../src/tapestry/Glyph';
import { TapestrySvg, rotuloDoPonto } from '../../src/tapestry/TapestrySvg';
import { layoutTrama, DIM_SEMANA, DIM_MES } from '../../src/tapestry/layout';
import { detectarPadroes } from '../../src/tapestry/patterns';
import { membros, pontosTheo, semanaTheo, semanaDoConceito, SP } from './fixtures/semana-theo';

const layoutConceito = layoutTrama({ periodo: semanaTheo, membros, pontos: pontosTheo, dim: DIM_SEMANA });
const [padrao] = detectarPadroes(semanaDoConceito);

it('desenha um botão por ponto com rótulo acessível', () => {
  render(<TapestrySvg layout={layoutConceito} variante="semana" ariaLabel="Trama" />);
  expect(screen.getAllByRole('button')).toHaveLength(30);
  expect(screen.getByRole('button', { name: 'Crise, Júlia, professora, terça às 10h' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sono, noite ruim, Ana, mãe, sexta às 6h45' })).toBeInTheDocument();
});

it('Enter e Espaço selecionam o ponto; clique também', async () => {
  const onSelecionar = vi.fn();
  render(<TapestrySvg layout={layoutConceito} variante="semana" ariaLabel="Trama" onSelecionar={onSelecionar} />);
  const botao = screen.getByRole('button', { name: 'Crise, Júlia, professora, terça às 10h' });
  botao.focus();
  await userEvent.keyboard('{Enter}');
  expect(onSelecionar).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'crise', membroId: 'julia' }));
  await userEvent.keyboard(' ');
  await userEvent.click(botao);
  expect(onSelecionar).toHaveBeenCalledTimes(3);
});

it('com destaque, desenha uma ligação por par e escurece o resto', () => {
  const { container } = render(<TapestrySvg layout={layoutConceito} variante="semana" ariaLabel="Trama" destaque={padrao} />);
  expect(container.querySelectorAll('[data-ligacao]')).toHaveLength(3);
  expect(container.querySelectorAll('[data-halo]')).toHaveLength(6);
  const apagados = container.querySelectorAll('[data-ponto][opacity="0.22"]');
  expect(apagados).toHaveLength(24);
});

it('a curva da ligação segue os controles do plano', () => {
  const { container } = render(<TapestrySvg layout={layoutConceito} variante="semana" ariaLabel="Trama" destaque={padrao} />);
  const d = container.querySelector('[data-ligacao]')!.getAttribute('d')!;
  expect(d).toMatch(/^M61 \d+(\.\d+)?C/);
});

it('sono ruim tem traço partido', () => {
  const { container } = render(<svg><Glyph tipo="sono" sonoRuim /></svg>);
  expect(container.querySelector('path')!.getAttribute('d')).toBe('M-7 0H-2M2 0H7');
});

it('sono bom tem traço contínuo e crise é um X', () => {
  const { container } = render(<svg><Glyph tipo="sono" sonoRuim={false} /><Glyph tipo="crise" sonoRuim={null} /></svg>);
  const ds = [...container.querySelectorAll('path')].map(p => p.getAttribute('d'));
  expect(ds).toEqual(['M-7 0H7', 'M-5 -5L5 5M5 -5L-5 5']);
});

it('mostra rótulos dos dias e das horas na semana', () => {
  render(<TapestrySvg layout={layoutConceito} variante="semana" ariaLabel="Trama" />);
  for (const t of ['Seg', 'Dom', '6h', '12h', '18h', '22h']) expect(screen.getByText(t)).toBeInTheDocument();
});

it('no mês o rótulo do ponto usa o dia do mês e nunca o texto', () => {
  const layoutMes = layoutTrama({ periodo: { tipo: 'mes', inicio: '2026-10-01', fuso: SP }, membros, pontos: pontosTheo, dim: DIM_MES });
  const { container } = render(<TapestrySvg layout={layoutMes} variante="mes" ariaLabel="Trama do mês" />);
  expect(screen.getByRole('button', { name: 'Crise, Júlia, professora, dia 20 às 10h' })).toBeInTheDocument();
  expect(container.innerHTML).not.toContain('Chorou');
});

it('rótulo diz quando o ponto está fora do horário da trama', () => {
  const pp = layoutConceito.faixas[0].pontos[0];
  expect(rotuloDoPonto({ ...pp, hora: 23.5, fora: 'depois' }, 'Ana, mãe', '2026-10-19', 'semana')).toBe('Sono, dormiu bem, Ana, mãe, segunda às 23h30');
});

it('sem violações de acessibilidade', async () => {
  const { container } = render(<TapestrySvg layout={layoutConceito} variante="semana" ariaLabel="Trama da semana" destaque={padrao} animar />);
  expect(await axe(container)).toHaveNoViolations();
});

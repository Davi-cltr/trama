import type { KeyboardEvent } from 'react';
import type { Ponto } from '../domain/types';
import { ROTULO_TIPO } from '../domain/rules';
import { Glyph } from './Glyph';
import type { LayoutTrama, PontoPosicionado } from './layout';
import type { Padrao } from './patterns';
import { DIAS_SEMANA_EXTENSO } from './time';
import css from './tapestry.module.css';

type Variante = 'semana' | 'mes';

const OPACIDADE_APAGADA = 0.22;
const ALTURA_EIXO = 22;

export function formatarHora(hora: number): string {
  let h = Math.floor(hora);
  let m = Math.round((hora - h) * 60);
  if (m === 60) { h += 1; m = 0; }
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/** Rótulo acessível do ponto: tipo, quem, quando. Nunca inclui o texto do registro. */
export function rotuloDoPonto(pp: PontoPosicionado, rotulo: string, dia: string, variante: Variante): string {
  const { tipo, sonoRuim } = pp.ponto;
  const tipoTexto = tipo === 'sono' ? `Sono, ${sonoRuim ? 'noite ruim' : 'dormiu bem'}` : ROTULO_TIPO[tipo];
  const [a, mes, d] = dia.split('-').map(Number);
  const quando = variante === 'semana'
    ? DIAS_SEMANA_EXTENSO[new Date(a, mes - 1, d, 12).getDay()]
    : `dia ${d}`;
  return `${tipoTexto}, ${rotulo}, ${quando} às ${formatarHora(pp.hora)}`;
}

function curva(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const topo = Math.min(y1, y2);
  const r = (v: number) => Math.round(v * 10) / 10;
  return `M${r(x1)} ${r(y1)}C${r(x1 + 0.3 * dx)} ${r(topo - 20)} ${r(x1 + 0.7 * dx)} ${r(topo - 14)} ${r(x2)} ${r(y2)}`;
}

export function TapestrySvg(props: {
  layout: LayoutTrama;
  variante: Variante;
  destaque?: Padrao | null;
  animar?: boolean;
  onSelecionar?: (p: Ponto) => void;
  ariaLabel: string;
}) {
  const { layout, variante, destaque, animar, onSelecionar, ariaLabel } = props;
  const semana = variante === 'semana';
  const altura = layout.altura + (semana ? ALTURA_EIXO : 0);
  const xInicio = layout.x(6);
  const xFim = layout.x(22);
  const escalaGlyph = semana ? 1 : 0.75;
  const emDestaque = new Set(destaque?.pontoIds ?? []);
  const rotulos = new Map(layout.linhas.map(l => [l.membroId, l.rotulo]));
  const ultima = layout.linhas[layout.linhas.length - 1];
  // Rótulo do dia alinhado ao meio das linhas da faixa.
  const meioDaFaixa = layout.linhas.length > 0 ? (layout.linhas[0].dy + ultima.dy) / 2 : 0;

  const posicoes = new Map<string, PontoPosicionado>();
  for (const f of layout.faixas) for (const p of f.pontos) posicoes.set(p.ponto.id, p);

  const selecionar = (p: Ponto) => onSelecionar?.(p);
  const teclado = (e: KeyboardEvent, p: Ponto) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selecionar(p);
    }
  };

  return (
    <svg
      className={css.svg}
      viewBox={`0 0 ${layout.largura} ${altura}`}
      role="group"
      aria-label={ariaLabel}
      fontFamily="'Atkinson Hyperlegible', system-ui, sans-serif"
    >
      {!semana &&
        Array.from({ length: 9 }, (_, k) => {
          const x = layout.x(6 + 2 * k);
          return <line key={`urdume-${k}`} x1={x} x2={x} y1={0} y2={layout.altura} stroke="#FFFFFF" strokeOpacity={0.05} />;
        })}

      {layout.faixas.map(f =>
        semana ? (
          <text key={`dia-${f.dia}`} x={10} y={f.y + meioDaFaixa + 4} fill="#A9B0CC" fontSize={11} aria-hidden="true">{f.rotulo}</text>
        ) : (
          <text key={`dia-${f.dia}`} x={28} y={f.y + meioDaFaixa + 4} fill="#A9B0CC" fontSize={12} textAnchor="end" aria-hidden="true">{f.rotulo}</text>
        ),
      )}

      {semana &&
        [6, 12, 18, 22].map(h => (
          <text key={`hora-${h}`} x={layout.x(h)} y={altura - 6} fill="#8D96B8" fontSize={10} textAnchor="middle" aria-hidden="true">{`${h}h`}</text>
        ))}

      <g aria-hidden="true">
        {layout.faixas.map(f =>
          layout.linhas.map(l => (
            <line
              key={`base-${f.dia}-${l.membroId}`}
              x1={xInicio} x2={xFim} y1={f.y + l.dy} y2={f.y + l.dy}
              stroke={l.corTear} strokeWidth={1} strokeOpacity={0.28}
            />
          )),
        )}
      </g>

      <g className={css.apagavel} opacity={destaque ? OPACIDADE_APAGADA : 1} aria-hidden="true">
        {layout.faixas.map((f, i) =>
          f.trechos.map(t => (
            <line
              key={`trecho-${f.dia}-${t.membroId}`}
              className={animar ? css.tecer : undefined}
              style={animar ? { animationDelay: `${(0.1 + 0.08 * i).toFixed(2)}s` } : undefined}
              x1={t.x1} x2={t.x2} y1={t.y} y2={t.y}
              stroke={t.cor} strokeWidth={2.4} strokeLinecap="round"
            />
          )),
        )}
      </g>

      {layout.faixas.map((f, i) =>
        f.pontos.map(pp => (
          <g
            key={pp.ponto.id}
            data-ponto=""
            role="button"
            tabIndex={0}
            aria-label={rotuloDoPonto(pp, rotulos.get(pp.ponto.membroId) ?? '', f.dia, variante)}
            className={`${css.ponto} ${css.apagavel}`}
            opacity={destaque && !emDestaque.has(pp.ponto.id) ? OPACIDADE_APAGADA : 1}
            transform={`translate(${pp.x} ${pp.y})`}
            style={{ color: pp.cor }}
            onClick={() => selecionar(pp.ponto)}
            onKeyDown={e => teclado(e, pp.ponto)}
          >
            <circle className={css.alvo} r={semana ? 9 : 6} fill="transparent" />
            <g
              className={animar ? css.surgir : undefined}
              style={animar ? { animationDelay: `${(0.75 + 0.1 * i).toFixed(2)}s` } : undefined}
              transform={escalaGlyph === 1 ? undefined : `scale(${escalaGlyph})`}
            >
              <Glyph tipo={pp.ponto.tipo} sonoRuim={pp.ponto.sonoRuim} />
            </g>
          </g>
        )),
      )}

      {destaque && (
        <g aria-hidden="true">
          {destaque.ligacoes.map(([a, b]) => {
            const pa = posicoes.get(a);
            const pb = posicoes.get(b);
            if (!pa || !pb) return null;
            return (
              <path
                key={`ligacao-${a}-${b}`}
                data-ligacao=""
                d={curva(pa.x, pa.y, pb.x, pb.y)}
                fill="none" stroke="#FFFFFF" strokeWidth={1.4} strokeDasharray="3 3" strokeLinecap="round"
              />
            );
          })}
          {destaque.pontoIds.map(id => {
            const p = posicoes.get(id);
            return p ? (
              <circle key={`halo-${id}`} data-halo="" cx={p.x} cy={p.y} r={10} fill="none" stroke="#FFFFFF" strokeWidth={1} strokeOpacity={0.75} />
            ) : null;
          })}
        </g>
      )}
    </svg>
  );
}

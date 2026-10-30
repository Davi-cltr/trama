import { TZDate } from '@date-fns/tz';
import { addDays, format, getDaysInMonth, parseISO, startOfWeek } from 'date-fns';

export type Periodo = { tipo: 'semana' | 'mes'; inicio: string /* 'YYYY-MM-DD' */; fuso: string };

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DIAS_SEMANA_EXTENSO = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function noFuso(iso: string | Date, fuso: string): TZDate {
  return new TZDate(typeof iso === 'string' ? new Date(iso) : iso, fuso);
}

/** Hora do dia no fuso, em horas decimais (6.5 = 6h30). */
export function horaLocal(iso: string, fuso: string): number {
  const d = noFuso(iso, fuso);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

/** Dia local no fuso, 'YYYY-MM-DD'. */
export function diaLocal(iso: string, fuso: string): string {
  return format(noFuso(iso, fuso), 'yyyy-MM-dd');
}

export function inicioDaSemana(ref: Date, fuso: string): string {
  return format(startOfWeek(noFuso(ref, fuso), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function periodoDaSemana(ref: Date, fuso: string): Periodo {
  return { tipo: 'semana', inicio: inicioDaSemana(ref, fuso), fuso };
}

export function periodoDoMes(ref: Date, fuso: string): Periodo {
  return { tipo: 'mes', inicio: format(noFuso(ref, fuso), 'yyyy-MM-01'), fuso };
}

/** Data local sem fuso (meio-dia, para não escorregar de dia). */
function dataCivil(dia: string): Date {
  return parseISO(`${dia}T12:00:00`);
}

function quantosDias(p: Periodo): number {
  return p.tipo === 'semana' ? 7 : getDaysInMonth(dataCivil(p.inicio));
}

export function diasDoPeriodo(p: Periodo): string[] {
  const base = dataCivil(p.inicio);
  return Array.from({ length: quantosDias(p) }, (_, i) => format(addDays(base, i), 'yyyy-MM-dd'));
}

/** Meia-noite local do dia, em UTC. */
export function meiaNoiteUtc(dia: string, fuso: string): string {
  const [a, m, d] = dia.split('-').map(Number);
  return new Date(new TZDate(a, m - 1, d, 0, 0, 0, fuso).getTime()).toISOString();
}

/** Limites do período em UTC; `ate` é exclusivo. */
export function limitesUtc(p: Periodo): { de: string; ate: string } {
  const fim = format(addDays(dataCivil(p.inicio), quantosDias(p)), 'yyyy-MM-dd');
  return { de: meiaNoiteUtc(p.inicio, p.fuso), ate: meiaNoiteUtc(fim, p.fuso) };
}

export function rotuloDoDia(dia: string, tipo: Periodo['tipo']): string {
  const d = dataCivil(dia);
  return tipo === 'semana' ? DIAS_SEMANA[d.getDay()] : String(d.getDate());
}

export function nomeDoMes(p: Periodo): string {
  return MESES[dataCivil(p.inicio).getMonth()];
}

/** Desloca o período: -1 = anterior, +1 = próximo. */
export function deslocarPeriodo(p: Periodo, passos: number): Periodo {
  const base = dataCivil(p.inicio);
  if (p.tipo === 'semana') return { ...p, inicio: format(addDays(base, 7 * passos), 'yyyy-MM-dd') };
  const d = new Date(base.getFullYear(), base.getMonth() + passos, 1, 12);
  return { ...p, inicio: format(d, 'yyyy-MM-dd') };
}

import {
  horaLocal, diaLocal, inicioDaSemana, periodoDaSemana, periodoDoMes,
  diasDoPeriodo, limitesUtc, rotuloDoDia, nomeDoMes, deslocarPeriodo,
} from '../../src/tapestry/time';

const SP = 'America/Sao_Paulo';

it('23h30 em São Paulo continua no mesmo dia local', () => {
  expect(diaLocal('2026-10-29T02:30:00Z', SP)).toBe('2026-10-28');
  expect(horaLocal('2026-10-29T02:30:00Z', SP)).toBeCloseTo(23.5);
});

it('6h30 local', () => {
  expect(horaLocal('2026-10-29T09:30:00Z', SP)).toBeCloseTo(6.5);
});

it('semana começa na segunda', () => {
  expect(inicioDaSemana(new Date('2026-10-29T15:00:00Z'), SP)).toBe('2026-10-26');
  expect(inicioDaSemana(new Date('2026-10-26T02:00:00Z'), SP)).toBe('2026-10-19'); // domingo 23h local
});

it('semana tem 7 dias e limites em UTC', () => {
  const p = periodoDaSemana(new Date('2026-10-29T15:00:00Z'), SP);
  expect(p).toEqual({ tipo: 'semana', inicio: '2026-10-26', fuso: SP });
  expect(diasDoPeriodo(p)).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']);
  expect(limitesUtc(p)).toEqual({ de: '2026-10-26T03:00:00.000Z', ate: '2026-11-02T03:00:00.000Z' });
});

it('outubro tem 31 dias e limites em UTC', () => {
  const p = periodoDoMes(new Date('2026-10-15T12:00:00Z'), SP);
  expect(diasDoPeriodo(p)).toHaveLength(31);
  expect(limitesUtc(p)).toEqual({ de: '2026-10-01T03:00:00.000Z', ate: '2026-11-01T03:00:00.000Z' });
});

it('fevereiro de 2027 tem 28 dias', () => {
  expect(diasDoPeriodo(periodoDoMes(new Date('2027-02-10T12:00:00Z'), SP))).toHaveLength(28);
});

it('respeita outro fuso', () => {
  expect(diaLocal('2026-10-29T02:30:00Z', 'Europe/Lisbon')).toBe('2026-10-29');
});

it('rótulos de dia', () => {
  expect(rotuloDoDia('2026-10-31', 'semana')).toBe('Sáb');
  expect(rotuloDoDia('2026-10-26', 'semana')).toBe('Seg');
  expect(rotuloDoDia('2026-10-05', 'mes')).toBe('5');
});

it('nome do mês', () => {
  expect(nomeDoMes(periodoDoMes(new Date('2026-10-15T12:00:00Z'), SP))).toBe('Outubro');
});

it('desloca semana e mês', () => {
  expect(deslocarPeriodo({ tipo: 'semana', inicio: '2026-10-26', fuso: SP }, -1).inicio).toBe('2026-10-19');
  expect(deslocarPeriodo({ tipo: 'mes', inicio: '2026-12-01', fuso: SP }, 1).inicio).toBe('2027-01-01');
  expect(deslocarPeriodo({ tipo: 'mes', inicio: '2026-03-01', fuso: SP }, -1).inicio).toBe('2026-02-01');
});

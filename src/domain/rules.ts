import type { Caderno, Papel, TipoPonto } from './types';

export const LIMITES = {
  apelido: 30,
  rotulo: 40,
  nome: 40,
  texto: 280,
  linhasAtivas: 6,
  diasRetroativos: 7,
  toleranciaFuturoMin: 5,
  conviteDias: 7,
  resumosPorMes: 10,
} as const;

export const ROTULO_TIPO: Record<TipoPonto, string> = {
  crise: 'Crise',
  conquista: 'Conquista',
  funcionou: 'Funcionou',
  sono: 'Sono',
  comida: 'Comida',
  nota: 'Nota',
};

export const ROTULO_PAPEL: Record<Papel, string> = {
  responsavel: 'Responsável',
  cuidador: 'Cuidador',
  escola: 'Escola',
  terapia: 'Terapia',
};

/** Conta code points, igual ao `char_length` do Postgres. */
export function contarCaracteres(s: string): number {
  return Array.from(s).length;
}

export function validarPonto(
  p: { tipo: TipoPonto; sonoRuim: boolean | null; texto: string | null; ocorreuEm: Date },
  agora: Date,
): string[] {
  const erros: string[] = [];
  if (p.tipo === 'sono' && p.sonoRuim === null) erros.push('Escolha como foi a noite.');
  if (p.tipo !== 'sono' && p.sonoRuim !== null) erros.push('Só o sono tem noite boa ou ruim.');
  if (p.texto !== null && contarCaracteres(p.texto) > LIMITES.texto) {
    erros.push(`O texto pode ter até ${LIMITES.texto} caracteres.`);
  }
  const minimo = agora.getTime() - LIMITES.diasRetroativos * 24 * 60 * 60 * 1000;
  const maximo = agora.getTime() + LIMITES.toleranciaFuturoMin * 60 * 1000;
  const t = p.ocorreuEm.getTime();
  if (t < minimo) erros.push(`Só dá para registrar até ${LIMITES.diasRetroativos} dias atrás.`);
  if (t > maximo) erros.push('Esse horário ainda não chegou.');
  return erros;
}

type ComTratamento = Pick<Caderno, 'apelido' | 'tratamento'>;

export function nomeComArtigo(c: ComTratamento): string {
  return c.tratamento ? `${c.tratamento} ${c.apelido}` : c.apelido;
}

export function doApelido(c: ComTratamento): string {
  return `${c.tratamento === 'o' ? 'do' : c.tratamento === 'a' ? 'da' : 'de'} ${c.apelido}`;
}

/** "dele", "dela" ou "dele ou dela", conforme o tratamento. */
export function pronome(c: Pick<Caderno, 'tratamento'>): string {
  return c.tratamento === 'o' ? 'dele' : c.tratamento === 'a' ? 'dela' : 'dele ou dela';
}

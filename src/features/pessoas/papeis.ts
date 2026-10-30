import type { Papel } from '../../domain/types';

export type PapelConvidado = Exclude<Papel, 'responsavel'>;

export const OPCOES_PAPEL: Array<{ valor: PapelConvidado; rotulo: string }> = [
  { valor: 'cuidador', rotulo: 'Familiar ou cuidador' },
  { valor: 'escola', rotulo: 'Escola' },
  { valor: 'terapia', rotulo: 'Terapia' },
];

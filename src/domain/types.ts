export type TipoPonto = 'crise' | 'conquista' | 'funcionou' | 'sono' | 'comida' | 'nota';
export type Papel = 'responsavel' | 'cuidador' | 'escola' | 'terapia';
/** Como as frases se referem à criança: "o Theo", "a Maria" ou só "Kim". */
export type Tratamento = 'o' | 'a' | '';

export interface Caderno {
  id: string;
  apelido: string;
  tratamento: Tratamento;
  nascimento: string | null;
  donaId: string;
  fuso: string;
}

export interface Membro {
  id: string;
  cadernoId: string;
  perfilId: string | null;
  papel: Papel;
  rotulo: string;
  cor: number;
  ativo: boolean;
  entrouEm: string;
}

export interface Ponto {
  id: string;
  cadernoId: string;
  membroId: string;
  tipo: TipoPonto;
  sonoRuim: boolean | null;
  texto: string | null;
  ocorreuEm: string;
}

export const TIPOS: readonly TipoPonto[] = ['crise', 'conquista', 'funcionou', 'sono', 'comida', 'nota'];

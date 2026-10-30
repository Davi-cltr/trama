import type { Database } from './database.types';
import type { Caderno, Membro, Papel, Ponto, TipoPonto, Tratamento } from '../domain/types';

type Tabelas = Database['public']['Tables'];
export type Row<T extends keyof Tabelas> = Tabelas[T]['Row'];

export interface ConvitePendente { id: string; papel: Exclude<Papel, 'responsavel'>; rotulo: string; expiraEm: string }

const TRATAMENTOS: readonly Tratamento[] = ['o', 'a', ''];

export function paraCaderno(r: Row<'cadernos'>): Caderno {
  return {
    id: r.id,
    apelido: r.apelido,
    tratamento: (TRATAMENTOS as readonly string[]).includes(r.tratamento) ? (r.tratamento as Tratamento) : '',
    nascimento: r.nascimento,
    donaId: r.dona_id,
    fuso: r.fuso,
  };
}

export function paraMembro(r: Row<'membros'>): Membro {
  return {
    id: r.id,
    cadernoId: r.caderno_id,
    perfilId: r.perfil_id,
    papel: r.papel as Papel,
    rotulo: r.rotulo,
    cor: r.cor,
    ativo: r.ativo,
    entrouEm: r.entrou_em,
  };
}

export function paraPonto(r: Row<'pontos'>): Ponto {
  return {
    id: r.id,
    cadernoId: r.caderno_id,
    membroId: r.membro_id,
    tipo: r.tipo as TipoPonto,
    sonoRuim: r.sono_ruim,
    texto: r.texto,
    ocorreuEm: r.ocorreu_em,
  };
}

export function pontoParaLinha(p: Ponto) {
  return {
    id: p.id,
    caderno_id: p.cadernoId,
    membro_id: p.membroId,
    tipo: p.tipo,
    sono_ruim: p.sonoRuim,
    texto: p.texto,
    ocorreu_em: p.ocorreuEm,
  };
}

export function paraConvite(r: Row<'convites'>): ConvitePendente {
  return { id: r.id, papel: r.papel as ConvitePendente['papel'], rotulo: r.rotulo, expiraEm: r.expira_em };
}

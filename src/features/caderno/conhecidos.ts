import type { Caderno } from '../../domain/types';

const CHAVE = 'trama:cadernos-conhecidos';
type Conhecidos = Record<string, Pick<Caderno, 'apelido' | 'tratamento'>>;

function ler(): Conhecidos {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(CHAVE) ?? '{}');
    return v && typeof v === 'object' ? (v as Conhecidos) : {};
  } catch {
    return {};
  }
}

function gravar(c: Conhecidos): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(c));
  } catch {
    // ignora
  }
}

/**
 * Compara a lista atual com a que o aparelho conhecia e devolve os cadernos
 * que sumiram (a pessoa foi removida). Depois passa a conhecer só os atuais.
 */
export function atualizarConhecidos(atuais: Caderno[]): Array<Pick<Caderno, 'apelido' | 'tratamento'>> {
  const antes = ler();
  const ids = new Set(atuais.map(c => c.id));
  const perdidos = Object.entries(antes).filter(([id]) => !ids.has(id)).map(([, c]) => c);
  gravar(Object.fromEntries(atuais.map(c => [c.id, { apelido: c.apelido, tratamento: c.tratamento }])));
  return perdidos;
}

/** Saída ou exclusão feita pela própria pessoa não deve virar aviso de acesso perdido. */
export function esquecerCaderno(id: string): void {
  const c = ler();
  delete c[id];
  gravar(c);
}

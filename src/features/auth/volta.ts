const CHAVE = 'trama:volta';

/** Só aceita caminhos internos, para o link de entrada não virar redirecionamento aberto. */
export function voltaSegura(v: string | null): string {
  return v && v.startsWith('/') && !v.startsWith('//') ? v : '/';
}

/**
 * O link mágico volta com o próprio fragmento (#access_token=…), então o fragmento
 * da rota (o token do convite) fica guardado no aparelho e é restaurado depois.
 */
export function prepararVolta(volta: string): string {
  const i = volta.indexOf('#');
  if (i < 0) return volta;
  try {
    localStorage.setItem(CHAVE, volta);
  } catch {
    // sem armazenamento: o convite precisará ser aberto de novo
  }
  return volta.slice(0, i);
}

export function voltaGuardada(caminho: string): string | null {
  try {
    const v = localStorage.getItem(CHAVE);
    if (v && v.slice(0, v.indexOf('#')) === caminho) {
      localStorage.removeItem(CHAVE);
      return v;
    }
  } catch {
    // ignora
  }
  return null;
}

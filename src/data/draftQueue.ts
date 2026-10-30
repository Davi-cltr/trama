import type { NovoPonto } from './mutations';

type Rascunho = NovoPonto & { id: string };

const CHAVE = 'trama:rascunhos';

function ler(): Rascunho[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    const lista: unknown = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? (lista as Rascunho[]) : [];
  } catch {
    return [];
  }
}

function gravar(lista: Rascunho[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    // Sem armazenamento disponível: o rascunho se perde, mas o app segue.
  }
}

export function salvarRascunho(p: Rascunho): void {
  gravar([...ler().filter(r => r.id !== p.id), p]);
}

export function listarRascunhos(): Rascunho[] {
  return ler();
}

let emAndamento: Promise<{ enviados: number; falhas: number }> | null = null;

/**
 * Envia a fila uma vez. Se já houver um envio em andamento, devolve o mesmo
 * resultado em vez de reenviar: tocar "Tentar agora" duas vezes ou a internet
 * voltar no meio do envio não cria pontos repetidos.
 */
export function enviarRascunhos(enviar: (p: Rascunho) => Promise<void>): Promise<{ enviados: number; falhas: number }> {
  if (emAndamento) return emAndamento;
  emAndamento = (async () => {
    let enviados = 0;
    let falhas = 0;
    for (const r of ler()) {
      try {
        await enviar(r);
        gravar(ler().filter(x => x.id !== r.id));
        enviados += 1;
      } catch {
        falhas += 1;
      }
    }
    return { enviados, falhas };
  })().finally(() => {
    emAndamento = null;
  });
  return emAndamento;
}

import type { NovoPonto } from './mutations';
import { ehErroDeRede } from './convite';

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

export interface ResultadoEnvio {
  enviados: number;
  /** Falhas de rede: o rascunho continua guardado para a próxima tentativa. */
  falhas: number;
  /** Recusados pelo servidor (pessoa removida, ponto antigo demais…): saem da fila. */
  descartados: Array<Rascunho & { erro: unknown }>;
}

let emAndamento: Promise<ResultadoEnvio> | null = null;

/**
 * Envia a fila uma vez. Se já houver um envio em andamento, devolve o mesmo
 * resultado em vez de reenviar: tocar "Tentar agora" duas vezes ou a internet
 * voltar no meio do envio não cria pontos repetidos.
 */
export function enviarRascunhos(enviar: (p: Rascunho) => Promise<void>): Promise<ResultadoEnvio> {
  if (emAndamento) return emAndamento;
  emAndamento = (async () => {
    let enviados = 0;
    let falhas = 0;
    const descartados: ResultadoEnvio['descartados'] = [];
    for (const r of ler()) {
      try {
        await enviar(r);
        gravar(ler().filter(x => x.id !== r.id));
        enviados += 1;
      } catch (erro) {
        if (ehErroDeRede(erro)) {
          falhas += 1;
        } else {
          // Tentar de novo não vai mudar a resposta do servidor.
          gravar(ler().filter(x => x.id !== r.id));
          descartados.push({ ...r, erro });
        }
      }
    }
    return { enviados, falhas, descartados };
  })().finally(() => {
    emAndamento = null;
  });
  return emAndamento;
}

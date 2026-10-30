// Lê os links mágicos que o Supabase local entrega no Mailpit (porta 54324).
const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324';

interface Resumo { ID: string; Created: string }

export async function linkMagico(email: string, depoisDe: Date, tentativas = 40): Promise<string> {
  for (let i = 0; i < tentativas; i++) {
    const r = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
    const { messages = [] } = (await r.json()) as { messages?: Resumo[] };
    const recente = messages.find(m => new Date(m.Created) >= new Date(depoisDe.getTime() - 1000));
    if (recente) {
      const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${recente.ID}`)).json()) as { HTML: string; Text: string };
      const achado = /https?:\/\/[^\s"'<>]+\/auth\/v1\/verify[^\s"'<>)]+/.exec(`${msg.HTML}\n${msg.Text}`);
      if (achado) return achado[0].replace(/&amp;/g, '&');
    }
    await new Promise(res => setTimeout(res, 500));
  }
  throw new Error(`Nenhum link mágico chegou para ${email}`);
}

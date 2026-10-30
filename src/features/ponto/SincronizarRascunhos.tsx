import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { enviarRascunhos, listarRascunhos } from '../../data/draftQueue';
import { enviarPonto } from '../../data/mutations';
import { mensagemDeErro } from '../../data/convite';
import { Toast } from '../../ui/Toast';

/** Envia os pontos guardados no aparelho ao abrir o app e sempre que a internet voltar. */
export function SincronizarRascunhos() {
  const qc = useQueryClient();
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    async function sincronizar() {
      if (listarRascunhos().length === 0) return;
      const r = await enviarRascunhos(async p => {
        await enviarPonto(p);
      });
      if (r.enviados > 0) await qc.invalidateQueries({ queryKey: ['pontos'] });
      if (r.descartados.length > 0) {
        setAviso(`Um ponto guardado no aparelho não pôde ser dado: ${mensagemDeErro(r.descartados[0].erro)}`);
      }
    }
    void sincronizar();
    window.addEventListener('online', sincronizar);
    return () => window.removeEventListener('online', sincronizar);
  }, [qc]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 8000);
    return () => clearTimeout(t);
  }, [aviso]);

  return <Toast mensagem={aviso} />;
}

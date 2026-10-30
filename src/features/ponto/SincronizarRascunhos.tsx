import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { enviarRascunhos, listarRascunhos } from '../../data/draftQueue';
import { enviarPonto } from '../../data/mutations';

/** Envia os pontos guardados no aparelho ao abrir o app e sempre que a internet voltar. */
export function SincronizarRascunhos() {
  const qc = useQueryClient();
  useEffect(() => {
    async function sincronizar() {
      if (listarRascunhos().length === 0) return;
      const r = await enviarRascunhos(async p => {
        await enviarPonto(p);
      });
      if (r.enviados > 0) await qc.invalidateQueries({ queryKey: ['pontos'] });
    }
    void sincronizar();
    window.addEventListener('online', sincronizar);
    return () => window.removeEventListener('online', sincronizar);
  }, [qc]);
  return null;
}

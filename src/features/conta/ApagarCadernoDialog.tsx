import { useState } from 'react';
import type { Caderno } from '../../domain/types';
import { doApelido } from '../../domain/rules';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { Field } from '../../ui/Field';

export function ApagarCadernoDialog({
  caderno, aberto, onFechar, onConfirmar,
}: { caderno: Caderno; aberto: boolean; onFechar: () => void; onConfirmar: () => Promise<void> }) {
  const [texto, setTexto] = useState('');
  const [apagando, setApagando] = useState(false);
  const fechar = () => { setTexto(''); onFechar(); };
  return (
    <Dialog titulo={`Apagar o caderno ${doApelido(caderno)}`} aberto={aberto} onFechar={fechar}>
      <p style={{ margin: 0 }}>Isso apaga a trama, as pessoas e todos os pontos, para todo mundo. Não dá para desfazer.</p>
      <Field rotulo={`Digite ${caderno.apelido} para confirmar`} value={texto} onChange={e => setTexto(e.target.value)} autoComplete="off" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <Button
          variante="perigo"
          disabled={texto !== caderno.apelido || apagando}
          onClick={async () => {
            setApagando(true);
            try {
              await onConfirmar();
              setTexto('');
            } finally {
              setApagando(false);
            }
          }}
        >
          Apagar para sempre
        </Button>
        <Button variante="secundario" onClick={fechar}>Cancelar</Button>
      </div>
    </Dialog>
  );
}

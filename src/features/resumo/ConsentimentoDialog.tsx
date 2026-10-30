import { Link } from 'react-router';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';

export function ConsentimentoDialog({ aberto, onAceitar, onRecusar }: { aberto: boolean; onAceitar: () => void; onRecusar: () => void }) {
  return (
    <Dialog titulo="Antes de gerar o resumo" aberto={aberto} onFechar={onRecusar}>
      <p style={{ margin: 0 }}>
        Para escrever o resumo, o texto dos registros do período é enviado a um serviço de inteligência artificial.
        Antes do envio, os nomes são trocados por papéis (como “escola 1”) e o apelido vira “a criança”. O que vocês
        escreveram nos pontos vai como está.
      </p>
      <p style={{ margin: 0 }}>O serviço não guarda os registros para treinar modelos. Você pode revogar esta permissão quando quiser, em Sua conta.</p>
      <p style={{ margin: 0 }}><Link to="/privacidade">Saiba mais sobre privacidade</Link></p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <Button onClick={onAceitar}>Aceitar e gerar</Button>
        <Button variante="secundario" onClick={onRecusar}>Agora não</Button>
      </div>
    </Dialog>
  );
}

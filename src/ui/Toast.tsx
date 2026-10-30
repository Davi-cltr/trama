import css from './ui.module.css';

/** Aviso curto, anunciado por leitores de tela. */
export function Toast({ mensagem }: { mensagem: string | null }) {
  return (
    <div role="status" aria-live="polite" className={mensagem ? css.toast : 'visualmente-oculto'}>
      {mensagem}
    </div>
  );
}

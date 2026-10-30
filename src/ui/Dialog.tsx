import { useEffect, useId, useRef, type ReactNode } from 'react';
import css from './ui.module.css';

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Diálogo modal: prende o foco, fecha com Esc e devolve o foco a quem abriu. */
export function Dialog({ titulo, aberto, onFechar, children }: { titulo: string; aberto: boolean; onFechar: () => void; children: ReactNode }) {
  const idTitulo = useId();
  const caixa = useRef<HTMLDivElement>(null);
  const fechar = useRef(onFechar);
  fechar.current = onFechar;

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const el = caixa.current;
    (el?.querySelector<HTMLElement>(FOCAVEIS) ?? el)?.focus();

    function tecla(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        fechar.current();
      } else if (e.key === 'Tab' && el) {
        const itens = [...el.querySelectorAll<HTMLElement>(FOCAVEIS)];
        if (itens.length === 0) return;
        const [primeiro, ultimo] = [itens[0], itens[itens.length - 1]];
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    }
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('keydown', tecla);
      anterior?.focus?.();
    };
  }, [aberto]);

  if (!aberto) return null;
  return (
    <div className={css.fundo} onClick={e => e.target === e.currentTarget && onFechar()}>
      <div ref={caixa} role="dialog" aria-modal="true" aria-labelledby={idTitulo} className={css.dialogo} tabIndex={-1}>
        <h2 id={idTitulo} style={{ fontSize: 22 }}>{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

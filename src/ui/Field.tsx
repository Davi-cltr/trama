import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import css from './ui.module.css';

interface Comum { rotulo: string; dica?: ReactNode; erro?: string | null }

export function Field({ rotulo, dica, erro, ...props }: Comum & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const idDica = dica ? `${id}-dica` : undefined;
  const idErro = erro ? `${id}-erro` : undefined;
  return (
    <div className={css.campo}>
      <label htmlFor={id} className={css.rotulo}>{rotulo}</label>
      <input
        id={id}
        className={css.entrada}
        aria-invalid={erro ? true : undefined}
        aria-describedby={[idDica, idErro].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {dica && <span id={idDica} className={css.dica}>{dica}</span>}
      {erro && <span id={idErro} className={css.erro}>{erro}</span>}
    </div>
  );
}

export function TextArea({ rotulo, dica, erro, ...props }: Comum & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  const idDica = dica ? `${id}-dica` : undefined;
  const idErro = erro ? `${id}-erro` : undefined;
  return (
    <div className={css.campo}>
      <label htmlFor={id} className={css.rotulo}>{rotulo}</label>
      <textarea
        id={id}
        className={css.entrada}
        aria-invalid={erro ? true : undefined}
        aria-describedby={[idDica, idErro].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {dica && <span id={idDica} className={css.dica}>{dica}</span>}
      {erro && <span id={idErro} className={css.erro}>{erro}</span>}
    </div>
  );
}

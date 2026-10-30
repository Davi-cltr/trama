import type { ButtonHTMLAttributes } from 'react';
import css from './ui.module.css';

type Variante = 'primario' | 'secundario' | 'perigo' | 'texto';

export function Button({
  variante = 'primario',
  largo = false,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; largo?: boolean }) {
  const classes = [css.botao, variante !== 'primario' && css[variante], largo && css.largo, className].filter(Boolean).join(' ');
  return <button type={type} className={classes} {...props} />;
}

export const classesDeBotao = css;

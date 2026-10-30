import type { Padrao } from '../../tapestry/patterns';
import { Button } from '../../ui/Button';
import css from './semana.module.css';

export function PadraoCard({ padrao, mostrando, onAlternar }: { padrao: Padrao; mostrando: boolean; onAlternar: () => void }) {
  return (
    <section className={css.cartao} aria-label="Padrão encontrado">
      <h2>{padrao.frase}</h2>
      <Button aria-pressed={mostrando} onClick={onAlternar} style={{ alignSelf: 'flex-start' }}>
        {mostrando ? 'Esconder o padrão' : 'Mostrar o padrão'}
      </Button>
      <p className={css.nota}>Leitura automática dos registros. Não substitui avaliação profissional.</p>
    </section>
  );
}

import { useMemo } from 'react';
import { Link } from 'react-router';
import { useCadernos } from '../../data/queries';
import { doApelido } from '../../domain/rules';
import { Marca } from '../auth/Marca';
import { Carregando } from '../auth/AuthGate';
import { atualizarConhecidos } from './conhecidos';
import { classesDeBotao } from '../../ui/Button';
import css from './caderno.module.css';

export function CadernosPage() {
  const cadernos = useCadernos();
  const perdidos = useMemo(() => (cadernos.data ? atualizarConhecidos(cadernos.data) : []), [cadernos.data]);

  if (cadernos.isLoading) return <Carregando />;

  return (
    <main className="pagina">
      <Marca />
      <h1 style={{ fontSize: 32 }}>Seus cadernos</h1>
      {perdidos.map(c => (
        <p key={c.apelido} className={css.aviso} role="status">Você não tem mais acesso ao caderno {doApelido(c)}.</p>
      ))}
      {cadernos.data && cadernos.data.length > 0 ? (
        <ul className={css.lista}>
          {cadernos.data.map(c => (
            <li key={c.id}>
              <Link to={`/c/${c.id}/semana`} className={css.cartao}>
                <strong>{c.apelido}</strong>
                <span aria-hidden="true">›</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>Você ainda não tem cadernos. Crie um para a criança de quem você cuida, ou abra o convite que recebeu.</p>
      )}
      <Link to="/novo" className={`${classesDeBotao.botao} ${classesDeBotao.largo}`}>Novo caderno</Link>
      <nav aria-label="Conta" className={css.rodape}>
        <Link to="/conta">Sua conta</Link>
        <Link to="/privacidade">Privacidade</Link>
      </nav>
    </main>
  );
}

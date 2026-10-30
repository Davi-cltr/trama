import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { usePerfil, useSessao } from '../../data/queries';
import { useCriarCaderno } from '../../data/mutations';
import { mensagemDeErro } from '../../data/convite';
import { contarCaracteres, LIMITES } from '../../domain/rules';
import type { Tratamento } from '../../domain/types';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Escolha } from '../../ui/Escolha';
import css from './caderno.module.css';

export function NovoCadernoPage() {
  const navegar = useNavigate();
  const { usuarioId } = useSessao();
  const perfil = usePerfil(usuarioId);
  const criar = useCriarCaderno();
  const [apelido, setApelido] = useState('');
  const [tratamento, setTratamento] = useState<Tratamento>('o');
  const [nascimento, setNascimento] = useState('');
  const [rotulo, setRotulo] = useState<string | null>(null);
  const [erros, setErros] = useState<{ apelido?: string; rotulo?: string; geral?: string }>({});

  const rotuloAtual = rotulo ?? (perfil.data ? `${perfil.data.nomeExibicao}, mãe` : '');
  const nome = apelido.trim() || 'Theo';

  async function criarCaderno(e: FormEvent) {
    e.preventDefault();
    const novos: typeof erros = {};
    if (!apelido.trim()) novos.apelido = 'Escreva o apelido.';
    else if (contarCaracteres(apelido.trim()) > LIMITES.apelido) novos.apelido = `Use até ${LIMITES.apelido} caracteres.`;
    if (!rotuloAtual.trim()) novos.rotulo = 'Escreva como você aparece.';
    else if (contarCaracteres(rotuloAtual.trim()) > LIMITES.rotulo) novos.rotulo = `Use até ${LIMITES.rotulo} caracteres.`;
    setErros(novos);
    if (Object.keys(novos).length > 0) return;
    try {
      const id = await criar.mutateAsync({
        apelido: apelido.trim(),
        tratamento,
        nascimento: nascimento ? `${nascimento}-01` : null,
        rotulo: rotuloAtual.trim(),
      });
      navegar(`/c/${id}/semana`, { replace: true });
    } catch (err) {
      setErros({ geral: mensagemDeErro(err) });
    }
  }

  return (
    <main className="pagina">
      <Link to="/">‹ Seus cadernos</Link>
      <h1 style={{ fontSize: 32 }}>Para quem é este caderno?</h1>
      <p style={{ margin: 0, color: 'var(--texto-2)' }}>Só o apelido. Nada de sobrenome, documento ou diagnóstico.</p>
      <form className={css.formulario} onSubmit={criarCaderno} noValidate>
        <Field rotulo="Apelido" value={apelido} onChange={e => setApelido(e.target.value)} erro={erros.apelido} maxLength={60} />
        <Escolha<Tratamento>
          legenda="Como falamos dele ou dela?"
          valor={tratamento}
          onMudar={setTratamento}
          opcoes={[
            { valor: 'o', rotulo: `o ${nome}` },
            { valor: 'a', rotulo: `a ${nome}` },
            { valor: '', rotulo: `só ${nome}` },
          ]}
        />
        <Field rotulo="Mês e ano de nascimento (opcional)" type="month" value={nascimento} onChange={e => setNascimento(e.target.value)} />
        <Field
          rotulo="Como você aparece na trama"
          dica="Você recebe a primeira linha, cor pau-brasil."
          value={rotuloAtual}
          onChange={e => setRotulo(e.target.value)}
          erro={erros.rotulo}
        />
        {erros.geral && <p role="alert" className="erro">{erros.geral}</p>}
        <Button type="submit" largo disabled={criar.isPending}>Criar caderno</Button>
      </form>
    </main>
  );
}

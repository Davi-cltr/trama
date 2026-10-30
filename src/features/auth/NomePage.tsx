import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useSessao } from '../../data/queries';
import { useSalvarPerfil } from '../../data/mutations';
import { mensagemDeErro } from '../../data/convite';
import { contarCaracteres, LIMITES } from '../../domain/rules';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Marca } from './Marca';
import { voltaSegura } from './volta';

export function validarNome(nome: string): string | null {
  const limpo = nome.trim();
  if (!limpo) return 'Escreva seu nome.';
  if (contarCaracteres(limpo) > LIMITES.nome) return `Use até ${LIMITES.nome} caracteres.`;
  return null;
}

export function NomePage() {
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const { usuarioId } = useSessao();
  const salvar = useSalvarPerfil();
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  async function continuar(e: FormEvent) {
    e.preventDefault();
    const problema = validarNome(nome);
    setErro(problema);
    if (problema || !usuarioId) return;
    try {
      await salvar.mutateAsync({ usuarioId, nomeExibicao: nome.trim() });
      navegar(voltaSegura(params.get('volta')), { replace: true });
    } catch (err) {
      setErro(mensagemDeErro(err));
    }
  }

  return (
    <main className="pagina">
      <Marca />
      <h1 style={{ fontSize: 32 }}>Como você quer ser chamada?</h1>
      <form onSubmit={continuar} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field
          rotulo="Seu nome"
          dica="É assim que as outras pessoas da trama vão te ver."
          autoComplete="given-name"
          value={nome}
          onChange={e => setNome(e.target.value)}
          erro={erro}
        />
        <Button type="submit" largo disabled={salvar.isPending}>Continuar</Button>
      </form>
    </main>
  );
}

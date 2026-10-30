import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { supabase } from '../../data/supabase';
import { mensagemDeErro } from '../../data/convite';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Marca } from './Marca';
import { prepararVolta, voltaSegura } from './volta';

export function EntrarPage() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const limpo = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo)) {
      setErro('Confira o e-mail.');
      return;
    }
    setErro(null);
    setEnviando(true);
    const destino = prepararVolta(voltaSegura(params.get('volta')));
    const { error } = await supabase.auth.signInWithOtp({
      email: limpo,
      options: { emailRedirectTo: `${window.location.origin}${destino}` },
    });
    setEnviando(false);
    if (error) setErro(mensagemDeErro(error));
    else setEnviadoPara(limpo);
  }

  return (
    <main className="pagina">
      <Marca />
      <h1 style={{ fontSize: 32 }}>Entre na Trama</h1>
      {enviadoPara ? (
        <p role="status">Enviamos um link para {enviadoPara}. Abra no celular para entrar.</p>
      ) : (
        <form onSubmit={enviar} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, color: 'var(--texto-2)' }}>Sem senha: enviamos um link de entrada para o seu e-mail.</p>
          <Field
            rotulo="Seu e-mail"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            erro={erro}
          />
          <Button type="submit" largo disabled={enviando}>Enviar link</Button>
        </form>
      )}
    </main>
  );
}

import { useState, type FormEvent } from 'react';
import { useCriarConvite } from '../../data/mutations';
import { linkWhatsApp, mensagemDeErro } from '../../data/convite';
import { contarCaracteres, LIMITES } from '../../domain/rules';
import type { Caderno } from '../../domain/types';
import { Button, classesDeBotao } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { Field } from '../../ui/Field';
import { Escolha } from '../../ui/Escolha';
import { OPCOES_PAPEL, type PapelConvidado } from './papeis';

export function ConvidarDialog({ caderno, aberto, onFechar }: { caderno: Caderno; aberto: boolean; onFechar: () => void }) {
  const criar = useCriarConvite();
  const [papel, setPapel] = useState<PapelConvidado>('cuidador');
  const [rotulo, setRotulo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  function fechar() {
    setRotulo('');
    setPapel('cuidador');
    setErro(null);
    setLink(null);
    setCopiado(false);
    onFechar();
  }

  async function criarConvite(e: FormEvent) {
    e.preventDefault();
    const limpo = rotulo.trim();
    if (!limpo) return setErro('Escreva como a pessoa aparece.');
    if (contarCaracteres(limpo) > LIMITES.rotulo) return setErro(`Use até ${LIMITES.rotulo} caracteres.`);
    setErro(null);
    try {
      const r = await criar.mutateAsync({ cadernoId: caderno.id, papel, rotulo: limpo });
      setLink(r.link);
    } catch (err) {
      setErro(mensagemDeErro(err));
    }
  }

  async function copiar() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
    } catch {
      setErro('Não foi possível copiar. Segure o link para copiar à mão.');
    }
  }

  return (
    <Dialog titulo="Convidar para a trama" aberto={aberto} onFechar={fechar}>
      {link ? (
        <>
          <p style={{ margin: 0 }}>
            Convite pronto para {rotulo.trim()}. Vale por {LIMITES.conviteDias} dias e só pode ser usado uma vez.
          </p>
          <p style={{ margin: 0, wordBreak: 'break-all', fontSize: 14, color: 'var(--texto-2)' }}>{link}</p>
          <div className="acoes" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a className={`${classesDeBotao.botao} ${classesDeBotao.largo}`} href={linkWhatsApp(link, rotulo.trim(), caderno)} target="_blank" rel="noreferrer">
              Enviar pelo WhatsApp
            </a>
            <Button variante="secundario" largo onClick={copiar}>Copiar link</Button>
            <p role="status" style={{ margin: 0 }}>{copiado ? 'Link copiado.' : ''}</p>
            {erro && <p className="erro" role="alert">{erro}</p>}
            <Button variante="texto" onClick={fechar}>Fechar</Button>
          </div>
        </>
      ) : (
        <form onSubmit={criarConvite} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Escolha legenda="Quem você está convidando?" opcoes={OPCOES_PAPEL} valor={papel} onMudar={setPapel} />
          <Field rotulo="Como a pessoa aparece" placeholder="Júlia, professora" value={rotulo} onChange={e => setRotulo(e.target.value)} erro={erro} />
          <Button type="submit" largo disabled={criar.isPending}>Criar convite</Button>
          <Button variante="texto" onClick={fechar}>Cancelar</Button>
        </form>
      )}
    </Dialog>
  );
}

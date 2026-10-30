import { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Caderno, Membro } from '../../domain/types';
import type { LayoutTrama } from '../../tapestry/layout';
import { TapestrySvg } from '../../tapestry/TapestrySvg';
import type { Periodo } from '../../tapestry/time';
import { compartilharOuBaixar, nomeDoArquivo, renderPoster, textosDoPoster } from '../../poster/renderPoster';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';

export function PosterDialog({
  aberto, onFechar, caderno, periodo, layout, membros, total,
}: { aberto: boolean; onFechar: () => void; caderno: Caderno; periodo: Periodo; layout: LayoutTrama; membros: Membro[]; total: number }) {
  const [esconderNomes, setEsconderNomes] = useState(false);
  const [esconderApelido, setEsconderApelido] = useState(false);
  const [estado, setEstado] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  async function gerar() {
    setGerando(true);
    setEstado('Gerando o pôster…');
    try {
      const svg = renderToStaticMarkup(<TapestrySvg layout={layout} variante="mes" ariaLabel="" />);
      const textos = textosDoPoster(caderno, periodo, membros, total, { esconderNomes, esconderApelido });
      const png = await renderPoster(svg, textos);
      const r = await compartilharOuBaixar(png, nomeDoArquivo(periodo));
      setEstado(r === 'baixado' ? 'Pôster baixado.' : 'Pôster pronto.');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') setEstado(null);
      else setEstado('Não foi possível gerar o pôster agora. Tente de novo.');
    } finally {
      setGerando(false);
    }
  }

  return (
    <Dialog titulo="Compartilhar pôster" aberto={aberto} onFechar={onFechar}>
      <p style={{ margin: 0 }}>O pôster nunca mostra o que foi escrito nos pontos. Só a trama, o mês e quem tece.</p>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
        <input type="checkbox" checked={esconderNomes} onChange={e => setEsconderNomes(e.target.checked)} style={{ width: 22, height: 22 }} />
        Esconder nomes
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
        <input type="checkbox" checked={esconderApelido} onChange={e => setEsconderApelido(e.target.checked)} style={{ width: 22, height: 22 }} />
        Esconder o apelido
      </label>
      <p role="status" style={{ margin: 0 }}>{estado}</p>
      <Button largo onClick={() => void gerar()} disabled={gerando}>Gerar pôster</Button>
      <Button variante="texto" onClick={onFechar}>Fechar</Button>
    </Dialog>
  );
}

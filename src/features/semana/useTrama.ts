import { useSearchParams } from 'react-router';
import { useCaderno, useMembros, usePontos, useSessao } from '../../data/queries';
import { deslocarPeriodo, periodoDaSemana, periodoDoMes, type Periodo } from '../../tapestry/time';

const PADRAO_DATA = /^\d{4}-\d{2}-\d{2}$/;

/** Período escolhido pela URL (?inicio=AAAA-MM-DD), normalizado para segunda-feira ou dia 1. */
export function usePeriodo(tipo: Periodo['tipo'], fuso: string) {
  const [params] = useSearchParams();
  const inicio = params.get('inicio');
  const ref = inicio && PADRAO_DATA.test(inicio) ? new Date(`${inicio}T12:00:00Z`) : new Date();
  const fazer = tipo === 'semana' ? periodoDaSemana : periodoDoMes;
  const periodo = fazer(ref, fuso);
  const atual = fazer(new Date(), fuso);
  return {
    periodo,
    ehAtual: periodo.inicio >= atual.inicio,
    anterior: deslocarPeriodo(periodo, -1).inicio,
    proximo: deslocarPeriodo(periodo, 1).inicio,
  };
}

export function useDadosDoCaderno(cadernoId: string) {
  const { usuarioId } = useSessao();
  const caderno = useCaderno(cadernoId);
  const membros = useMembros(cadernoId);
  return { usuarioId, caderno, membros };
}

export { usePontos };

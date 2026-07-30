import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cliente } from './cliente';

/** Corpo aceito pelo backend ao registrar/atualizar a venda de um empreendimento. */
export interface VendaRequisicao {
  dataVenda: string;
  valorVenda: number;
  comprador: string;
  comissaoCorretor?: number | null;
  custosVendaAdicionais?: number | null;
}

/** Resposta crua da venda registrada — só é devolvida pelo POST/PUT (não há um GET dedicado). */
export interface VendaResposta {
  id: number;
  empreendimentoId: number;
  dataVenda: string;
  valorVenda: number;
  comprador: string;
  comissaoCorretor: number;
  custosVendaAdicionais: number;
}

export interface RateioInvestidorResposta {
  investidorId: number;
  investidorNome: string;
  percentual: number;
  totalInvestido: number;
  lucroRateado: number;
}

/** Fechamento financeiro já calculado: lucro apurado e rateio por investidor. */
export interface FechamentoResposta {
  empreendimentoId: number;
  empreendimentoDescricao: string;
  dataVenda: string;
  comprador: string;
  valorVenda: number;
  totalGasto: number;
  comissaoCorretor: number;
  custosVendaAdicionais: number;
  lucro: number;
  rateio: RateioInvestidorResposta[];
}

function buscarFechamento(empreendimentoId: number) {
  return cliente
    .get<FechamentoResposta>(`/empreendimentos/${empreendimentoId}/venda/fechamento`)
    .then((resposta) => resposta.data);
}

function registrarVenda(empreendimentoId: number, dados: VendaRequisicao) {
  return cliente
    .post<VendaResposta>(`/empreendimentos/${empreendimentoId}/venda`, dados)
    .then((resposta) => resposta.data);
}

function atualizarVenda(empreendimentoId: number, dados: VendaRequisicao) {
  return cliente
    .put<VendaResposta>(`/empreendimentos/${empreendimentoId}/venda`, dados)
    .then((resposta) => resposta.data);
}

/**
 * Busca o fechamento financeiro do empreendimento. Enquanto a venda não é
 * registrada, o backend responde 404 — isso é esperado (não um erro de
 * verdade), por isso `retry: false`: os componentes devem tratar
 * `error?.response?.status === 404` como "ainda não há venda registrada".
 */
export function useFechamento(empreendimentoId: number) {
  return useQuery({
    queryKey: ['fechamento', empreendimentoId],
    queryFn: () => buscarFechamento(empreendimentoId),
    enabled: !!empreendimentoId,
    retry: false,
  });
}

export function useRegistrarVenda(empreendimentoId: number) {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: (dados: VendaRequisicao) => registrarVenda(empreendimentoId, dados),
    onSuccess: () => {
      filaConsulta.invalidateQueries({ queryKey: ['fechamento', empreendimentoId] });
    },
  });
}

export function useAtualizarVenda(empreendimentoId: number) {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: (dados: VendaRequisicao) => atualizarVenda(empreendimentoId, dados),
    onSuccess: () => {
      filaConsulta.invalidateQueries({ queryKey: ['fechamento', empreendimentoId] });
    },
  });
}

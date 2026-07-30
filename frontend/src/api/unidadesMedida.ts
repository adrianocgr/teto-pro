import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cliente } from './cliente';
import type { Pagina } from '@/tipos/pagina';

export interface UnidadeMedidaResposta {
  id: number;
  sigla: string;
  descricao: string;
}

export interface UnidadeMedidaRequisicao {
  sigla: string;
  descricao: string;
}

async function listarUnidadesMedida(): Promise<Pagina<UnidadeMedidaResposta>> {
  const resposta = await cliente.get<Pagina<UnidadeMedidaResposta>>('/unidades-medida', { params: { size: 200 } });
  return resposta.data;
}

async function criarUnidadeMedida(dados: UnidadeMedidaRequisicao): Promise<UnidadeMedidaResposta> {
  const resposta = await cliente.post<UnidadeMedidaResposta>('/unidades-medida', dados);
  return resposta.data;
}

export function useListaUnidadesMedida() {
  return useQuery({ queryKey: ['unidades-medida'], queryFn: listarUnidadesMedida });
}

export function useCriarUnidadeMedida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: criarUnidadeMedida,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['unidades-medida'] }),
  });
}

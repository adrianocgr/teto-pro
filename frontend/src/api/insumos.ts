import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cliente } from './cliente';
import type { Pagina } from '@/tipos/pagina';

export interface InsumoResposta {
  id: number;
  codigo: string;
  descricao: string;
  unidadeMedidaId: number;
  unidadeMedidaSigla: string;
  classificacaoId: number;
  classificacaoDescricao: string;
  precoReferencia: number;
}

export interface InsumoRequisicao {
  codigo: string;
  descricao: string;
  unidadeMedidaId: number;
  classificacaoId: number;
  precoReferencia: number;
}

export async function listarInsumos(): Promise<Pagina<InsumoResposta>> {
  const resposta = await cliente.get<Pagina<InsumoResposta>>('/insumos', { params: { size: 200 } });
  return resposta.data;
}

async function criarInsumo(dados: InsumoRequisicao): Promise<InsumoResposta> {
  const resposta = await cliente.post<InsumoResposta>('/insumos', dados);
  return resposta.data;
}

async function atualizarInsumo(id: number, dados: InsumoRequisicao): Promise<InsumoResposta> {
  const resposta = await cliente.put<InsumoResposta>(`/insumos/${id}`, dados);
  return resposta.data;
}

export function useListaInsumos() {
  return useQuery({ queryKey: ['insumos'], queryFn: listarInsumos });
}

export function useCriarInsumo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: criarInsumo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insumos'] }),
  });
}

export function useAtualizarInsumo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: InsumoRequisicao }) => atualizarInsumo(id, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insumos'] }),
  });
}

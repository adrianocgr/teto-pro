import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cliente } from './cliente';
import type { Pagina } from '@/tipos/pagina';

export type StatusAtivoInativo = 'ATIVO' | 'INATIVO';

export interface ClassificacaoResposta {
  id: number;
  descricao: string;
  status: StatusAtivoInativo;
}

export interface ClassificacaoRequisicao {
  descricao: string;
  status: StatusAtivoInativo;
}

async function listarClassificacoes(): Promise<Pagina<ClassificacaoResposta>> {
  const resposta = await cliente.get<Pagina<ClassificacaoResposta>>('/classificacoes', { params: { size: 200 } });
  return resposta.data;
}

async function criarClassificacao(dados: ClassificacaoRequisicao): Promise<ClassificacaoResposta> {
  const resposta = await cliente.post<ClassificacaoResposta>('/classificacoes', dados);
  return resposta.data;
}

export function useListaClassificacoes() {
  return useQuery({ queryKey: ['classificacoes'], queryFn: listarClassificacoes });
}

export function useCriarClassificacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: criarClassificacao,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classificacoes'] }),
  });
}

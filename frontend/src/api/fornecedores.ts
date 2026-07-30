import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cliente } from './cliente';
import type { Pagina } from '@/tipos/pagina';

export type StatusAtivoInativo = 'ATIVO' | 'INATIVO';

export interface RepresentanteResposta {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
}

export interface FornecedorResposta {
  id: number;
  razaoSocial: string;
  cnpjCpf: string;
  email: string | null;
  telefone: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cep: string | null;
  cidadeId: number | null;
  cidadeNome: string | null;
  estadoSigla: string | null;
  status: StatusAtivoInativo;
  representantes: RepresentanteResposta[];
}

export interface FornecedorRequisicao {
  razaoSocial: string;
  cnpjCpf: string;
  email: string | null;
  telefone: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cep: string | null;
  cidadeId: number | null;
  status: StatusAtivoInativo;
  representantes: [];
}

export interface RepresentanteRequisicao {
  nome: string;
  email: string | null;
  telefone: string | null;
}

export async function listarFornecedores(busca?: string): Promise<Pagina<FornecedorResposta>> {
  const resposta = await cliente.get<Pagina<FornecedorResposta>>('/fornecedores', {
    params: { busca: busca || undefined, size: 200 },
  });
  return resposta.data;
}

async function criarFornecedor(dados: FornecedorRequisicao): Promise<FornecedorResposta> {
  const resposta = await cliente.post<FornecedorResposta>('/fornecedores', dados);
  return resposta.data;
}

async function adicionarRepresentante(fornecedorId: number, dados: RepresentanteRequisicao): Promise<FornecedorResposta> {
  const resposta = await cliente.post<FornecedorResposta>(`/fornecedores/${fornecedorId}/representantes`, dados);
  return resposta.data;
}

async function removerRepresentante(fornecedorId: number, representanteId: number): Promise<FornecedorResposta> {
  const resposta = await cliente.delete<FornecedorResposta>(
    `/fornecedores/${fornecedorId}/representantes/${representanteId}`,
  );
  return resposta.data;
}

export function useListaFornecedores(busca?: string) {
  return useQuery({ queryKey: ['fornecedores', busca ?? ''], queryFn: () => listarFornecedores(busca) });
}

export function useCriarFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: criarFornecedor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fornecedores'] }),
  });
}

export function useAdicionarRepresentante() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fornecedorId, dados }: { fornecedorId: number; dados: RepresentanteRequisicao }) =>
      adicionarRepresentante(fornecedorId, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fornecedores'] }),
  });
}

export function useRemoverRepresentante() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fornecedorId, representanteId }: { fornecedorId: number; representanteId: number }) =>
      removerRepresentante(fornecedorId, representanteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fornecedores'] }),
  });
}

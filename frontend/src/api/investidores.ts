import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cliente } from './cliente';
import type { Pagina } from '@/tipos/pagina';

export type TipoPessoa = 'FISICA' | 'JURIDICA';

export interface InvestidorResposta {
  id: number;
  nome: string;
  cpfCnpj: string;
  tipoPessoa: TipoPessoa;
  email: string | null;
  telefone: string | null;
  observacoes: string | null;
}

export interface InvestidorRequisicao {
  nome: string;
  cpfCnpj: string;
  tipoPessoa: TipoPessoa;
  email: string | null;
  telefone: string | null;
  observacoes: string | null;
}

export async function listarInvestidores(busca?: string): Promise<Pagina<InvestidorResposta>> {
  const resposta = await cliente.get<Pagina<InvestidorResposta>>('/investidores', {
    params: { busca: busca || undefined, size: 200 },
  });
  return resposta.data;
}

async function buscarInvestidor(id: number): Promise<InvestidorResposta> {
  const resposta = await cliente.get<InvestidorResposta>(`/investidores/${id}`);
  return resposta.data;
}

async function criarInvestidor(dados: InvestidorRequisicao): Promise<InvestidorResposta> {
  const resposta = await cliente.post<InvestidorResposta>('/investidores', dados);
  return resposta.data;
}

export function useListaInvestidores(busca?: string) {
  return useQuery({ queryKey: ['investidores', busca ?? ''], queryFn: () => listarInvestidores(busca) });
}

export function useInvestidor(id: number | null | undefined) {
  return useQuery({
    queryKey: ['investidores', id],
    queryFn: () => buscarInvestidor(id as number),
    enabled: id !== null && id !== undefined,
  });
}

export function useCriarInvestidor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: criarInvestidor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investidores'] }),
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cliente } from './cliente';
import type { Pagina } from '@/tipos/pagina';

export type StatusAtivoInativo = 'ATIVO' | 'INATIVO';

export interface CategoriaResposta {
  id: number;
  codigo: string;
  descricao: string;
  categoriaPaiId: number | null;
  categoriaPaiDescricao: string | null;
  status: StatusAtivoInativo;
}

/** `codigo` não entra aqui — é gerado automaticamente pelo backend (ex.: "01", "01.01"). */
export interface CategoriaRequisicao {
  descricao: string;
  categoriaPaiId: number | null;
  status: StatusAtivoInativo;
}

async function listarCategorias(): Promise<Pagina<CategoriaResposta>> {
  const resposta = await cliente.get<Pagina<CategoriaResposta>>('/categorias', { params: { size: 200 } });
  return resposta.data;
}

async function criarCategoria(dados: CategoriaRequisicao): Promise<CategoriaResposta> {
  const resposta = await cliente.post<CategoriaResposta>('/categorias', dados);
  return resposta.data;
}

export function useListaCategorias() {
  return useQuery({ queryKey: ['categorias'], queryFn: listarCategorias });
}

export function useCriarCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: criarCategoria,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] }),
  });
}

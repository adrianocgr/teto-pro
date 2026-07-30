import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cliente } from './cliente';
import type { Pagina } from '@/tipos/pagina';

export interface ItemResposta {
  id: number;
  insumoId: number;
  insumoDescricao: string;
  unidadeSigla: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  observacao: string | null;
}

export interface ItemRequisicao {
  insumoId: number;
  quantidade: number;
  valorUnitario: number;
  observacao?: string | null;
}

export interface PagadorResposta {
  id: number;
  investidorId: number;
  investidorNome: string;
  valor: number;
}

export interface PagadorRequisicao {
  investidorId: number;
  valor: number;
}

export interface DocumentoResposta {
  id: number;
  filename: string;
  contentType: string;
  length: number;
  uploadedAt: string;
}

export interface DespesaResposta {
  id: number;
  empreendimentoId: number;
  empreendimentoDescricao: string;
  categoriaId: number;
  categoriaDescricao: string;
  fornecedorId: number | null;
  fornecedorNome: string | null;
  descricao: string;
  observacao: string | null;
  valorTotal: number;
  dataCadastro: string;
  dataAlteracao: string | null;
  usuarioCadastroNome: string;
  usuarioAlteracaoNome: string | null;
  itens: ItemResposta[];
  pagadores: PagadorResposta[];
  documentos: DocumentoResposta[];
  recorrenciaId: number | null;
  competencia: string | null;
}

/**
 * Quando `itens` vier vazio/nulo, `valorTotal` é considerado (ex: uma
 * escritura, sem detalhamento). Quando há itens, o backend recalcula o valor
 * total a partir deles e ignora este campo — por isso a UI trata o total
 * como somente leitura sempre que existir ao menos um item.
 */
export interface DespesaRequisicao {
  empreendimentoId: number;
  categoriaId: number;
  fornecedorId: number | null;
  descricao: string;
  observacao: string | null;
  valorTotal: number | null;
  itens: ItemRequisicao[];
  pagadores: PagadorRequisicao[];
  recorrenciaId?: number | null;
  competencia?: string | null;
}

export interface FiltrosDespesas {
  categoriaId?: number;
  investidorId?: number;
  busca?: string;
}

async function listarDespesas(empreendimentoId: number, busca?: string): Promise<Pagina<DespesaResposta>> {
  const resposta = await cliente.get<Pagina<DespesaResposta>>('/despesas', {
    params: { empreendimentoId, busca: busca || undefined, size: 200 },
  });
  return resposta.data;
}

async function buscarDespesa(id: number): Promise<DespesaResposta> {
  const resposta = await cliente.get<DespesaResposta>(`/despesas/${id}`);
  return resposta.data;
}

async function criarDespesa(dados: DespesaRequisicao): Promise<DespesaResposta> {
  const resposta = await cliente.post<DespesaResposta>('/despesas', dados);
  return resposta.data;
}

async function atualizarDespesa(id: number, dados: DespesaRequisicao): Promise<DespesaResposta> {
  const resposta = await cliente.put<DespesaResposta>(`/despesas/${id}`, dados);
  return resposta.data;
}

async function excluirDespesa(id: number): Promise<void> {
  await cliente.delete(`/despesas/${id}`);
}

async function uploadDocumentos(despesaId: number, arquivos: File[]): Promise<DocumentoResposta[]> {
  const formData = new FormData();
  arquivos.forEach((arquivo) => formData.append('arquivos', arquivo));
  const resposta = await cliente.post<DocumentoResposta[]>(`/despesas/${despesaId}/documentos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return resposta.data;
}

async function removerDocumento(despesaId: number, documentoId: number): Promise<void> {
  await cliente.delete(`/despesas/${despesaId}/documentos/${documentoId}`);
}

/**
 * O endpoint de download exige o token Bearer no header (não aceita cookie de
 * sessão), então um `<a href>` simples não funciona. Em vez disso, buscamos o
 * binário via axios (que já injeta o token) como blob, criamos uma URL de
 * objeto temporária e disparamos o download programaticamente.
 */
export async function baixarDocumento(despesaId: number, documentoId: number, nomeArquivo: string): Promise<void> {
  const resposta = await cliente.get(`/despesas/${despesaId}/documentos/${documentoId}/download`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(resposta.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function useListaDespesas(empreendimentoId: number | undefined, filtros?: FiltrosDespesas) {
  const busca = filtros?.busca ?? '';
  return useQuery({
    queryKey: ['despesas', empreendimentoId, busca],
    queryFn: () => listarDespesas(empreendimentoId as number, busca),
    enabled: !!empreendimentoId,
  });
}

export function useDespesa(id: number | undefined) {
  return useQuery({
    queryKey: ['despesa', id],
    queryFn: () => buscarDespesa(id as number),
    enabled: !!id,
  });
}

export function useCriarDespesa() {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: (dados: DespesaRequisicao) => criarDespesa(dados),
    onSuccess: (despesaCriada) => {
      filaConsulta.invalidateQueries({ queryKey: ['despesas', despesaCriada.empreendimentoId] });
      filaConsulta.invalidateQueries({ queryKey: ['despesa', despesaCriada.id] });
    },
  });
}

export function useAtualizarDespesa(id: number | undefined) {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: (dados: DespesaRequisicao) => atualizarDespesa(id as number, dados),
    onSuccess: (despesaAtualizada) => {
      filaConsulta.invalidateQueries({ queryKey: ['despesas', despesaAtualizada.empreendimentoId] });
      filaConsulta.invalidateQueries({ queryKey: ['despesa', id] });
    },
  });
}

export function useExcluirDespesa() {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; empreendimentoId: number }) => excluirDespesa(id),
    onSuccess: (_dado, variaveis) => {
      filaConsulta.invalidateQueries({ queryKey: ['despesas', variaveis.empreendimentoId] });
      filaConsulta.invalidateQueries({ queryKey: ['despesa', variaveis.id] });
    },
  });
}

export function useUploadDocumentos(despesaId: number | undefined) {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: (arquivos: File[]) => uploadDocumentos(despesaId as number, arquivos),
    onSuccess: () => {
      filaConsulta.invalidateQueries({ queryKey: ['despesa', despesaId] });
      filaConsulta.invalidateQueries({ queryKey: ['despesas'] });
    },
  });
}

export function useRemoverDocumento(despesaId: number | undefined) {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: (documentoId: number) => removerDocumento(despesaId as number, documentoId),
    onSuccess: () => {
      filaConsulta.invalidateQueries({ queryKey: ['despesa', despesaId] });
      filaConsulta.invalidateQueries({ queryKey: ['despesas'] });
    },
  });
}

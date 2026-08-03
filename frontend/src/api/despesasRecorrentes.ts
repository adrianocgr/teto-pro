import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cliente } from './cliente';

export type StatusAtivoInativo = 'ATIVO' | 'INATIVO';

export interface PagadorRecorrenteResposta {
  investidorId: number;
  investidorNome: string;
  percentual: number;
}

export interface PagadorRecorrenteRequisicao {
  investidorId: number;
  percentual: number;
}

export interface DespesaRecorrenteResposta {
  id: number;
  empreendimentoId: number;
  categoriaId: number;
  categoriaDescricao: string;
  fornecedorId: number | null;
  fornecedorNome: string | null;
  descricao: string;
  observacao: string | null;
  valorPadrao: number | null;
  diaVencimento: number | null;
  status: StatusAtivoInativo;
  lancamentoAutomatico: boolean;
  pagadores: PagadorRecorrenteResposta[];
  ultimaCompetencia: string | null;
  ultimoValor: number | null;
}

export interface DespesaRecorrenteRequisicao {
  categoriaId: number;
  fornecedorId: number | null;
  descricao: string;
  observacao: string | null;
  valorPadrao: number | null;
  diaVencimento: number | null;
  lancamentoAutomatico: boolean;
  pagadores: PagadorRecorrenteRequisicao[];
}

function chave(empreendimentoId: number) {
  return ['despesas-recorrentes', empreendimentoId];
}

async function listar(empreendimentoId: number): Promise<DespesaRecorrenteResposta[]> {
  const resposta = await cliente.get<DespesaRecorrenteResposta[]>(
    `/empreendimentos/${empreendimentoId}/despesas-recorrentes`,
  );
  return resposta.data;
}

async function criar(empreendimentoId: number, dados: DespesaRecorrenteRequisicao): Promise<DespesaRecorrenteResposta> {
  const resposta = await cliente.post<DespesaRecorrenteResposta>(
    `/empreendimentos/${empreendimentoId}/despesas-recorrentes`,
    dados,
  );
  return resposta.data;
}

async function atualizar(
  empreendimentoId: number,
  id: number,
  dados: DespesaRecorrenteRequisicao,
): Promise<DespesaRecorrenteResposta> {
  const resposta = await cliente.put<DespesaRecorrenteResposta>(
    `/empreendimentos/${empreendimentoId}/despesas-recorrentes/${id}`,
    dados,
  );
  return resposta.data;
}

async function alternarStatus(empreendimentoId: number, id: number, ativar: boolean): Promise<DespesaRecorrenteResposta> {
  const acao = ativar ? 'reativar' : 'inativar';
  const resposta = await cliente.patch<DespesaRecorrenteResposta>(
    `/empreendimentos/${empreendimentoId}/despesas-recorrentes/${id}/${acao}`,
  );
  return resposta.data;
}

async function excluir(empreendimentoId: number, id: number): Promise<void> {
  await cliente.delete(`/empreendimentos/${empreendimentoId}/despesas-recorrentes/${id}`);
}

export function useListaDespesasRecorrentes(empreendimentoId: number | undefined) {
  return useQuery({
    queryKey: chave(empreendimentoId as number),
    queryFn: () => listar(empreendimentoId as number),
    enabled: !!empreendimentoId,
  });
}

export function useCriarDespesaRecorrente(empreendimentoId: number) {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: (dados: DespesaRecorrenteRequisicao) => criar(empreendimentoId, dados),
    onSuccess: () => filaConsulta.invalidateQueries({ queryKey: chave(empreendimentoId) }),
  });
}

export function useAtualizarDespesaRecorrente(empreendimentoId: number) {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: DespesaRecorrenteRequisicao }) =>
      atualizar(empreendimentoId, id, dados),
    onSuccess: () => filaConsulta.invalidateQueries({ queryKey: chave(empreendimentoId) }),
  });
}

export function useAlternarStatusDespesaRecorrente(empreendimentoId: number) {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ativar }: { id: number; ativar: boolean }) => alternarStatus(empreendimentoId, id, ativar),
    onSuccess: () => filaConsulta.invalidateQueries({ queryKey: chave(empreendimentoId) }),
  });
}

export function useExcluirDespesaRecorrente(empreendimentoId: number) {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => excluir(empreendimentoId, id),
    onSuccess: () => filaConsulta.invalidateQueries({ queryKey: chave(empreendimentoId) }),
  });
}

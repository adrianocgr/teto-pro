import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cliente } from './cliente';
import type { Pagina } from '@/tipos/pagina';

export interface Participacao {
  id: number;
  investidorId: number;
  investidorNome: string;
  percentual: number | null;
  dataEntrada: string | null;
}

export interface Empreendimento {
  id: number;
  descricao: string;
  inscricaoMunicipal: string | null;
  matricula: string | null;
  endereco: string | null;
  numero: string | null;
  quadra: string | null;
  lote: string | null;
  complemento: string | null;
  participacoes: Participacao[];
  somaPercentuais: number;
}

export interface ParticipacaoRequisicao {
  investidorId: number;
  percentual: number | null;
  dataEntrada?: string | null;
}

export interface EmpreendimentoRequisicao {
  descricao: string;
  inscricaoMunicipal?: string | null;
  matricula?: string | null;
  endereco?: string | null;
  numero?: string | null;
  quadra?: string | null;
  lote?: string | null;
  complemento?: string | null;
  participacoesIniciais?: ParticipacaoRequisicao[];
}

function listar(busca?: string) {
  return cliente
    .get<Pagina<Empreendimento>>('/empreendimentos', { params: { busca: busca || undefined, size: 100 } })
    .then((resposta) => resposta.data);
}

function buscarPorId(id: number) {
  return cliente.get<Empreendimento>(`/empreendimentos/${id}`).then((resposta) => resposta.data);
}

function criar(dados: EmpreendimentoRequisicao) {
  return cliente.post<Empreendimento>('/empreendimentos', dados).then((resposta) => resposta.data);
}

function atualizar(id: number, dados: EmpreendimentoRequisicao) {
  return cliente.put<Empreendimento>(`/empreendimentos/${id}`, dados).then((resposta) => resposta.data);
}

function listarParticipacoes(empreendimentoId: number) {
  return cliente
    .get<Participacao[]>(`/empreendimentos/${empreendimentoId}/participacoes`)
    .then((resposta) => resposta.data);
}

function adicionarParticipacao(empreendimentoId: number, dados: ParticipacaoRequisicao) {
  return cliente
    .post<Participacao>(`/empreendimentos/${empreendimentoId}/participacoes`, dados)
    .then((resposta) => resposta.data);
}

function atualizarParticipacao(empreendimentoId: number, participacaoId: number, dados: ParticipacaoRequisicao) {
  return cliente
    .put<Participacao>(`/empreendimentos/${empreendimentoId}/participacoes/${participacaoId}`, dados)
    .then((resposta) => resposta.data);
}

function removerParticipacao(empreendimentoId: number, participacaoId: number) {
  return cliente
    .delete<void>(`/empreendimentos/${empreendimentoId}/participacoes/${participacaoId}`)
    .then(() => undefined);
}

export function useListaEmpreendimentos(busca?: string) {
  return useQuery({
    queryKey: ['empreendimentos', busca ?? ''],
    queryFn: () => listar(busca),
  });
}

export function useEmpreendimento(id: number | undefined) {
  return useQuery({
    queryKey: ['empreendimento', id],
    queryFn: () => buscarPorId(id as number),
    enabled: !!id,
  });
}

export function useCriarEmpreendimento() {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: (dados: EmpreendimentoRequisicao) => criar(dados),
    onSuccess: () => {
      filaConsulta.invalidateQueries({ queryKey: ['empreendimentos'] });
    },
  });
}

export function useAtualizarEmpreendimento(id: number | undefined) {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: (dados: EmpreendimentoRequisicao) => atualizar(id as number, dados),
    onSuccess: () => {
      filaConsulta.invalidateQueries({ queryKey: ['empreendimentos'] });
      filaConsulta.invalidateQueries({ queryKey: ['empreendimento', id] });
    },
  });
}

export function useParticipacoes(empreendimentoId: number | undefined) {
  return useQuery({
    queryKey: ['participacoes', empreendimentoId],
    queryFn: () => listarParticipacoes(empreendimentoId as number),
    enabled: !!empreendimentoId,
  });
}

export function useAdicionarParticipacao(empreendimentoId: number | undefined) {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: (dados: ParticipacaoRequisicao) => adicionarParticipacao(empreendimentoId as number, dados),
    onSuccess: () => {
      filaConsulta.invalidateQueries({ queryKey: ['participacoes', empreendimentoId] });
      filaConsulta.invalidateQueries({ queryKey: ['empreendimento', empreendimentoId] });
    },
  });
}

export function useAtualizarParticipacao(empreendimentoId: number | undefined) {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: ({ participacaoId, dados }: { participacaoId: number; dados: ParticipacaoRequisicao }) =>
      atualizarParticipacao(empreendimentoId as number, participacaoId, dados),
    onSuccess: () => {
      filaConsulta.invalidateQueries({ queryKey: ['participacoes', empreendimentoId] });
      filaConsulta.invalidateQueries({ queryKey: ['empreendimento', empreendimentoId] });
    },
  });
}

export function useRemoverParticipacao(empreendimentoId: number | undefined) {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: (participacaoId: number) => removerParticipacao(empreendimentoId as number, participacaoId),
    onSuccess: () => {
      filaConsulta.invalidateQueries({ queryKey: ['participacoes', empreendimentoId] });
      filaConsulta.invalidateQueries({ queryKey: ['empreendimento', empreendimentoId] });
    },
  });
}

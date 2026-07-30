import { useQuery } from '@tanstack/react-query';
import { cliente } from './cliente';
import type { Pagina } from '@/tipos/pagina';

/** "de/para" de um campo alterado numa operação de atualização. Vazio para criação/exclusão. */
export interface CampoAlteradoResposta {
  campo: string;
  valorAnterior: string | null;
  valorNovo: string | null;
}

export type OperacaoAuditoria = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditoriaResposta {
  id: string;
  entidade: string;
  entidadeId: number;
  entidadeRef: string;
  empreendimentoId: number | null;
  empreendimentoDescricao: string | null;
  operacao: OperacaoAuditoria;
  usuarioEmail: string;
  camposAlterados: CampoAlteradoResposta[];
  momento: string;
}

export interface FiltrosAuditoria {
  entidade?: string;
  entidadeId?: number;
  page?: number;
  size?: number;
}

function listarAuditoria(filtros: FiltrosAuditoria) {
  return cliente
    .get<Pagina<AuditoriaResposta>>('/auditoria', {
      params: {
        entidade: filtros.entidade || undefined,
        entidadeId: filtros.entidadeId,
        page: filtros.page ?? 0,
        size: filtros.size ?? 20,
      },
    })
    .then((resposta) => resposta.data);
}

export function useAuditoria(filtros: FiltrosAuditoria) {
  return useQuery({
    queryKey: ['auditoria', filtros],
    queryFn: () => listarAuditoria(filtros),
  });
}

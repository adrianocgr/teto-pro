import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cliente } from './cliente';

export interface EstadoResposta {
  id: number;
  nome: string;
  sigla: string;
}

export interface CidadeResposta {
  id: number;
  nome: string;
  estadoId: number;
  estadoSigla: string;
}

export interface ImportacaoMunicipiosResposta {
  estadoId: number;
  estadoNome: string;
  estadoSigla: string;
  totalMunicipiosNoIbge: number;
  totalImportados: number;
  totalJaExistentes: number;
}

async function listarEstados(): Promise<EstadoResposta[]> {
  const resposta = await cliente.get<EstadoResposta[]>('/estados');
  return resposta.data;
}

async function listarCidades(): Promise<CidadeResposta[]> {
  const resposta = await cliente.get<CidadeResposta[]>('/cidades');
  return resposta.data;
}

async function importarMunicipios(siglaUf: string): Promise<ImportacaoMunicipiosResposta> {
  const resposta = await cliente.post<ImportacaoMunicipiosResposta>('/administracao/localidades/importar-municipios', {
    siglaUf,
  });
  return resposta.data;
}

export function useListaEstados() {
  return useQuery({ queryKey: ['estados'], queryFn: listarEstados });
}

export function useListaCidades() {
  return useQuery({ queryKey: ['cidades'], queryFn: listarCidades });
}

export function useImportarMunicipios() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importarMunicipios,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estados'] });
      queryClient.invalidateQueries({ queryKey: ['cidades'] });
    },
  });
}

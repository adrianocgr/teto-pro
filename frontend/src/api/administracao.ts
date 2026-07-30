import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cliente } from './cliente';
import type { Papel } from '@/tipos/usuario';

export interface EmpresaResposta {
  id: string;
  nome: string;
  status: 'ATIVO' | 'INATIVO';
}
export interface EmpresaRequisicao {
  nome: string;
}

export interface EmpresaVinculadaResposta {
  tenantId: string;
  tenantNome: string;
  papel: Papel;
  status: 'ATIVO' | 'INATIVO';
  investidorId: number | null;
  investidorNome: string | null;
  vinculadoDesde: string;
}
export interface UsuarioAdminResposta {
  id: number;
  nome: string;
  username: string;
  email: string;
  status: 'ATIVO' | 'INATIVO';
  empresas: EmpresaVinculadaResposta[];
  createdAt: string;
}
export interface UsuarioAdminRequisicao {
  tenantId: string;
  nome: string;
  username: string;
  email: string;
  papel: Papel;
}
export interface UsuarioAdminAtualizarRequisicao {
  nome: string;
  username: string;
  email: string;
}
export interface VincularEmpresaRequisicao {
  tenantId: string;
  papel: Papel;
}

// ---------- Empresas ----------

async function listarEmpresas(): Promise<EmpresaResposta[]> {
  return cliente.get<EmpresaResposta[]>('/administracao/empresas').then((r) => r.data);
}
async function criarEmpresa(dados: EmpresaRequisicao): Promise<EmpresaResposta> {
  return cliente.post<EmpresaResposta>('/administracao/empresas', dados).then((r) => r.data);
}
async function atualizarEmpresa(id: string, dados: EmpresaRequisicao): Promise<EmpresaResposta> {
  return cliente.put<EmpresaResposta>(`/administracao/empresas/${id}`, dados).then((r) => r.data);
}
async function inativarEmpresa(id: string): Promise<EmpresaResposta> {
  return cliente.patch<EmpresaResposta>(`/administracao/empresas/${id}/inativar`).then((r) => r.data);
}
async function reativarEmpresa(id: string): Promise<EmpresaResposta> {
  return cliente.patch<EmpresaResposta>(`/administracao/empresas/${id}/reativar`).then((r) => r.data);
}

export function useListaEmpresas() {
  return useQuery({ queryKey: ['administracao', 'empresas'], queryFn: listarEmpresas });
}
export function useCriarEmpresa() {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: criarEmpresa,
    onSuccess: () => filaConsulta.invalidateQueries({ queryKey: ['administracao', 'empresas'] }),
  });
}
export function useAtualizarEmpresa() {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: EmpresaRequisicao }) => atualizarEmpresa(id, dados),
    onSuccess: () => filaConsulta.invalidateQueries({ queryKey: ['administracao', 'empresas'] }),
  });
}
export function useAlternarStatusEmpresa() {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ativar }: { id: string; ativar: boolean }) =>
      ativar ? reativarEmpresa(id) : inativarEmpresa(id),
    onSuccess: () => filaConsulta.invalidateQueries({ queryKey: ['administracao', 'empresas'] }),
  });
}

// ---------- Usuários ----------

async function listarUsuariosAdmin(tenantId?: string): Promise<UsuarioAdminResposta[]> {
  return cliente
    .get<UsuarioAdminResposta[]>('/administracao/usuarios', { params: tenantId ? { tenantId } : undefined })
    .then((r) => r.data);
}
async function criarUsuarioAdmin(dados: UsuarioAdminRequisicao): Promise<UsuarioAdminResposta> {
  return cliente.post<UsuarioAdminResposta>('/administracao/usuarios', dados).then((r) => r.data);
}
async function atualizarUsuarioAdmin(id: number, dados: UsuarioAdminAtualizarRequisicao): Promise<UsuarioAdminResposta> {
  return cliente.put<UsuarioAdminResposta>(`/administracao/usuarios/${id}`, dados).then((r) => r.data);
}
async function excluirUsuarioAdmin(id: number): Promise<void> {
  await cliente.delete(`/administracao/usuarios/${id}`);
}
async function adicionarVinculo(id: number, dados: VincularEmpresaRequisicao): Promise<UsuarioAdminResposta> {
  return cliente.post<UsuarioAdminResposta>(`/administracao/usuarios/${id}/empresas`, dados).then((r) => r.data);
}
async function atualizarVinculo(id: number, tenantId: string, papel: Papel): Promise<UsuarioAdminResposta> {
  return cliente
    .put<UsuarioAdminResposta>(`/administracao/usuarios/${id}/empresas/${tenantId}`, { papel })
    .then((r) => r.data);
}
async function removerVinculo(id: number, tenantId: string): Promise<UsuarioAdminResposta> {
  return cliente.delete<UsuarioAdminResposta>(`/administracao/usuarios/${id}/empresas/${tenantId}`).then((r) => r.data);
}

export function useListaUsuariosAdmin(tenantId?: string) {
  return useQuery({
    queryKey: ['administracao', 'usuarios', tenantId ?? 'todas'],
    queryFn: () => listarUsuariosAdmin(tenantId),
  });
}
export function useCriarUsuarioAdmin() {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: criarUsuarioAdmin,
    onSuccess: () => filaConsulta.invalidateQueries({ queryKey: ['administracao', 'usuarios'] }),
  });
}
export function useAtualizarUsuarioAdmin() {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: UsuarioAdminAtualizarRequisicao }) =>
      atualizarUsuarioAdmin(id, dados),
    onSuccess: () => filaConsulta.invalidateQueries({ queryKey: ['administracao', 'usuarios'] }),
  });
}
export function useExcluirUsuarioAdmin() {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: excluirUsuarioAdmin,
    onSuccess: () => filaConsulta.invalidateQueries({ queryKey: ['administracao', 'usuarios'] }),
  });
}
export function useAdicionarVinculo() {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: VincularEmpresaRequisicao }) => adicionarVinculo(id, dados),
    onSuccess: () => filaConsulta.invalidateQueries({ queryKey: ['administracao', 'usuarios'] }),
  });
}
export function useAtualizarVinculo() {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tenantId, papel }: { id: number; tenantId: string; papel: Papel }) =>
      atualizarVinculo(id, tenantId, papel),
    onSuccess: () => filaConsulta.invalidateQueries({ queryKey: ['administracao', 'usuarios'] }),
  });
}
export function useRemoverVinculo() {
  const filaConsulta = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tenantId }: { id: number; tenantId: string }) => removerVinculo(id, tenantId),
    onSuccess: () => filaConsulta.invalidateQueries({ queryKey: ['administracao', 'usuarios'] }),
  });
}

export type Papel = 'ADMIN' | 'GESTOR' | 'INVESTIDOR_VISUALIZADOR' | 'PLATAFORMA_ADMIN';

export interface UsuarioAutenticado {
  id: number | null;
  nome: string;
  email: string;
  papel: Papel;
  /** Nulo para PLATAFORMA_ADMIN — esse papel não pertence a nenhuma empresa. */
  tenantId: string | null;
  investidorId: number | null;
}

export interface UsuarioResposta {
  id: number;
  usuarioId: number;
  nome: string;
  sobrenome: string | null;
  username: string;
  email: string;
  status: 'ATIVO' | 'INATIVO';
  papel: Papel;
  investidorId: number | null;
  investidorNome: string | null;
  createdAt: string;
}

/** Uma empresa à qual o usuário logado está vinculado, com o papel que tem nela. */
export interface MinhaEmpresaResposta {
  tenantId: string;
  tenantNome: string;
  papel: Papel;
  investidorId: number | null;
}

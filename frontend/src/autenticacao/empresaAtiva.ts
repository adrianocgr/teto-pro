const CHAVE_STORAGE = 'tetopro-obra:empresaAtivaId';

let empresaAtivaId: string | null = localStorage.getItem(CHAVE_STORAGE);

/** Usado pelo interceptor do axios (ver api/cliente.ts) para enviar X-Tenant-Id. */
export function obterEmpresaAtiva(): string | null {
  return empresaAtivaId;
}

export function definirEmpresaAtiva(tenantId: string | null) {
  empresaAtivaId = tenantId;
  if (tenantId) {
    localStorage.setItem(CHAVE_STORAGE, tenantId);
  } else {
    localStorage.removeItem(CHAVE_STORAGE);
  }
}

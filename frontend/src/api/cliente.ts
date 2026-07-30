import axios from 'axios';
import { keycloak } from '@/autenticacao/keycloak';
import { obterEmpresaAtiva } from '@/autenticacao/empresaAtiva';

export const cliente = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

cliente.interceptors.request.use(async (config) => {
  if (keycloak.token) {
    try {
      await keycloak.updateToken(30);
    } catch {
      keycloak.login();
    }
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  const tenantId = obterEmpresaAtiva();
  if (tenantId) {
    config.headers['X-Tenant-Id'] = tenantId;
  }
  return config;
});

cliente.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (erro.response?.status === 401) {
      keycloak.login();
    }
    return Promise.reject(erro);
  },
);

package br.com.tetoproobra.compartilhado.multitenancy;

/**
 * Guarda o identificador do tenant (empresa) da requisição atual em um
 * ThreadLocal. Preenchido pelo {@link FiltroTenant} logo após a autenticação
 * e sempre limpo ao final da requisição — essencial em threads reaproveitadas
 * de um pool.
 */
public final class ContextoTenant {

    private static final ThreadLocal<String> TENANT_ATUAL = new ThreadLocal<>();

    private ContextoTenant() {
    }

    public static void definir(String tenantId) {
        TENANT_ATUAL.set(tenantId);
    }

    public static String obter() {
        return TENANT_ATUAL.get();
    }

    public static void limpar() {
        TENANT_ATUAL.remove();
    }
}

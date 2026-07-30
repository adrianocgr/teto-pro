package br.com.tetoproobra.compartilhado.multitenancy;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

/**
 * Ponte entre o {@link ContextoTenant} e o Hibernate: é consultado
 * automaticamente sempre que uma entidade anotada com {@code @TenantId}
 * (ver {@link br.com.tetoproobra.compartilhado.dominio.EntidadeComTenant})
 * é lida, gravada ou atualizada.
 * <p>
 * Uma vez configurado, o Hibernate exige um identificador NÃO NULO para abrir
 * qualquer {@code Session}/{@code EntityManager} — mesmo para entidades sem
 * {@code @TenantId} (ex.: {@code Empresa}) e mesmo no boot da aplicação, antes
 * de existir requisição alguma (o Spring Data JPA abre uma sessão só para
 * inspecionar o metamodelo). Por isso NUNCA retornamos {@code null} aqui:
 * na ausência de contexto, devolvemos um valor-sentinela que não corresponde
 * a nenhuma empresa real — toda consulta contra uma entidade com
 * {@code @TenantId} feita nessas condições continua batendo zero linhas
 * (modo de falha fechado), mas a sessão consegue abrir normalmente, e
 * entidades sem {@code @TenantId} (Empresa, Estado, Cidade) não são afetadas
 * de forma alguma por esse valor.
 */
@Component
public class ResolvedorTenantAtual implements CurrentTenantIdentifierResolver<String> {

    private static final String SEM_TENANT_NO_CONTEXTO = "__sem_tenant_no_contexto__";

    @Override
    public String resolveCurrentTenantIdentifier() {
        String tenantId = ContextoTenant.obter();
        return tenantId != null ? tenantId : SEM_TENANT_NO_CONTEXTO;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}

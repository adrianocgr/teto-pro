package br.com.tetoproobra.compartilhado.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.hibernate.annotations.TenantId;

/**
 * Superclasse das entidades isoladas por empresa (tenant).
 * <p>
 * O campo é anotado com {@code @TenantId} (multi-tenancy nativa do Hibernate 6):
 * toda consulta feita através do JPA/Hibernate para uma entidade que estenda esta
 * classe recebe automaticamente a restrição {@code tenant_id = :tenantAtual} — e todo
 * INSERT preenche essa coluna sozinho. O valor do "tenant atual" vem do
 * {@link br.com.tetoproobra.compartilhado.multitenancy.ResolvedorTenantAtual}, que por
 * sua vez lê o {@link br.com.tetoproobra.compartilhado.multitenancy.ContextoTenant}
 * (preenchido pelo {@link br.com.tetoproobra.compartilhado.multitenancy.FiltroTenant}
 * a partir do claim "tenant_id" do token JWT).
 * <p>
 * Não expor este campo em nenhum DTO de entrada — o tenant nunca pode ser decidido
 * pelo cliente, apenas derivado do vínculo resolvido pelo
 * {@link br.com.tetoproobra.compartilhado.multitenancy.FiltroTenant}.
 * <p>
 * {@code Usuario} (a identidade global de login) e
 * {@code VinculoUsuarioEmpresa} (o vínculo por empresa) deliberadamente NÃO
 * estendem esta classe — ver o javadoc de cada um.
 */
@MappedSuperclass
@Getter
public abstract class EntidadeComTenant {

    @TenantId
    @Column(name = "tenant_id", updatable = false, length = 40)
    private String tenantId;
}

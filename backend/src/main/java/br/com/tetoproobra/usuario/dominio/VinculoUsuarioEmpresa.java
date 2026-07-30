package br.com.tetoproobra.usuario.dominio;

import br.com.tetoproobra.administracao.dominio.Empresa;
import br.com.tetoproobra.compartilhado.dominio.Papel;
import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import br.com.tetoproobra.investidor.dominio.Investidor;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Vínculo de um {@link Usuario} (identidade global) com uma {@link Empresa},
 * carregando o papel (ADMIN, GESTOR, INVESTIDOR_VISUALIZADOR) que essa pessoa
 * tem NAQUELA empresa especificamente — a mesma pessoa pode ter papéis
 * diferentes em empresas diferentes.
 * <p>
 * Deliberadamente NÃO estende {@code EntidadeComTenant}: o campo
 * {@code tenantId} é uma coluna comum, filtrada explicitamente em código
 * (ver {@link br.com.tetoproobra.usuario.infraestrutura.VinculoUsuarioEmpresaRepository}),
 * porque este é o único lugar do sistema que precisa enxergar vínculos de
 * VÁRIAS empresas ao mesmo tempo para uma mesma pessoa (Hibernate
 * {@code @TenantId} só resolve um tenant por sessão).
 */
@Entity
@Table(name = "tb_usuario_empresa")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class VinculoUsuarioEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ue_id")
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "tenant_id", nullable = false, updatable = false, length = 40)
    private String tenantId;

    /** Somente leitura — mapeia a mesma coluna de {@link #tenantId}, só para permitir join fetch ao nome da empresa. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", insertable = false, updatable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ue_usuario_id", nullable = false, updatable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "ue_papel", nullable = false, length = 30)
    private Papel papel;

    @Enumerated(EnumType.STRING)
    @Column(name = "ue_status", nullable = false, length = 20)
    private StatusAtivoInativo status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ue_investidor_id")
    private Investidor investidor;

    @CreationTimestamp
    @Column(name = "ue_created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

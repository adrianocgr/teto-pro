package br.com.tetoproobra.usuario.dominio;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Identidade global de login, autenticada via Keycloak — NÃO é isolada por
 * tenant (ao contrário da maioria das entidades deste sistema): a mesma
 * pessoa pode estar vinculada a mais de uma empresa, cada vínculo com seu
 * próprio papel (ver {@link VinculoUsuarioEmpresa}). PLATAFORMA_ADMIN é a
 * única exceção — não tem vínculo algum, é apenas uma realm role no Keycloak.
 */
@Entity
@Table(name = "tb_usuario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "us_id")
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "us_nome", nullable = false)
    private String nome;

    /**
     * Sobrenome — opcional na coluna (contas antigas foram criadas só com
     * {@code nome}), mas exigido pela API do formulário de cadastro porque o
     * Keycloak recusa a criação do usuário sem {@code lastName} (perfil de
     * usuário padrão do realm exige o atributo).
     */
    @Column(name = "us_sobrenome", length = 120)
    private String sobrenome;

    @Column(name = "us_username", nullable = false, length = 60)
    private String username;

    @Column(name = "us_email", nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "us_status", nullable = false, length = 20)
    private StatusAtivoInativo status;

    @Column(name = "us_keycloak_id", length = 64, unique = true)
    private String keycloakId;

    @CreationTimestamp
    @Column(name = "us_created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "us_updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

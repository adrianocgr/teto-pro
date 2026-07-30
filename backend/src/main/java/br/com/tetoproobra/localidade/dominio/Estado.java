package br.com.tetoproobra.localidade.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/**
 * Cadastro GLOBAL (entre tenants) de estado — dado geográfico de referência,
 * não de negócio. Não estende {@link br.com.tetoproobra.compartilhado.dominio.EntidadeComTenant}.
 */
@Entity
@Table(name = "tb_estado")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Estado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "es_id")
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "es_nome", nullable = false)
    private String nome;

    @Column(name = "es_sigla", nullable = false, length = 2)
    private String sigla;
}

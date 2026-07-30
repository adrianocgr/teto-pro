package br.com.tetoproobra.unidademedida.dominio;

import br.com.tetoproobra.compartilhado.dominio.EntidadeComTenant;
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
 * Unidade de medida do catálogo da empresa (ex.: M2, KG, UN).
 */
@Entity
@Table(name = "tb_unidade_medida")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class UnidadeMedida extends EntidadeComTenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "um_id")
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "um_sigla", nullable = false, length = 10)
    private String sigla;

    @Column(name = "um_descricao", nullable = false, length = 120)
    private String descricao;
}

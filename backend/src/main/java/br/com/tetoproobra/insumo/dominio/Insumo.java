package br.com.tetoproobra.insumo.dominio;

import br.com.tetoproobra.classificacao.dominio.Classificacao;
import br.com.tetoproobra.compartilhado.dominio.EntidadeComTenant;
import br.com.tetoproobra.unidademedida.dominio.UnidadeMedida;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

import java.math.BigDecimal;

/**
 * Insumo do catálogo da empresa, usado nos itens de despesa.
 */
@Entity
@Table(name = "tb_insumo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Insumo extends EntidadeComTenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "in_id")
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "in_codigo", nullable = false, length = 50)
    private String codigo;

    @Column(name = "in_descricao", nullable = false, length = 500)
    private String descricao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "in_unidade_medida_id", nullable = false)
    private UnidadeMedida unidadeMedida;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "in_classificacao_id", nullable = false)
    private Classificacao classificacao;

    @Column(name = "in_preco_referencia", nullable = false, precision = 14, scale = 4)
    private BigDecimal precoReferencia;
}

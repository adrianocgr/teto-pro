package br.com.tetoproobra.categoria.dominio;

import br.com.tetoproobra.compartilhado.dominio.EntidadeComTenant;
import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
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

/**
 * Categoria de despesa (equivalente ao "Centro de Custo" de sistemas de referência).
 * Catálogo reaproveitado entre os empreendimentos de uma mesma empresa (tenant).
 */
@Entity
@Table(name = "tb_categoria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Categoria extends EntidadeComTenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ct_id")
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "ct_codigo", nullable = false, length = 20)
    private String codigo;

    @Column(name = "ct_descricao", nullable = false)
    private String descricao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ct_pai_id")
    private Categoria categoriaPai;

    @Enumerated(EnumType.STRING)
    @Column(name = "ct_status", nullable = false, length = 20)
    private StatusAtivoInativo status;
}

package br.com.tetoproobra.despesa.dominio;

import br.com.tetoproobra.insumo.dominio.Insumo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Item de detalhamento de uma {@link Despesa}, como uma linha de nota fiscal:
 * um {@link Insumo}, a quantidade comprada e o valor unitário pago. Não
 * estende {@code EntidadeComTenant} — é filho de Despesa e herda o isolamento
 * por tenant transitivamente via {@code ie_despesa_id}.
 */
@Entity
@Table(name = "tb_item_despesa")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ItemDespesa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ie_id")
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ie_despesa_id", nullable = false)
    private Despesa despesa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ie_insumo_id", nullable = false)
    private Insumo insumo;

    @Column(name = "ie_quantidade", nullable = false, precision = 14, scale = 4)
    private BigDecimal quantidade;

    @Column(name = "ie_valor_unitario", nullable = false, precision = 14, scale = 4)
    private BigDecimal valorUnitario;

    @Column(name = "ie_valor_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "ie_observacao", length = 500)
    private String observacao;
}

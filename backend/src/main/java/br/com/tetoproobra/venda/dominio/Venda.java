package br.com.tetoproobra.venda.dominio;

import br.com.tetoproobra.compartilhado.dominio.EntidadeComTenant;
import br.com.tetoproobra.empreendimento.dominio.Empreendimento;
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
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Venda / fechamento financeiro de um {@link Empreendimento}. Um empreendimento
 * só pode ter uma venda (ver constraint {@code uk_vd_empreendimento}) — é a
 * partir dela que se calcula o lucro (valor de venda menos custos da obra,
 * comissão de corretor e custos adicionais) e o rateio desse lucro entre os
 * investidores participantes, proporcional ao percentual de cada um.
 */
@Entity
@Table(name = "tb_venda")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Venda extends EntidadeComTenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vd_id")
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vd_empreendimento_id", nullable = false)
    private Empreendimento empreendimento;

    @Column(name = "vd_data_venda", nullable = false)
    private LocalDate dataVenda;

    @Column(name = "vd_valor_venda", nullable = false, precision = 14, scale = 2)
    private BigDecimal valorVenda;

    @Column(name = "vd_comprador", nullable = false)
    private String comprador;

    @Column(name = "vd_comissao_corretor", nullable = false, precision = 14, scale = 2)
    private BigDecimal comissaoCorretor;

    @Column(name = "vd_custos_venda_adicionais", nullable = false, precision = 14, scale = 2)
    private BigDecimal custosVendaAdicionais;
}

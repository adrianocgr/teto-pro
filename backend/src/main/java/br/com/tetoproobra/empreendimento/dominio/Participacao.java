package br.com.tetoproobra.empreendimento.dominio;

import br.com.tetoproobra.compartilhado.dominio.EntidadeComTenant;
import br.com.tetoproobra.investidor.dominio.Investidor;
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
 * Participação de um {@link Investidor} em um {@link Empreendimento}, com o
 * percentual usado para ratear despesas e, futuramente, o lucro na venda
 * (módulo Fechamento). Um investidor só pode ter uma participação por
 * empreendimento (ver constraint {@code uk_pa_emp_inv}).
 */
@Entity
@Table(name = "tb_participacao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Participacao extends EntidadeComTenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pa_id")
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pa_empreendimento_id", nullable = false)
    private Empreendimento empreendimento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pa_investidor_id", nullable = false)
    private Investidor investidor;

    /** Opcional — pode ser preenchido depois de vincular o investidor ao empreendimento. */
    @Column(name = "pa_percentual", precision = 5, scale = 2)
    private BigDecimal percentual;

    @Column(name = "pa_data_entrada", nullable = false)
    private LocalDate dataEntrada;
}

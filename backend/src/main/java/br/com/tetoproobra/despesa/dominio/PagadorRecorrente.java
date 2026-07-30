package br.com.tetoproobra.despesa.dominio;

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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Percentual de rateio de um investidor dentro de uma {@link DespesaRecorrente}
 * — ao contrário de {@link PagadorDespesa} (valor fixo), aqui é sempre
 * percentual, porque a conta varia todo mês e o que se repete é a proporção.
 */
@Entity
@Table(name = "tb_pagador_recorrente")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class PagadorRecorrente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pr_id")
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pr_recorrencia_id", nullable = false)
    private DespesaRecorrente recorrencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pr_investidor_id", nullable = false)
    private Investidor investidor;

    @Column(name = "pr_percentual", nullable = false, precision = 5, scale = 2)
    private BigDecimal percentual;
}

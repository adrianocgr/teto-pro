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
 * Rateio N:N entre {@link Despesa} e {@link Investidor}: quanto cada
 * investidor pagou daquela despesa. A soma dos valores de todos os pagadores
 * de uma despesa deve ser exatamente igual ao valor total da despesa (ver
 * {@link br.com.tetoproobra.despesa.aplicacao.DespesaServico}). Não estende
 * {@code EntidadeComTenant} — é filho de Despesa e herda o isolamento por
 * tenant transitivamente via {@code pg_despesa_id}.
 */
@Entity
@Table(name = "tb_pagador_despesa")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class PagadorDespesa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pg_id")
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pg_despesa_id", nullable = false)
    private Despesa despesa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pg_investidor_id", nullable = false)
    private Investidor investidor;

    @Column(name = "pg_valor", nullable = false, precision = 14, scale = 2)
    private BigDecimal valor;
}

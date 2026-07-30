package br.com.tetoproobra.venda.web;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VendaResposta(
        Long id,
        Long empreendimentoId,
        LocalDate dataVenda,
        BigDecimal valorVenda,
        String comprador,
        BigDecimal comissaoCorretor,
        BigDecimal custosVendaAdicionais
) {
}

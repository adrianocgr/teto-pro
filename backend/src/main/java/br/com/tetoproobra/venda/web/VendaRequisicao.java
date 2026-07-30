package br.com.tetoproobra.venda.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record VendaRequisicao(

        @NotNull(message = "A data da venda é obrigatória")
        LocalDate dataVenda,

        @NotNull(message = "O valor da venda é obrigatório")
        BigDecimal valorVenda,

        @NotBlank(message = "O comprador é obrigatório")
        String comprador,

        BigDecimal comissaoCorretor,

        BigDecimal custosVendaAdicionais
) {
}

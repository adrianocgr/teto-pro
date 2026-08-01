package br.com.tetoproobra.despesa.web;

import java.math.BigDecimal;

public record ItemNfeResposta(
        Long insumoId,
        String insumoDescricao,
        String unidadeSigla,
        boolean insumoNovo,
        BigDecimal quantidade,
        BigDecimal valorUnitario
) {
}

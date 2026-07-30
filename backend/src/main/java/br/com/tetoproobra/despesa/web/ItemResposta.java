package br.com.tetoproobra.despesa.web;

import java.math.BigDecimal;

public record ItemResposta(
        Long id,
        Long insumoId,
        String insumoDescricao,
        String unidadeSigla,
        BigDecimal quantidade,
        BigDecimal valorUnitario,
        BigDecimal valorTotal,
        String observacao
) {
}

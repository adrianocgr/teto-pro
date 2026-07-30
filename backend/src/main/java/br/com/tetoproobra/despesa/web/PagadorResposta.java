package br.com.tetoproobra.despesa.web;

import java.math.BigDecimal;

public record PagadorResposta(
        Long id,
        Long investidorId,
        String investidorNome,
        BigDecimal valor
) {
}

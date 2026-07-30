package br.com.tetoproobra.despesa.web;

import java.math.BigDecimal;

public record PagadorRecorrenteResposta(
        Long investidorId,
        String investidorNome,
        BigDecimal percentual
) {
}

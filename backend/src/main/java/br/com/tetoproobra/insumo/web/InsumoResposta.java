package br.com.tetoproobra.insumo.web;

import java.math.BigDecimal;

public record InsumoResposta(
        Long id,
        String codigo,
        String descricao,
        Long unidadeMedidaId,
        String unidadeMedidaSigla,
        Long classificacaoId,
        String classificacaoDescricao,
        BigDecimal precoReferencia
) {
}

package br.com.tetoproobra.insumo.web;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record InsumoRequisicao(

        @NotBlank(message = "O código é obrigatório")
        String codigo,

        @NotBlank(message = "A descrição é obrigatória")
        String descricao,

        @NotNull(message = "A unidade de medida é obrigatória")
        Long unidadeMedidaId,

        @NotNull(message = "A classificação é obrigatória")
        Long classificacaoId,

        @NotNull(message = "O preço de referência é obrigatório")
        @DecimalMin(value = "0.0", message = "O preço de referência não pode ser negativo")
        BigDecimal precoReferencia
) {
}

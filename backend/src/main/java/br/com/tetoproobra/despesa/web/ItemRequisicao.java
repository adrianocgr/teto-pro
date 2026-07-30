package br.com.tetoproobra.despesa.web;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ItemRequisicao(

        @NotNull(message = "O insumo é obrigatório")
        Long insumoId,

        @NotNull(message = "A quantidade é obrigatória")
        @DecimalMin(value = "0.0001", message = "A quantidade deve ser maior que 0")
        BigDecimal quantidade,

        @NotNull(message = "O valor unitário é obrigatório")
        @DecimalMin(value = "0.0001", message = "O valor unitário deve ser maior que 0")
        BigDecimal valorUnitario,

        String observacao
) {
}

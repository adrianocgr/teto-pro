package br.com.tetoproobra.despesa.web;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PagadorRequisicao(

        @NotNull(message = "O investidor pagador é obrigatório")
        Long investidorId,

        @NotNull(message = "O valor pago pelo investidor é obrigatório")
        @DecimalMin(value = "0.01", message = "O valor pago deve ser maior que 0")
        BigDecimal valor
) {
}

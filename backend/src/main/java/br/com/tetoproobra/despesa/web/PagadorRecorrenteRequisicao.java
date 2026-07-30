package br.com.tetoproobra.despesa.web;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PagadorRecorrenteRequisicao(

        @NotNull(message = "O investidor pagador é obrigatório")
        Long investidorId,

        @NotNull(message = "O percentual é obrigatório")
        @DecimalMin(value = "0.01", message = "O percentual deve ser maior que 0")
        @DecimalMax(value = "100.0", message = "O percentual deve ser no máximo 100")
        BigDecimal percentual
) {
}

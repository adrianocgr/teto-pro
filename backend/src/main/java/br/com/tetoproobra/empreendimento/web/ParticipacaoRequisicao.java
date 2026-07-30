package br.com.tetoproobra.empreendimento.web;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

/** {@code percentual} é opcional — pode ser preenchido depois de vincular o investidor. */
public record ParticipacaoRequisicao(

        @NotNull(message = "O investidor é obrigatório")
        Long investidorId,

        @DecimalMin(value = "0.01", message = "O percentual de participação deve ser maior que 0")
        @DecimalMax(value = "100.0", message = "O percentual de participação deve ser no máximo 100")
        BigDecimal percentual,

        LocalDate dataEntrada
) {
}

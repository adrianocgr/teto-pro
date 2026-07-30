package br.com.tetoproobra.empreendimento.web;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ParticipacaoResposta(
        Long id,
        Long investidorId,
        String investidorNome,
        BigDecimal percentual,
        LocalDate dataEntrada
) {
}

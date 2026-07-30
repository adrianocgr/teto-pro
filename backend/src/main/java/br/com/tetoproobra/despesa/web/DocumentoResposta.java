package br.com.tetoproobra.despesa.web;

import java.time.LocalDateTime;

public record DocumentoResposta(
        Long id,
        String filename,
        String contentType,
        Long length,
        LocalDateTime uploadedAt
) {
}

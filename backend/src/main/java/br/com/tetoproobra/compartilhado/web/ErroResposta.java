package br.com.tetoproobra.compartilhado.web;

import java.time.OffsetDateTime;
import java.util.List;

public record ErroResposta(
        OffsetDateTime momento,
        int status,
        String erro,
        String mensagem,
        List<String> detalhes
) {
    public static ErroResposta de(int status, String erro, String mensagem) {
        return new ErroResposta(OffsetDateTime.now(), status, erro, mensagem, List.of());
    }

    public static ErroResposta de(int status, String erro, String mensagem, List<String> detalhes) {
        return new ErroResposta(OffsetDateTime.now(), status, erro, mensagem, detalhes);
    }
}

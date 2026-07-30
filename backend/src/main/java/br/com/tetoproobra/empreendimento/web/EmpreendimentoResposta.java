package br.com.tetoproobra.empreendimento.web;

import java.math.BigDecimal;
import java.util.List;

public record EmpreendimentoResposta(
        Long id,
        String descricao,
        String inscricaoMunicipal,
        String matricula,
        String endereco,
        String numero,
        String quadra,
        String lote,
        String complemento,
        List<ParticipacaoResposta> participacoes,
        BigDecimal somaPercentuais
) {
}

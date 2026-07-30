package br.com.tetoproobra.empreendimento.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record EmpreendimentoRequisicao(

        @NotBlank(message = "A descrição é obrigatória")
        String descricao,

        String inscricaoMunicipal,

        String matricula,

        String endereco,

        String numero,

        String quadra,

        String lote,

        String complemento,

        @Valid
        List<ParticipacaoRequisicao> participacoesIniciais
) {
}

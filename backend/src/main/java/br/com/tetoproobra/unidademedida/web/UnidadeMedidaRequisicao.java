package br.com.tetoproobra.unidademedida.web;

import jakarta.validation.constraints.NotBlank;

public record UnidadeMedidaRequisicao(

        @NotBlank(message = "A sigla é obrigatória")
        String sigla,

        @NotBlank(message = "A descrição é obrigatória")
        String descricao
) {
}

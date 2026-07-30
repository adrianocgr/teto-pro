package br.com.tetoproobra.classificacao.web;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ClassificacaoRequisicao(

        @NotBlank(message = "A descrição é obrigatória")
        String descricao,

        @NotNull(message = "O status é obrigatório")
        StatusAtivoInativo status
) {
}

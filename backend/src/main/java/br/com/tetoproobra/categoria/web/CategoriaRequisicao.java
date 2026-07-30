package br.com.tetoproobra.categoria.web;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * {@code codigo} não é informado aqui de propósito — é gerado automaticamente
 * de forma sequencial e hierárquica (ver {@link br.com.tetoproobra.categoria.aplicacao.CategoriaServico}),
 * ex.: "01", "01.01", "02".
 */
public record CategoriaRequisicao(

        @NotBlank(message = "A descrição é obrigatória")
        String descricao,

        Long categoriaPaiId,

        @NotNull(message = "O status é obrigatório")
        StatusAtivoInativo status
) {
}

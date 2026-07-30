package br.com.tetoproobra.categoria.web;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;

public record CategoriaResposta(
        Long id,
        String codigo,
        String descricao,
        Long categoriaPaiId,
        String categoriaPaiDescricao,
        StatusAtivoInativo status
) {
}

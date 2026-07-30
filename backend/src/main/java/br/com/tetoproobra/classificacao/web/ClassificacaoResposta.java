package br.com.tetoproobra.classificacao.web;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;

public record ClassificacaoResposta(
        Long id,
        String descricao,
        StatusAtivoInativo status
) {
}

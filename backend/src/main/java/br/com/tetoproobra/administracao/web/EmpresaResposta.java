package br.com.tetoproobra.administracao.web;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;

public record EmpresaResposta(
        String id,
        String nome,
        StatusAtivoInativo status
) {
}

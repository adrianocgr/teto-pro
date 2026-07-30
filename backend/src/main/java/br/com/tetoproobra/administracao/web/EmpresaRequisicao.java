package br.com.tetoproobra.administracao.web;

import jakarta.validation.constraints.NotBlank;

public record EmpresaRequisicao(
        @NotBlank(message = "Informe o nome da empresa") String nome
) {
}

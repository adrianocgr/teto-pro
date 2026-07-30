package br.com.tetoproobra.localidade.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ImportacaoMunicipiosRequisicao(
        @NotBlank(message = "Informe a sigla do estado")
        @Pattern(regexp = "(?i)^[a-z]{2}$", message = "A sigla do estado deve ter 2 letras")
        String siglaUf
) {
}

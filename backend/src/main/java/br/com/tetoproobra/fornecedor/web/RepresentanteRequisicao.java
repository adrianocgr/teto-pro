package br.com.tetoproobra.fornecedor.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RepresentanteRequisicao(

        @NotBlank(message = "Nome é obrigatório")
        String nome,

        @Email(message = "E-mail inválido")
        String email,

        String telefone
) {
}

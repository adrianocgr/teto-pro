package br.com.tetoproobra.administracao.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Atualiza os dados globais da pessoa — o papel vive no vínculo com cada empresa, não aqui. */
public record UsuarioAdminAtualizarRequisicao(
        @NotBlank(message = "Informe o nome") String nome,
        @NotBlank(message = "Informe o sobrenome") String sobrenome,
        @NotBlank(message = "Informe o usuário de acesso") String username,
        @NotBlank @Email(message = "Informe um e-mail válido") String email
) {
}

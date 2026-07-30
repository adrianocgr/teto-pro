package br.com.tetoproobra.administracao.web;

import br.com.tetoproobra.compartilhado.dominio.Papel;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Cadastra a pessoa (se ainda não existir) e cria seu primeiro vínculo com uma empresa. */
public record UsuarioAdminRequisicao(
        @NotBlank(message = "Selecione a empresa") String tenantId,
        @NotBlank(message = "Informe o nome") String nome,
        @NotBlank(message = "Informe o usuário de acesso") String username,
        @NotBlank @Email(message = "Informe um e-mail válido") String email,
        @NotNull(message = "Selecione o papel do usuário") Papel papel
) {
}

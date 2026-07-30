package br.com.tetoproobra.usuario.web;

import br.com.tetoproobra.compartilhado.dominio.Papel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * {@code investidorId} só é relevante (e obrigatório) quando {@code papel} é
 * {@link Papel#INVESTIDOR_VISUALIZADOR} — validado em
 * {@link br.com.tetoproobra.usuario.aplicacao.UsuarioServico}, não via Bean Validation.
 */
public record UsuarioRequisicao(

        @NotBlank(message = "O nome é obrigatório")
        String nome,

        @NotBlank(message = "O username é obrigatório")
        String username,

        @NotBlank(message = "O e-mail é obrigatório")
        String email,

        @NotNull(message = "O papel é obrigatório")
        Papel papel,

        Long investidorId
) {
}

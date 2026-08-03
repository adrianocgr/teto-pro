package br.com.tetoproobra.usuario.web;

import br.com.tetoproobra.compartilhado.dominio.Papel;
import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;

import java.time.LocalDateTime;

/** {@code id} é o id do VÍNCULO com a empresa atual; {@code usuarioId} é o id global da pessoa. */
public record UsuarioResposta(
        Long id,
        Long usuarioId,
        String nome,
        String sobrenome,
        String username,
        String email,
        StatusAtivoInativo status,
        Papel papel,
        Long investidorId,
        String investidorNome,
        LocalDateTime createdAt
) {
}

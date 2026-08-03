package br.com.tetoproobra.administracao.web;

import br.com.tetoproobra.compartilhado.dominio.Papel;
import jakarta.validation.constraints.NotNull;

/**
 * Muda o papel de um vínculo já existente entre a pessoa e uma empresa.
 * <p>
 * {@code investidorId} só é relevante (e obrigatório) quando {@code papel} é
 * {@link Papel#INVESTIDOR_VISUALIZADOR}.
 */
public record AtualizarPapelRequisicao(
        @NotNull(message = "Selecione o papel do usuário") Papel papel,
        Long investidorId
) {
}

package br.com.tetoproobra.administracao.web;

import br.com.tetoproobra.compartilhado.dominio.Papel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Cria mais um vínculo para uma pessoa já existente — ela pode estar em mais de uma empresa.
 * <p>
 * {@code investidorId} só é relevante (e obrigatório) quando {@code papel} é
 * {@link Papel#INVESTIDOR_VISUALIZADOR}.
 */
public record VincularEmpresaRequisicao(
        @NotBlank(message = "Selecione a empresa") String tenantId,
        @NotNull(message = "Selecione o papel do usuário") Papel papel,
        Long investidorId
) {
}

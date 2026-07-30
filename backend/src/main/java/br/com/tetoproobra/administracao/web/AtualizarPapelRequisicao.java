package br.com.tetoproobra.administracao.web;

import br.com.tetoproobra.compartilhado.dominio.Papel;
import jakarta.validation.constraints.NotNull;

/** Muda o papel de um vínculo já existente entre a pessoa e uma empresa. */
public record AtualizarPapelRequisicao(
        @NotNull(message = "Selecione o papel do usuário") Papel papel
) {
}

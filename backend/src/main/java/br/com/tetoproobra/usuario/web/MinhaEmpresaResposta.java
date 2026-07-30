package br.com.tetoproobra.usuario.web;

import br.com.tetoproobra.compartilhado.dominio.Papel;

/**
 * Uma empresa à qual o usuário autenticado está vinculado, com o papel que
 * ele tem nela — usado pelo frontend para montar o seletor de empresa logo
 * após o login (antes disso, nenhuma empresa está selecionada, então o
 * backend ainda não sabe qual papel aplicar).
 */
public record MinhaEmpresaResposta(
        String tenantId,
        String tenantNome,
        Papel papel,
        Long investidorId
) {
}

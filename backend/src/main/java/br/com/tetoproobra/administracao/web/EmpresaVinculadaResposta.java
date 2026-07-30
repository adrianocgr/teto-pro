package br.com.tetoproobra.administracao.web;

import br.com.tetoproobra.compartilhado.dominio.Papel;
import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;

import java.time.LocalDateTime;

/** Uma das empresas às quais um usuário está vinculado, com o papel que tem nela. */
public record EmpresaVinculadaResposta(
        String tenantId,
        String tenantNome,
        Papel papel,
        StatusAtivoInativo status,
        Long investidorId,
        String investidorNome,
        LocalDateTime vinculadoDesde
) {
}

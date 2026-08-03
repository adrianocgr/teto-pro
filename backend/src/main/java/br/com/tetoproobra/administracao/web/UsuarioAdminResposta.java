package br.com.tetoproobra.administracao.web;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;

import java.time.LocalDateTime;
import java.util.List;

/** Uma pessoa (identidade global de login) e todas as empresas às quais está vinculada. */
public record UsuarioAdminResposta(
        Long id,
        String nome,
        String sobrenome,
        String username,
        String email,
        StatusAtivoInativo status,
        List<EmpresaVinculadaResposta> empresas,
        LocalDateTime createdAt
) {
}

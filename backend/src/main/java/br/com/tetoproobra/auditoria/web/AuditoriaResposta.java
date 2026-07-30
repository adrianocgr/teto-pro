package br.com.tetoproobra.auditoria.web;

import java.time.Instant;
import java.util.List;

public record AuditoriaResposta(
        String id,
        String entidade,
        Long entidadeId,
        String entidadeRef,
        Long empreendimentoId,
        String empreendimentoDescricao,
        String operacao,
        String usuarioEmail,
        List<CampoAlteradoResposta> camposAlterados,
        Instant momento
) {
}

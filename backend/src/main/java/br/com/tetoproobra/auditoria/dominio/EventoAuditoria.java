package br.com.tetoproobra.auditoria.dominio;

import java.time.Instant;
import java.util.List;

/**
 * Contrato publicado pelos domínios de negócio (Despesa, Venda, Participação
 * etc.) via {@link org.springframework.context.ApplicationEventPublisher} e
 * consumido por um {@code @Async @EventListener} do domínio Auditoria, que
 * grava o evento no MongoDB. Quem publica não precisa saber nada sobre a
 * persistência do lado da auditoria — apenas emitir este record.
 */
public record EventoAuditoria(
        String tenantId,
        String entidade,               // ex: "despesa", "venda", "participacao"
        Long entidadeId,
        String entidadeRef,            // descrição legível do registro (ex: descrição da despesa)
        Long empreendimentoId,
        String empreendimentoDescricao,
        String operacao,               // "CREATE" | "UPDATE" | "DELETE"
        String usuarioEmail,
        List<CampoAlterado> camposAlterados,  // vazio para CREATE/DELETE
        Instant momento
) {
    public record CampoAlterado(String campo, String valorAnterior, String valorNovo) {}

    public static EventoAuditoria criacao(String tenantId, String entidade, Long entidadeId, String entidadeRef,
                                           Long empreendimentoId, String empreendimentoDescricao, String usuarioEmail) {
        return new EventoAuditoria(tenantId, entidade, entidadeId, entidadeRef, empreendimentoId, empreendimentoDescricao,
                "CREATE", usuarioEmail, List.of(), Instant.now());
    }

    public static EventoAuditoria exclusao(String tenantId, String entidade, Long entidadeId, String entidadeRef,
                                            Long empreendimentoId, String empreendimentoDescricao, String usuarioEmail) {
        return new EventoAuditoria(tenantId, entidade, entidadeId, entidadeRef, empreendimentoId, empreendimentoDescricao,
                "DELETE", usuarioEmail, List.of(), Instant.now());
    }

    public static EventoAuditoria atualizacao(String tenantId, String entidade, Long entidadeId, String entidadeRef,
                                               Long empreendimentoId, String empreendimentoDescricao, String usuarioEmail,
                                               List<CampoAlterado> camposAlterados) {
        return new EventoAuditoria(tenantId, entidade, entidadeId, entidadeRef, empreendimentoId, empreendimentoDescricao,
                "UPDATE", usuarioEmail, camposAlterados, Instant.now());
    }
}

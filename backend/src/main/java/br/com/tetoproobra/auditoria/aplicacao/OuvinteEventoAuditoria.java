package br.com.tetoproobra.auditoria.aplicacao;

import br.com.tetoproobra.auditoria.dominio.EventoAuditoria;
import br.com.tetoproobra.auditoria.dominio.RegistroAuditoria;
import br.com.tetoproobra.auditoria.infraestrutura.RegistroAuditoriaRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Consome os {@link EventoAuditoria} publicados pelos domínios de negócio
 * (Despesa, Venda, Participação etc.) e grava o registro correspondente no
 * MongoDB. Roda de forma assíncrona ({@code @Async}) para não impactar a
 * latência nem a transação principal de quem publicou o evento.
 */
@Component
@RequiredArgsConstructor
public class OuvinteEventoAuditoria {

    private final RegistroAuditoriaRepository registroAuditoriaRepository;

    @Async
    @EventListener
    public void aoOcorrerEvento(EventoAuditoria evento) {
        List<RegistroAuditoria.CampoAlterado> camposAlterados = evento.camposAlterados() == null
                ? List.of()
                : evento.camposAlterados().stream()
                        .map(campo -> RegistroAuditoria.CampoAlterado.builder()
                                .campo(campo.campo())
                                .valorAnterior(campo.valorAnterior())
                                .valorNovo(campo.valorNovo())
                                .build())
                        .toList();

        RegistroAuditoria registro = RegistroAuditoria.builder()
                .tenantId(evento.tenantId())
                .entidade(evento.entidade())
                .entidadeId(evento.entidadeId())
                .entidadeRef(evento.entidadeRef())
                .empreendimentoId(evento.empreendimentoId())
                .empreendimentoDescricao(evento.empreendimentoDescricao())
                .operacao(evento.operacao())
                .usuarioEmail(evento.usuarioEmail())
                .camposAlterados(camposAlterados)
                .momento(evento.momento())
                .build();

        registroAuditoriaRepository.save(registro);
    }
}

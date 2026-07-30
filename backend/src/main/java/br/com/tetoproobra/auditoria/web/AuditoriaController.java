package br.com.tetoproobra.auditoria.web;

import br.com.tetoproobra.auditoria.dominio.RegistroAuditoria;
import br.com.tetoproobra.auditoria.infraestrutura.RegistroAuditoriaRepository;
import br.com.tetoproobra.compartilhado.multitenancy.ContextoTenant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Consulta da trilha de auditoria (criação/alteração/exclusão de despesas,
 * vendas e participações). Restrito a administradores, conforme a
 * especificação do sistema.
 */
@RestController
@RequestMapping("/auditoria")
@RequiredArgsConstructor
public class AuditoriaController {

    private final RegistroAuditoriaRepository registroAuditoriaRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<AuditoriaResposta> listar(
            @RequestParam(required = false) String entidade,
            @RequestParam(required = false) Long entidadeId,
            @ParameterObject Pageable pageable) {
        String tenantId = ContextoTenant.obter();

        Page<RegistroAuditoria> pagina;
        if (entidadeId != null) {
            pagina = registroAuditoriaRepository.findByTenantIdAndEntidadeAndEntidadeIdOrderByMomentoDesc(
                    tenantId, entidade, entidadeId, pageable);
        } else if (StringUtils.hasText(entidade)) {
            pagina = registroAuditoriaRepository.findByTenantIdAndEntidadeOrderByMomentoDesc(
                    tenantId, entidade, pageable);
        } else {
            pagina = registroAuditoriaRepository.findByTenantIdOrderByMomentoDesc(tenantId, pageable);
        }

        return pagina.map(this::paraResposta);
    }

    private AuditoriaResposta paraResposta(RegistroAuditoria registro) {
        List<CampoAlteradoResposta> camposAlterados = registro.getCamposAlterados() == null
                ? List.of()
                : registro.getCamposAlterados().stream()
                        .map(campo -> new CampoAlteradoResposta(
                                campo.getCampo(), campo.getValorAnterior(), campo.getValorNovo()))
                        .toList();

        return new AuditoriaResposta(
                registro.getId(),
                registro.getEntidade(),
                registro.getEntidadeId(),
                registro.getEntidadeRef(),
                registro.getEmpreendimentoId(),
                registro.getEmpreendimentoDescricao(),
                registro.getOperacao(),
                registro.getUsuarioEmail(),
                camposAlterados,
                registro.getMomento());
    }
}

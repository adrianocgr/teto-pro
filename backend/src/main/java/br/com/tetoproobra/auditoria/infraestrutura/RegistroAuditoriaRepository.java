package br.com.tetoproobra.auditoria.infraestrutura;

import br.com.tetoproobra.auditoria.dominio.RegistroAuditoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RegistroAuditoriaRepository extends MongoRepository<RegistroAuditoria, String> {

    Page<RegistroAuditoria> findByTenantIdOrderByMomentoDesc(String tenantId, Pageable pageable);

    Page<RegistroAuditoria> findByTenantIdAndEntidadeOrderByMomentoDesc(
            String tenantId, String entidade, Pageable pageable);

    Page<RegistroAuditoria> findByTenantIdAndEntidadeAndEntidadeIdOrderByMomentoDesc(
            String tenantId, String entidade, Long entidadeId, Pageable pageable);
}

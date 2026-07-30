package br.com.tetoproobra.usuario.infraestrutura;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import br.com.tetoproobra.usuario.dominio.VinculoUsuarioEmpresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface VinculoUsuarioEmpresaRepository extends JpaRepository<VinculoUsuarioEmpresa, Long> {

    @Query("""
            select v from VinculoUsuarioEmpresa v
            join fetch v.empresa
            left join fetch v.investidor
            where v.usuario.id = :usuarioId
            order by v.empresa.nome
            """)
    List<VinculoUsuarioEmpresa> listarPorUsuario(Long usuarioId);

    @Query("""
            select v from VinculoUsuarioEmpresa v
            join fetch v.usuario
            left join fetch v.investidor
            where v.tenantId = :tenantId
            order by v.usuario.nome
            """)
    List<VinculoUsuarioEmpresa> listarPorEmpresa(String tenantId);

    Optional<VinculoUsuarioEmpresa> findByUsuario_IdAndTenantId(Long usuarioId, String tenantId);

    Optional<VinculoUsuarioEmpresa> findByUsuario_IdAndTenantIdAndStatus(Long usuarioId, String tenantId, StatusAtivoInativo status);

    boolean existsByUsuario_IdAndTenantId(Long usuarioId, String tenantId);
}

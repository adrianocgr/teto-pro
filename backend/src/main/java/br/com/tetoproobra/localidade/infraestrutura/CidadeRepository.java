package br.com.tetoproobra.localidade.infraestrutura;

import br.com.tetoproobra.localidade.dominio.Cidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CidadeRepository extends JpaRepository<Cidade, Long> {

    List<Cidade> findByEstadoIdOrderByNomeAsc(Long estadoId);

    List<Cidade> findAllByOrderByNomeAsc();

    boolean existsByEstadoIdAndNomeIgnoreCase(Long estadoId, String nome);

    Optional<Cidade> findByEstadoIdAndNomeIgnoreCase(Long estadoId, String nome);

    long countByEstadoId(Long estadoId);
}

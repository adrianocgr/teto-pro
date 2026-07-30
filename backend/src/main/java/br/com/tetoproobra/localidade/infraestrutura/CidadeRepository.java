package br.com.tetoproobra.localidade.infraestrutura;

import br.com.tetoproobra.localidade.dominio.Cidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CidadeRepository extends JpaRepository<Cidade, Long> {

    List<Cidade> findByEstadoIdOrderByNomeAsc(Long estadoId);

    List<Cidade> findAllByOrderByNomeAsc();

    boolean existsByEstadoIdAndNomeIgnoreCase(Long estadoId, String nome);

    long countByEstadoId(Long estadoId);
}

package br.com.tetoproobra.localidade.infraestrutura;

import br.com.tetoproobra.localidade.dominio.Estado;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstadoRepository extends JpaRepository<Estado, Long> {

    Optional<Estado> findBySiglaIgnoreCase(String sigla);
}

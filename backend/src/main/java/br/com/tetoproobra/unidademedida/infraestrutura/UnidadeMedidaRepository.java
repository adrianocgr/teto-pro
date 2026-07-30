package br.com.tetoproobra.unidademedida.infraestrutura;

import br.com.tetoproobra.unidademedida.dominio.UnidadeMedida;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UnidadeMedidaRepository extends JpaRepository<UnidadeMedida, Long> {
}

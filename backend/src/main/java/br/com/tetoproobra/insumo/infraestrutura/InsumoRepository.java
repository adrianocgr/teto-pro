package br.com.tetoproobra.insumo.infraestrutura;

import br.com.tetoproobra.insumo.dominio.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InsumoRepository extends JpaRepository<Insumo, Long> {
}

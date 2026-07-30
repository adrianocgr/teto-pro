package br.com.tetoproobra.fornecedor.infraestrutura;

import br.com.tetoproobra.fornecedor.dominio.Representante;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepresentanteRepository extends JpaRepository<Representante, Long> {
}

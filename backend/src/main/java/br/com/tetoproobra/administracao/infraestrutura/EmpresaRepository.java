package br.com.tetoproobra.administracao.infraestrutura;

import br.com.tetoproobra.administracao.dominio.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmpresaRepository extends JpaRepository<Empresa, String> {

    boolean existsByIdIgnoreCase(String id);
}

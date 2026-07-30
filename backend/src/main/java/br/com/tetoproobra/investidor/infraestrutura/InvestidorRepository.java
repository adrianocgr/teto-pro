package br.com.tetoproobra.investidor.infraestrutura;

import br.com.tetoproobra.investidor.dominio.Investidor;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvestidorRepository extends JpaRepository<Investidor, Long> {

    Optional<Investidor> findByCpfCnpj(String cpfCnpj);

    Page<Investidor> findByNomeContainingIgnoreCase(String nome, Pageable pageable);
}

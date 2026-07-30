package br.com.tetoproobra.venda.infraestrutura;

import br.com.tetoproobra.venda.dominio.Venda;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendaRepository extends JpaRepository<Venda, Long> {

    Optional<Venda> findByEmpreendimentoId(Long empreendimentoId);
}

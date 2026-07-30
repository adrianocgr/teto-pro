package br.com.tetoproobra.despesa.infraestrutura;

import br.com.tetoproobra.despesa.dominio.DespesaRecorrente;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DespesaRecorrenteRepository extends JpaRepository<DespesaRecorrente, Long> {

    List<DespesaRecorrente> findByEmpreendimentoIdOrderByDescricaoAsc(Long empreendimentoId);
}

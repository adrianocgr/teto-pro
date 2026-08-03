package br.com.tetoproobra.despesa.infraestrutura;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import br.com.tetoproobra.despesa.dominio.DespesaRecorrente;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DespesaRecorrenteRepository extends JpaRepository<DespesaRecorrente, Long> {

    List<DespesaRecorrente> findByEmpreendimentoIdOrderByDescricaoAsc(Long empreendimentoId);

    /** Base do job noturno de lançamento automático — ver {@code LancamentoAutomaticoDespesaRecorrenteJob}. */
    List<DespesaRecorrente> findByStatusAndLancamentoAutomaticoTrue(StatusAtivoInativo status);
}

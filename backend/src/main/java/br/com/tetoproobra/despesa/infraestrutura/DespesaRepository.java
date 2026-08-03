package br.com.tetoproobra.despesa.infraestrutura;

import br.com.tetoproobra.despesa.dominio.Despesa;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * {@link JpaSpecificationExecutor} habilita a combinação dinâmica de filtros
 * opcionais (busca textual + períodos de lançamento/pagamento) na listagem —
 * ver {@link DespesaEspecificacoes} e {@code DespesaServico#listar}.
 */
public interface DespesaRepository extends JpaRepository<Despesa, Long>, JpaSpecificationExecutor<Despesa> {

    Page<Despesa> findByEmpreendimentoId(Long empreendimentoId, Pageable pageable);

    boolean existsByRecorrencia_IdAndCompetencia(Long recorrenciaId, LocalDate competencia);

    /**
     * Todas as despesas em que o investidor aparece como pagador (rateio) —
     * base para o extrato do investidor. O cálculo do extrato em si (soma por
     * empreendimento/período etc.) fica por conta de quem consumir esta lista;
     * este método só busca os dados brutos.
     */
    @Query("select d from Despesa d join d.pagadores p where p.investidor.id = :investidorId")
    List<Despesa> buscarPorInvestidorPagador(@Param("investidorId") Long investidorId);
}

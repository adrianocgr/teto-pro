package br.com.tetoproobra.despesa.infraestrutura;

import br.com.tetoproobra.despesa.dominio.Despesa;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DespesaRepository extends JpaRepository<Despesa, Long> {

    Page<Despesa> findByEmpreendimentoId(Long empreendimentoId, Pageable pageable);

    boolean existsByRecorrencia_IdAndCompetencia(Long recorrenciaId, LocalDate competencia);

    Page<Despesa> findByEmpreendimentoIdAndDescricaoContainingIgnoreCase(
            Long empreendimentoId, String descricao, Pageable pageable);

    /**
     * Todas as despesas em que o investidor aparece como pagador (rateio) —
     * base para o extrato do investidor. O cálculo do extrato em si (soma por
     * empreendimento/período etc.) fica por conta de quem consumir esta lista;
     * este método só busca os dados brutos.
     */
    @Query("select d from Despesa d join d.pagadores p where p.investidor.id = :investidorId")
    List<Despesa> buscarPorInvestidorPagador(@Param("investidorId") Long investidorId);
}

package br.com.tetoproobra.empreendimento.infraestrutura;

import br.com.tetoproobra.empreendimento.dominio.Empreendimento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmpreendimentoRepository extends JpaRepository<Empreendimento, Long> {

    Page<Empreendimento> findByDescricaoContainingIgnoreCase(String descricao, Pageable pageable);

    @Query("select distinct e from Empreendimento e join e.participacoes p where p.investidor.id = :investidorId")
    Page<Empreendimento> buscarPorInvestidor(@Param("investidorId") Long investidorId, Pageable pageable);
}

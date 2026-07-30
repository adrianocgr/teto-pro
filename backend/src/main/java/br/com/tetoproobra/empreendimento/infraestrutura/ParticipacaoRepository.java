package br.com.tetoproobra.empreendimento.infraestrutura;

import br.com.tetoproobra.empreendimento.dominio.Participacao;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParticipacaoRepository extends JpaRepository<Participacao, Long> {

    List<Participacao> findByEmpreendimentoId(Long empreendimentoId);

    boolean existsByEmpreendimentoIdAndInvestidorId(Long empreendimentoId, Long investidorId);
}

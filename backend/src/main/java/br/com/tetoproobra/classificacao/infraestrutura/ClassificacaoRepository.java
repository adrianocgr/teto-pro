package br.com.tetoproobra.classificacao.infraestrutura;

import br.com.tetoproobra.classificacao.dominio.Classificacao;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassificacaoRepository extends JpaRepository<Classificacao, Long> {
}

package br.com.tetoproobra.despesa.infraestrutura;

import br.com.tetoproobra.despesa.dominio.PagadorDespesa;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Uso interno do domínio Despesa — os pagadores são sempre manipulados
 * através do agregado {@link br.com.tetoproobra.despesa.dominio.Despesa}
 * (cascade), nunca diretamente por um controller.
 */
public interface PagadorDespesaRepository extends JpaRepository<PagadorDespesa, Long> {
}

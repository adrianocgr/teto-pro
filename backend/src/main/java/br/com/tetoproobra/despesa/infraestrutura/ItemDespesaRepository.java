package br.com.tetoproobra.despesa.infraestrutura;

import br.com.tetoproobra.despesa.dominio.ItemDespesa;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Uso interno do domínio Despesa — os itens são sempre manipulados através do
 * agregado {@link br.com.tetoproobra.despesa.dominio.Despesa} (cascade),
 * nunca diretamente por um controller.
 */
public interface ItemDespesaRepository extends JpaRepository<ItemDespesa, Long> {
}

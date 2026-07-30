package br.com.tetoproobra.despesa.infraestrutura;

import br.com.tetoproobra.despesa.dominio.DespesaDocumento;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Uso interno do domínio Despesa — manipulado por
 * {@link br.com.tetoproobra.despesa.aplicacao.DespesaServico}, nunca
 * diretamente por um controller.
 */
public interface DespesaDocumentoRepository extends JpaRepository<DespesaDocumento, Long> {
}

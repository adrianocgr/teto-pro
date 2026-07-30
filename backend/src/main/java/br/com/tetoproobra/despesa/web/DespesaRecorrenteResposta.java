package br.com.tetoproobra.despesa.web;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DespesaRecorrenteResposta(
        Long id,
        Long empreendimentoId,
        Long categoriaId,
        String categoriaDescricao,
        Long fornecedorId,
        String fornecedorNome,
        String descricao,
        String observacao,
        BigDecimal valorPadrao,
        Integer diaVencimento,
        StatusAtivoInativo status,
        List<PagadorRecorrenteResposta> pagadores,
        LocalDate ultimaCompetencia,
        BigDecimal ultimoValor
) {
}

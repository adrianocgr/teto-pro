package br.com.tetoproobra.despesa.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ImportacaoNfeResposta(
        Long fornecedorId,
        String fornecedorNome,
        boolean fornecedorNovo,
        String descricaoSugerida,
        BigDecimal valorTotal,
        BigDecimal desconto,
        LocalDate dataEmissao,
        String numeroNota,
        String chaveAcesso,
        List<ItemNfeResposta> itens
) {
}

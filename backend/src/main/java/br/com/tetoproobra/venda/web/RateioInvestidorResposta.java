package br.com.tetoproobra.venda.web;

import java.math.BigDecimal;

/**
 * Parcela do lucro da venda que cabe a um investidor, proporcional ao seu
 * percentual de participação no empreendimento.
 */
public record RateioInvestidorResposta(
        Long investidorId,
        String investidorNome,
        BigDecimal percentual,
        // TODO: somar via PagadorDespesa quando o domínio Despesa expuser essa consulta
        BigDecimal totalInvestido,
        BigDecimal lucroRateado
) {
}

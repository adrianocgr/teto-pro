package br.com.tetoproobra.venda.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Fechamento financeiro completo de um empreendimento vendido: lucro apurado
 * (valor de venda menos custos da obra, comissão de corretor e custos
 * adicionais) e o rateio desse lucro entre os investidores participantes.
 */
public record FechamentoResposta(
        Long empreendimentoId,
        String empreendimentoDescricao,
        LocalDate dataVenda,
        String comprador,
        BigDecimal valorVenda,
        BigDecimal totalGasto,
        BigDecimal comissaoCorretor,
        BigDecimal custosVendaAdicionais,
        BigDecimal lucro,
        List<RateioInvestidorResposta> rateio
) {
}

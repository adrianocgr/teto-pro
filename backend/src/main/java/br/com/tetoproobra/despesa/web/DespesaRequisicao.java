package br.com.tetoproobra.despesa.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * {@code valorTotal} só é considerado quando {@code itens} vem vazio/nulo —
 * quando há itens, o valor total é sempre recalculado a partir deles (fonte
 * da verdade), e este campo é ignorado (ver
 * {@link br.com.tetoproobra.despesa.aplicacao.DespesaServico}).
 * <p>
 * {@code recorrenciaId}/{@code competencia} só são usados na CRIAÇÃO, quando
 * a despesa está sendo "lançada" a partir de uma
 * {@link br.com.tetoproobra.despesa.dominio.DespesaRecorrente} — os dois
 * precisam vir juntos (ou nenhum). Ignorados em atualização.
 */
public record DespesaRequisicao(

        @NotNull(message = "O empreendimento é obrigatório")
        Long empreendimentoId,

        @NotNull(message = "A categoria é obrigatória")
        Long categoriaId,

        Long fornecedorId,

        @NotBlank(message = "A descrição é obrigatória")
        String descricao,

        String observacao,

        BigDecimal valorTotal,

        @Valid
        List<ItemRequisicao> itens,

        @Valid
        List<PagadorRequisicao> pagadores,

        Long recorrenciaId,

        LocalDate competencia
) {
}

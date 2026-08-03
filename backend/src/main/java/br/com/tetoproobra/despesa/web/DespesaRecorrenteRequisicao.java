package br.com.tetoproobra.despesa.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

/** {@code valorPadrao} e {@code diaVencimento} são só sugestão/informativo — opcionais. */
public record DespesaRecorrenteRequisicao(

        @NotNull(message = "A categoria é obrigatória")
        Long categoriaId,

        Long fornecedorId,

        @NotBlank(message = "A descrição é obrigatória")
        String descricao,

        String observacao,

        BigDecimal valorPadrao,

        Integer diaVencimento,

        /** Se {@code true}, exige {@code valorPadrao} preenchido — ver {@code DespesaRecorrenteServico}. */
        boolean lancamentoAutomatico,

        @Valid
        List<PagadorRecorrenteRequisicao> pagadores
) {
}

package br.com.tetoproobra.despesa.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DespesaResposta(
        Long id,
        Long empreendimentoId,
        String empreendimentoDescricao,
        Long categoriaId,
        String categoriaDescricao,
        Long fornecedorId,
        String fornecedorNome,
        String descricao,
        String observacao,
        BigDecimal valorTotal,
        LocalDate dataCadastro,
        LocalDate dataAlteracao,
        String usuarioCadastroNome,
        String usuarioAlteracaoNome,
        List<ItemResposta> itens,
        List<PagadorResposta> pagadores,
        List<DocumentoResposta> documentos,
        Long recorrenciaId,
        LocalDate competencia
) {
}

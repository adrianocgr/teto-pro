package br.com.tetoproobra.despesa.web;

import br.com.tetoproobra.despesa.dominio.Despesa;
import br.com.tetoproobra.despesa.dominio.DespesaDocumento;
import br.com.tetoproobra.despesa.dominio.ItemDespesa;
import br.com.tetoproobra.despesa.dominio.PagadorDespesa;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Conversão entidade → resposta. A conversão requisição → entidade não é
 * feita aqui: envolve buscar Insumo/Investidor por id e recalcular o valor
 * total, então fica explícita em {@link br.com.tetoproobra.despesa.aplicacao.DespesaServico}.
 */
@Mapper(componentModel = "spring")
public interface DespesaMapper {

    @Mapping(target = "empreendimentoId", source = "empreendimento.id")
    @Mapping(target = "empreendimentoDescricao", source = "empreendimento.descricao")
    @Mapping(target = "categoriaId", source = "categoria.id")
    @Mapping(target = "categoriaDescricao", source = "categoria.descricao")
    @Mapping(target = "fornecedorId", source = "fornecedor.id")
    @Mapping(target = "fornecedorNome", source = "fornecedor.razaoSocial")
    @Mapping(target = "usuarioCadastroNome", source = "usuarioCadastro.nome")
    @Mapping(target = "usuarioAlteracaoNome", source = "usuarioAlteracao.nome")
    @Mapping(target = "recorrenciaId", source = "recorrencia.id")
    DespesaResposta paraResposta(Despesa despesa);

    List<DespesaResposta> paraRespostaLista(List<Despesa> despesas);

    @Mapping(target = "insumoId", source = "insumo.id")
    @Mapping(target = "insumoDescricao", source = "insumo.descricao")
    @Mapping(target = "unidadeSigla", source = "insumo.unidadeMedida.sigla")
    ItemResposta paraResposta(ItemDespesa item);

    List<ItemResposta> paraRespostaItens(List<ItemDespesa> itens);

    @Mapping(target = "investidorId", source = "investidor.id")
    @Mapping(target = "investidorNome", source = "investidor.nome")
    PagadorResposta paraResposta(PagadorDespesa pagador);

    List<PagadorResposta> paraRespostaPagadores(List<PagadorDespesa> pagadores);

    DocumentoResposta paraResposta(DespesaDocumento documento);

    List<DocumentoResposta> paraRespostaDocumentos(List<DespesaDocumento> documentos);
}

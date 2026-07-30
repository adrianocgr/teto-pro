package br.com.tetoproobra.despesa.web;

import br.com.tetoproobra.despesa.dominio.DespesaRecorrente;
import br.com.tetoproobra.despesa.dominio.PagadorRecorrente;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DespesaRecorrenteMapper {

    @Mapping(target = "empreendimentoId", source = "empreendimento.id")
    @Mapping(target = "categoriaId", source = "categoria.id")
    @Mapping(target = "categoriaDescricao", source = "categoria.descricao")
    @Mapping(target = "fornecedorId", source = "fornecedor.id")
    @Mapping(target = "fornecedorNome", source = "fornecedor.razaoSocial")
    DespesaRecorrenteResposta paraResposta(DespesaRecorrente recorrente);

    List<DespesaRecorrenteResposta> paraRespostaLista(List<DespesaRecorrente> recorrentes);

    @Mapping(target = "investidorId", source = "investidor.id")
    @Mapping(target = "investidorNome", source = "investidor.nome")
    PagadorRecorrenteResposta paraResposta(PagadorRecorrente pagador);

    List<PagadorRecorrenteResposta> paraRespostaPagadores(List<PagadorRecorrente> pagadores);
}

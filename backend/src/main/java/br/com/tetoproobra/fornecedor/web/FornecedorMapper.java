package br.com.tetoproobra.fornecedor.web;

import br.com.tetoproobra.fornecedor.dominio.Fornecedor;
import br.com.tetoproobra.fornecedor.dominio.Representante;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface FornecedorMapper {

    @Mapping(target = "cidadeId", source = "cidade.id")
    @Mapping(target = "cidadeNome", source = "cidade.nome")
    @Mapping(target = "estadoSigla", source = "cidade.estado.sigla")
    FornecedorResposta toResposta(Fornecedor fornecedor);

    List<FornecedorResposta> toRespostas(List<Fornecedor> fornecedores);

    RepresentanteResposta toResposta(Representante representante);

    List<RepresentanteResposta> toRespostasRepresentantes(List<Representante> representantes);

    /**
     * Mapeia apenas os campos escalares simples da requisição para a entidade.
     * Cidade, status e representantes são resolvidos no serviço, pois exigem
     * consulta a outro repositório ou regra de sincronização de coleção.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "cidade", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "representantes", ignore = true)
    void atualizarDadosBasicos(FornecedorRequisicao requisicao, @MappingTarget Fornecedor fornecedor);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "fornecedor", ignore = true)
    Representante toEntidade(RepresentanteRequisicao requisicao);
}

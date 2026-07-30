package br.com.tetoproobra.insumo.web;

import br.com.tetoproobra.insumo.dominio.Insumo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InsumoMapper {

    @Mapping(target = "unidadeMedidaId", source = "unidadeMedida.id")
    @Mapping(target = "unidadeMedidaSigla", source = "unidadeMedida.sigla")
    @Mapping(target = "classificacaoId", source = "classificacao.id")
    @Mapping(target = "classificacaoDescricao", source = "classificacao.descricao")
    InsumoResposta paraResposta(Insumo insumo);
}

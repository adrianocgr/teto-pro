package br.com.tetoproobra.categoria.web;

import br.com.tetoproobra.categoria.dominio.Categoria;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CategoriaMapper {

    @Mapping(target = "categoriaPaiId", source = "categoriaPai.id")
    @Mapping(target = "categoriaPaiDescricao", source = "categoriaPai.descricao")
    CategoriaResposta paraResposta(Categoria categoria);
}

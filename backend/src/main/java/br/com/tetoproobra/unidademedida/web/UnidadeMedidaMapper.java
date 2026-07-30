package br.com.tetoproobra.unidademedida.web;

import br.com.tetoproobra.unidademedida.dominio.UnidadeMedida;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UnidadeMedidaMapper {

    UnidadeMedidaResposta paraResposta(UnidadeMedida unidadeMedida);
}

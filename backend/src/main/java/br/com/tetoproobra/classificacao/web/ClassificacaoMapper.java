package br.com.tetoproobra.classificacao.web;

import br.com.tetoproobra.classificacao.dominio.Classificacao;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ClassificacaoMapper {

    ClassificacaoResposta paraResposta(Classificacao classificacao);
}

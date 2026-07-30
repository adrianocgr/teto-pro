package br.com.tetoproobra.venda.web;

import br.com.tetoproobra.venda.dominio.Venda;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface VendaMapper {

    @Mapping(target = "empreendimentoId", source = "empreendimento.id")
    VendaResposta paraResposta(Venda venda);
}

package br.com.tetoproobra.investidor.web;

import br.com.tetoproobra.investidor.dominio.Investidor;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface InvestidorMapper {

    InvestidorResposta paraResposta(Investidor investidor);
}

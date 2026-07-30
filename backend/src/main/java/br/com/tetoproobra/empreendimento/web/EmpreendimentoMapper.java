package br.com.tetoproobra.empreendimento.web;

import br.com.tetoproobra.empreendimento.dominio.Empreendimento;
import br.com.tetoproobra.empreendimento.dominio.Participacao;
import java.math.BigDecimal;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EmpreendimentoMapper {

    @Mapping(target = "somaPercentuais", expression = "java(somarPercentuais(empreendimento.getParticipacoes()))")
    EmpreendimentoResposta paraResposta(Empreendimento empreendimento);

    List<ParticipacaoResposta> paraRespostaLista(List<Participacao> participacoes);

    @Mapping(target = "investidorId", source = "investidor.id")
    @Mapping(target = "investidorNome", source = "investidor.nome")
    ParticipacaoResposta paraResposta(Participacao participacao);

    default BigDecimal somarPercentuais(List<Participacao> participacoes) {
        if (participacoes == null || participacoes.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return participacoes.stream()
                .map(participacao -> participacao.getPercentual() != null ? participacao.getPercentual() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}

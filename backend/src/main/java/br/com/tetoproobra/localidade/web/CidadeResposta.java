package br.com.tetoproobra.localidade.web;

import br.com.tetoproobra.localidade.dominio.Cidade;

public record CidadeResposta(
        Long id,
        String nome,
        Long estadoId,
        String estadoSigla
) {

    public static CidadeResposta de(Cidade cidade) {
        return new CidadeResposta(
                cidade.getId(),
                cidade.getNome(),
                cidade.getEstado().getId(),
                cidade.getEstado().getSigla());
    }
}

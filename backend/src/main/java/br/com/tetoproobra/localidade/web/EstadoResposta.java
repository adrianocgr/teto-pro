package br.com.tetoproobra.localidade.web;

import br.com.tetoproobra.localidade.dominio.Estado;

public record EstadoResposta(
        Long id,
        String nome,
        String sigla
) {

    public static EstadoResposta de(Estado estado) {
        return new EstadoResposta(estado.getId(), estado.getNome(), estado.getSigla());
    }
}

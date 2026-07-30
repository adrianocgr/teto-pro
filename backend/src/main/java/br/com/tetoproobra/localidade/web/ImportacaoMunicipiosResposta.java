package br.com.tetoproobra.localidade.web;

public record ImportacaoMunicipiosResposta(
        Long estadoId,
        String estadoNome,
        String estadoSigla,
        int totalMunicipiosNoIbge,
        int totalImportados,
        int totalJaExistentes
) {
}

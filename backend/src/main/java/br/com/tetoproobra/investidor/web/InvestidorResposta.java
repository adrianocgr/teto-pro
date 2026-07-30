package br.com.tetoproobra.investidor.web;

import br.com.tetoproobra.compartilhado.dominio.TipoPessoa;

public record InvestidorResposta(
        Long id,
        String nome,
        String cpfCnpj,
        TipoPessoa tipoPessoa,
        String email,
        String telefone,
        String observacoes
) {
}

package br.com.tetoproobra.investidor.web;

import br.com.tetoproobra.compartilhado.dominio.TipoPessoa;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InvestidorRequisicao(

        @NotBlank(message = "O nome é obrigatório")
        String nome,

        @NotBlank(message = "O CPF/CNPJ é obrigatório")
        String cpfCnpj,

        @NotNull(message = "O tipo de pessoa é obrigatório")
        TipoPessoa tipoPessoa,

        @Email(message = "O e-mail informado é inválido")
        String email,

        String telefone,

        String observacoes
) {
}

package br.com.tetoproobra.fornecedor.web;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record FornecedorRequisicao(

        @NotBlank(message = "Razão social é obrigatória")
        String razaoSocial,

        @NotBlank(message = "CNPJ/CPF é obrigatório")
        String cnpjCpf,

        @Email(message = "E-mail inválido")
        String email,

        String telefone,

        String logradouro,

        String numero,

        String complemento,

        String bairro,

        String cep,

        Long cidadeId,

        StatusAtivoInativo status,

        @Valid
        List<RepresentanteRequisicao> representantes
) {
}

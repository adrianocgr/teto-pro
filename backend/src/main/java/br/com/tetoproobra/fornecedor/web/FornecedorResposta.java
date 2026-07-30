package br.com.tetoproobra.fornecedor.web;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;

import java.util.List;

public record FornecedorResposta(
        Long id,
        String razaoSocial,
        String cnpjCpf,
        String email,
        String telefone,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String cep,
        Long cidadeId,
        String cidadeNome,
        String estadoSigla,
        StatusAtivoInativo status,
        List<RepresentanteResposta> representantes
) {
}

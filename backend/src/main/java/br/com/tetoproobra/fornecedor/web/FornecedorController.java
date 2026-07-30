package br.com.tetoproobra.fornecedor.web;

import br.com.tetoproobra.fornecedor.aplicacao.FornecedorServico;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/fornecedores")
@RequiredArgsConstructor
public class FornecedorController {

    private final FornecedorServico fornecedorServico;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR','INVESTIDOR_VISUALIZADOR')")
    public Page<FornecedorResposta> listar(@RequestParam(required = false) String busca,
                                            @ParameterObject Pageable pageable) {
        return fornecedorServico.listar(busca, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR','INVESTIDOR_VISUALIZADOR')")
    public FornecedorResposta buscarPorId(@PathVariable Long id) {
        return fornecedorServico.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public FornecedorResposta criar(@RequestBody @Valid FornecedorRequisicao requisicao) {
        return fornecedorServico.criar(requisicao);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public FornecedorResposta atualizar(@PathVariable Long id, @RequestBody @Valid FornecedorRequisicao requisicao) {
        return fornecedorServico.atualizar(id, requisicao);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        fornecedorServico.excluir(id);
    }

    @PostMapping("/{id}/representantes")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public FornecedorResposta adicionarRepresentante(@PathVariable Long id,
                                                       @RequestBody @Valid RepresentanteRequisicao requisicao) {
        return fornecedorServico.adicionarRepresentante(id, requisicao);
    }

    @DeleteMapping("/{id}/representantes/{representanteId}")
    @PreAuthorize("hasRole('ADMIN')")
    public FornecedorResposta removerRepresentante(@PathVariable Long id, @PathVariable Long representanteId) {
        return fornecedorServico.removerRepresentante(id, representanteId);
    }
}

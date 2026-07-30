package br.com.tetoproobra.usuario.web;

import br.com.tetoproobra.usuario.aplicacao.UsuarioContextoServico;
import br.com.tetoproobra.usuario.aplicacao.UsuarioServico;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioServico servico;
    private final UsuarioContextoServico contextoServico;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UsuarioResposta> listar() {
        return servico.listar();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResposta buscarPorId(@PathVariable Long id) {
        return servico.buscarPorId(id);
    }

    /**
     * Empresas às quais o usuário autenticado está vinculado — é assim que o
     * frontend monta o seletor de empresa logo após o login, antes de saber
     * qual X-Tenant-Id enviar nas próximas chamadas.
     */
    @GetMapping("/minhas-empresas")
    @PreAuthorize("isAuthenticated()")
    public List<MinhaEmpresaResposta> listarMinhasEmpresas() {
        return contextoServico.listarMinhasEmpresas();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResposta criar(@Valid @RequestBody UsuarioRequisicao requisicao) {
        return servico.criar(requisicao);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResposta atualizar(@PathVariable Long id, @Valid @RequestBody UsuarioRequisicao requisicao) {
        return servico.atualizar(id, requisicao);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        servico.excluir(id);
    }
}

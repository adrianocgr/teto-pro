package br.com.tetoproobra.administracao.web;

import br.com.tetoproobra.administracao.aplicacao.EmpresaServico;
import br.com.tetoproobra.administracao.dominio.Empresa;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Cadastro de empresas (tenants) — restrito ao administrador da plataforma,
 * que não pertence a nenhuma empresa e por isso precisa de uma visão acima
 * do isolamento multi-tenant normal do sistema.
 */
@RestController
@RequestMapping("/administracao/empresas")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PLATAFORMA_ADMIN')")
public class EmpresaController {

    private final EmpresaServico empresaServico;

    @Operation(summary = "Lista todas as empresas da plataforma")
    @GetMapping
    public List<EmpresaResposta> listar() {
        return empresaServico.listar().stream().map(this::paraResposta).toList();
    }

    @Operation(summary = "Busca uma empresa por id")
    @GetMapping("/{id}")
    public EmpresaResposta buscarPorId(@PathVariable String id) {
        return paraResposta(empresaServico.buscarPorId(id));
    }

    @Operation(summary = "Cadastra uma nova empresa — o id é gerado a partir do nome")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EmpresaResposta criar(@Valid @RequestBody EmpresaRequisicao requisicao) {
        return paraResposta(empresaServico.criar(requisicao.nome()));
    }

    @Operation(summary = "Atualiza o nome de uma empresa")
    @PutMapping("/{id}")
    public EmpresaResposta atualizar(@PathVariable String id, @Valid @RequestBody EmpresaRequisicao requisicao) {
        return paraResposta(empresaServico.atualizar(id, requisicao.nome()));
    }

    @Operation(summary = "Inativa uma empresa")
    @PatchMapping("/{id}/inativar")
    public EmpresaResposta inativar(@PathVariable String id) {
        return paraResposta(empresaServico.inativar(id));
    }

    @Operation(summary = "Reativa uma empresa")
    @PatchMapping("/{id}/reativar")
    public EmpresaResposta reativar(@PathVariable String id) {
        return paraResposta(empresaServico.reativar(id));
    }

    private EmpresaResposta paraResposta(Empresa empresa) {
        return new EmpresaResposta(empresa.getId(), empresa.getNome(), empresa.getStatus());
    }
}

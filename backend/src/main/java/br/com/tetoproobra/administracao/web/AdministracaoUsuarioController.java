package br.com.tetoproobra.administracao.web;

import br.com.tetoproobra.administracao.aplicacao.AdministracaoUsuarioServico;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Cadastro de usuários e vínculos com empresas — restrito ao administrador da
 * plataforma. Uma pessoa é uma única identidade global; pode estar vinculada
 * a mais de uma empresa (ver {@link br.com.tetoproobra.usuario.dominio.VinculoUsuarioEmpresa}),
 * cada vínculo com seu próprio papel.
 */
@RestController
@RequestMapping("/administracao/usuarios")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PLATAFORMA_ADMIN')")
public class AdministracaoUsuarioController {

    private final AdministracaoUsuarioServico administracaoUsuarioServico;

    @Operation(summary = "Lista pessoas — todas, ou só as vinculadas a uma empresa específica via ?tenantId=")
    @GetMapping
    public List<UsuarioAdminResposta> listar(@RequestParam(required = false) String tenantId) {
        return administracaoUsuarioServico.listar(tenantId);
    }

    @Operation(summary = "Busca uma pessoa por id, com todas as empresas às quais está vinculada")
    @GetMapping("/{id}")
    public UsuarioAdminResposta buscarPorId(@PathVariable Long id) {
        return administracaoUsuarioServico.buscarPorId(id);
    }

    @Operation(summary = "Cadastra uma pessoa (ou reaproveita uma já existente) e cria seu primeiro vínculo com uma empresa")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioAdminResposta criar(@Valid @RequestBody UsuarioAdminRequisicao requisicao) {
        return administracaoUsuarioServico.criar(requisicao);
    }

    @Operation(summary = "Atualiza os dados globais da pessoa (nome/username/email) — não altera vínculos")
    @PutMapping("/{id}")
    public UsuarioAdminResposta atualizar(@PathVariable Long id, @Valid @RequestBody UsuarioAdminAtualizarRequisicao requisicao) {
        return administracaoUsuarioServico.atualizar(id, requisicao);
    }

    @Operation(summary = "Exclui a pessoa e todos os seus vínculos")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        administracaoUsuarioServico.excluir(id);
    }

    @Operation(summary = "Vincula a pessoa a mais uma empresa")
    @PostMapping("/{id}/empresas")
    public UsuarioAdminResposta adicionarVinculo(@PathVariable Long id, @Valid @RequestBody VincularEmpresaRequisicao requisicao) {
        return administracaoUsuarioServico.adicionarVinculo(id, requisicao.tenantId(), requisicao.papel(), requisicao.investidorId());
    }

    @Operation(summary = "Muda o papel da pessoa numa empresa à qual já está vinculada")
    @PutMapping("/{id}/empresas/{tenantId}")
    public UsuarioAdminResposta atualizarVinculo(@PathVariable Long id, @PathVariable String tenantId,
                                                   @Valid @RequestBody AtualizarPapelRequisicao requisicao) {
        return administracaoUsuarioServico.atualizarVinculo(id, tenantId, requisicao.papel(), requisicao.investidorId());
    }

    @Operation(summary = "Remove o vínculo da pessoa com uma empresa")
    @DeleteMapping("/{id}/empresas/{tenantId}")
    public UsuarioAdminResposta removerVinculo(@PathVariable Long id, @PathVariable String tenantId) {
        return administracaoUsuarioServico.removerVinculo(id, tenantId);
    }
}

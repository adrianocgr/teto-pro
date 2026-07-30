package br.com.tetoproobra.empreendimento.web;

import br.com.tetoproobra.empreendimento.aplicacao.EmpreendimentoServico;
import br.com.tetoproobra.usuario.aplicacao.UsuarioContextoServico;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
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

/**
 * Quando o usuário autenticado tem o papel INVESTIDOR_VISUALIZADOR, o escopo de
 * leitura é restrito aos empreendimentos em que o investidor associado a ele
 * participa (ver {@link UsuarioContextoServico}).
 */
@RestController
@RequestMapping("/empreendimentos")
@RequiredArgsConstructor
public class EmpreendimentoController {

    private final EmpreendimentoServico servico;
    private final UsuarioContextoServico usuarioContextoServico;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR','INVESTIDOR_VISUALIZADOR')")
    public Page<EmpreendimentoResposta> listar(
            @RequestParam(required = false) String busca, @ParameterObject Pageable pageable) {
        if (usuarioContextoServico.usuarioAtualEhInvestidor()) {
            return servico.listarPorInvestidor(usuarioContextoServico.investidorIdDoUsuarioAtual(), pageable);
        }
        return servico.listar(busca, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR','INVESTIDOR_VISUALIZADOR')")
    public EmpreendimentoResposta buscarPorId(@PathVariable Long id) {
        validarEscopoDoInvestidor(id);
        return servico.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public EmpreendimentoResposta criar(@Valid @RequestBody EmpreendimentoRequisicao requisicao) {
        return servico.criar(requisicao);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public EmpreendimentoResposta atualizar(
            @PathVariable Long id, @Valid @RequestBody EmpreendimentoRequisicao requisicao) {
        return servico.atualizar(id, requisicao);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        servico.excluir(id);
    }

    @GetMapping("/{id}/participacoes")
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR','INVESTIDOR_VISUALIZADOR')")
    public List<ParticipacaoResposta> listarParticipacoes(@PathVariable Long id) {
        validarEscopoDoInvestidor(id);
        return servico.listarParticipacoes(id);
    }

    @PostMapping("/{id}/participacoes")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ParticipacaoResposta adicionarParticipacao(
            @PathVariable Long id, @Valid @RequestBody ParticipacaoRequisicao requisicao) {
        return servico.adicionarParticipacao(id, requisicao);
    }

    @PutMapping("/{id}/participacoes/{participacaoId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ParticipacaoResposta atualizarParticipacao(
            @PathVariable Long id,
            @PathVariable Long participacaoId,
            @Valid @RequestBody ParticipacaoRequisicao requisicao) {
        return servico.atualizarParticipacao(id, participacaoId, requisicao);
    }

    @DeleteMapping("/{id}/participacoes/{participacaoId}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removerParticipacao(@PathVariable Long id, @PathVariable Long participacaoId) {
        servico.removerParticipacao(id, participacaoId);
    }

    private void validarEscopoDoInvestidor(Long empreendimentoId) {
        if (!usuarioContextoServico.usuarioAtualEhInvestidor()) {
            return;
        }
        Long investidorId = usuarioContextoServico.investidorIdDoUsuarioAtual();
        if (!servico.investidorParticipaDoEmpreendimento(empreendimentoId, investidorId)) {
            throw new AccessDeniedException("Você não participa deste empreendimento");
        }
    }
}

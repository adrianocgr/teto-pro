package br.com.tetoproobra.venda.web;

import br.com.tetoproobra.venda.aplicacao.VendaServico;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/empreendimentos/{empreendimentoId}/venda")
@RequiredArgsConstructor
public class VendaController {

    private final VendaServico servico;
    private final VendaMapper mapper;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public VendaResposta registrar(
            @PathVariable Long empreendimentoId, @Valid @RequestBody VendaRequisicao requisicao) {
        return mapper.paraResposta(servico.registrar(empreendimentoId, requisicao));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public VendaResposta atualizar(
            @PathVariable Long empreendimentoId, @Valid @RequestBody VendaRequisicao requisicao) {
        return mapper.paraResposta(servico.atualizar(empreendimentoId, requisicao));
    }

    @GetMapping("/fechamento")
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR','INVESTIDOR_VISUALIZADOR')")
    public FechamentoResposta buscarFechamento(@PathVariable Long empreendimentoId) {
        return servico.buscarFechamento(empreendimentoId);
    }
}

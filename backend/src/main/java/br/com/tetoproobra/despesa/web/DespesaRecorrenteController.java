package br.com.tetoproobra.despesa.web;

import br.com.tetoproobra.despesa.aplicacao.DespesaRecorrenteServico;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/empreendimentos/{empreendimentoId}/despesas-recorrentes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
public class DespesaRecorrenteController {

    private final DespesaRecorrenteServico servico;

    @GetMapping
    public List<DespesaRecorrenteResposta> listar(@PathVariable Long empreendimentoId) {
        return servico.listar(empreendimentoId);
    }

    @GetMapping("/{id}")
    public DespesaRecorrenteResposta buscarPorId(@PathVariable Long empreendimentoId, @PathVariable Long id) {
        return servico.buscarPorId(empreendimentoId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DespesaRecorrenteResposta criar(
            @PathVariable Long empreendimentoId, @Valid @RequestBody DespesaRecorrenteRequisicao requisicao) {
        return servico.criar(empreendimentoId, requisicao);
    }

    @PutMapping("/{id}")
    public DespesaRecorrenteResposta atualizar(
            @PathVariable Long empreendimentoId, @PathVariable Long id,
            @Valid @RequestBody DespesaRecorrenteRequisicao requisicao) {
        return servico.atualizar(empreendimentoId, id, requisicao);
    }

    @PatchMapping("/{id}/inativar")
    public DespesaRecorrenteResposta inativar(@PathVariable Long empreendimentoId, @PathVariable Long id) {
        return servico.inativar(empreendimentoId, id);
    }

    @PatchMapping("/{id}/reativar")
    public DespesaRecorrenteResposta reativar(@PathVariable Long empreendimentoId, @PathVariable Long id) {
        return servico.reativar(empreendimentoId, id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long empreendimentoId, @PathVariable Long id) {
        servico.excluir(empreendimentoId, id);
    }
}

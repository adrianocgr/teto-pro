package br.com.tetoproobra.administracao.web;

import br.com.tetoproobra.localidade.aplicacao.ImportacaoLocalidadeServico;
import br.com.tetoproobra.localidade.web.ImportacaoMunicipiosRequisicao;
import br.com.tetoproobra.localidade.web.ImportacaoMunicipiosResposta;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Importação do cadastro de localidades (Estado/Cidade) via API pública do
 * IBGE — restrito ao administrador da plataforma, já que é um cadastro
 * global (entre empresas).
 */
@RestController
@RequestMapping("/administracao/localidades")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PLATAFORMA_ADMIN')")
public class AdministracaoLocalidadeController {

    private final ImportacaoLocalidadeServico importacaoLocalidadeServico;

    @Operation(summary = "Cadastra o estado (se necessário) e todos os seus municípios a partir da sigla, via IBGE")
    @PostMapping("/importar-municipios")
    public ImportacaoMunicipiosResposta importarMunicipios(@Valid @RequestBody ImportacaoMunicipiosRequisicao requisicao) {
        return importacaoLocalidadeServico.importarMunicipiosDoEstado(requisicao.siglaUf());
    }
}

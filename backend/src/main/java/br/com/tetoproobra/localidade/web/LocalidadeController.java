package br.com.tetoproobra.localidade.web;

import br.com.tetoproobra.localidade.aplicacao.LocalidadeServico;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class LocalidadeController {

    private final LocalidadeServico localidadeServico;

    @GetMapping("/estados")
    @PreAuthorize("isAuthenticated()")
    public List<EstadoResposta> listarEstados() {
        return localidadeServico.listarEstados();
    }

    @GetMapping("/cidades")
    @PreAuthorize("isAuthenticated()")
    public List<CidadeResposta> listarCidades(@RequestParam(required = false) Long estadoId) {
        return localidadeServico.listarCidades(estadoId);
    }
}

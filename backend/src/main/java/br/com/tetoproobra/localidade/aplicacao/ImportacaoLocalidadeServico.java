package br.com.tetoproobra.localidade.aplicacao;

import br.com.tetoproobra.localidade.dominio.Cidade;
import br.com.tetoproobra.localidade.dominio.Estado;
import br.com.tetoproobra.localidade.infraestrutura.CidadeRepository;
import br.com.tetoproobra.localidade.infraestrutura.EstadoRepository;
import br.com.tetoproobra.localidade.infraestrutura.IbgeClient;
import br.com.tetoproobra.localidade.web.ImportacaoMunicipiosResposta;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RegraDeNegocioException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;

/**
 * Importação de município via API pública do IBGE — separada de
 * {@link LocalidadeServico} (que é somente leitura) porque só a área de
 * administração da plataforma pode disparar isso. Dada a sigla de um estado,
 * cadastra o estado (se ainda não existir) e todos os seus municípios,
 * pulando os que já foram importados antes (idempotente — pode rodar de novo
 * sem duplicar).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ImportacaoLocalidadeServico {

    private final EstadoRepository estadoRepository;
    private final CidadeRepository cidadeRepository;
    private final IbgeClient ibgeClient;

    public ImportacaoMunicipiosResposta importarMunicipiosDoEstado(String siglaUf) {
        IbgeClient.EstadoIbge estadoIbge;
        try {
            estadoIbge = ibgeClient.buscarEstado(siglaUf);
        } catch (HttpClientErrorException.NotFound ex) {
            throw new RegraDeNegocioException("Sigla de estado inválida: " + siglaUf.toUpperCase());
        }

        Estado estado = estadoRepository.findBySiglaIgnoreCase(estadoIbge.sigla())
                .orElseGet(() -> estadoRepository.save(
                        Estado.builder().nome(estadoIbge.nome()).sigla(estadoIbge.sigla().toUpperCase()).build()));

        List<IbgeClient.MunicipioIbge> municipios = ibgeClient.listarMunicipios(siglaUf);

        int importados = 0;
        for (IbgeClient.MunicipioIbge municipio : municipios) {
            if (cidadeRepository.existsByEstadoIdAndNomeIgnoreCase(estado.getId(), municipio.nome())) {
                continue;
            }
            cidadeRepository.save(Cidade.builder().nome(municipio.nome()).estado(estado).build());
            importados++;
        }

        return new ImportacaoMunicipiosResposta(
                estado.getId(), estado.getNome(), estado.getSigla(),
                municipios.size(), importados, municipios.size() - importados);
    }
}

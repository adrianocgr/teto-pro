package br.com.tetoproobra.localidade.aplicacao;

import br.com.tetoproobra.localidade.infraestrutura.CidadeRepository;
import br.com.tetoproobra.localidade.infraestrutura.EstadoRepository;
import br.com.tetoproobra.localidade.web.CidadeResposta;
import br.com.tetoproobra.localidade.web.EstadoResposta;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Cadastros GLOBAIS (Estado/Cidade) — somente leitura pela aplicação (a
 * escrita é feita só pela importação via IBGE, ver
 * {@link ImportacaoLocalidadeServico}).
 * <p>
 * O mapeamento para DTO acontece AQUI (dentro da transação), não no
 * controller: {@code Cidade.estado} é {@code @ManyToOne(LAZY)} — se o
 * controller mapeasse depois de receber a entidade, a transação já teria
 * fechado e o acesso a {@code estado.getSigla()} quebraria com
 * LazyInitializationException.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LocalidadeServico {

    private final EstadoRepository estadoRepository;
    private final CidadeRepository cidadeRepository;

    public List<EstadoResposta> listarEstados() {
        return estadoRepository.findAll().stream().map(EstadoResposta::de).toList();
    }

    public List<CidadeResposta> listarCidades(Long estadoId) {
        var cidades = estadoId == null
                ? cidadeRepository.findAllByOrderByNomeAsc()
                : cidadeRepository.findByEstadoIdOrderByNomeAsc(estadoId);
        return cidades.stream().map(CidadeResposta::de).toList();
    }
}

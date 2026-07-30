package br.com.tetoproobra.unidademedida.aplicacao;

import br.com.tetoproobra.compartilhado.dominio.excecoes.RecursoNaoEncontradoException;
import br.com.tetoproobra.unidademedida.dominio.UnidadeMedida;
import br.com.tetoproobra.unidademedida.infraestrutura.UnidadeMedidaRepository;
import br.com.tetoproobra.unidademedida.web.UnidadeMedidaMapper;
import br.com.tetoproobra.unidademedida.web.UnidadeMedidaRequisicao;
import br.com.tetoproobra.unidademedida.web.UnidadeMedidaResposta;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UnidadeMedidaServico {

    private final UnidadeMedidaRepository repository;
    private final UnidadeMedidaMapper mapper;

    public Page<UnidadeMedidaResposta> listar(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::paraResposta);
    }

    public UnidadeMedidaResposta buscarPorId(Long id) {
        return mapper.paraResposta(buscarEntidadePorId(id));
    }

    public UnidadeMedidaResposta criar(UnidadeMedidaRequisicao requisicao) {
        UnidadeMedida unidadeMedida = UnidadeMedida.builder()
                .sigla(requisicao.sigla())
                .descricao(requisicao.descricao())
                .build();

        return mapper.paraResposta(repository.save(unidadeMedida));
    }

    public UnidadeMedidaResposta atualizar(Long id, UnidadeMedidaRequisicao requisicao) {
        UnidadeMedida unidadeMedida = buscarEntidadePorId(id);
        unidadeMedida.setSigla(requisicao.sigla());
        unidadeMedida.setDescricao(requisicao.descricao());

        return mapper.paraResposta(repository.save(unidadeMedida));
    }

    public void excluir(Long id) {
        repository.delete(buscarEntidadePorId(id));
    }

    private UnidadeMedida buscarEntidadePorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Unidade de medida", id));
    }
}

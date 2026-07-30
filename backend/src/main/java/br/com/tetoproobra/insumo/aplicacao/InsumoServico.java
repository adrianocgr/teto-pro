package br.com.tetoproobra.insumo.aplicacao;

import br.com.tetoproobra.classificacao.dominio.Classificacao;
import br.com.tetoproobra.classificacao.infraestrutura.ClassificacaoRepository;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RecursoNaoEncontradoException;
import br.com.tetoproobra.insumo.dominio.Insumo;
import br.com.tetoproobra.insumo.infraestrutura.InsumoRepository;
import br.com.tetoproobra.insumo.web.InsumoMapper;
import br.com.tetoproobra.insumo.web.InsumoRequisicao;
import br.com.tetoproobra.insumo.web.InsumoResposta;
import br.com.tetoproobra.unidademedida.dominio.UnidadeMedida;
import br.com.tetoproobra.unidademedida.infraestrutura.UnidadeMedidaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@code @Transactional} na classe: o mapper acessa {@code unidadeMedida} e
 * {@code classificacao} (ambos lazy) para montar a resposta — sem manter a
 * transação aberta até o mapeamento, isso quebra com LazyInitializationException.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class InsumoServico {

    private final InsumoRepository repository;
    private final UnidadeMedidaRepository unidadeMedidaRepository;
    private final ClassificacaoRepository classificacaoRepository;
    private final InsumoMapper mapper;

    public Page<InsumoResposta> listar(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::paraResposta);
    }

    public InsumoResposta buscarPorId(Long id) {
        return mapper.paraResposta(buscarEntidadePorId(id));
    }

    public InsumoResposta criar(InsumoRequisicao requisicao) {
        UnidadeMedida unidadeMedida = buscarUnidadeMedida(requisicao.unidadeMedidaId());
        Classificacao classificacao = buscarClassificacao(requisicao.classificacaoId());

        Insumo insumo = Insumo.builder()
                .codigo(requisicao.codigo())
                .descricao(requisicao.descricao())
                .unidadeMedida(unidadeMedida)
                .classificacao(classificacao)
                .precoReferencia(requisicao.precoReferencia())
                .build();

        return mapper.paraResposta(repository.save(insumo));
    }

    public InsumoResposta atualizar(Long id, InsumoRequisicao requisicao) {
        Insumo insumo = buscarEntidadePorId(id);
        UnidadeMedida unidadeMedida = buscarUnidadeMedida(requisicao.unidadeMedidaId());
        Classificacao classificacao = buscarClassificacao(requisicao.classificacaoId());

        insumo.setCodigo(requisicao.codigo());
        insumo.setDescricao(requisicao.descricao());
        insumo.setUnidadeMedida(unidadeMedida);
        insumo.setClassificacao(classificacao);
        insumo.setPrecoReferencia(requisicao.precoReferencia());

        return mapper.paraResposta(repository.save(insumo));
    }

    public void excluir(Long id) {
        repository.delete(buscarEntidadePorId(id));
    }

    private Insumo buscarEntidadePorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Insumo", id));
    }

    private UnidadeMedida buscarUnidadeMedida(Long id) {
        return unidadeMedidaRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Unidade de medida", id));
    }

    private Classificacao buscarClassificacao(Long id) {
        return classificacaoRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Classificação", id));
    }
}

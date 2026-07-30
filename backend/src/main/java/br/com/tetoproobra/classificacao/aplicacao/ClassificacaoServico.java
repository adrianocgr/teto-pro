package br.com.tetoproobra.classificacao.aplicacao;

import br.com.tetoproobra.classificacao.dominio.Classificacao;
import br.com.tetoproobra.classificacao.infraestrutura.ClassificacaoRepository;
import br.com.tetoproobra.classificacao.web.ClassificacaoMapper;
import br.com.tetoproobra.classificacao.web.ClassificacaoRequisicao;
import br.com.tetoproobra.classificacao.web.ClassificacaoResposta;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RecursoNaoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ClassificacaoServico {

    private final ClassificacaoRepository repository;
    private final ClassificacaoMapper mapper;

    public Page<ClassificacaoResposta> listar(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::paraResposta);
    }

    public ClassificacaoResposta buscarPorId(Long id) {
        return mapper.paraResposta(buscarEntidadePorId(id));
    }

    public ClassificacaoResposta criar(ClassificacaoRequisicao requisicao) {
        Classificacao classificacao = Classificacao.builder()
                .descricao(requisicao.descricao())
                .status(requisicao.status())
                .build();

        return mapper.paraResposta(repository.save(classificacao));
    }

    public ClassificacaoResposta atualizar(Long id, ClassificacaoRequisicao requisicao) {
        Classificacao classificacao = buscarEntidadePorId(id);
        classificacao.setDescricao(requisicao.descricao());
        classificacao.setStatus(requisicao.status());

        return mapper.paraResposta(repository.save(classificacao));
    }

    public void excluir(Long id) {
        repository.delete(buscarEntidadePorId(id));
    }

    private Classificacao buscarEntidadePorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Classificação", id));
    }
}

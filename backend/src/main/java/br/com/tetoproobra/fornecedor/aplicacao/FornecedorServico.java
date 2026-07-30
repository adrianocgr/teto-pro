package br.com.tetoproobra.fornecedor.aplicacao;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RecursoNaoEncontradoException;
import br.com.tetoproobra.fornecedor.dominio.Fornecedor;
import br.com.tetoproobra.fornecedor.dominio.Representante;
import br.com.tetoproobra.fornecedor.infraestrutura.FornecedorRepository;
import br.com.tetoproobra.fornecedor.web.FornecedorMapper;
import br.com.tetoproobra.fornecedor.web.FornecedorRequisicao;
import br.com.tetoproobra.fornecedor.web.FornecedorResposta;
import br.com.tetoproobra.fornecedor.web.RepresentanteRequisicao;
import br.com.tetoproobra.localidade.dominio.Cidade;
import br.com.tetoproobra.localidade.infraestrutura.CidadeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FornecedorServico {

    private final FornecedorRepository fornecedorRepository;
    private final CidadeRepository cidadeRepository;
    private final FornecedorMapper fornecedorMapper;

    @Transactional(readOnly = true)
    public Page<FornecedorResposta> listar(String busca, Pageable pageable) {
        String termo = busca == null ? "" : busca;
        return fornecedorRepository
                .findByRazaoSocialContainingIgnoreCaseOrCnpjCpfContaining(termo, termo, pageable)
                .map(fornecedorMapper::toResposta);
    }

    @Transactional(readOnly = true)
    public FornecedorResposta buscarPorId(Long id) {
        return fornecedorMapper.toResposta(buscarEntidadePorId(id));
    }

    public FornecedorResposta criar(FornecedorRequisicao requisicao) {
        Fornecedor fornecedor = new Fornecedor();
        fornecedor.setRepresentantes(new ArrayList<>());
        aplicarDadosBasicos(fornecedor, requisicao);
        fornecedor.setStatus(requisicao.status() != null ? requisicao.status() : StatusAtivoInativo.ATIVO);
        sincronizarRepresentantes(fornecedor, requisicao.representantes());
        return fornecedorMapper.toResposta(fornecedorRepository.save(fornecedor));
    }

    public FornecedorResposta atualizar(Long id, FornecedorRequisicao requisicao) {
        Fornecedor fornecedor = buscarEntidadePorId(id);
        aplicarDadosBasicos(fornecedor, requisicao);
        if (requisicao.status() != null) {
            fornecedor.setStatus(requisicao.status());
        }
        sincronizarRepresentantes(fornecedor, requisicao.representantes());
        return fornecedorMapper.toResposta(fornecedor);
    }

    public void excluir(Long id) {
        fornecedorRepository.delete(buscarEntidadePorId(id));
    }

    public FornecedorResposta adicionarRepresentante(Long fornecedorId, RepresentanteRequisicao requisicao) {
        Fornecedor fornecedor = buscarEntidadePorId(fornecedorId);
        Representante representante = fornecedorMapper.toEntidade(requisicao);
        representante.setFornecedor(fornecedor);
        fornecedor.getRepresentantes().add(representante);
        return fornecedorMapper.toResposta(fornecedor);
    }

    public FornecedorResposta removerRepresentante(Long fornecedorId, Long representanteId) {
        Fornecedor fornecedor = buscarEntidadePorId(fornecedorId);
        boolean removido = fornecedor.getRepresentantes()
                .removeIf(representante -> representanteId.equals(representante.getId()));
        if (!removido) {
            throw RecursoNaoEncontradoException.paraId("Representante", representanteId);
        }
        return fornecedorMapper.toResposta(fornecedor);
    }

    private Fornecedor buscarEntidadePorId(Long id) {
        return fornecedorRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Fornecedor", id));
    }

    private void aplicarDadosBasicos(Fornecedor fornecedor, FornecedorRequisicao requisicao) {
        fornecedorMapper.atualizarDadosBasicos(requisicao, fornecedor);
        fornecedor.setCidade(resolverCidade(requisicao.cidadeId()));
    }

    private Cidade resolverCidade(Long cidadeId) {
        if (cidadeId == null) {
            return null;
        }
        return cidadeRepository.findById(cidadeId)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Cidade", cidadeId));
    }

    /**
     * Substitui a lista de representantes do fornecedor pela recebida na
     * requisição. Como a associação usa {@code orphanRemoval = true}, limpar a
     * coleção existente é suficiente para o Hibernate excluir os removidos.
     */
    private void sincronizarRepresentantes(Fornecedor fornecedor, List<RepresentanteRequisicao> representantesRequisicao) {
        fornecedor.getRepresentantes().clear();
        if (representantesRequisicao == null) {
            return;
        }
        representantesRequisicao.forEach(requisicaoRepresentante -> {
            Representante representante = fornecedorMapper.toEntidade(requisicaoRepresentante);
            representante.setFornecedor(fornecedor);
            fornecedor.getRepresentantes().add(representante);
        });
    }
}

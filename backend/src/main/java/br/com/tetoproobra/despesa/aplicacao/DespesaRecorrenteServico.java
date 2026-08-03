package br.com.tetoproobra.despesa.aplicacao;

import br.com.tetoproobra.categoria.dominio.Categoria;
import br.com.tetoproobra.categoria.infraestrutura.CategoriaRepository;
import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RecursoNaoEncontradoException;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RegraDeNegocioException;
import br.com.tetoproobra.despesa.dominio.DespesaRecorrente;
import br.com.tetoproobra.despesa.dominio.PagadorRecorrente;
import br.com.tetoproobra.despesa.infraestrutura.DespesaRecorrenteRepository;
import br.com.tetoproobra.despesa.web.DespesaRecorrenteMapper;
import br.com.tetoproobra.despesa.web.DespesaRecorrenteRequisicao;
import br.com.tetoproobra.despesa.web.DespesaRecorrenteResposta;
import br.com.tetoproobra.despesa.web.PagadorRecorrenteRequisicao;
import br.com.tetoproobra.empreendimento.dominio.Empreendimento;
import br.com.tetoproobra.empreendimento.infraestrutura.EmpreendimentoRepository;
import br.com.tetoproobra.fornecedor.dominio.Fornecedor;
import br.com.tetoproobra.fornecedor.infraestrutura.FornecedorRepository;
import br.com.tetoproobra.investidor.dominio.Investidor;
import br.com.tetoproobra.investidor.infraestrutura.InvestidorRepository;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Modelos de despesa recorrente (água, luz, condomínio...) — o lançamento em
 * si (virar uma {@link br.com.tetoproobra.despesa.dominio.Despesa} de
 * verdade) é feito por {@link DespesaServico#criar} quando a requisição traz
 * {@code recorrenciaId}/{@code competencia}; este serviço só gerencia o
 * cadastro do modelo.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class DespesaRecorrenteServico {

    private final DespesaRecorrenteRepository repository;
    private final EmpreendimentoRepository empreendimentoRepository;
    private final CategoriaRepository categoriaRepository;
    private final FornecedorRepository fornecedorRepository;
    private final InvestidorRepository investidorRepository;
    private final DespesaRecorrenteMapper mapper;

    public List<DespesaRecorrenteResposta> listar(Long empreendimentoId) {
        return mapper.paraRespostaLista(repository.findByEmpreendimentoIdOrderByDescricaoAsc(empreendimentoId));
    }

    public DespesaRecorrenteResposta buscarPorId(Long empreendimentoId, Long id) {
        return mapper.paraResposta(buscarEntidadePorId(empreendimentoId, id));
    }

    public DespesaRecorrenteResposta criar(Long empreendimentoId, DespesaRecorrenteRequisicao requisicao) {
        Empreendimento empreendimento = buscarEmpreendimento(empreendimentoId);
        Categoria categoria = buscarCategoria(requisicao.categoriaId());
        Fornecedor fornecedor = resolverFornecedor(requisicao.fornecedorId());
        validarLancamentoAutomatico(requisicao);

        DespesaRecorrente recorrente = DespesaRecorrente.builder()
                .empreendimento(empreendimento)
                .categoria(categoria)
                .fornecedor(fornecedor)
                .descricao(requisicao.descricao())
                .observacao(requisicao.observacao())
                .valorPadrao(requisicao.valorPadrao())
                .diaVencimento(requisicao.diaVencimento())
                .status(StatusAtivoInativo.ATIVO)
                .lancamentoAutomatico(requisicao.lancamentoAutomatico())
                .build();

        List<PagadorRecorrente> pagadores = montarPagadores(recorrente, requisicao.pagadores());
        recorrente.getPagadores().addAll(pagadores);

        return mapper.paraResposta(repository.save(recorrente));
    }

    public DespesaRecorrenteResposta atualizar(Long empreendimentoId, Long id, DespesaRecorrenteRequisicao requisicao) {
        DespesaRecorrente recorrente = buscarEntidadePorId(empreendimentoId, id);
        Categoria categoria = buscarCategoria(requisicao.categoriaId());
        Fornecedor fornecedor = resolverFornecedor(requisicao.fornecedorId());
        validarLancamentoAutomatico(requisicao);

        recorrente.setCategoria(categoria);
        recorrente.setFornecedor(fornecedor);
        recorrente.setDescricao(requisicao.descricao());
        recorrente.setObservacao(requisicao.observacao());
        recorrente.setValorPadrao(requisicao.valorPadrao());
        recorrente.setDiaVencimento(requisicao.diaVencimento());
        recorrente.setLancamentoAutomatico(requisicao.lancamentoAutomatico());

        // Mesmo cuidado de DespesaServico.atualizar: com orphanRemoval, um INSERT
        // pro MESMO investidor aconteceria antes do DELETE do antigo na mesma
        // flush, violando uk_pr_recorrencia_investidor — por isso o flush aqui.
        recorrente.getPagadores().clear();
        repository.saveAndFlush(recorrente);

        List<PagadorRecorrente> novosPagadores = montarPagadores(recorrente, requisicao.pagadores());
        recorrente.getPagadores().addAll(novosPagadores);

        return mapper.paraResposta(repository.save(recorrente));
    }

    public DespesaRecorrenteResposta inativar(Long empreendimentoId, Long id) {
        DespesaRecorrente recorrente = buscarEntidadePorId(empreendimentoId, id);
        recorrente.setStatus(StatusAtivoInativo.INATIVO);
        return mapper.paraResposta(repository.save(recorrente));
    }

    public DespesaRecorrenteResposta reativar(Long empreendimentoId, Long id) {
        DespesaRecorrente recorrente = buscarEntidadePorId(empreendimentoId, id);
        recorrente.setStatus(StatusAtivoInativo.ATIVO);
        return mapper.paraResposta(repository.save(recorrente));
    }

    public void excluir(Long empreendimentoId, Long id) {
        repository.delete(buscarEntidadePorId(empreendimentoId, id));
    }

    /**
     * O job noturno de lançamento automático usa {@code valorPadrao} como o
     * valor total da despesa gerada (não há como perguntar "quanto foi a
     * conta este mês" sem um usuário) — por isso exige o valor preenchido e
     * positivo quando esta opção está ligada.
     */
    private void validarLancamentoAutomatico(DespesaRecorrenteRequisicao requisicao) {
        if (!requisicao.lancamentoAutomatico()) {
            return;
        }
        if (requisicao.valorPadrao() == null || requisicao.valorPadrao().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RegraDeNegocioException(
                    "Informe um valor padrão maior que zero para habilitar o lançamento automático");
        }
    }

    private List<PagadorRecorrente> montarPagadores(DespesaRecorrente recorrente, List<PagadorRecorrenteRequisicao> requisicoes) {
        if (requisicoes == null || requisicoes.isEmpty()) {
            throw new RegraDeNegocioException("Informe ao menos um investidor pagador");
        }

        BigDecimal soma = requisicoes.stream().map(PagadorRecorrenteRequisicao::percentual).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (soma.compareTo(new BigDecimal("100")) != 0) {
            throw new RegraDeNegocioException(
                    "A soma dos percentuais dos pagadores deve ser exatamente 100%% (está em %s%%)".formatted(soma));
        }

        return requisicoes.stream()
                .map(pagadorRequisicao -> {
                    Investidor investidor = investidorRepository.findById(pagadorRequisicao.investidorId())
                            .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Investidor", pagadorRequisicao.investidorId()));
                    return PagadorRecorrente.builder()
                            .recorrencia(recorrente)
                            .investidor(investidor)
                            .percentual(pagadorRequisicao.percentual())
                            .build();
                })
                .toList();
    }

    private DespesaRecorrente buscarEntidadePorId(Long empreendimentoId, Long id) {
        DespesaRecorrente recorrente = repository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Despesa recorrente", id));
        if (!recorrente.getEmpreendimento().getId().equals(empreendimentoId)) {
            throw RecursoNaoEncontradoException.paraId("Despesa recorrente", id);
        }
        return recorrente;
    }

    private Fornecedor resolverFornecedor(Long fornecedorId) {
        if (fornecedorId == null) {
            return null;
        }
        return fornecedorRepository.findById(fornecedorId)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Fornecedor", fornecedorId));
    }

    private Empreendimento buscarEmpreendimento(Long id) {
        return empreendimentoRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Empreendimento", id));
    }

    private Categoria buscarCategoria(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Categoria", id));
    }
}

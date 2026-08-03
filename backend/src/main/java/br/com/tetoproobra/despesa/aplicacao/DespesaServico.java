package br.com.tetoproobra.despesa.aplicacao;

import br.com.tetoproobra.auditoria.dominio.EventoAuditoria;
import br.com.tetoproobra.categoria.dominio.Categoria;
import br.com.tetoproobra.categoria.infraestrutura.CategoriaRepository;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RecursoNaoEncontradoException;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RegraDeNegocioException;
import br.com.tetoproobra.despesa.dominio.Despesa;
import br.com.tetoproobra.despesa.dominio.DespesaDocumento;
import br.com.tetoproobra.despesa.dominio.DespesaRecorrente;
import br.com.tetoproobra.despesa.dominio.ItemDespesa;
import br.com.tetoproobra.despesa.dominio.PagadorDespesa;
import br.com.tetoproobra.despesa.infraestrutura.ArmazenamentoArquivoServico;
import br.com.tetoproobra.despesa.infraestrutura.DespesaDocumentoRepository;
import br.com.tetoproobra.despesa.infraestrutura.DespesaEspecificacoes;
import br.com.tetoproobra.despesa.infraestrutura.DespesaRecorrenteRepository;
import br.com.tetoproobra.despesa.infraestrutura.DespesaRepository;
import br.com.tetoproobra.despesa.web.DespesaMapper;
import br.com.tetoproobra.despesa.web.DespesaRequisicao;
import br.com.tetoproobra.despesa.web.DespesaResposta;
import br.com.tetoproobra.despesa.web.DocumentoResposta;
import br.com.tetoproobra.despesa.web.ItemRequisicao;
import br.com.tetoproobra.despesa.web.PagadorRequisicao;
import br.com.tetoproobra.empreendimento.dominio.Empreendimento;
import br.com.tetoproobra.empreendimento.infraestrutura.EmpreendimentoRepository;
import br.com.tetoproobra.fornecedor.dominio.Fornecedor;
import br.com.tetoproobra.fornecedor.infraestrutura.FornecedorRepository;
import br.com.tetoproobra.insumo.dominio.Insumo;
import br.com.tetoproobra.insumo.infraestrutura.InsumoRepository;
import br.com.tetoproobra.investidor.dominio.Investidor;
import br.com.tetoproobra.investidor.infraestrutura.InvestidorRepository;
import br.com.tetoproobra.usuario.aplicacao.UsuarioContextoServico;
import br.com.tetoproobra.usuario.dominio.Usuario;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Regras de negócio do domínio Despesa — o mais complexo do sistema: uma
 * despesa pertence a um {@link Empreendimento}, tem uma {@link Categoria},
 * opcionalmente um {@link Fornecedor}, pode detalhar seu valor em
 * {@link ItemDespesa}s e é sempre paga por um ou mais investidores ao mesmo
 * tempo (rateio — {@link PagadorDespesa}), com tolerância zero entre a soma
 * do rateio e o valor total.
 * <p>
 * A leitura/escrita de {@link DespesaResposta} acontece dentro da própria
 * transação do serviço (em vez de devolver a entidade para o controller
 * mapear depois, como em domínios mais simples) porque {@code open-in-view}
 * está desligado e o grafo de associações preguiçosas aqui é profundo
 * (empreendimento, categoria, fornecedor, usuários, itens→insumo→unidade,
 * pagadores→investidor) — inicializar tudo isso fora da transação lançaria
 * {@code LazyInitializationException}.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class DespesaServico {

    private final DespesaRepository despesaRepository;
    private final DespesaRecorrenteRepository despesaRecorrenteRepository;
    private final EmpreendimentoRepository empreendimentoRepository;
    private final CategoriaRepository categoriaRepository;
    private final FornecedorRepository fornecedorRepository;
    private final InvestidorRepository investidorRepository;
    private final InsumoRepository insumoRepository;
    private final ArmazenamentoArquivoServico armazenamentoArquivoServico;
    private final DespesaDocumentoRepository despesaDocumentoRepository;
    private final UsuarioContextoServico usuarioContextoServico;
    private final ApplicationEventPublisher publicadorDeEventos;
    private final DespesaMapper mapper;

    /**
     * {@code busca} filtra pela descrição (contém, sem diferenciar maiúsculas);
     * {@code categoriaId}/{@code investidorId} são filtros exatos opcionais;
     * os quatro parâmetros de data são opcionais e independentes entre si —
     * período de lançamento ({@code dataCadastro}) e período de pagamento
     * ({@code dataPagamento}) podem vir só com "de", só com "até" ou com os
     * dois. Todos combinados via {@link Specification}, para que a paginação
     * e a ordenação do backend reflitam o total realmente filtrado (em vez de
     * filtrar só a página já carregada, que seria incorreto com paginação de
     * verdade). Quando a requisição não pede uma ordenação explícita, a lista
     * volta ordenada por {@code dataPagamento} decrescente (ver
     * {@link #aplicarOrdenacaoPadrao}).
     */
    @Transactional(readOnly = true)
    public Page<DespesaResposta> listar(Long empreendimentoId, String busca, Long categoriaId, Long investidorId,
            LocalDate dataCadastroDe, LocalDate dataCadastroAte,
            LocalDate dataPagamentoDe, LocalDate dataPagamentoAte, Pageable pageable) {

        if (dataCadastroDe != null && dataCadastroAte != null && dataCadastroDe.isAfter(dataCadastroAte)) {
            throw new RegraDeNegocioException(
                    "O período de lançamento é inválido: a data inicial não pode ser depois da final");
        }
        if (dataPagamentoDe != null && dataPagamentoAte != null && dataPagamentoDe.isAfter(dataPagamentoAte)) {
            throw new RegraDeNegocioException(
                    "O período de pagamento é inválido: a data inicial não pode ser depois da final");
        }

        Specification<Despesa> especificacao = Specification
                .where(DespesaEspecificacoes.comEmpreendimento(empreendimentoId))
                .and(DespesaEspecificacoes.comDescricaoContendo(busca))
                .and(DespesaEspecificacoes.comCategoria(categoriaId))
                .and(DespesaEspecificacoes.comInvestidorPagador(investidorId))
                .and(DespesaEspecificacoes.comDataCadastroEntre(dataCadastroDe, dataCadastroAte))
                .and(DespesaEspecificacoes.comDataPagamentoEntre(dataPagamentoDe, dataPagamentoAte));

        Page<Despesa> pagina = despesaRepository.findAll(especificacao, aplicarOrdenacaoPadrao(pageable));

        return pagina.map(mapper::paraResposta);
    }

    /**
     * Sem {@code sort} explícito na requisição, a ordem default é por data de
     * pagamento, da mais recente para a mais antiga. Em qualquer ordenação por
     * {@code dataPagamento} — a default ou uma escolhida pelo usuário — as
     * despesas ainda não pagas (campo nulo) sempre vão para o fim da lista,
     * independentemente da direção: sem isso, o Postgres despeja os nulos no
     * TOPO quando a ordem é decrescente (nulo é "maior" que qualquer data),
     * escondendo atrás deles as despesas realmente pagas mais recentemente.
     */
    private Pageable aplicarOrdenacaoPadrao(Pageable pageable) {
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : Sort.by(Sort.Direction.DESC, "dataPagamento");

        List<Sort.Order> ordens = sort.stream()
                .map(ordem -> "dataPagamento".equals(ordem.getProperty()) ? ordem.nullsLast() : ordem)
                .toList();

        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(ordens));
    }

    @Transactional(readOnly = true)
    public DespesaResposta buscarPorId(Long id) {
        return mapper.paraResposta(buscarEntidadePorId(id));
    }

    public DespesaResposta criar(DespesaRequisicao requisicao) {
        return criar(requisicao, usuarioContextoServico.obterUsuarioAutenticado());
    }

    /**
     * Mesma criação de {@link #criar(DespesaRequisicao)}, mas recebendo o
     * usuário responsável explicitamente em vez de resolvê-lo do
     * {@code SecurityContextHolder} — usado pelo
     * {@code LancamentoAutomaticoDespesaRecorrenteJob}, que roda numa thread
     * do agendador, sem requisição HTTP/JWT autenticado.
     */
    public DespesaResposta criarAutomatica(DespesaRequisicao requisicao, Usuario usuarioResponsavel) {
        return criar(requisicao, usuarioResponsavel);
    }

    private DespesaResposta criar(DespesaRequisicao requisicao, Usuario usuarioAtual) {
        Empreendimento empreendimento = buscarEmpreendimento(requisicao.empreendimentoId());
        Categoria categoria = buscarCategoria(requisicao.categoriaId());
        Fornecedor fornecedor = resolverFornecedor(requisicao.fornecedorId());

        Despesa despesa = Despesa.builder()
                .empreendimento(empreendimento)
                .categoria(categoria)
                .fornecedor(fornecedor)
                .descricao(requisicao.descricao())
                .observacao(requisicao.observacao())
                .dataCadastro(LocalDate.now())
                .dataPagamento(requisicao.dataPagamento())
                .build();

        List<ItemDespesa> itens = montarItens(despesa, requisicao.itens());
        BigDecimal valorTotal = calcularValorTotal(requisicao, itens);
        despesa.getItens().addAll(itens);
        despesa.setValorTotal(valorTotal);
        despesa.setDesconto(requisicao.desconto() != null ? requisicao.desconto() : BigDecimal.ZERO);

        List<PagadorDespesa> pagadores = montarPagadores(despesa, requisicao.pagadores());
        validarRateio(pagadores, valorTotal);
        despesa.getPagadores().addAll(pagadores);

        despesa.setUsuarioCadastro(usuarioAtual);

        DespesaRecorrente recorrencia = resolverOrigemRecorrente(empreendimento, requisicao);
        if (recorrencia != null) {
            despesa.setRecorrencia(recorrencia);
            despesa.setCompetencia(requisicao.competencia());
        }

        Despesa salva = despesaRepository.save(despesa);

        if (recorrencia != null) {
            recorrencia.setUltimaCompetencia(requisicao.competencia());
            recorrencia.setUltimoValor(valorTotal);
            despesaRecorrenteRepository.save(recorrencia);
        }

        publicadorDeEventos.publishEvent(EventoAuditoria.criacao(
                salva.getTenantId(),
                "despesa",
                salva.getId(),
                salva.getDescricao(),
                empreendimento.getId(),
                empreendimento.getDescricao(),
                usuarioAtual.getEmail()));

        return mapper.paraResposta(salva);
    }

    public DespesaResposta atualizar(Long id, DespesaRequisicao requisicao) {
        Despesa despesa = buscarEntidadePorId(id);

        String descricaoAnterior = despesa.getDescricao();
        BigDecimal valorTotalAnterior = despesa.getValorTotal();

        Empreendimento empreendimento = buscarEmpreendimento(requisicao.empreendimentoId());
        Categoria categoria = buscarCategoria(requisicao.categoriaId());
        Fornecedor fornecedor = resolverFornecedor(requisicao.fornecedorId());

        despesa.setEmpreendimento(empreendimento);
        despesa.setCategoria(categoria);
        despesa.setFornecedor(fornecedor);
        despesa.setDescricao(requisicao.descricao());
        despesa.setObservacao(requisicao.observacao());
        despesa.setDataPagamento(requisicao.dataPagamento());

        // O flush aqui é necessário: com orphanRemoval, Hibernate executa INSERTs
        // de entidade antes de DELETEs na mesma flush — sem forçar o DELETE dos
        // itens/pagadores antigos primeiro, recriar um pagador para o MESMO
        // investidor (ou item do mesmo insumo) violaria a constraint única
        // (uk_pg_despesa_investidor), porque o INSERT do novo aconteceria antes
        // do DELETE do antigo.
        despesa.getItens().clear();
        despesa.getPagadores().clear();
        despesaRepository.saveAndFlush(despesa);

        List<ItemDespesa> novosItens = montarItens(despesa, requisicao.itens());
        BigDecimal valorTotal = calcularValorTotal(requisicao, novosItens);
        despesa.getItens().addAll(novosItens);
        despesa.setValorTotal(valorTotal);
        despesa.setDesconto(requisicao.desconto() != null ? requisicao.desconto() : BigDecimal.ZERO);

        List<PagadorDespesa> novosPagadores = montarPagadores(despesa, requisicao.pagadores());
        validarRateio(novosPagadores, valorTotal);
        despesa.getPagadores().addAll(novosPagadores);

        Usuario usuarioAtual = usuarioContextoServico.obterUsuarioAutenticado();
        despesa.setDataAlteracao(LocalDate.now());
        despesa.setUsuarioAlteracao(usuarioAtual);

        Despesa salva = despesaRepository.save(despesa);

        List<EventoAuditoria.CampoAlterado> camposAlterados = new ArrayList<>();
        if (!descricaoAnterior.equals(salva.getDescricao())) {
            camposAlterados.add(
                    new EventoAuditoria.CampoAlterado("descricao", descricaoAnterior, salva.getDescricao()));
        }
        if (valorTotalAnterior.compareTo(salva.getValorTotal()) != 0) {
            camposAlterados.add(new EventoAuditoria.CampoAlterado(
                    "valorTotal", valorTotalAnterior.toPlainString(), salva.getValorTotal().toPlainString()));
        }

        publicadorDeEventos.publishEvent(EventoAuditoria.atualizacao(
                salva.getTenantId(),
                "despesa",
                salva.getId(),
                salva.getDescricao(),
                empreendimento.getId(),
                empreendimento.getDescricao(),
                usuarioAtual.getEmail(),
                camposAlterados));

        return mapper.paraResposta(salva);
    }

    public void excluir(Long id) {
        Despesa despesa = buscarEntidadePorId(id);
        Usuario usuarioAtual = usuarioContextoServico.obterUsuarioAutenticado();

        publicadorDeEventos.publishEvent(EventoAuditoria.exclusao(
                despesa.getTenantId(),
                "despesa",
                despesa.getId(),
                despesa.getDescricao(),
                despesa.getEmpreendimento().getId(),
                despesa.getEmpreendimento().getDescricao(),
                usuarioAtual.getEmail()));

        for (DespesaDocumento documento : despesa.getDocumentos()) {
            armazenamentoArquivoServico.remover(documento.getFileId());
        }

        despesaRepository.delete(despesa);
    }

    public List<DespesaDocumento> adicionarDocumentos(Long despesaId, List<MultipartFile> arquivos) {
        Despesa despesa = buscarEntidadePorId(despesaId);

        List<DespesaDocumento> documentosAdicionados = new ArrayList<>();
        for (MultipartFile arquivo : arquivos) {
            String fileId = armazenamentoArquivoServico.armazenar(arquivo);
            DespesaDocumento documento = DespesaDocumento.builder()
                    .despesa(despesa)
                    .fileId(fileId)
                    .filename(arquivo.getOriginalFilename())
                    .contentType(arquivo.getContentType())
                    .length(arquivo.getSize())
                    .uploadedAt(LocalDateTime.now())
                    .build();
            despesa.getDocumentos().add(documento);
            documentosAdicionados.add(documento);
        }

        despesaRepository.save(despesa);

        return documentosAdicionados;
    }

    public void removerDocumento(Long despesaId, Long documentoId) {
        DespesaDocumento documento = buscarDocumento(despesaId, documentoId);
        armazenamentoArquivoServico.remover(documento.getFileId());
        despesaDocumentoRepository.delete(documento);
    }

    @Transactional(readOnly = true)
    public DespesaDocumento buscarDocumento(Long despesaId, Long documentoId) {
        DespesaDocumento documento = despesaDocumentoRepository.findById(documentoId)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Documento", documentoId));

        if (!documento.getDespesa().getId().equals(despesaId)) {
            throw RecursoNaoEncontradoException.paraId("Documento", documentoId);
        }

        return documento;
    }

    /**
     * Converte a lista de {@link ItemRequisicao} em {@link ItemDespesa}, já
     * associados à despesa e com o valor total de cada item calculado
     * (quantidade x valor unitário). Retorna lista vazia (nunca nula) quando
     * a despesa não detalha itens — ex.: escritura de terreno.
     */
    private List<ItemDespesa> montarItens(Despesa despesa, List<ItemRequisicao> itensRequisicao) {
        if (itensRequisicao == null || itensRequisicao.isEmpty()) {
            return List.of();
        }
        return itensRequisicao.stream()
                .map(itemRequisicao -> {
                    Insumo insumo = insumoRepository.findById(itemRequisicao.insumoId())
                            .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Insumo", itemRequisicao.insumoId()));

                    BigDecimal valorTotalItem = itemRequisicao.quantidade()
                            .multiply(itemRequisicao.valorUnitario())
                            .setScale(2, RoundingMode.HALF_UP);

                    return ItemDespesa.builder()
                            .despesa(despesa)
                            .insumo(insumo)
                            .quantidade(itemRequisicao.quantidade())
                            .valorUnitario(itemRequisicao.valorUnitario())
                            .valorTotal(valorTotalItem)
                            .observacao(itemRequisicao.observacao())
                            .build();
                })
                .toList();
    }

    /**
     * Fonte da verdade do valor total: quando há itens, é sempre a soma
     * deles (o {@code valorTotal} da requisição é ignorado nesse caso).
     * Quando não há itens, usa o {@code valorTotal} informado diretamente.
     * Em ambos os casos, {@code desconto} é subtraído do valor bruto antes
     * de retornar — o valor total salvo (e usado no rateio dos pagadores)
     * já é líquido de desconto.
     */
    private BigDecimal calcularValorTotal(DespesaRequisicao requisicao, List<ItemDespesa> itens) {
        BigDecimal bruto;
        if (!itens.isEmpty()) {
            bruto = itens.stream().map(ItemDespesa::getValorTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        } else {
            bruto = requisicao.valorTotal();
            if (bruto == null || bruto.compareTo(BigDecimal.ZERO) <= 0) {
                throw new RegraDeNegocioException("Informe o valor total ou ao menos um item");
            }
        }

        BigDecimal desconto = requisicao.desconto() != null ? requisicao.desconto() : BigDecimal.ZERO;
        if (desconto.compareTo(BigDecimal.ZERO) < 0) {
            throw new RegraDeNegocioException("O desconto não pode ser negativo");
        }
        if (desconto.compareTo(bruto) > 0) {
            throw new RegraDeNegocioException("O desconto não pode ser maior que o valor total");
        }

        return bruto.subtract(desconto).setScale(2, RoundingMode.HALF_UP);
    }

    private List<PagadorDespesa> montarPagadores(Despesa despesa, List<PagadorRequisicao> pagadoresRequisicao) {
        if (pagadoresRequisicao == null || pagadoresRequisicao.isEmpty()) {
            throw new RegraDeNegocioException("Informe ao menos um investidor pagador");
        }
        return pagadoresRequisicao.stream()
                .map(pagadorRequisicao -> {
                    Investidor investidor = investidorRepository.findById(pagadorRequisicao.investidorId())
                            .orElseThrow(() ->
                                    RecursoNaoEncontradoException.paraId("Investidor", pagadorRequisicao.investidorId()));

                    return PagadorDespesa.builder()
                            .despesa(despesa)
                            .investidor(investidor)
                            .valor(pagadorRequisicao.valor())
                            .build();
                })
                .toList();
    }

    /**
     * A soma dos valores dos pagadores precisa ser EXATAMENTE igual ao valor
     * total da despesa — comparação via {@link BigDecimal#compareTo}, não
     * {@code equals}, para não quebrar por diferença de escala.
     */
    private void validarRateio(List<PagadorDespesa> pagadores, BigDecimal valorTotal) {
        BigDecimal soma = pagadores.stream().map(PagadorDespesa::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (soma.compareTo(valorTotal) != 0) {
            throw new RegraDeNegocioException(
                    "A soma dos valores dos pagadores (R$ %s) é diferente do valor total da despesa (R$ %s)"
                            .formatted(soma, valorTotal));
        }
    }

    private Fornecedor resolverFornecedor(Long fornecedorId) {
        if (fornecedorId == null) {
            return null;
        }
        return fornecedorRepository.findById(fornecedorId)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Fornecedor", fornecedorId));
    }

    /**
     * "Lançar" uma despesa recorrente (água, luz, condomínio...) é só criar
     * uma despesa normal informando de onde ela veio — {@code recorrenciaId}
     * e {@code competencia} têm que vir os dois juntos (ou nenhum), e nunca
     * pode repetir a mesma competência para a mesma recorrência (idempotência
     * garantida também por {@code uk_de_recorrencia_competencia} no banco).
     */
    private DespesaRecorrente resolverOrigemRecorrente(Empreendimento empreendimento, DespesaRequisicao requisicao) {
        if (requisicao.recorrenciaId() == null && requisicao.competencia() == null) {
            return null;
        }
        if (requisicao.recorrenciaId() == null || requisicao.competencia() == null) {
            throw new RegraDeNegocioException("Informe a recorrência e a competência juntas, ou nenhuma das duas");
        }

        DespesaRecorrente recorrencia = despesaRecorrenteRepository.findById(requisicao.recorrenciaId())
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Despesa recorrente", requisicao.recorrenciaId()));

        if (!recorrencia.getEmpreendimento().getId().equals(empreendimento.getId())) {
            throw new RegraDeNegocioException("Esta despesa recorrente não pertence a este empreendimento");
        }
        if (despesaRepository.existsByRecorrencia_IdAndCompetencia(recorrencia.getId(), requisicao.competencia())) {
            throw new RegraDeNegocioException("Esta competência já foi lançada para esta despesa recorrente");
        }

        return recorrencia;
    }

    private Empreendimento buscarEmpreendimento(Long id) {
        return empreendimentoRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Empreendimento", id));
    }

    private Categoria buscarCategoria(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Categoria", id));
    }

    private Despesa buscarEntidadePorId(Long id) {
        return despesaRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Despesa", id));
    }
}

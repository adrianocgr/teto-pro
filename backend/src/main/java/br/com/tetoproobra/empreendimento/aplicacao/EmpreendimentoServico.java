package br.com.tetoproobra.empreendimento.aplicacao;

import br.com.tetoproobra.compartilhado.dominio.excecoes.RecursoNaoEncontradoException;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RegraDeNegocioException;
import br.com.tetoproobra.empreendimento.dominio.Empreendimento;
import br.com.tetoproobra.empreendimento.dominio.Participacao;
import br.com.tetoproobra.empreendimento.infraestrutura.EmpreendimentoRepository;
import br.com.tetoproobra.empreendimento.infraestrutura.ParticipacaoRepository;
import br.com.tetoproobra.empreendimento.web.EmpreendimentoMapper;
import br.com.tetoproobra.empreendimento.web.EmpreendimentoRequisicao;
import br.com.tetoproobra.empreendimento.web.EmpreendimentoResposta;
import br.com.tetoproobra.empreendimento.web.ParticipacaoRequisicao;
import br.com.tetoproobra.empreendimento.web.ParticipacaoResposta;
import br.com.tetoproobra.investidor.dominio.Investidor;
import br.com.tetoproobra.investidor.infraestrutura.InvestidorRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Regras de negócio do Empreendimento e das Participações de investidores nele.
 * A soma dos percentuais de participação de um empreendimento não é bloqueada
 * caso ultrapasse ou fique abaixo de 100% — isso é tecnicamente permitido e vira
 * apenas um alerta visual no frontend (ver {@link #somaPercentuais(Long)}).
 * <p>
 * {@code @Transactional} na classe: {@code participacoes} é lazy, e o mapper
 * precisa acessá-la para calcular {@code somaPercentuais} — sem manter a
 * transação aberta até o mapeamento, isso quebra com LazyInitializationException.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class EmpreendimentoServico {

    private final EmpreendimentoRepository empreendimentoRepository;
    private final ParticipacaoRepository participacaoRepository;
    private final InvestidorRepository investidorRepository;
    private final EmpreendimentoMapper mapper;

    public Page<EmpreendimentoResposta> listar(String busca, Pageable pageable) {
        Page<Empreendimento> pagina = StringUtils.hasText(busca)
                ? empreendimentoRepository.findByDescricaoContainingIgnoreCase(busca, pageable)
                : empreendimentoRepository.findAll(pageable);

        return pagina.map(mapper::paraResposta);
    }

    public Page<EmpreendimentoResposta> listarPorInvestidor(Long investidorId, Pageable pageable) {
        return empreendimentoRepository.buscarPorInvestidor(investidorId, pageable).map(mapper::paraResposta);
    }

    public EmpreendimentoResposta buscarPorId(Long id) {
        return mapper.paraResposta(buscarEntidadePorId(id));
    }

    public EmpreendimentoResposta criar(EmpreendimentoRequisicao requisicao) {
        Empreendimento empreendimento = Empreendimento.builder()
                .descricao(requisicao.descricao())
                .inscricaoMunicipal(requisicao.inscricaoMunicipal())
                .matricula(requisicao.matricula())
                .endereco(requisicao.endereco())
                .numero(requisicao.numero())
                .quadra(requisicao.quadra())
                .lote(requisicao.lote())
                .complemento(requisicao.complemento())
                .build();

        empreendimento = empreendimentoRepository.save(empreendimento);

        if (requisicao.participacoesIniciais() != null) {
            for (ParticipacaoRequisicao participacaoRequisicao : requisicao.participacoesIniciais()) {
                criarParticipacao(empreendimento, participacaoRequisicao);
            }
        }

        return mapper.paraResposta(buscarEntidadePorId(empreendimento.getId()));
    }

    public EmpreendimentoResposta atualizar(Long id, EmpreendimentoRequisicao requisicao) {
        Empreendimento empreendimento = buscarEntidadePorId(id);

        empreendimento.setDescricao(requisicao.descricao());
        empreendimento.setInscricaoMunicipal(requisicao.inscricaoMunicipal());
        empreendimento.setMatricula(requisicao.matricula());
        empreendimento.setEndereco(requisicao.endereco());
        empreendimento.setNumero(requisicao.numero());
        empreendimento.setQuadra(requisicao.quadra());
        empreendimento.setLote(requisicao.lote());
        empreendimento.setComplemento(requisicao.complemento());

        return mapper.paraResposta(empreendimentoRepository.save(empreendimento));
    }

    public void excluir(Long id) {
        empreendimentoRepository.delete(buscarEntidadePorId(id));
    }

    public List<ParticipacaoResposta> listarParticipacoes(Long empreendimentoId) {
        buscarEntidadePorId(empreendimentoId);
        return mapper.paraRespostaLista(participacaoRepository.findByEmpreendimentoId(empreendimentoId));
    }

    public ParticipacaoResposta adicionarParticipacao(Long empreendimentoId, ParticipacaoRequisicao requisicao) {
        Empreendimento empreendimento = buscarEntidadePorId(empreendimentoId);
        return mapper.paraResposta(criarParticipacao(empreendimento, requisicao));
    }

    public ParticipacaoResposta atualizarParticipacao(
            Long empreendimentoId, Long participacaoId, ParticipacaoRequisicao requisicao) {
        buscarEntidadePorId(empreendimentoId);
        Participacao participacao = buscarParticipacaoEntidade(empreendimentoId, participacaoId);

        if (requisicao.investidorId() != null && !requisicao.investidorId().equals(participacao.getInvestidor().getId())) {
            throw new RegraDeNegocioException("Não é possível alterar o investidor de uma participação existente");
        }

        validarPercentual(requisicao.percentual());

        participacao.setPercentual(requisicao.percentual());
        if (requisicao.dataEntrada() != null) {
            participacao.setDataEntrada(requisicao.dataEntrada());
        }

        return mapper.paraResposta(participacaoRepository.save(participacao));
    }

    public void removerParticipacao(Long empreendimentoId, Long participacaoId) {
        buscarEntidadePorId(empreendimentoId);
        Participacao participacao = buscarParticipacaoEntidade(empreendimentoId, participacaoId);
        participacaoRepository.delete(participacao);
    }

    public BigDecimal somaPercentuais(Long empreendimentoId) {
        buscarEntidadePorId(empreendimentoId);
        return participacaoRepository.findByEmpreendimentoId(empreendimentoId).stream()
                .map(participacao -> participacao.getPercentual() != null ? participacao.getPercentual() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public boolean investidorParticipaDoEmpreendimento(Long empreendimentoId, Long investidorId) {
        return participacaoRepository.existsByEmpreendimentoIdAndInvestidorId(empreendimentoId, investidorId);
    }

    private Participacao criarParticipacao(Empreendimento empreendimento, ParticipacaoRequisicao requisicao) {
        Investidor investidor = investidorRepository.findById(requisicao.investidorId())
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Investidor", requisicao.investidorId()));

        if (participacaoRepository.existsByEmpreendimentoIdAndInvestidorId(empreendimento.getId(), investidor.getId())) {
            throw new RegraDeNegocioException("Este investidor já participa deste empreendimento");
        }

        validarPercentual(requisicao.percentual());

        Participacao participacao = Participacao.builder()
                .empreendimento(empreendimento)
                .investidor(investidor)
                .percentual(requisicao.percentual())
                .dataEntrada(requisicao.dataEntrada() != null ? requisicao.dataEntrada() : LocalDate.now())
                .build();

        return participacaoRepository.save(participacao);
    }

    private Participacao buscarParticipacaoEntidade(Long empreendimentoId, Long participacaoId) {
        Participacao participacao = participacaoRepository.findById(participacaoId)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Participação", participacaoId));

        if (!participacao.getEmpreendimento().getId().equals(empreendimentoId)) {
            throw RecursoNaoEncontradoException.paraId("Participação", participacaoId);
        }

        return participacao;
    }

    /** Percentual é opcional — só valida a faixa quando um valor é informado. */
    private void validarPercentual(BigDecimal percentual) {
        if (percentual == null) {
            return;
        }
        if (percentual.compareTo(BigDecimal.ZERO) <= 0 || percentual.compareTo(new BigDecimal("100")) > 0) {
            throw new RegraDeNegocioException("O percentual de participação deve estar entre 0 e 100");
        }
    }

    private Empreendimento buscarEntidadePorId(Long id) {
        return empreendimentoRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Empreendimento", id));
    }
}

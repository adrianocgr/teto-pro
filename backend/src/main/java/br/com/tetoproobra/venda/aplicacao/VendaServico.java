package br.com.tetoproobra.venda.aplicacao;

import br.com.tetoproobra.auditoria.dominio.EventoAuditoria;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RecursoNaoEncontradoException;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RegraDeNegocioException;
import br.com.tetoproobra.despesa.dominio.Despesa;
import br.com.tetoproobra.despesa.infraestrutura.DespesaRepository;
import br.com.tetoproobra.empreendimento.dominio.Empreendimento;
import br.com.tetoproobra.empreendimento.dominio.Participacao;
import br.com.tetoproobra.empreendimento.infraestrutura.EmpreendimentoRepository;
import br.com.tetoproobra.empreendimento.infraestrutura.ParticipacaoRepository;
import br.com.tetoproobra.investidor.dominio.Investidor;
import br.com.tetoproobra.usuario.aplicacao.UsuarioContextoServico;
import br.com.tetoproobra.usuario.dominio.Usuario;
import br.com.tetoproobra.venda.dominio.Venda;
import br.com.tetoproobra.venda.infraestrutura.VendaRepository;
import br.com.tetoproobra.venda.web.FechamentoResposta;
import br.com.tetoproobra.venda.web.RateioInvestidorResposta;
import br.com.tetoproobra.venda.web.VendaRequisicao;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Regras de negócio do fechamento financeiro (Venda) de um empreendimento:
 * registro/atualização da venda e cálculo do lucro apurado e do seu rateio
 * entre os investidores, proporcional ao percentual de participação de cada
 * um (ver {@link Participacao}).
 * <p>
 * {@code @Transactional} na classe: {@code investidor} de {@link Participacao}
 * é lazy, e {@code montarRateio} precisa acessá-lo para montar a resposta —
 * sem manter a transação aberta até o mapeamento, isso quebra com
 * LazyInitializationException.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class VendaServico {

    private final VendaRepository vendaRepository;
    private final EmpreendimentoRepository empreendimentoRepository;
    private final ParticipacaoRepository participacaoRepository;
    private final DespesaRepository despesaRepository;
    private final UsuarioContextoServico usuarioContextoServico;
    private final ApplicationEventPublisher publicadorDeEventos;

    public Venda registrar(Long empreendimentoId, VendaRequisicao requisicao) {
        Empreendimento empreendimento = buscarEmpreendimento(empreendimentoId);

        if (vendaRepository.findByEmpreendimentoId(empreendimentoId).isPresent()) {
            throw new RegraDeNegocioException(
                    "Este empreendimento já possui uma venda registrada. Para alterar, utilize a atualização.");
        }

        Venda venda = Venda.builder()
                .empreendimento(empreendimento)
                .dataVenda(requisicao.dataVenda())
                .valorVenda(requisicao.valorVenda())
                .comprador(requisicao.comprador())
                .comissaoCorretor(valorOuZero(requisicao.comissaoCorretor()))
                .custosVendaAdicionais(valorOuZero(requisicao.custosVendaAdicionais()))
                .build();

        venda = vendaRepository.save(venda);

        Usuario usuarioAtual = usuarioContextoServico.obterUsuarioAutenticado();
        publicadorDeEventos.publishEvent(EventoAuditoria.criacao(
                venda.getTenantId(),
                "venda",
                venda.getId(),
                empreendimento.getDescricao(),
                empreendimento.getId(),
                empreendimento.getDescricao(),
                usuarioAtual.getEmail()));

        return venda;
    }

    public Venda atualizar(Long empreendimentoId, VendaRequisicao requisicao) {
        Empreendimento empreendimento = buscarEmpreendimento(empreendimentoId);
        Venda venda = vendaRepository.findByEmpreendimentoId(empreendimentoId)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Venda", empreendimentoId));

        BigDecimal valorVendaAnterior = venda.getValorVenda();

        venda.setDataVenda(requisicao.dataVenda());
        venda.setValorVenda(requisicao.valorVenda());
        venda.setComprador(requisicao.comprador());
        venda.setComissaoCorretor(valorOuZero(requisicao.comissaoCorretor()));
        venda.setCustosVendaAdicionais(valorOuZero(requisicao.custosVendaAdicionais()));

        venda = vendaRepository.save(venda);

        Usuario usuarioAtual = usuarioContextoServico.obterUsuarioAutenticado();
        publicadorDeEventos.publishEvent(EventoAuditoria.atualizacao(
                venda.getTenantId(),
                "venda",
                venda.getId(),
                empreendimento.getDescricao(),
                empreendimento.getId(),
                empreendimento.getDescricao(),
                usuarioAtual.getEmail(),
                List.of(new EventoAuditoria.CampoAlterado(
                        "valorVenda",
                        String.valueOf(valorVendaAnterior),
                        String.valueOf(venda.getValorVenda())))));

        return venda;
    }

    public FechamentoResposta buscarFechamento(Long empreendimentoId) {
        Empreendimento empreendimento = buscarEmpreendimento(empreendimentoId);

        Venda venda = vendaRepository.findByEmpreendimentoId(empreendimentoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Nenhuma venda registrada para este empreendimento"));

        BigDecimal totalGasto = despesaRepository.findByEmpreendimentoId(empreendimentoId, Pageable.unpaged())
                .getContent().stream()
                .map(Despesa::getValorTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal lucro = venda.getValorVenda()
                .subtract(totalGasto)
                .subtract(venda.getComissaoCorretor())
                .subtract(venda.getCustosVendaAdicionais());

        List<Participacao> participacoes = participacaoRepository.findByEmpreendimentoId(empreendimentoId);
        List<RateioInvestidorResposta> rateio = participacoes.stream()
                .map(participacao -> montarRateio(participacao, lucro))
                .toList();

        return new FechamentoResposta(
                empreendimento.getId(),
                empreendimento.getDescricao(),
                venda.getDataVenda(),
                venda.getComprador(),
                venda.getValorVenda(),
                totalGasto,
                venda.getComissaoCorretor(),
                venda.getCustosVendaAdicionais(),
                lucro,
                rateio);
    }

    private RateioInvestidorResposta montarRateio(Participacao participacao, BigDecimal lucro) {
        Investidor investidor = participacao.getInvestidor();
        BigDecimal percentual = valorOuZero(participacao.getPercentual());
        BigDecimal lucroRateado = lucro
                .multiply(percentual)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        return new RateioInvestidorResposta(
                investidor.getId(),
                investidor.getNome(),
                percentual,
                BigDecimal.ZERO,
                lucroRateado);
    }

    private BigDecimal valorOuZero(BigDecimal valor) {
        return valor != null ? valor : BigDecimal.ZERO;
    }

    private Empreendimento buscarEmpreendimento(Long id) {
        return empreendimentoRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Empreendimento", id));
    }
}

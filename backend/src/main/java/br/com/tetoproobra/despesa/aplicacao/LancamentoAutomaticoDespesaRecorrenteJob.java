package br.com.tetoproobra.despesa.aplicacao;

import br.com.tetoproobra.administracao.dominio.Empresa;
import br.com.tetoproobra.administracao.infraestrutura.EmpresaRepository;
import br.com.tetoproobra.compartilhado.dominio.Papel;
import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import br.com.tetoproobra.compartilhado.multitenancy.ContextoTenant;
import br.com.tetoproobra.despesa.dominio.DespesaRecorrente;
import br.com.tetoproobra.despesa.dominio.PagadorRecorrente;
import br.com.tetoproobra.despesa.infraestrutura.DespesaRecorrenteRepository;
import br.com.tetoproobra.despesa.infraestrutura.DespesaRepository;
import br.com.tetoproobra.despesa.web.DespesaRequisicao;
import br.com.tetoproobra.despesa.web.PagadorRequisicao;
import br.com.tetoproobra.usuario.dominio.Usuario;
import br.com.tetoproobra.usuario.dominio.VinculoUsuarioEmpresa;
import br.com.tetoproobra.usuario.infraestrutura.VinculoUsuarioEmpresaRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Todo dia, na madrugada, cria automaticamente a {@link br.com.tetoproobra.despesa.dominio.Despesa}
 * do mês corrente para toda {@link DespesaRecorrente} ATIVA que tenha optado
 * por "lançamento automático" — dispensando alguém de clicar em "Lançar"
 * para contas cujo valor mensal é previsível o bastante para usar
 * {@code valorPadrao} como valor final.
 * <p>
 * Roda para todos os tenants ativos, um de cada vez: como
 * {@link ContextoTenant} só é populado por requisição HTTP (ver
 * {@code FiltroTenant}), aqui ele precisa ser definido/limpo manualmente em
 * volta do processamento de cada empresa. Idempotente e tolerante a falhas:
 * se travar num tenant ou numa recorrência específica, loga o erro e segue
 * para a próxima — a constraint {@code uk_de_recorrencia_competencia}
 * garante que a mesma competência nunca é lançada duas vezes, então rodar
 * todo dia só "tenta de novo" até dar certo (cobre o caso do job não rodar
 * numa madrugada específica).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LancamentoAutomaticoDespesaRecorrenteJob {

    private static final ZoneId ZONA_SAO_PAULO = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter FORMATO_MES =
            DateTimeFormatter.ofPattern("MMMM 'de' yyyy", new Locale("pt", "BR"));

    private final EmpresaRepository empresaRepository;
    private final DespesaRecorrenteRepository despesaRecorrenteRepository;
    private final DespesaRepository despesaRepository;
    private final VinculoUsuarioEmpresaRepository vinculoUsuarioEmpresaRepository;
    private final DespesaServico despesaServico;

    @Scheduled(
            cron = "${tetopro-obra.despesas-recorrentes.lancamento-automatico.cron:0 0 23 * * *}",
            zone = "America/Sao_Paulo")
    public void executar() {
        LocalDate competencia = LocalDate.now(ZONA_SAO_PAULO).withDayOfMonth(1);
        List<Empresa> empresasAtivas = empresaRepository.findAll().stream()
                .filter(empresa -> empresa.getStatus() == StatusAtivoInativo.ATIVO)
                .toList();

        log.info("Iniciando lançamento automático de despesas recorrentes para a competência {} ({} tenant(s) ativo(s))",
                competencia, empresasAtivas.size());

        for (Empresa empresa : empresasAtivas) {
            try {
                ContextoTenant.definir(empresa.getId());
                processarTenant(empresa, competencia);
            } catch (Exception e) {
                log.error("Falha ao processar lançamento automático de despesas recorrentes do tenant {}",
                        empresa.getId(), e);
            } finally {
                ContextoTenant.limpar();
            }
        }
    }

    private void processarTenant(Empresa empresa, LocalDate competencia) {
        List<DespesaRecorrente> recorrentes =
                despesaRecorrenteRepository.findByStatusAndLancamentoAutomaticoTrue(StatusAtivoInativo.ATIVO);
        if (recorrentes.isEmpty()) {
            return;
        }

        Usuario usuarioResponsavel = buscarAdministradorResponsavel(empresa.getId());
        if (usuarioResponsavel == null) {
            log.warn("Tenant {} tem {} despesa(s) recorrente(s) com lançamento automático, mas nenhum "
                            + "administrador ativo para atribuir o lançamento — pulando",
                    empresa.getId(), recorrentes.size());
            return;
        }

        for (DespesaRecorrente recorrente : recorrentes) {
            try {
                lancar(recorrente, competencia, usuarioResponsavel);
            } catch (Exception e) {
                log.error("Falha ao lançar automaticamente a despesa recorrente {} ({}) do tenant {}",
                        recorrente.getId(), recorrente.getDescricao(), empresa.getId(), e);
            }
        }
    }

    private void lancar(DespesaRecorrente recorrente, LocalDate competencia, Usuario usuarioResponsavel) {
        if (despesaRepository.existsByRecorrencia_IdAndCompetencia(recorrente.getId(), competencia)) {
            return; // já lançada este mês — nada a fazer.
        }
        if (recorrente.getValorPadrao() == null || recorrente.getValorPadrao().compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("Despesa recorrente {} ({}) está com lançamento automático ativo mas sem valor padrão "
                    + "válido — pulando", recorrente.getId(), recorrente.getDescricao());
            return;
        }

        DespesaRequisicao requisicao = new DespesaRequisicao(
                recorrente.getEmpreendimento().getId(),
                recorrente.getCategoria().getId(),
                recorrente.getFornecedor() != null ? recorrente.getFornecedor().getId() : null,
                recorrente.getDescricao() + " — " + FORMATO_MES.format(competencia),
                observacaoAutomatica(recorrente),
                recorrente.getValorPadrao(),
                BigDecimal.ZERO,
                null,
                montarPagadores(recorrente),
                recorrente.getId(),
                competencia,
                null);

        despesaServico.criarAutomatica(requisicao, usuarioResponsavel);
        log.info("Despesa recorrente {} ({}) lançada automaticamente para a competência {}",
                recorrente.getId(), recorrente.getDescricao(), competencia);
    }

    private String observacaoAutomatica(DespesaRecorrente recorrente) {
        String nota = "Lançamento automático gerado pelo sistema.";
        return recorrente.getObservacao() == null || recorrente.getObservacao().isBlank()
                ? nota
                : recorrente.getObservacao() + " — " + nota;
    }

    /**
     * Distribui {@code valorPadrao} entre os pagadores proporcionalmente ao
     * percentual de cada um, arredondando para 2 casas — e ajustando o
     * último pagador para a soma bater exatamente com o valor total. Mesmo
     * algoritmo usado no "Lançar" manual da tela de despesas recorrentes
     * (ver {@code DespesasRecorrentes.tsx}), só que calculado no servidor.
     */
    private List<PagadorRequisicao> montarPagadores(DespesaRecorrente recorrente) {
        List<PagadorRecorrente> pagadores = recorrente.getPagadores();
        BigDecimal valorPadrao = recorrente.getValorPadrao();
        BigDecimal totalPercentual = pagadores.stream()
                .map(PagadorRecorrente::getPercentual)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalPercentual.compareTo(BigDecimal.ZERO) == 0) {
            totalPercentual = new BigDecimal("100");
        }

        List<PagadorRequisicao> requisicoes = new ArrayList<>();
        BigDecimal somaParcial = BigDecimal.ZERO;
        for (int i = 0; i < pagadores.size(); i++) {
            PagadorRecorrente pagador = pagadores.get(i);
            BigDecimal valor;
            if (i == pagadores.size() - 1) {
                valor = valorPadrao.subtract(somaParcial).setScale(2, RoundingMode.HALF_UP);
            } else {
                valor = valorPadrao.multiply(pagador.getPercentual())
                        .divide(totalPercentual, 10, RoundingMode.HALF_UP)
                        .setScale(2, RoundingMode.HALF_UP);
                somaParcial = somaParcial.add(valor);
            }
            requisicoes.add(new PagadorRequisicao(pagador.getInvestidor().getId(), valor));
        }
        return requisicoes;
    }

    private Usuario buscarAdministradorResponsavel(String tenantId) {
        return vinculoUsuarioEmpresaRepository.listarPorEmpresa(tenantId).stream()
                .filter(vinculo -> vinculo.getPapel() == Papel.ADMIN && vinculo.getStatus() == StatusAtivoInativo.ATIVO)
                .map(VinculoUsuarioEmpresa::getUsuario)
                .findFirst()
                .orElse(null);
    }
}

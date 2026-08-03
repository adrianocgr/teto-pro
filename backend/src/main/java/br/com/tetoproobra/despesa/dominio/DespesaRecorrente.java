package br.com.tetoproobra.despesa.dominio;

import br.com.tetoproobra.categoria.dominio.Categoria;
import br.com.tetoproobra.compartilhado.dominio.EntidadeComTenant;
import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import br.com.tetoproobra.empreendimento.dominio.Empreendimento;
import br.com.tetoproobra.fornecedor.dominio.Fornecedor;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Modelo de despesa que se repete todo mês (água, luz, condomínio...) para um
 * {@link Empreendimento} — não é uma despesa em si, é o "molde" a partir do
 * qual uma {@link Despesa} de verdade é criada quando o usuário clica em
 * "Lançar" para uma competência (mês) específica (ver
 * {@link br.com.tetoproobra.despesa.aplicacao.DespesaRecorrenteServico}).
 * <p>
 * O rateio aqui é em PERCENTUAL ({@link PagadorRecorrente}), não valor fixo
 * como em {@link PagadorDespesa} — a conta varia todo mês, então o que se
 * repete é a proporção entre os investidores, não o valor.
 */
@Entity
@Table(name = "tb_despesa_recorrente")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class DespesaRecorrente extends EntidadeComTenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dr_id")
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dr_empreendimento_id", nullable = false)
    private Empreendimento empreendimento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dr_categoria_id", nullable = false)
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dr_fornecedor_id")
    private Fornecedor fornecedor;

    @Column(name = "dr_descricao", nullable = false)
    private String descricao;

    @Column(name = "dr_observacao", columnDefinition = "text")
    private String observacao;

    /** Sugestão de valor para pré-preencher o lançamento — a conta real varia todo mês. */
    @Column(name = "dr_valor_padrao", precision = 14, scale = 2)
    private BigDecimal valorPadrao;

    /** Só informativo (dia do vencimento) — não dispara cobrança nem lembrete. */
    @Column(name = "dr_dia_vencimento")
    private Integer diaVencimento;

    @Enumerated(EnumType.STRING)
    @Column(name = "dr_status", nullable = false, length = 20)
    private StatusAtivoInativo status;

    @Column(name = "dr_ultima_competencia")
    private LocalDate ultimaCompetencia;

    @Column(name = "dr_ultimo_valor", precision = 14, scale = 2)
    private BigDecimal ultimoValor;

    /**
     * Quando ativado, o job noturno ({@code LancamentoAutomaticoDespesaRecorrenteJob})
     * cria sozinho a {@link Despesa} da competência corrente a partir deste
     * modelo, usando {@code valorPadrao} e o rateio percentual dos
     * {@code pagadores} — por isso exige {@code valorPadrao} preenchido (ver
     * validação em {@code DespesaRecorrenteServico}).
     */
    @Column(name = "dr_lancamento_automatico", nullable = false)
    @Builder.Default
    private boolean lancamentoAutomatico = false;

    @CreationTimestamp
    @Column(name = "dr_created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "recorrencia", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PagadorRecorrente> pagadores = new ArrayList<>();
}

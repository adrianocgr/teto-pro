package br.com.tetoproobra.despesa.dominio;

import br.com.tetoproobra.categoria.dominio.Categoria;
import br.com.tetoproobra.compartilhado.dominio.EntidadeComTenant;
import br.com.tetoproobra.empreendimento.dominio.Empreendimento;
import br.com.tetoproobra.fornecedor.dominio.Fornecedor;
import br.com.tetoproobra.usuario.dominio.Usuario;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Lançamento de custo de um {@link Empreendimento}: pertence a uma
 * {@link Categoria}, opcionalmente a um {@link Fornecedor}, pode detalhar seu
 * valor em {@link ItemDespesa}s (insumo x quantidade x valor unitário) e é
 * sempre paga por um ou mais investidores ao mesmo tempo, via rateio (ver
 * {@link PagadorDespesa}). Pode ainda ter {@link DespesaDocumento}s anexados
 * (nota fiscal, comprovante etc.), cujo binário fica no GridFS/MongoDB.
 */
@Entity
@Table(name = "tb_despesa")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Despesa extends EntidadeComTenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "de_id")
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "de_empreendimento_id", nullable = false)
    private Empreendimento empreendimento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "de_categoria_id", nullable = false)
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "de_fornecedor_id")
    private Fornecedor fornecedor;

    @Column(name = "de_descricao", nullable = false)
    private String descricao;

    @Column(name = "de_observacao", columnDefinition = "text")
    private String observacao;

    @Column(name = "de_valor_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "de_data_cadastro", nullable = false)
    private LocalDate dataCadastro;

    @Column(name = "de_data_alteracao")
    private LocalDate dataAlteracao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "de_usuario_cadastro_id", nullable = false)
    private Usuario usuarioCadastro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "de_usuario_alteracao_id")
    private Usuario usuarioAlteracao;

    /**
     * Preenchidos só quando esta despesa foi gerada a partir de uma
     * {@link DespesaRecorrente} (botão "Lançar" — ver
     * {@link br.com.tetoproobra.despesa.aplicacao.DespesaRecorrenteServico}).
     * {@code competencia} é sempre o primeiro dia do mês de referência; a
     * combinação com {@code recorrencia} nunca se repete (ver constraint
     * {@code uk_de_recorrencia_competencia}), evitando lançar o mesmo mês duas vezes.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "de_recorrencia_id")
    private DespesaRecorrente recorrencia;

    @Column(name = "de_competencia")
    private LocalDate competencia;

    @OneToMany(mappedBy = "despesa", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ItemDespesa> itens = new ArrayList<>();

    @OneToMany(mappedBy = "despesa", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PagadorDespesa> pagadores = new ArrayList<>();

    @OneToMany(mappedBy = "despesa", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DespesaDocumento> documentos = new ArrayList<>();
}

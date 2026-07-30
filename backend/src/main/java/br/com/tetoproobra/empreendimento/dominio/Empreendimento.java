package br.com.tetoproobra.empreendimento.dominio;

import br.com.tetoproobra.compartilhado.dominio.EntidadeComTenant;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Empreendimento (obra) — residencial, edifício etc. — financiado por um ou mais
 * investidores, cada um com um percentual de participação (ver {@link Participacao})
 * usado posteriormente para ratear o lucro na venda.
 */
@Entity
@Table(name = "tb_empreendimento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Empreendimento extends EntidadeComTenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ep_id")
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "ep_descricao", nullable = false)
    private String descricao;

    @Column(name = "ep_inscricao_municipal", length = 50)
    private String inscricaoMunicipal;

    @Column(name = "ep_matricula", length = 50)
    private String matricula;

    @Column(name = "ep_endereco")
    private String endereco;

    @Column(name = "ep_numero", length = 20)
    private String numero;

    @Column(name = "ep_quadra", length = 50)
    private String quadra;

    @Column(name = "ep_lote", length = 50)
    private String lote;

    @Column(name = "ep_complemento", length = 100)
    private String complemento;

    @OneToMany(mappedBy = "empreendimento", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Participacao> participacoes = new ArrayList<>();
}

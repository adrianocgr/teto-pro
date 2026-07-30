package br.com.tetoproobra.investidor.dominio;

import br.com.tetoproobra.compartilhado.dominio.EntidadeComTenant;
import br.com.tetoproobra.compartilhado.dominio.TipoPessoa;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Investidor (pessoa física ou jurídica) que financia empreendimentos e
 * posteriormente recebe extrato/rateio do que pagou e do lucro na venda.
 */
@Entity
@Table(name = "tb_investidor")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Investidor extends EntidadeComTenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "iv_id")
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "iv_nome", nullable = false, length = 255)
    private String nome;

    @Column(name = "iv_cpf_cnpj", nullable = false, length = 20)
    private String cpfCnpj;

    @Enumerated(EnumType.STRING)
    @Column(name = "iv_tipo_pessoa", nullable = false, length = 20)
    private TipoPessoa tipoPessoa;

    @Column(name = "iv_email", length = 255)
    private String email;

    @Column(name = "iv_telefone", length = 30)
    private String telefone;

    @Column(name = "iv_observacoes")
    private String observacoes;
}

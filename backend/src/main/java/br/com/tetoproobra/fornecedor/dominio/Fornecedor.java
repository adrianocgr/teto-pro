package br.com.tetoproobra.fornecedor.dominio;

import br.com.tetoproobra.compartilhado.dominio.EntidadeComTenant;
import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import br.com.tetoproobra.localidade.dominio.Cidade;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Catálogo de fornecedores da empresa (tenant) — reaproveitado entre todos os
 * empreendimentos de uma mesma empresa, isolado das demais empresas.
 */
@Entity
@Table(name = "tb_fornecedor")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false, onlyExplicitlyIncluded = true)
public class Fornecedor extends EntidadeComTenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fo_id")
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "fo_razao_social", nullable = false)
    private String razaoSocial;

    @Column(name = "fo_cnpj_cpf", nullable = false, length = 20)
    private String cnpjCpf;

    @Column(name = "fo_email")
    private String email;

    @Column(name = "fo_telefone", length = 30)
    private String telefone;

    @Column(name = "fo_logradouro")
    private String logradouro;

    @Column(name = "fo_numero", length = 30)
    private String numero;

    @Column(name = "fo_complemento", length = 120)
    private String complemento;

    @Column(name = "fo_bairro", length = 120)
    private String bairro;

    @Column(name = "fo_cep", length = 15)
    private String cep;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fo_cidade_id")
    private Cidade cidade;

    @Enumerated(EnumType.STRING)
    @Column(name = "fo_status", nullable = false, length = 20)
    private StatusAtivoInativo status;

    @Builder.Default
    @OneToMany(mappedBy = "fornecedor", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Representante> representantes = new ArrayList<>();
}

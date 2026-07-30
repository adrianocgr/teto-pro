package br.com.tetoproobra.fornecedor.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Pessoa de contato de um {@link Fornecedor}. Não estende
 * {@link br.com.tetoproobra.compartilhado.dominio.EntidadeComTenant} — é filho
 * de Fornecedor e herda o isolamento por tenant transitivamente via
 * {@code rp_fornecedor_id}, não precisando de coluna tenant_id própria.
 */
@Entity
@Table(name = "tb_representante")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Representante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rp_id")
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rp_fornecedor_id", nullable = false)
    private Fornecedor fornecedor;

    @Column(name = "rp_nome", nullable = false)
    private String nome;

    @Column(name = "rp_email")
    private String email;

    @Column(name = "rp_telefone", length = 30)
    private String telefone;
}

package br.com.tetoproobra.administracao.dominio;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import jakarta.persistence.*;
import lombok.*;

/**
 * Uma empresa (tenant) da plataforma. Ao contrário das demais entidades do
 * sistema, NÃO é isolada por tenant — é ela própria quem define o universo
 * de isolamento das outras. Por isso não estende {@code EntidadeComTenant}
 * e só é gerenciável pela área de administração da plataforma.
 */
@Entity
@Table(name = "tb_tenant")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Empresa {

    @Id
    @Column(name = "tn_id", length = 40)
    @EqualsAndHashCode.Include
    private String id;

    @Column(name = "tn_nome", nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(name = "tn_status", nullable = false, length = 20)
    private StatusAtivoInativo status;
}

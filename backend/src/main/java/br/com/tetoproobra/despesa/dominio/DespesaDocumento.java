package br.com.tetoproobra.despesa.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Metadado de um documento (PDF/imagem) anexado a uma {@link Despesa}. O
 * binário em si fica no MongoDB via GridFS ({@code fileId} é o ObjectId,
 * como String) — ver
 * {@link br.com.tetoproobra.despesa.infraestrutura.ArmazenamentoArquivoServico}.
 * Não estende {@code EntidadeComTenant} — é filho de Despesa e herda o
 * isolamento por tenant transitivamente via {@code dd_despesa_id}.
 */
@Entity
@Table(name = "tb_despesa_documento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class DespesaDocumento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dd_id")
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dd_despesa_id", nullable = false)
    private Despesa despesa;

    @Column(name = "dd_file_id", nullable = false, length = 24)
    private String fileId;

    @Column(name = "dd_filename", nullable = false)
    private String filename;

    @Column(name = "dd_content_type", length = 150)
    private String contentType;

    @Column(name = "dd_length", nullable = false)
    private Long length;

    @Column(name = "dd_uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dd_tags", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> tags = new ArrayList<>();
}

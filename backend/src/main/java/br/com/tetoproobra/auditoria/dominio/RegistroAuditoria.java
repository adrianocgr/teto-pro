package br.com.tetoproobra.auditoria.dominio;

import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Registro persistido no MongoDB (coleção dedicada à auditoria, separada do
 * banco relacional e do banco de arquivos) a partir de um
 * {@link EventoAuditoria} publicado por qualquer domínio de negócio (Despesa,
 * Venda, Participação etc.). Gravação sempre assíncrona — ver
 * {@code OuvinteEventoAuditoria} — para não travar a transação principal.
 */
@Document(collection = "registros_auditoria")
@CompoundIndexes(
        @CompoundIndex(name = "idx_tenant_entidade_momento", def = "{'tenantId': 1, 'entidade': 1, 'momento': -1}"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroAuditoria {

    @Id
    private String id;

    private String tenantId;

    private String entidade;

    private Long entidadeId;

    private String entidadeRef;

    private Long empreendimentoId;

    private String empreendimentoDescricao;

    private String operacao;

    private String usuarioEmail;

    private List<CampoAlterado> camposAlterados;

    private Instant momento;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CampoAlterado {
        private String campo;
        private String valorAnterior;
        private String valorNovo;
    }
}

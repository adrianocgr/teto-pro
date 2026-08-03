package br.com.tetoproobra.despesa.infraestrutura;

import br.com.tetoproobra.despesa.dominio.Despesa;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * Filtros opcionais e combináveis da listagem de despesas — cada método
 * devolve {@code null} quando o filtro não se aplica (nenhum valor
 * informado), o que {@link Specification#where} e
 * {@link Specification#and} tratam como "sem restrição adicional", conforme
 * o padrão documentado do Spring Data JPA para combinar {@code Specification}s
 * opcionais sem precisar de um método de repositório para cada combinação.
 */
public final class DespesaEspecificacoes {

    private DespesaEspecificacoes() {
    }

    public static Specification<Despesa> comEmpreendimento(Long empreendimentoId) {
        return (raiz, consulta, cb) -> cb.equal(raiz.get("empreendimento").get("id"), empreendimentoId);
    }

    public static Specification<Despesa> comDescricaoContendo(String busca) {
        if (!StringUtils.hasText(busca)) {
            return null;
        }
        String padrao = "%" + busca.toLowerCase() + "%";
        return (raiz, consulta, cb) -> cb.like(cb.lower(raiz.get("descricao")), padrao);
    }

    public static Specification<Despesa> comCategoria(Long categoriaId) {
        if (categoriaId == null) {
            return null;
        }
        return (raiz, consulta, cb) -> cb.equal(raiz.get("categoria").get("id"), categoriaId);
    }

    /**
     * {@code distinct(true)} evita repetir a mesma despesa caso o join com
     * pagadores alguma vez deixe de ser 1:1 por investidor — hoje é garantido
     * por {@code uk_pg_despesa_investidor}, mas mais barato manter a
     * consulta correta por construção do que depender só da constraint.
     */
    public static Specification<Despesa> comInvestidorPagador(Long investidorId) {
        if (investidorId == null) {
            return null;
        }
        return (raiz, consulta, cb) -> {
            consulta.distinct(true);
            return cb.equal(raiz.join("pagadores").get("investidor").get("id"), investidorId);
        };
    }

    /** Período de lançamento — filtra por {@code dataCadastro}. */
    public static Specification<Despesa> comDataCadastroEntre(LocalDate de, LocalDate ate) {
        return comDataEntre("dataCadastro", de, ate);
    }

    /** Período de pagamento — filtra por {@code dataPagamento}. */
    public static Specification<Despesa> comDataPagamentoEntre(LocalDate de, LocalDate ate) {
        return comDataEntre("dataPagamento", de, ate);
    }

    private static Specification<Despesa> comDataEntre(String campo, LocalDate de, LocalDate ate) {
        if (de == null && ate == null) {
            return null;
        }
        if (de != null && ate != null) {
            return (raiz, consulta, cb) -> cb.between(raiz.get(campo), de, ate);
        }
        if (de != null) {
            return (raiz, consulta, cb) -> cb.greaterThanOrEqualTo(raiz.get(campo), de);
        }
        return (raiz, consulta, cb) -> cb.lessThanOrEqualTo(raiz.get(campo), ate);
    }
}

package br.com.tetoproobra.localidade.infraestrutura;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Cliente para a API pública de localidades do IBGE — usado só pela
 * importação de município por estado (ver {@code ImportacaoLocalidadeServico}),
 * disparada manualmente pelo administrador da plataforma.
 * <p>
 * As respostas trazem bem mais campos do que interessa aqui (região,
 * mesorregião, microrregião...), por isso são lidas como {@code Map} em vez
 * de records estritos — evita depender do formato completo da API externa.
 */
@Component
public class IbgeClient {

    private static final String URL_BASE = "https://servicodados.ibge.gov.br/api/v1/localidades";

    private final RestClient restClient = RestClient.create(URL_BASE);

    public record EstadoIbge(String sigla, String nome) {
    }

    public record MunicipioIbge(String nome) {
    }

    public EstadoIbge buscarEstado(String siglaUf) {
        @SuppressWarnings("unchecked")
        Map<String, Object> corpo = restClient.get()
                .uri("/estados/{uf}", siglaUf)
                .retrieve()
                .body(Map.class);
        return new EstadoIbge((String) corpo.get("sigla"), (String) corpo.get("nome"));
    }

    public List<MunicipioIbge> listarMunicipios(String siglaUf) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> corpo = restClient.get()
                .uri("/estados/{uf}/municipios", siglaUf)
                .retrieve()
                .body(List.class);
        return corpo.stream().map(municipio -> new MunicipioIbge((String) municipio.get("nome"))).toList();
    }
}

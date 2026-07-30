package br.com.tetoproobra.compartilhado.keycloak;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

/**
 * Cliente para a Admin REST API do Keycloak — usado exclusivamente para
 * provisionar/remover a credencial de login quando um usuário é
 * cadastrado/excluído pela aplicação (ver {@code UsuarioProvisionamentoServico}).
 * <p>
 * Autentica-se como o próprio client de service account
 * "tetopro-obra-backend" (grant client_credentials, ver realm-tetopro-obra.json),
 * que tem a role "manage-users" do client embutido "realm-management" —
 * nunca usa as credenciais do admin master do Keycloak.
 */
@Component
public class KeycloakAdminClient {

    private static final String SENHA_TEMPORARIA_PADRAO = "trocar123";

    private final RestClient restClient;
    private final String realm;
    private final String clientId;
    private final String clientSecret;

    private volatile String tokenEmCache;
    private volatile Instant tokenExpiraEm = Instant.EPOCH;

    public KeycloakAdminClient(
            @Value("${tetopro-obra.keycloak-admin.url}") String url,
            @Value("${tetopro-obra.keycloak-admin.realm}") String realm,
            @Value("${tetopro-obra.keycloak-admin.client-id}") String clientId,
            @Value("${tetopro-obra.keycloak-admin.client-secret}") String clientSecret) {
        this.restClient = RestClient.create(url);
        this.realm = realm;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    /**
     * Cria o usuário no Keycloak com uma senha temporária padrão (o próprio
     * Keycloak força a troca no primeiro login, por causa de "temporary": true)
     * e devolve o id gerado — que vira {@code us_keycloak_id} em {@code tb_usuario}.
     */
    public String criarUsuario(String nome, String username, String email) {
        Map<String, Object> corpo = Map.of(
                "username", username,
                "email", email,
                "firstName", nome,
                "enabled", true,
                "emailVerified", true,
                "credentials", List.of(Map.of(
                        "type", "password",
                        "value", SENHA_TEMPORARIA_PADRAO,
                        "temporary", true)));

        var resposta = restClient.post()
                .uri("/admin/realms/{realm}/users", realm)
                .headers(cabecalhos -> cabecalhos.setBearerAuth(tokenDeAcesso()))
                .contentType(MediaType.APPLICATION_JSON)
                .body(corpo)
                .retrieve()
                .toBodilessEntity();

        String location = resposta.getHeaders().getFirst(HttpHeaders.LOCATION);
        if (location == null) {
            throw new IllegalStateException("Keycloak não retornou o id do usuário criado");
        }
        return location.substring(location.lastIndexOf('/') + 1);
    }

    public void excluirUsuario(String keycloakId) {
        restClient.delete()
                .uri("/admin/realms/{realm}/users/{id}", realm, keycloakId)
                .headers(cabecalhos -> cabecalhos.setBearerAuth(tokenDeAcesso()))
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> { })
                .toBodilessEntity();
    }

    private synchronized String tokenDeAcesso() {
        if (tokenEmCache != null && Instant.now().isBefore(tokenExpiraEm)) {
            return tokenEmCache;
        }
        MultiValueMap<String, String> formulario = new LinkedMultiValueMap<>();
        formulario.add("grant_type", "client_credentials");
        formulario.add("client_id", clientId);
        formulario.add("client_secret", clientSecret);

        // Extraído como Map (não um record estrito) porque a resposta do Keycloak
        // traz vários campos além de access_token/expires_in (token_type,
        // refresh_token, scope, ...) que não interessam aqui.
        @SuppressWarnings("unchecked")
        Map<String, Object> token = restClient.post()
                .uri("/realms/{realm}/protocol/openid-connect/token", realm)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(formulario)
                .retrieve()
                .body(Map.class);

        tokenEmCache = (String) token.get("access_token");
        long expiresIn = ((Number) token.get("expires_in")).longValue();
        // Margem de segurança de 10s para não usar um token prestes a expirar.
        tokenExpiraEm = Instant.now().plusSeconds(Math.max(expiresIn - 10, 0));
        return tokenEmCache;
    }
}

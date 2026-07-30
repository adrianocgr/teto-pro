package br.com.tetoproobra.configuracao;

import br.com.tetoproobra.compartilhado.multitenancy.FiltroTenant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.oauth2.server.resource.OAuth2ResourceServerConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Configuration
@EnableMethodSecurity
public class SegurancaConfig {

    private static final String[] ROTAS_PUBLICAS = {
            "/docs/**", "/v3/api-docs/**", "/swagger-ui/**", "/actuator/health"
    };

    /** Lista separada por vírgula — em produção vem de application-prod.yml, nunca hardcoded. */
    @Value("${tetopro-obra.cors.origens-permitidas}")
    private String origensPermitidasCsv;

    @Bean
    public SecurityFilterChain cadeiaDeSeguranca(HttpSecurity http, FiltroTenant filtroTenant) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(origensPermitidas()))
                .sessionManagement(sessao -> sessao.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(autorizacao -> autorizacao
                        .requestMatchers(ROTAS_PUBLICAS).permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwtConfigurer()))
                .addFilterAfter(filtroTenant, BearerTokenAuthenticationFilter.class);

        return http.build();
    }

    private org.springframework.security.config.Customizer<OAuth2ResourceServerConfigurer<HttpSecurity>.JwtConfigurer> jwtConfigurer() {
        return jwt -> jwt.jwtAuthenticationConverter(conversorDeAutenticacao());
    }

    /**
     * O Keycloak entrega as realm roles em {@code realm_access.roles}, não no
     * formato "scope" que o conversor padrão do Spring entende — por isso o
     * conversor customizado abaixo, que também preserva as authorities de
     * escopo padrão (caso algum client passe a usá-las).
     */
    private JwtAuthenticationConverter conversorDeAutenticacao() {
        JwtGrantedAuthoritiesConverter conversorPadrao = new JwtGrantedAuthoritiesConverter();
        JwtAuthenticationConverter conversor = new JwtAuthenticationConverter();
        conversor.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> authoritiesPadrao = conversorPadrao.convert(jwt);
            Collection<GrantedAuthority> authoritiesDeRealmRole = extrairRealmRoles(jwt).stream()
                    .map(papel -> "ROLE_" + papel)
                    .map(SimpleGrantedAuthority::new)
                    .map(GrantedAuthority.class::cast)
                    .toList();
            return Stream.concat(
                            Objects.requireNonNullElse(authoritiesPadrao, List.<GrantedAuthority>of()).stream(),
                            authoritiesDeRealmRole.stream())
                    .collect(Collectors.toSet());
        });
        return conversor;
    }

    @SuppressWarnings("unchecked")
    private List<String> extrairRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null || !(realmAccess.get("roles") instanceof List<?> roles)) {
            return List.of();
        }
        return (List<String>) roles;
    }

    private CorsConfigurationSource origensPermitidas() {
        List<String> origens = Arrays.stream(origensPermitidasCsv.split(","))
                .map(String::trim).filter(s -> !s.isBlank()).toList();

        CorsConfiguration configuracao = new CorsConfiguration();
        configuracao.setAllowedOrigins(origens);
        configuracao.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuracao.setAllowedHeaders(List.of("*"));
        configuracao.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource fonte = new UrlBasedCorsConfigurationSource();
        fonte.registerCorsConfiguration("/**", configuracao);
        return fonte;
    }
}

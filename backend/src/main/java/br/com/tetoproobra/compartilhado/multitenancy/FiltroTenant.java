package br.com.tetoproobra.compartilhado.multitenancy;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import br.com.tetoproobra.usuario.aplicacao.UsuarioContextoServico;
import br.com.tetoproobra.usuario.dominio.Usuario;
import br.com.tetoproobra.usuario.dominio.VinculoUsuarioEmpresa;
import br.com.tetoproobra.usuario.infraestrutura.VinculoUsuarioEmpresaRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Executa logo após a autenticação do token JWT (ver SegurancaConfig).
 * <p>
 * Papel (ADMIN, GESTOR, INVESTIDOR_VISUALIZADOR) não é mais uma realm role do
 * Keycloak — é um dado do vínculo entre a pessoa e a empresa (ver
 * {@link VinculoUsuarioEmpresa}), já que a mesma pessoa pode ter papéis
 * diferentes em empresas diferentes. Por isso este filtro:
 * <p>
 * 1. Lê qual empresa o frontend selecionou no cabeçalho {@code X-Tenant-Id}
 *    (nunca confiar em tenant vindo do token — aqui ele nem existe mais).<br>
 * 2. Resolve a pessoa logada e confere se ela tem um vínculo ATIVO com essa
 *    empresa.<br>
 * 3. Se tiver, publica o tenant no {@link ContextoTenant} (para o Hibernate)
 *    e adiciona {@code ROLE_<papel>} à autenticação da requisição — é assim
 *    que {@code @PreAuthorize("hasRole('ADMIN')")} nos controllers continua
 *    funcionando sem precisar saber nada sobre vínculos.
 * <p>
 * PLATAFORMA_ADMIN é a exceção: continua vindo direto do JWT (realm role de
 * verdade) porque não pertence a empresa alguma — não precisa de cabeçalho.
 */
@Component
@RequiredArgsConstructor
public class FiltroTenant extends OncePerRequestFilter {

    public static final String CABECALHO_TENANT_ID = "X-Tenant-Id";
    private static final String ROLE_PLATAFORMA_ADMIN = "ROLE_PLATAFORMA_ADMIN";

    private final UsuarioContextoServico usuarioContextoServico;
    private final VinculoUsuarioEmpresaRepository vinculoRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest requisicao,
                                     @NonNull HttpServletResponse resposta,
                                     @NonNull FilterChain cadeia) throws ServletException, IOException {
        try {
            aplicarContextoDeTenant(requisicao);
            cadeia.doFilter(requisicao, resposta);
        } finally {
            ContextoTenant.limpar();
        }
    }

    private void aplicarContextoDeTenant(HttpServletRequest requisicao) {
        if (!(SecurityContextHolder.getContext().getAuthentication() instanceof JwtAuthenticationToken autenticacao)) {
            return;
        }
        if (jaEhPlataformaAdmin(autenticacao)) {
            return;
        }

        String tenantId = requisicao.getHeader(CABECALHO_TENANT_ID);
        if (tenantId == null || tenantId.isBlank()) {
            return;
        }

        Optional<Usuario> usuario = usuarioContextoServico.resolverUsuarioAtual();
        if (usuario.isEmpty()) {
            return;
        }

        vinculoRepository.findByUsuario_IdAndTenantIdAndStatus(usuario.get().getId(), tenantId, StatusAtivoInativo.ATIVO)
                .ifPresent(vinculo -> {
                    ContextoTenant.definir(tenantId);
                    autenticarComPapel(autenticacao, vinculo);
                });
    }

    private boolean jaEhPlataformaAdmin(JwtAuthenticationToken autenticacao) {
        return autenticacao.getAuthorities().stream()
                .anyMatch(autoridade -> autoridade.getAuthority().equals(ROLE_PLATAFORMA_ADMIN));
    }

    private void autenticarComPapel(JwtAuthenticationToken original, VinculoUsuarioEmpresa vinculo) {
        Set<GrantedAuthority> autoridades = new HashSet<>(original.getAuthorities());
        autoridades.add(new SimpleGrantedAuthority("ROLE_" + vinculo.getPapel().name()));
        JwtAuthenticationToken novaAutenticacao = new JwtAuthenticationToken(original.getToken(), autoridades, original.getName());
        SecurityContextHolder.getContext().setAuthentication(novaAutenticacao);
    }
}

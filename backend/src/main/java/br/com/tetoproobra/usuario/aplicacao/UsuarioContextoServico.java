package br.com.tetoproobra.usuario.aplicacao;

import br.com.tetoproobra.compartilhado.dominio.Papel;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RecursoNaoEncontradoException;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RegraDeNegocioException;
import br.com.tetoproobra.compartilhado.multitenancy.ContextoTenant;
import br.com.tetoproobra.usuario.dominio.Usuario;
import br.com.tetoproobra.usuario.dominio.VinculoUsuarioEmpresa;
import br.com.tetoproobra.usuario.infraestrutura.UsuarioRepository;
import br.com.tetoproobra.usuario.infraestrutura.VinculoUsuarioEmpresaRepository;
import br.com.tetoproobra.usuario.web.MinhaEmpresaResposta;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Ponto único de acesso ao usuário autenticado na requisição atual — outros
 * domínios (Despesa, Auditoria, etc.) devem depender desta classe em vez de
 * lerem o {@link Jwt} diretamente. Também usado pelo
 * {@link br.com.tetoproobra.compartilhado.multitenancy.FiltroTenant} para
 * resolver qual pessoa está logada antes de aplicar o papel do vínculo com
 * a empresa selecionada.
 */
@Service
@RequiredArgsConstructor
public class UsuarioContextoServico {

    private static final String CLAIM_SUBJECT = "sub";
    private static final String CLAIM_EMAIL = "email";

    private final UsuarioRepository usuarioRepository;
    private final VinculoUsuarioEmpresaRepository vinculoRepository;

    /**
     * Resolve a pessoa logada sem lançar exceção — usado em pontos que
     * precisam tolerar "ainda não cadastrado" (ex.: FiltroTenant, ou a
     * listagem de empresas do usuário antes de qualquer empresa selecionada).
     */
    public Optional<Usuario> resolverUsuarioAtual() {
        Jwt jwt = jwtAtual();
        String keycloakId = jwt.getClaimAsString(CLAIM_SUBJECT);

        Optional<Usuario> usuarioPorKeycloakId = usuarioRepository.findByKeycloakId(keycloakId);
        if (usuarioPorKeycloakId.isPresent()) {
            return usuarioPorKeycloakId;
        }

        String email = jwt.getClaimAsString(CLAIM_EMAIL);
        if (email == null) {
            return Optional.empty();
        }
        return usuarioRepository.findByEmailIgnoreCase(email).map(usuario -> {
            // Primeiro login: o usuário já existia (seed/cadastro manual) mas ainda
            // não tinha o id do Keycloak vinculado — vincula agora.
            usuario.setKeycloakId(keycloakId);
            return usuarioRepository.save(usuario);
        });
    }

    public Usuario obterUsuarioAutenticado() {
        return resolverUsuarioAtual().orElseThrow(() -> new RecursoNaoEncontradoException(
                "Usuário autenticado não está cadastrado. Contate o administrador."));
    }

    /**
     * Lista as empresas do usuário logado — usado pelo frontend para montar o
     * seletor de empresa logo após o login. Retorna vazio (em vez de lançar)
     * quando a pessoa ainda não tem cadastro correspondente, para não quebrar
     * essa tela justamente no ponto em que ela ainda está descobrindo isso.
     */
    public List<MinhaEmpresaResposta> listarMinhasEmpresas() {
        return resolverUsuarioAtual()
                .map(usuario -> vinculoRepository.listarPorUsuario(usuario.getId()).stream()
                        .map(vinculo -> new MinhaEmpresaResposta(
                                vinculo.getTenantId(), vinculo.getEmpresa().getNome(), vinculo.getPapel(),
                                vinculo.getInvestidor() != null ? vinculo.getInvestidor().getId() : null))
                        .toList())
                .orElseGet(List::of);
    }

    /**
     * Papel e vínculo com investidor são do VÍNCULO com a empresa atual (ver
     * {@link ContextoTenant}), não da pessoa em si — a mesma pessoa pode ter
     * papéis diferentes em empresas diferentes.
     */
    public boolean usuarioAtualEhInvestidor() {
        return vinculoAtual().getPapel() == Papel.INVESTIDOR_VISUALIZADOR;
    }

    public Long investidorIdDoUsuarioAtual() {
        VinculoUsuarioEmpresa vinculo = vinculoAtual();
        if (vinculo.getPapel() != Papel.INVESTIDOR_VISUALIZADOR || vinculo.getInvestidor() == null) {
            throw new RegraDeNegocioException("O usuário autenticado não é um investidor");
        }
        return vinculo.getInvestidor().getId();
    }

    private VinculoUsuarioEmpresa vinculoAtual() {
        Usuario usuario = obterUsuarioAutenticado();
        String tenantId = ContextoTenant.obter();
        return vinculoRepository.findByUsuario_IdAndTenantId(usuario.getId(), tenantId)
                .orElseThrow(() -> new RegraDeNegocioException("O usuário autenticado não está vinculado à empresa atual"));
    }

    private Jwt jwtAtual() {
        return (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}

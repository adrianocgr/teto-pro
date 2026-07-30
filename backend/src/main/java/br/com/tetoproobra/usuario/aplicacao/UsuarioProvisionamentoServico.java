package br.com.tetoproobra.usuario.aplicacao;

import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RegraDeNegocioException;
import br.com.tetoproobra.compartilhado.keycloak.KeycloakAdminClient;
import br.com.tetoproobra.usuario.dominio.Usuario;
import br.com.tetoproobra.usuario.infraestrutura.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Ponto único que resolve "esta pessoa (nome/username/email) já existe como
 * login?" — usado tanto pelo cadastro de usuário de uma empresa quanto pela
 * área de administração da plataforma, já que a mesma pessoa pode acabar
 * vinculada a mais de uma empresa (ver {@link br.com.tetoproobra.usuario.dominio.VinculoUsuarioEmpresa}).
 * <p>
 * Se a pessoa ainda não existe, cria a identidade global E a credencial no
 * Keycloak (senha temporária padrão) — sem isso, o cadastro feito pela
 * aplicação nunca teria como logar de verdade.
 */
@Service
@RequiredArgsConstructor
public class UsuarioProvisionamentoServico {

    private final UsuarioRepository usuarioRepository;
    private final KeycloakAdminClient keycloakAdminClient;

    public Usuario obterOuProvisionar(String nome, String username, String email) {
        Usuario existentePorEmail = usuarioRepository.findByEmailIgnoreCase(email).orElse(null);
        if (existentePorEmail != null) {
            if (!existentePorEmail.getUsername().equalsIgnoreCase(username)) {
                throw new RegraDeNegocioException(
                        "Já existe um usuário cadastrado com este e-mail, mas com outro nome de acesso (%s)"
                                .formatted(existentePorEmail.getUsername()));
            }
            return existentePorEmail;
        }

        if (usuarioRepository.findByUsernameIgnoreCase(username).isPresent()) {
            throw new RegraDeNegocioException("Já existe um usuário cadastrado com este nome de acesso, mas com outro e-mail");
        }

        String keycloakId = keycloakAdminClient.criarUsuario(nome, username, email);
        Usuario novoUsuario = Usuario.builder()
                .nome(nome)
                .username(username)
                .email(email)
                .status(StatusAtivoInativo.ATIVO)
                .keycloakId(keycloakId)
                .build();
        return usuarioRepository.save(novoUsuario);
    }
}

package br.com.tetoproobra.administracao.aplicacao;

import br.com.tetoproobra.administracao.infraestrutura.EmpresaRepository;
import br.com.tetoproobra.administracao.web.EmpresaVinculadaResposta;
import br.com.tetoproobra.administracao.web.UsuarioAdminAtualizarRequisicao;
import br.com.tetoproobra.administracao.web.UsuarioAdminRequisicao;
import br.com.tetoproobra.administracao.web.UsuarioAdminResposta;
import br.com.tetoproobra.compartilhado.dominio.Papel;
import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RecursoNaoEncontradoException;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RegraDeNegocioException;
import br.com.tetoproobra.compartilhado.keycloak.KeycloakAdminClient;
import br.com.tetoproobra.usuario.aplicacao.UsuarioProvisionamentoServico;
import br.com.tetoproobra.usuario.dominio.Usuario;
import br.com.tetoproobra.usuario.dominio.VinculoUsuarioEmpresa;
import br.com.tetoproobra.usuario.infraestrutura.UsuarioRepository;
import br.com.tetoproobra.usuario.infraestrutura.VinculoUsuarioEmpresaRepository;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Cadastro de usuários e vínculos com empresas, visto de "cima" — sem o
 * isolamento por tenant que o resto do sistema aplica automaticamente. Só a
 * área de administração da plataforma usa este serviço.
 * <p>
 * Uma pessoa é uma única identidade global ({@link Usuario}); pode ter
 * quantos vínculos quiser com empresas diferentes (ver
 * {@link VinculoUsuarioEmpresa}), cada um com seu próprio papel.
 */
@Service
@RequiredArgsConstructor
public class AdministracaoUsuarioServico {

    private final UsuarioRepository usuarioRepository;
    private final VinculoUsuarioEmpresaRepository vinculoRepository;
    private final EmpresaRepository empresaRepository;
    private final UsuarioProvisionamentoServico provisionamentoServico;
    private final KeycloakAdminClient keycloakAdminClient;

    public List<UsuarioAdminResposta> listar(String tenantId) {
        List<Usuario> usuarios = (tenantId == null || tenantId.isBlank())
                ? usuarioRepository.findAll()
                : vinculoRepository.listarPorEmpresa(tenantId).stream().map(VinculoUsuarioEmpresa::getUsuario).distinct().toList();

        return usuarios.stream()
                .sorted(Comparator.comparing(Usuario::getNome, String.CASE_INSENSITIVE_ORDER))
                .map(this::paraResposta)
                .toList();
    }

    public UsuarioAdminResposta buscarPorId(Long id) {
        return paraResposta(buscarUsuarioOuFalhar(id));
    }

    public UsuarioAdminResposta criar(UsuarioAdminRequisicao requisicao) {
        if (!empresaRepository.existsById(requisicao.tenantId())) {
            throw RecursoNaoEncontradoException.paraId("Empresa", requisicao.tenantId());
        }

        Usuario usuario = provisionamentoServico.obterOuProvisionar(requisicao.nome(), requisicao.username(), requisicao.email());
        criarVinculo(usuario, requisicao.tenantId(), requisicao.papel());
        return paraResposta(usuario);
    }

    public UsuarioAdminResposta atualizar(Long id, UsuarioAdminAtualizarRequisicao requisicao) {
        Usuario usuario = buscarUsuarioOuFalhar(id);

        if (usuarioRepository.existsByUsernameIgnoreCaseAndIdNot(requisicao.username(), id)) {
            throw new RegraDeNegocioException("Já existe um usuário cadastrado com este nome de acesso");
        }
        if (usuarioRepository.existsByEmailIgnoreCaseAndIdNot(requisicao.email(), id)) {
            throw new RegraDeNegocioException("Já existe um usuário cadastrado com este e-mail");
        }

        usuario.setNome(requisicao.nome());
        usuario.setUsername(requisicao.username());
        usuario.setEmail(requisicao.email());
        return paraResposta(usuarioRepository.save(usuario));
    }

    public void excluir(Long id) {
        Usuario usuario = buscarUsuarioOuFalhar(id);
        usuarioRepository.delete(usuario);
        if (usuario.getKeycloakId() != null) {
            keycloakAdminClient.excluirUsuario(usuario.getKeycloakId());
        }
    }

    public UsuarioAdminResposta adicionarVinculo(Long id, String tenantId, Papel papel) {
        Usuario usuario = buscarUsuarioOuFalhar(id);
        if (!empresaRepository.existsById(tenantId)) {
            throw RecursoNaoEncontradoException.paraId("Empresa", tenantId);
        }
        criarVinculo(usuario, tenantId, papel);
        return paraResposta(usuario);
    }

    public UsuarioAdminResposta atualizarVinculo(Long id, String tenantId, Papel papel) {
        Usuario usuario = buscarUsuarioOuFalhar(id);
        VinculoUsuarioEmpresa vinculo = buscarVinculoOuFalhar(id, tenantId);
        vinculo.setPapel(papel);
        vinculoRepository.save(vinculo);
        return paraResposta(usuario);
    }

    public UsuarioAdminResposta removerVinculo(Long id, String tenantId) {
        Usuario usuario = buscarUsuarioOuFalhar(id);
        vinculoRepository.delete(buscarVinculoOuFalhar(id, tenantId));
        return paraResposta(usuario);
    }

    private void criarVinculo(Usuario usuario, String tenantId, Papel papel) {
        if (vinculoRepository.existsByUsuario_IdAndTenantId(usuario.getId(), tenantId)) {
            throw new RegraDeNegocioException("Este usuário já está vinculado a esta empresa");
        }
        VinculoUsuarioEmpresa vinculo = VinculoUsuarioEmpresa.builder()
                .tenantId(tenantId)
                .usuario(usuario)
                .papel(papel)
                .status(StatusAtivoInativo.ATIVO)
                .build();
        vinculoRepository.save(vinculo);
    }

    private Usuario buscarUsuarioOuFalhar(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Usuário", id));
    }

    private VinculoUsuarioEmpresa buscarVinculoOuFalhar(Long usuarioId, String tenantId) {
        return vinculoRepository.findByUsuario_IdAndTenantId(usuarioId, tenantId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Este usuário não está vinculado a esta empresa"));
    }

    private UsuarioAdminResposta paraResposta(Usuario usuario) {
        List<EmpresaVinculadaResposta> empresas = vinculoRepository.listarPorUsuario(usuario.getId()).stream()
                .map(this::paraEmpresaVinculada)
                .toList();
        return new UsuarioAdminResposta(usuario.getId(), usuario.getNome(), usuario.getUsername(), usuario.getEmail(),
                usuario.getStatus(), empresas, usuario.getCreatedAt());
    }

    private EmpresaVinculadaResposta paraEmpresaVinculada(VinculoUsuarioEmpresa vinculo) {
        return new EmpresaVinculadaResposta(
                vinculo.getTenantId(),
                vinculo.getEmpresa().getNome(),
                vinculo.getPapel(),
                vinculo.getStatus(),
                vinculo.getInvestidor() != null ? vinculo.getInvestidor().getId() : null,
                vinculo.getInvestidor() != null ? vinculo.getInvestidor().getNome() : null,
                vinculo.getCreatedAt());
    }
}

package br.com.tetoproobra.usuario.aplicacao;

import br.com.tetoproobra.compartilhado.dominio.Papel;
import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RecursoNaoEncontradoException;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RegraDeNegocioException;
import br.com.tetoproobra.compartilhado.multitenancy.ContextoTenant;
import br.com.tetoproobra.investidor.dominio.Investidor;
import br.com.tetoproobra.investidor.infraestrutura.InvestidorRepository;
import br.com.tetoproobra.usuario.dominio.Usuario;
import br.com.tetoproobra.usuario.dominio.VinculoUsuarioEmpresa;
import br.com.tetoproobra.usuario.infraestrutura.UsuarioRepository;
import br.com.tetoproobra.usuario.infraestrutura.VinculoUsuarioEmpresaRepository;
import br.com.tetoproobra.usuario.web.UsuarioRequisicao;
import br.com.tetoproobra.usuario.web.UsuarioResposta;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Gerencia os vínculos de usuário com a empresa (tenant) atual — ver
 * {@link VinculoUsuarioEmpresa}. Papel e investidor pertencem ao vínculo, não
 * à pessoa: os dados globais de login (nome/username/email) ficam em
 * {@link Usuario}, editados aqui em conjunto por conveniência.
 * <p>
 * {@code @Transactional} na classe: {@code buscarVinculoOuFalhar} usa
 * {@code findById}, sem join fetch, então {@code usuario} e {@code investidor}
 * do vínculo ficam lazy — sem manter a transação aberta até o mapeamento (ou
 * até os setters em {@link #atualizar}), isso quebra com
 * LazyInitializationException.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class UsuarioServico {

    private final UsuarioRepository usuarioRepository;
    private final VinculoUsuarioEmpresaRepository vinculoRepository;
    private final InvestidorRepository investidorRepository;
    private final UsuarioProvisionamentoServico provisionamentoServico;

    public List<UsuarioResposta> listar() {
        return vinculoRepository.listarPorEmpresa(ContextoTenant.obter()).stream().map(this::paraResposta).toList();
    }

    public UsuarioResposta buscarPorId(Long id) {
        return paraResposta(buscarVinculoOuFalhar(id));
    }

    public UsuarioResposta criar(UsuarioRequisicao requisicao) {
        String tenantId = ContextoTenant.obter();
        Investidor investidor = resolverInvestidor(requisicao.papel(), requisicao.investidorId());
        Usuario usuario = provisionamentoServico.obterOuProvisionar(requisicao.nome(), requisicao.username(), requisicao.email());

        if (vinculoRepository.existsByUsuario_IdAndTenantId(usuario.getId(), tenantId)) {
            throw new RegraDeNegocioException("Este usuário já está vinculado a esta empresa");
        }

        VinculoUsuarioEmpresa vinculo = VinculoUsuarioEmpresa.builder()
                .tenantId(tenantId)
                .usuario(usuario)
                .papel(requisicao.papel())
                .status(StatusAtivoInativo.ATIVO)
                .investidor(investidor)
                .build();
        return paraResposta(vinculoRepository.save(vinculo));
    }

    public UsuarioResposta atualizar(Long id, UsuarioRequisicao requisicao) {
        VinculoUsuarioEmpresa vinculo = buscarVinculoOuFalhar(id);
        Investidor investidor = resolverInvestidor(requisicao.papel(), requisicao.investidorId());
        Usuario usuario = vinculo.getUsuario();

        if (usuarioRepository.existsByUsernameIgnoreCaseAndIdNot(requisicao.username(), usuario.getId())) {
            throw new RegraDeNegocioException("Já existe um usuário cadastrado com este nome de acesso");
        }
        if (usuarioRepository.existsByEmailIgnoreCaseAndIdNot(requisicao.email(), usuario.getId())) {
            throw new RegraDeNegocioException("Já existe um usuário cadastrado com este e-mail");
        }

        usuario.setNome(requisicao.nome());
        usuario.setUsername(requisicao.username());
        usuario.setEmail(requisicao.email());
        usuarioRepository.save(usuario);

        vinculo.setPapel(requisicao.papel());
        vinculo.setInvestidor(investidor);
        return paraResposta(vinculoRepository.save(vinculo));
    }

    public void excluir(Long id) {
        vinculoRepository.delete(buscarVinculoOuFalhar(id));
    }

    private VinculoUsuarioEmpresa buscarVinculoOuFalhar(Long id) {
        VinculoUsuarioEmpresa vinculo = vinculoRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Usuário", id));
        if (!vinculo.getTenantId().equals(ContextoTenant.obter())) {
            throw RecursoNaoEncontradoException.paraId("Usuário", id);
        }
        return vinculo;
    }

    private Investidor resolverInvestidor(Papel papel, Long investidorId) {
        if (papel != Papel.INVESTIDOR_VISUALIZADOR) {
            return null;
        }
        if (investidorId == null) {
            throw new RegraDeNegocioException(
                    "O investidor é obrigatório para usuários com papel INVESTIDOR_VISUALIZADOR");
        }
        return investidorRepository.findById(investidorId)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Investidor", investidorId));
    }

    private UsuarioResposta paraResposta(VinculoUsuarioEmpresa vinculo) {
        Usuario usuario = vinculo.getUsuario();
        Investidor investidor = vinculo.getInvestidor();
        return new UsuarioResposta(
                vinculo.getId(),
                usuario.getId(),
                usuario.getNome(),
                usuario.getUsername(),
                usuario.getEmail(),
                vinculo.getStatus(),
                vinculo.getPapel(),
                investidor != null ? investidor.getId() : null,
                investidor != null ? investidor.getNome() : null,
                vinculo.getCreatedAt());
    }
}

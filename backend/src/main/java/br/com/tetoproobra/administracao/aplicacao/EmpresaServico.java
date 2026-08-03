package br.com.tetoproobra.administracao.aplicacao;

import br.com.tetoproobra.administracao.dominio.Empresa;
import br.com.tetoproobra.administracao.infraestrutura.EmpresaRepository;
import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RecursoNaoEncontradoException;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RegraDeNegocioException;
import br.com.tetoproobra.compartilhado.multitenancy.ContextoTenant;
import br.com.tetoproobra.investidor.dominio.Investidor;
import br.com.tetoproobra.investidor.infraestrutura.InvestidorRepository;
import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Cadastro de empresas (tenants) da plataforma — só acessível pela área de
 * administração. O identificador da empresa (mesmo valor que precisa ser
 * configurado como atributo "tenant_id" do usuário no Keycloak) é derivado
 * do nome informado, como um slug legível, garantido único.
 */
@Service
@RequiredArgsConstructor
public class EmpresaServico {

    private final EmpresaRepository empresaRepository;
    private final InvestidorRepository investidorRepository;

    public List<Empresa> listar() {
        return empresaRepository.findAll();
    }

    public Empresa buscarPorId(String id) {
        return empresaRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Empresa", id));
    }

    public Empresa criar(String nome) {
        String id = gerarIdUnico(nome);
        Empresa empresa = Empresa.builder().id(id).nome(nome).status(StatusAtivoInativo.ATIVO).build();
        return empresaRepository.save(empresa);
    }

    public Empresa atualizar(String id, String nome) {
        Empresa empresa = buscarPorId(id);
        empresa.setNome(nome);
        return empresaRepository.save(empresa);
    }

    public Empresa inativar(String id) {
        Empresa empresa = buscarPorId(id);
        empresa.setStatus(StatusAtivoInativo.INATIVO);
        return empresaRepository.save(empresa);
    }

    public Empresa reativar(String id) {
        Empresa empresa = buscarPorId(id);
        empresa.setStatus(StatusAtivoInativo.ATIVO);
        return empresaRepository.save(empresa);
    }

    /**
     * Investidores cadastrados nesta empresa — usado para popular o seletor
     * de investidor ao vincular uma pessoa com papel INVESTIDOR_VISUALIZADOR
     * (ver AdministracaoUsuarioServico). {@link Investidor} é isolado por
     * tenant, e este serviço roda sem {@link ContextoTenant} definido (visão
     * "de cima" do PLATAFORMA_ADMIN) — por isso publicamos o tenant só para
     * esta consulta.
     */
    public List<Investidor> listarInvestidores(String tenantId) {
        buscarPorId(tenantId);
        ContextoTenant.definir(tenantId);
        try {
            return investidorRepository.findAll().stream()
                    .sorted(Comparator.comparing(Investidor::getNome, String.CASE_INSENSITIVE_ORDER))
                    .toList();
        } finally {
            ContextoTenant.limpar();
        }
    }

    private String gerarIdUnico(String nome) {
        String base = paraSlug(nome);
        if (base.isBlank()) {
            throw new RegraDeNegocioException("Não foi possível gerar um identificador a partir do nome informado");
        }
        String candidato = base;
        int sufixo = 2;
        while (empresaRepository.existsByIdIgnoreCase(candidato)) {
            candidato = base + "-" + sufixo;
            sufixo++;
        }
        return candidato;
    }

    private String paraSlug(String texto) {
        String semAcentos = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return semAcentos.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
    }
}

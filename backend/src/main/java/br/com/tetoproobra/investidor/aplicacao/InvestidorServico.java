package br.com.tetoproobra.investidor.aplicacao;

import br.com.tetoproobra.compartilhado.dominio.excecoes.RecursoNaoEncontradoException;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RegraDeNegocioException;
import br.com.tetoproobra.investidor.dominio.Investidor;
import br.com.tetoproobra.investidor.infraestrutura.InvestidorRepository;
import br.com.tetoproobra.investidor.web.InvestidorMapper;
import br.com.tetoproobra.investidor.web.InvestidorRequisicao;
import br.com.tetoproobra.investidor.web.InvestidorResposta;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class InvestidorServico {

    private final InvestidorRepository investidorRepository;
    private final InvestidorMapper mapper;

    public Page<InvestidorResposta> listar(String busca, Pageable pageable) {
        Page<Investidor> pagina = StringUtils.hasText(busca)
                ? investidorRepository.findByNomeContainingIgnoreCase(busca, pageable)
                : investidorRepository.findAll(pageable);

        return pagina.map(mapper::paraResposta);
    }

    public InvestidorResposta buscarPorId(Long id) {
        return mapper.paraResposta(buscarEntidadePorId(id));
    }

    public InvestidorResposta criar(InvestidorRequisicao requisicao) {
        validarCpfCnpjNaoDuplicado(requisicao.cpfCnpj(), null);

        Investidor investidor = Investidor.builder()
                .nome(requisicao.nome())
                .cpfCnpj(requisicao.cpfCnpj())
                .tipoPessoa(requisicao.tipoPessoa())
                .email(requisicao.email())
                .telefone(requisicao.telefone())
                .observacoes(requisicao.observacoes())
                .build();

        return mapper.paraResposta(investidorRepository.save(investidor));
    }

    public InvestidorResposta atualizar(Long id, InvestidorRequisicao requisicao) {
        Investidor investidor = buscarEntidadePorId(id);

        validarCpfCnpjNaoDuplicado(requisicao.cpfCnpj(), id);

        investidor.setNome(requisicao.nome());
        investidor.setCpfCnpj(requisicao.cpfCnpj());
        investidor.setTipoPessoa(requisicao.tipoPessoa());
        investidor.setEmail(requisicao.email());
        investidor.setTelefone(requisicao.telefone());
        investidor.setObservacoes(requisicao.observacoes());

        return mapper.paraResposta(investidorRepository.save(investidor));
    }

    public void excluir(Long id) {
        investidorRepository.delete(buscarEntidadePorId(id));
    }

    private Investidor buscarEntidadePorId(Long id) {
        return investidorRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Investidor", id));
    }

    private void validarCpfCnpjNaoDuplicado(String cpfCnpj, Long idIgnorado) {
        investidorRepository.findByCpfCnpj(cpfCnpj)
                .filter(investidorExistente -> !investidorExistente.getId().equals(idIgnorado))
                .ifPresent(investidorExistente -> {
                    throw new RegraDeNegocioException("Já existe um investidor cadastrado com este CPF/CNPJ");
                });
    }
}

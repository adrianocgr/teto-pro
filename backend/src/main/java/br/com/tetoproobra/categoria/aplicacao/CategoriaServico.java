package br.com.tetoproobra.categoria.aplicacao;

import br.com.tetoproobra.categoria.dominio.Categoria;
import br.com.tetoproobra.categoria.infraestrutura.CategoriaRepository;
import br.com.tetoproobra.categoria.web.CategoriaMapper;
import br.com.tetoproobra.categoria.web.CategoriaRequisicao;
import br.com.tetoproobra.categoria.web.CategoriaResposta;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RecursoNaoEncontradoException;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@code @Transactional} na classe: {@code categoriaPai} é lazy, e o mapper
 * precisa acessá-la (id e descrição) para montar a resposta — sem manter a
 * transação aberta até o mapeamento, isso quebra com LazyInitializationException.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CategoriaServico {

    private final CategoriaRepository repository;
    private final CategoriaMapper mapper;

    public Page<CategoriaResposta> listar(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::paraResposta);
    }

    public CategoriaResposta buscarPorId(Long id) {
        return mapper.paraResposta(buscarEntidadePorId(id));
    }

    public CategoriaResposta criar(CategoriaRequisicao requisicao) {
        Categoria categoriaPai = resolverCategoriaPai(requisicao.categoriaPaiId());

        Categoria categoria = Categoria.builder()
                .codigo(gerarProximoCodigo(categoriaPai))
                .descricao(requisicao.descricao())
                .categoriaPai(categoriaPai)
                .status(requisicao.status())
                .build();

        return mapper.paraResposta(repository.save(categoria));
    }

    public CategoriaResposta atualizar(Long id, CategoriaRequisicao requisicao) {
        Categoria categoria = buscarEntidadePorId(id);
        Categoria categoriaPai = resolverCategoriaPai(requisicao.categoriaPaiId());

        Long paiAtualId = categoria.getCategoriaPai() != null ? categoria.getCategoriaPai().getId() : null;
        Long paiNovoId = categoriaPai != null ? categoriaPai.getId() : null;
        if (!Objects.equals(paiAtualId, paiNovoId)) {
            // Só regenera o código quando a categoria muda de pai (ou vira/deixa
            // de ser de topo) — o código reflete a posição na hierarquia, então
            // trocar de pai sem código novo deixaria a numeração inconsistente.
            categoria.setCodigo(gerarProximoCodigo(categoriaPai));
            categoria.setCategoriaPai(categoriaPai);
        }

        categoria.setDescricao(requisicao.descricao());
        categoria.setStatus(requisicao.status());

        return mapper.paraResposta(repository.save(categoria));
    }

    public void excluir(Long id) {
        repository.delete(buscarEntidadePorId(id));
    }

    private Categoria buscarEntidadePorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Categoria", id));
    }

    private Categoria resolverCategoriaPai(Long categoriaPaiId) {
        if (categoriaPaiId == null) {
            return null;
        }
        return repository.findById(categoriaPaiId)
                .orElseThrow(() -> RecursoNaoEncontradoException.paraId("Categoria pai", categoriaPaiId));
    }

    /**
     * Código sequencial e hierárquico, com zeros à esquerda (2 dígitos por
     * nível): "01", "02"... para categorias de topo; "01.01", "01.02"... para
     * filhas de "01". Calculado a partir do maior número já usado entre os
     * irmãos atuais (não pela contagem, pra não colidir se algum irmão do meio
     * tiver sido excluído).
     */
    private String gerarProximoCodigo(Categoria categoriaPai) {
        List<Categoria> irmaos = categoriaPai == null
                ? repository.findByCategoriaPaiIsNull()
                : repository.findByCategoriaPai_Id(categoriaPai.getId());

        int proximoNumero = irmaos.stream()
                .mapToInt(irmao -> extrairUltimoSegmento(irmao.getCodigo()))
                .max()
                .orElse(0) + 1;

        String numeroFormatado = "%02d".formatted(proximoNumero);
        return categoriaPai == null ? numeroFormatado : categoriaPai.getCodigo() + "." + numeroFormatado;
    }

    /**
     * Extrai o número do último segmento do código (depois do último ponto,
     * ou o código inteiro se não houver ponto). Tolerante a códigos antigos
     * não numéricos (cadastrados antes da numeração automática) — trata como
     * 0 em vez de quebrar o cálculo do próximo número.
     */
    private int extrairUltimoSegmento(String codigo) {
        String ultimoSegmento = codigo.contains(".") ? codigo.substring(codigo.lastIndexOf('.') + 1) : codigo;
        try {
            return Integer.parseInt(ultimoSegmento);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}

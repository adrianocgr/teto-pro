package br.com.tetoproobra.despesa.aplicacao;

import br.com.tetoproobra.classificacao.dominio.Classificacao;
import br.com.tetoproobra.classificacao.infraestrutura.ClassificacaoRepository;
import br.com.tetoproobra.compartilhado.dominio.StatusAtivoInativo;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RegraDeNegocioException;
import br.com.tetoproobra.despesa.web.ImportacaoNfeResposta;
import br.com.tetoproobra.despesa.web.ItemNfeResposta;
import br.com.tetoproobra.fornecedor.dominio.Fornecedor;
import br.com.tetoproobra.fornecedor.infraestrutura.FornecedorRepository;
import br.com.tetoproobra.insumo.dominio.Insumo;
import br.com.tetoproobra.insumo.infraestrutura.InsumoRepository;
import br.com.tetoproobra.localidade.dominio.Cidade;
import br.com.tetoproobra.localidade.dominio.Estado;
import br.com.tetoproobra.localidade.infraestrutura.CidadeRepository;
import br.com.tetoproobra.localidade.infraestrutura.EstadoRepository;
import br.com.tetoproobra.unidademedida.dominio.UnidadeMedida;
import br.com.tetoproobra.unidademedida.infraestrutura.UnidadeMedidaRepository;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

/**
 * Lê o XML de uma NF-e (o mesmo XML que gera o DANFE impresso) e extrai os
 * dados necessários pra pré-preencher o lançamento de uma despesa: fornecedor
 * (emitente), valor total e uma descrição sugerida a partir dos produtos. O
 * fornecedor é cadastrado automaticamente quando o CNPJ do emitente ainda não
 * existe no catálogo do tenant — a despesa em si nunca é salva sozinha, quem
 * chama apenas usa esta resposta pra pré-preencher o formulário.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ImportacaoNfeServico {

    private static final String CLASSIFICACAO_PADRAO_DESCRICAO = "Importado de NF-e";

    private final FornecedorRepository fornecedorRepository;
    private final CidadeRepository cidadeRepository;
    private final EstadoRepository estadoRepository;
    private final InsumoRepository insumoRepository;
    private final UnidadeMedidaRepository unidadeMedidaRepository;
    private final ClassificacaoRepository classificacaoRepository;

    public ImportacaoNfeResposta importar(MultipartFile arquivo) {
        Element infNFe = lerInfNFe(arquivo);

        Element emit = primeiroFilho(infNFe, "emit");
        if (emit == null) {
            throw new RegraDeNegocioException("O XML não contém os dados do emitente da nota.");
        }
        Element enderEmit = primeiroFilho(emit, "enderEmit");
        Element ide = primeiroFilho(infNFe, "ide");
        Element icmsTot = buscarDescendente(infNFe, "ICMSTot");

        String cnpjDigitos = apenasDigitos(textoDe(emit, "CNPJ"));
        if (cnpjDigitos.isEmpty()) {
            throw new RegraDeNegocioException("O XML não contém o CNPJ do emitente da nota.");
        }
        String razaoSocial = textoDe(emit, "xNome");
        if (razaoSocial == null || razaoSocial.isBlank()) {
            throw new RegraDeNegocioException("O XML não contém a razão social do emitente da nota.");
        }

        boolean fornecedorNovo = false;
        Optional<Fornecedor> existente = fornecedorRepository.findAll().stream()
                .filter(f -> apenasDigitos(f.getCnpjCpf()).equals(cnpjDigitos))
                .findFirst();

        Fornecedor fornecedor;
        if (existente.isPresent()) {
            fornecedor = existente.get();
        } else {
            fornecedor = Fornecedor.builder()
                    .razaoSocial(razaoSocial)
                    .cnpjCpf(formatarCnpj(cnpjDigitos))
                    .logradouro(enderEmit != null ? textoDe(enderEmit, "xLgr") : null)
                    .numero(enderEmit != null ? textoDe(enderEmit, "nro") : null)
                    .complemento(enderEmit != null ? textoDe(enderEmit, "xCpl") : null)
                    .bairro(enderEmit != null ? textoDe(enderEmit, "xBairro") : null)
                    .cep(enderEmit != null ? textoDe(enderEmit, "CEP") : null)
                    .cidade(enderEmit != null ? resolverCidade(textoDe(enderEmit, "xMun"), textoDe(enderEmit, "UF")) : null)
                    .status(StatusAtivoInativo.ATIVO)
                    .build();
            fornecedor.setRepresentantes(new ArrayList<>());
            fornecedor = fornecedorRepository.save(fornecedor);
            fornecedorNovo = true;
        }

        BigDecimal valorTotal = icmsTot != null ? valorDecimal(textoDe(icmsTot, "vNF")) : null;
        BigDecimal desconto = icmsTot != null ? valorDecimal(textoDe(icmsTot, "vDesc")) : null;
        String numeroNota = ide != null ? textoDe(ide, "nNF") : null;
        LocalDate dataEmissao = ide != null ? extrairData(ide) : null;
        String chaveAcesso = extrairChaveAcesso(infNFe);
        String descricaoSugerida = montarDescricaoSugerida(infNFe, numeroNota);
        List<ItemNfeResposta> itens = processarItens(infNFe);

        return new ImportacaoNfeResposta(
                fornecedor.getId(),
                fornecedor.getRazaoSocial(),
                fornecedorNovo,
                descricaoSugerida,
                valorTotal,
                desconto,
                dataEmissao,
                numeroNota,
                chaveAcesso,
                itens
        );
    }

    /**
     * Um item da NF-e vira um item de despesa (insumo + quantidade + valor
     * unitário). Quando o insumo já existe no catálogo (casamento por
     * descrição, sem diferenciar maiúsculas/acentos), ele é reaproveitado;
     * senão é cadastrado automaticamente com a classificação sentinela
     * {@value #CLASSIFICACAO_PADRAO_DESCRICAO}, que sinaliza pro usuário quais
     * insumos vieram de importação e ainda merecem revisão (classificação
     * correta, código definitivo etc.).
     */
    private List<ItemNfeResposta> processarItens(Element infNFe) {
        NodeList detLista = infNFe.getElementsByTagName("det");
        if (detLista.getLength() == 0) return List.of();

        Map<String, Insumo> insumosPorDescricao = new HashMap<>();
        insumoRepository.findAll().forEach(i -> insumosPorDescricao.put(normalizar(i.getDescricao()), i));
        Map<String, UnidadeMedida> unidadesPorSigla = new HashMap<>();
        unidadeMedidaRepository.findAll().forEach(u -> unidadesPorSigla.put(u.getSigla().trim().toUpperCase(), u));
        Set<String> codigosExistentes = new HashSet<>();
        insumosPorDescricao.values().forEach(i -> codigosExistentes.add(i.getCodigo()));

        Classificacao[] classificacaoPadraoCache = new Classificacao[1];

        List<ItemNfeResposta> itens = new ArrayList<>();
        for (int i = 0; i < detLista.getLength(); i++) {
            Element det = (Element) detLista.item(i);
            Element prod = primeiroFilho(det, "prod");
            if (prod == null) continue;

            String xProd = textoDe(prod, "xProd");
            BigDecimal quantidade = valorDecimal(textoDe(prod, "qCom"));
            BigDecimal valorUnitario = valorDecimal(textoDe(prod, "vUnCom"));
            if (xProd == null || quantidade == null || valorUnitario == null) continue;

            String chave = normalizar(xProd);
            Insumo insumo = insumosPorDescricao.get(chave);
            boolean insumoNovo = false;
            if (insumo == null) {
                if (classificacaoPadraoCache[0] == null) {
                    classificacaoPadraoCache[0] = resolverClassificacaoPadrao();
                }
                UnidadeMedida unidade = resolverUnidadeMedida(textoDe(prod, "uCom"), unidadesPorSigla);
                String codigo = gerarCodigoInsumo(textoDe(prod, "cProd"), codigosExistentes);
                insumo = insumoRepository.save(Insumo.builder()
                        .codigo(codigo)
                        .descricao(xProd)
                        .unidadeMedida(unidade)
                        .classificacao(classificacaoPadraoCache[0])
                        .precoReferencia(valorUnitario)
                        .build());
                insumosPorDescricao.put(chave, insumo);
                insumoNovo = true;
            }

            itens.add(new ItemNfeResposta(
                    insumo.getId(),
                    insumo.getDescricao(),
                    insumo.getUnidadeMedida().getSigla(),
                    insumoNovo,
                    quantidade,
                    valorUnitario
            ));
        }
        return itens;
    }

    private Classificacao resolverClassificacaoPadrao() {
        return classificacaoRepository.findAll().stream()
                .filter(c -> CLASSIFICACAO_PADRAO_DESCRICAO.equalsIgnoreCase(c.getDescricao()))
                .findFirst()
                .orElseGet(() -> classificacaoRepository.save(Classificacao.builder()
                        .descricao(CLASSIFICACAO_PADRAO_DESCRICAO)
                        .status(StatusAtivoInativo.ATIVO)
                        .build()));
    }

    private UnidadeMedida resolverUnidadeMedida(String sigla, Map<String, UnidadeMedida> cache) {
        String chave = (sigla != null && !sigla.isBlank()) ? sigla.trim().toUpperCase() : "UN";
        UnidadeMedida existente = cache.get(chave);
        if (existente != null) return existente;
        UnidadeMedida nova = unidadeMedidaRepository.save(
                UnidadeMedida.builder().sigla(chave).descricao(chave).build());
        cache.put(chave, nova);
        return nova;
    }

    private String gerarCodigoInsumo(String cProd, Set<String> existentes) {
        String base = (cProd != null && !cProd.isBlank())
                ? "NFE-" + cProd
                : "NFE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String candidato = base;
        int sufixo = 2;
        while (existentes.contains(candidato)) {
            candidato = base + "-" + sufixo;
            sufixo++;
        }
        existentes.add(candidato);
        return candidato;
    }

    private static String normalizar(String texto) {
        return texto == null ? "" : texto.trim().toLowerCase();
    }

    private Element lerInfNFe(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new RegraDeNegocioException("Selecione o arquivo XML da NF-e.");
        }
        Document documento;
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            // Proteção contra XXE: nenhum DTD/entidade externa é processado —
            // o arquivo vem de upload do usuário e não é confiável.
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);
            DocumentBuilder builder = factory.newDocumentBuilder();
            documento = builder.parse(new ByteArrayInputStream(arquivo.getBytes()));
        } catch (IOException | ParserConfigurationException | SAXException | IllegalArgumentException e) {
            throw new RegraDeNegocioException("Não foi possível ler o arquivo — verifique se é um XML de NF-e válido.");
        }
        NodeList infNFeLista = documento.getElementsByTagName("infNFe");
        if (infNFeLista.getLength() == 0) {
            throw new RegraDeNegocioException("O arquivo não parece ser uma NF-e válida (tag infNFe não encontrada).");
        }
        return (Element) infNFeLista.item(0);
    }

    private String montarDescricaoSugerida(Element infNFe, String numeroNota) {
        List<String> produtos = new ArrayList<>();
        NodeList detLista = infNFe.getElementsByTagName("det");
        for (int i = 0; i < detLista.getLength(); i++) {
            Element det = (Element) detLista.item(i);
            Element prod = primeiroFilho(det, "prod");
            if (prod == null) continue;
            String xProd = textoDe(prod, "xProd");
            if (xProd != null) produtos.add(xProd);
        }
        if (produtos.isEmpty()) {
            return numeroNota != null ? "NF-e nº " + numeroNota : "Despesa importada de NF-e";
        }
        if (produtos.size() == 1) {
            return produtos.get(0);
        }
        return produtos.get(0) + " +" + (produtos.size() - 1) + " ite" + (produtos.size() - 1 == 1 ? "m" : "ns");
    }

    private String extrairChaveAcesso(Element infNFe) {
        String id = infNFe.getAttribute("Id");
        if (id == null || id.isBlank()) return null;
        return id.startsWith("NFe") ? id.substring(3) : id;
    }

    private LocalDate extrairData(Element ide) {
        String dhEmi = textoDe(ide, "dhEmi");
        String base = dhEmi != null ? dhEmi : textoDe(ide, "dEmi");
        if (base == null || base.length() < 10) return null;
        try {
            return LocalDate.parse(base.substring(0, 10));
        } catch (Exception e) {
            return null;
        }
    }

    private Cidade resolverCidade(String nomeMunicipio, String siglaUf) {
        if (nomeMunicipio == null || siglaUf == null) return null;
        Optional<Estado> estado = estadoRepository.findBySiglaIgnoreCase(siglaUf);
        if (estado.isEmpty()) return null;
        return cidadeRepository.findByEstadoIdAndNomeIgnoreCase(estado.get().getId(), nomeMunicipio).orElse(null);
    }

    private BigDecimal valorDecimal(String texto) {
        if (texto == null || texto.isBlank()) return null;
        try {
            return new BigDecimal(texto.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String apenasDigitos(String texto) {
        return texto == null ? "" : texto.replaceAll("\\D", "");
    }

    private static String formatarCnpj(String digitos) {
        if (digitos.length() != 14) return digitos;
        return digitos.substring(0, 2) + "." + digitos.substring(2, 5) + "." + digitos.substring(5, 8) + "/"
                + digitos.substring(8, 12) + "-" + digitos.substring(12, 14);
    }

    /** Primeiro filho DIRETO com a tag informada (evita pegar, por exemplo, o
     * {@code xNome} do destinatário quando o que se quer é o do emitente). */
    private static Element primeiroFilho(Element pai, String tag) {
        NodeList filhos = pai.getChildNodes();
        for (int i = 0; i < filhos.getLength(); i++) {
            Node no = filhos.item(i);
            if (no.getNodeType() == Node.ELEMENT_NODE && tag.equals(no.getNodeName())) {
                return (Element) no;
            }
        }
        return null;
    }

    /** Busca em qualquer profundidade abaixo de {@code raiz} — usado só para
     * tags que não se repetem em outro contexto do XML (ex.: ICMSTot). */
    private static Element buscarDescendente(Element raiz, String tag) {
        NodeList lista = raiz.getElementsByTagName(tag);
        return lista.getLength() > 0 ? (Element) lista.item(0) : null;
    }

    private static String textoDe(Element pai, String tag) {
        Element filho = primeiroFilho(pai, tag);
        if (filho == null) return null;
        String texto = filho.getTextContent();
        return (texto == null || texto.isBlank()) ? null : texto.trim();
    }
}

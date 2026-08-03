package br.com.tetoproobra.despesa.web;

import br.com.tetoproobra.despesa.aplicacao.DespesaServico;
import br.com.tetoproobra.despesa.aplicacao.ImportacaoNfeServico;
import br.com.tetoproobra.despesa.dominio.DespesaDocumento;
import br.com.tetoproobra.despesa.infraestrutura.ArmazenamentoArquivoServico;
import jakarta.validation.Valid;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/despesas")
@RequiredArgsConstructor
public class DespesaController {

    private final DespesaServico servico;
    private final DespesaMapper mapper;
    private final ArmazenamentoArquivoServico armazenamentoArquivoServico;
    private final ImportacaoNfeServico importacaoNfeServico;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR','INVESTIDOR_VISUALIZADOR')")
    public Page<DespesaResposta> listar(
            @RequestParam Long empreendimentoId,
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) Long investidorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataCadastroDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataCadastroAte,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataPagamentoDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataPagamentoAte,
            @ParameterObject Pageable pageable) {
        return servico.listar(empreendimentoId, busca, categoriaId, investidorId,
                dataCadastroDe, dataCadastroAte, dataPagamentoDe, dataPagamentoAte, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR','INVESTIDOR_VISUALIZADOR')")
    public DespesaResposta buscarPorId(@PathVariable Long id) {
        return servico.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    @ResponseStatus(HttpStatus.CREATED)
    public DespesaResposta criar(@Valid @RequestBody DespesaRequisicao requisicao) {
        return servico.criar(requisicao);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    public DespesaResposta atualizar(@PathVariable Long id, @Valid @RequestBody DespesaRequisicao requisicao) {
        return servico.atualizar(id, requisicao);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        servico.excluir(id);
    }

    @PostMapping("/importar-nfe")
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    public ImportacaoNfeResposta importarNfe(@RequestParam("arquivo") MultipartFile arquivo) {
        return importacaoNfeServico.importar(arquivo);
    }

    @PostMapping("/{id}/documentos")
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    @ResponseStatus(HttpStatus.CREATED)
    public List<DocumentoResposta> adicionarDocumentos(
            @PathVariable Long id, @RequestParam("arquivos") List<MultipartFile> arquivos) {
        List<DespesaDocumento> documentos = servico.adicionarDocumentos(id, arquivos);
        return mapper.paraRespostaDocumentos(documentos);
    }

    @GetMapping("/{id}/documentos/{documentoId}/download")
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR','INVESTIDOR_VISUALIZADOR')")
    public ResponseEntity<InputStreamResource> baixarDocumento(
            @PathVariable Long id, @PathVariable Long documentoId) throws IOException {
        DespesaDocumento documento = servico.buscarDocumento(id, documentoId);
        GridFsResource recurso = armazenamentoArquivoServico.recuperar(documento.getFileId());

        MediaType tipoConteudo = documento.getContentType() != null
                ? MediaType.parseMediaType(documento.getContentType())
                : MediaType.APPLICATION_OCTET_STREAM;

        ContentDisposition disposicao = ContentDisposition.attachment()
                .filename(documento.getFilename(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(tipoConteudo)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposicao.toString())
                .contentLength(documento.getLength())
                .body(new InputStreamResource(recurso.getInputStream()));
    }

    @DeleteMapping("/{id}/documentos/{documentoId}")
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removerDocumento(@PathVariable Long id, @PathVariable Long documentoId) {
        servico.removerDocumento(id, documentoId);
    }
}

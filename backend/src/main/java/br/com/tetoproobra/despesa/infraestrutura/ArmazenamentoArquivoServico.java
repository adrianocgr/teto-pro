package br.com.tetoproobra.despesa.infraestrutura;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

import br.com.tetoproobra.compartilhado.dominio.excecoes.RecursoNaoEncontradoException;
import br.com.tetoproobra.compartilhado.dominio.excecoes.RegraDeNegocioException;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Encapsula o acesso ao GridFS/MongoDB (bucket dedicado a arquivos, separado
 * do banco de auditoria — ver {@link br.com.tetoproobra.configuracao.MongoConfig}).
 * O Postgres guarda apenas o metadado ({@link br.com.tetoproobra.despesa.dominio.DespesaDocumento}),
 * o binário fica inteiramente aqui.
 */
@Service
@RequiredArgsConstructor
public class ArmazenamentoArquivoServico {

    private final GridFsTemplate gridFsTemplate;

    @Value("${tetopro-obra.arquivos.tamanho-maximo-bytes}")
    private long tamanhoMaximoBytes;

    @Value("${tetopro-obra.arquivos.tipos-permitidos}")
    private String tiposPermitidosConfigurados;

    public String armazenar(MultipartFile arquivo) {
        validarTipo(arquivo.getContentType());
        validarTamanho(arquivo.getSize());

        try {
            ObjectId id = gridFsTemplate.store(
                    arquivo.getInputStream(), arquivo.getOriginalFilename(), arquivo.getContentType());
            return id.toHexString();
        } catch (java.io.IOException e) {
            throw new RegraDeNegocioException("Não foi possível ler o arquivo enviado: " + e.getMessage());
        }
    }

    public GridFsResource recuperar(String fileId) {
        var arquivo = gridFsTemplate.findOne(query(where("_id").is(new ObjectId(fileId))));
        if (arquivo == null) {
            throw RecursoNaoEncontradoException.paraId("Arquivo", fileId);
        }
        return gridFsTemplate.getResource(arquivo);
    }

    public void remover(String fileId) {
        gridFsTemplate.delete(query(where("_id").is(new ObjectId(fileId))));
    }

    private void validarTipo(String tipo) {
        List<String> tiposPermitidos = Arrays.asList(tiposPermitidosConfigurados.split(","));
        if (tipo == null || !tiposPermitidos.contains(tipo)) {
            throw new RegraDeNegocioException("Tipo de arquivo não permitido: " + tipo);
        }
    }

    private void validarTamanho(long tamanho) {
        if (tamanho > tamanhoMaximoBytes) {
            throw new RegraDeNegocioException("Arquivo excede o tamanho máximo de 15MB");
        }
    }
}

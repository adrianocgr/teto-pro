package br.com.tetoproobra.configuracao;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;

/**
 * O MongoDB acumula dois papéis nesse sistema — auditoria e armazenamento
 * binário de arquivos (GridFS) — mantidos em databases lógicos separados
 * dentro do mesmo cluster, para não misturar coleções de propósitos
 * diferentes.
 * <p>
 * O {@code MongoClient} precisa ser declarado manualmente aqui: assim que
 * este arquivo define um {@code MongoDatabaseFactory} próprio
 * ({@code fabricaBancoArquivos}), o {@code MongoAutoConfiguration} do Spring
 * Boot se desliga por completo (ele só atua na ausência de qualquer
 * {@code MongoDatabaseFactory} customizado) — inclusive o próprio bean de
 * {@code MongoClient} que ele forneceria deixa de existir. Descoberto rodando
 * a aplicação de verdade (o erro só aparece em runtime, não na compilação).
 * <p>
 * O bean de template se chama "mongoTemplate" (e não "mongoTemplateAuditoria")
 * de propósito: é esse o nome que o Spring Data Mongo procura por convenção
 * para montar os repositórios ({@code RegistroAuditoriaRepository}).
 */
@Configuration
public class MongoConfig {

    @Bean
    public MongoClient mongoClient(@Value("${spring.data.mongodb.uri}") String uri) {
        return MongoClients.create(uri);
    }

    @Bean
    public MongoTemplate mongoTemplate(MongoClient client,
                                        @Value("${tetopro-obra.mongo.banco-auditoria}") String banco) {
        return new MongoTemplate(new SimpleMongoClientDatabaseFactory(client, banco));
    }

    @Bean
    public MongoDatabaseFactory fabricaBancoArquivos(MongoClient client,
                                                       @Value("${tetopro-obra.mongo.banco-arquivos}") String banco) {
        return new SimpleMongoClientDatabaseFactory(client, banco);
    }

    @Bean
    public GridFsTemplate gridFsTemplate(MongoDatabaseFactory fabricaBancoArquivos, MongoTemplate mongoTemplate) {
        // O GridFsTemplate precisa de um MongoConverter — reaproveita o do template de auditoria,
        // já configurado pelo autoconfigure do Spring Data Mongo.
        return new GridFsTemplate(fabricaBancoArquivos, mongoTemplate.getConverter());
    }
}

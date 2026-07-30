package br.com.tetoproobra.compartilhado.dominio.excecoes;

public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }

    public static RecursoNaoEncontradoException paraId(String entidade, Object id) {
        return new RecursoNaoEncontradoException("%s não encontrado(a) para o id %s".formatted(entidade, id));
    }
}

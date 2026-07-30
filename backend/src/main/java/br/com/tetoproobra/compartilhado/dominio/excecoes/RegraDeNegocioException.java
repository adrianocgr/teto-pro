package br.com.tetoproobra.compartilhado.dominio.excecoes;

/**
 * Sinaliza violação de uma regra de negócio (ex.: soma dos pagadores diferente
 * do valor total da despesa, soma dos percentuais de participação fora do
 * intervalo esperado). Sempre resulta em HTTP 422 — ver
 * {@link br.com.tetoproobra.compartilhado.web.ManipuladorGlobalDeExcecoes}.
 */
public class RegraDeNegocioException extends RuntimeException {

    public RegraDeNegocioException(String mensagem) {
        super(mensagem);
    }
}

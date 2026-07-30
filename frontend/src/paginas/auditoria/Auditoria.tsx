import { useState } from 'react';
import { useAutenticacao } from '@/autenticacao/ContextoAutenticacao';
import { formatarDataHora } from '@/utilitarios/formatacao';
import { useAuditoria, type OperacaoAuditoria } from '@/api/auditoria';

const TAMANHO_PAGINA = 20;

const ROTULO_OPERACAO: Record<OperacaoAuditoria, string> = {
  CREATE: 'Criação',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
};

const CLASSE_OPERACAO: Record<OperacaoAuditoria, string> = {
  CREATE: 'operacao-create',
  UPDATE: 'operacao-update',
  DELETE: 'operacao-delete',
};

function capitalizar(texto: string): string {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function Auditoria() {
  const { temPapel } = useAutenticacao();
  const [entidade, setEntidade] = useState('');
  const [pagina, setPagina] = useState(0);
  const admin = temPapel('ADMIN');

  const { data, isLoading, isError } = useAuditoria({
    entidade: entidade || undefined,
    page: pagina,
    size: TAMANHO_PAGINA,
  });

  if (!admin) {
    return <p>Acesso restrito a administradores.</p>;
  }

  function aoMudarEntidade(valor: string) {
    setEntidade(valor);
    setPagina(0);
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Auditoria</h1>
          <p className="subtitulo-pagina">Trilha de criação, alteração e exclusão de despesas e vendas</p>
        </div>
      </div>

      <div className="filtros" style={{ marginBottom: 18 }}>
        <select value={entidade} onChange={(evento) => aoMudarEntidade(evento.target.value)}>
          <option value="">Todas as entidades</option>
          <option value="despesa">Despesa</option>
          <option value="venda">Venda</option>
        </select>
      </div>

      {isLoading && <p>Carregando…</p>}
      {isError && <p>Não foi possível carregar a auditoria.</p>}

      {!isLoading && !isError && data && data.content.length === 0 && (
        <div className="estado-vazio">
          <div className="titulo">Nenhum registro encontrado</div>
          <div className="subtitulo">Ajuste os filtros ou volte mais tarde.</div>
        </div>
      )}

      {!isLoading && !isError && data && data.content.length > 0 && (
        <div className="painel">
          <div className="tabela-scroll">
            <table className="dados">
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Usuário</th>
                  <th>Operação</th>
                  <th>Registro</th>
                  <th>Alteração</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((registro) => (
                  <tr key={registro.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatarDataHora(registro.momento)}</td>
                    <td>{registro.usuarioEmail}</td>
                    <td>
                      <span className={`selo-operacao ${CLASSE_OPERACAO[registro.operacao]}`}>
                        {ROTULO_OPERACAO[registro.operacao] ?? registro.operacao}
                      </span>
                    </td>
                    <td>
                      <div>{capitalizar(registro.entidade)}</div>
                      <div className="linha-meta">{registro.entidadeRef}</div>
                    </td>
                    <td>
                      {registro.camposAlterados.length === 0 ? (
                        '—'
                      ) : (
                        registro.camposAlterados.map((campo) => (
                          <div key={campo.campo}>
                            {campo.campo}: <span className="diferenca-antiga">{campo.valorAnterior ?? '—'}</span>{' '}
                            → <span className="diferenca-nova">{campo.valorNovo ?? '—'}</span>
                          </div>
                        ))
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="painel-corpo"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 0 }}
          >
            <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
              Página {data.number + 1} de {Math.max(data.totalPages, 1)} · {data.totalElements} registro
              {data.totalElements === 1 ? '' : 's'}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="botao botao-fantasma botao-pequeno"
                disabled={data.first}
                onClick={() => setPagina((atual) => Math.max(atual - 1, 0))}
              >
                Anterior
              </button>
              <button
                type="button"
                className="botao botao-fantasma botao-pequeno"
                disabled={data.last}
                onClick={() => setPagina((atual) => atual + 1)}
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

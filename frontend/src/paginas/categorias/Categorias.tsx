import { Fragment, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useAutenticacao } from '@/autenticacao/ContextoAutenticacao';
import { useToast } from '@/componentes/Toast';
import { IconeMais, IconeEtiqueta, IconeSeta } from '@/componentes/Icones';
import { useCriarCategoria, useListaCategorias, type CategoriaResposta } from '@/api/categorias';

export function Categorias() {
  const { temPapel } = useAutenticacao();
  const { notificar } = useToast();
  const { data, isLoading, isError } = useListaCategorias();
  const criarCategoria = useCriarCategoria();

  const [modalAberto, setModalAberto] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [categoriaPaiId, setCategoriaPaiId] = useState<string>('');
  const [expandidas, setExpandidas] = useState<Set<number>>(new Set());

  const categorias = data?.content ?? [];
  const categoriasTopo = useMemo(() => categorias.filter((c) => c.categoriaPaiId === null), [categorias]);
  // Qualquer categoria pode ser pai de outra (profundidade livre) — ordenada
  // pelo código, que já reflete a hierarquia (ex.: "01", "01.01", "01.01.01", "02").
  const categoriasOrdenadas = useMemo(
    () => categorias.slice().sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true })),
    [categorias],
  );
  const filhosPorPai = useMemo(() => {
    const mapa = new Map<number, CategoriaResposta[]>();
    for (const categoria of categorias) {
      if (categoria.categoriaPaiId === null) continue;
      const lista = mapa.get(categoria.categoriaPaiId) ?? [];
      lista.push(categoria);
      mapa.set(categoria.categoriaPaiId, lista);
    }
    return mapa;
  }, [categorias]);

  function alternarExpandida(id: number) {
    setExpandidas((atual) => {
      const nova = new Set(atual);
      if (nova.has(id)) nova.delete(id);
      else nova.add(id);
      return nova;
    });
  }

  function abrirModal() {
    setDescricao('');
    setCategoriaPaiId('');
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    criarCategoria.mutate(
      {
        descricao,
        categoriaPaiId: categoriaPaiId ? Number(categoriaPaiId) : null,
        status: 'ATIVO',
      },
      {
        onSuccess: () => {
          notificar('Categoria criada com sucesso.');
          fecharModal();
        },
        onError: () => {
          notificar('Não foi possível criar a categoria.', 'erro');
        },
      },
    );
  }

  function linhaCategoria(categoria: CategoriaResposta, nivel: number): ReactNode {
    const filhos = filhosPorPai.get(categoria.id) ?? [];
    const temFilhos = filhos.length > 0;
    const expandida = expandidas.has(categoria.id);

    return (
      <Fragment key={categoria.id}>
        <tr>
          <td className="mono">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: nivel * 22 }}>
              {temFilhos ? (
                <button
                  type="button"
                  onClick={() => alternarExpandida(categoria.id)}
                  aria-label={expandida ? 'Recolher' : 'Expandir'}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    color: 'var(--ink-muted)',
                    transform: expandida ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.12s',
                  }}
                >
                  <IconeSeta width={12} height={12} />
                </button>
              ) : (
                <span style={{ width: 12, display: 'inline-block' }} />
              )}
              {categoria.codigo}
            </div>
          </td>
          <td>{categoria.descricao}</td>
          <td>
            <span className={`pilula-status ${categoria.status === 'ATIVO' ? 'status-ativo' : 'status-inativo'}`}>
              <span className="ponto" />
              {categoria.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
            </span>
          </td>
        </tr>
        {expandida && filhos.map((filha) => linhaCategoria(filha, nivel + 1))}
      </Fragment>
    );
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <div>
          <div className="titulo-pagina">Categorias</div>
          <div className="subtitulo-pagina">
            {isLoading ? 'Carregando…' : `${categorias.length} categoria(s) cadastrada(s)`}
          </div>
        </div>
        {temPapel('ADMIN') && (
          <button type="button" className="botao botao-primario" onClick={abrirModal}>
            <IconeMais width={14} height={14} />
            Nova categoria
          </button>
        )}
      </div>

      <div className="painel">
        <div className="painel-corpo" style={{ padding: 0 }}>
          {isLoading ? (
            <div className="estado-vazio">
              <div className="titulo">Carregando…</div>
            </div>
          ) : isError ? (
            <div className="estado-vazio">
              <div className="titulo">Erro ao carregar categorias</div>
              <div className="subtitulo">Tente novamente em instantes.</div>
            </div>
          ) : categorias.length === 0 ? (
            <div className="estado-vazio">
              <IconeEtiqueta width={28} height={28} />
              <div className="titulo">Nenhuma categoria cadastrada</div>
              <div className="subtitulo">Crie a primeira categoria para começar a classificar despesas.</div>
            </div>
          ) : (
            <div className="tabela-scroll">
              <table className="dados">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descrição</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>{categoriasTopo.map((categoria) => linhaCategoria(categoria, 0))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalAberto && (
        <div className="sobreposicao-modal" onClick={fecharModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <div className="modal-titulo">Nova categoria</div>
              <button type="button" className="fechar-modal" onClick={fecharModal}>
                ×
              </button>
            </div>
            <form onSubmit={aoSubmeter}>
              <div className="modal-corpo">
                <div className="grade-formulario">
                  <div className="campo col-2">
                    <label>Descrição</label>
                    <input
                      type="text"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      required
                    />
                  </div>
                  <div className="campo col-2">
                    <label>Categoria pai</label>
                    <select value={categoriaPaiId} onChange={(e) => setCategoriaPaiId(e.target.value)}>
                      <option value="">Nenhuma (categoria de topo)</option>
                      {categoriasOrdenadas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.codigo} — {c.descricao}
                        </option>
                      ))}
                    </select>
                    <span className="dica">O código é gerado automaticamente (ex.: 01, 01.01, 02).</span>
                  </div>
                </div>
              </div>
              <div className="modal-rodape">
                <button type="button" className="botao" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="botao botao-primario" disabled={criarCategoria.isPending}>
                  {criarCategoria.isPending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

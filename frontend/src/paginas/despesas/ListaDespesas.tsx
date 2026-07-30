import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAutenticacao } from '@/autenticacao/ContextoAutenticacao';
import { IconeDespesas, IconeMais, IconeSeta } from '@/componentes/Icones';
import { useListaDespesas, type DespesaResposta } from '@/api/despesas';
import { useListaCategorias } from '@/api/categorias';
import { useEmpreendimento } from '@/api/empreendimentos';
import { formatarData, formatarMoeda } from '@/utilitarios/formatacao';

const CORES_CATEGORIA = [
  'var(--cat-1)',
  'var(--cat-2)',
  'var(--cat-3)',
  'var(--cat-4)',
  'var(--cat-5)',
  'var(--cat-6)',
  'var(--cat-7)',
  'var(--cat-8)',
];

export function ListaDespesas() {
  const { id } = useParams<{ id: string }>();
  const empreendimentoId = Number(id);
  const navigate = useNavigate();
  const { temPapel } = useAutenticacao();

  const [busca, setBusca] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [investidorId, setInvestidorId] = useState('');

  const { data, isLoading, isError } = useListaDespesas(empreendimentoId, { busca });
  const { data: categoriasResp } = useListaCategorias();
  const { data: empreendimento } = useEmpreendimento(empreendimentoId);

  const despesas = data?.content ?? [];
  const categorias = categoriasResp?.content ?? [];
  const participacoes = empreendimento?.participacoes ?? [];

  const categoriasEmUso = useMemo(() => {
    const idsEmUso = new Set(despesas.map((d) => d.categoriaId));
    return categorias.filter((c) => idsEmUso.has(c.id)).sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [despesas, categorias]);

  function corCategoria(catId: number) {
    const indice = categoriasEmUso.findIndex((c) => c.id === catId);
    return CORES_CATEGORIA[indice >= 0 ? indice % CORES_CATEGORIA.length : 0];
  }

  const despesasFiltradas = useMemo(() => {
    return despesas.filter((despesa) => {
      if (categoriaId && despesa.categoriaId !== Number(categoriaId)) return false;
      if (investidorId && !despesa.pagadores.some((p) => p.investidorId === Number(investidorId))) return false;
      return true;
    });
  }, [despesas, categoriaId, investidorId]);

  function nomesPagadores(despesa: DespesaResposta) {
    if (despesa.pagadores.length === 0) return '—';
    if (despesa.pagadores.length === 1) return despesa.pagadores[0].investidorNome;
    return `${despesa.pagadores[0].investidorNome} +${despesa.pagadores.length - 1}`;
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <div>
          <div className="titulo-pagina">Despesas</div>
          <div className="subtitulo-pagina">
            {isLoading ? 'Carregando…' : `${despesasFiltradas.length} despesa(s)`}
          </div>
        </div>
        {temPapel('ADMIN', 'GESTOR') && (
          <button
            type="button"
            className="botao botao-primario"
            onClick={() => navigate(`/empreendimentos/${empreendimentoId}/despesas/novo`)}
          >
            <IconeMais width={14} height={14} />
            Nova despesa
          </button>
        )}
      </div>

      <div className="filtros" style={{ marginBottom: 14 }}>
        <input
          type="text"
          placeholder="Buscar por descrição…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ minWidth: 240 }}
        />
        <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.codigo} — {categoria.descricao}
            </option>
          ))}
        </select>
        <select value={investidorId} onChange={(e) => setInvestidorId(e.target.value)}>
          <option value="">Todos os investidores</option>
          {participacoes.map((participacao) => (
            <option key={participacao.investidorId} value={participacao.investidorId}>
              {participacao.investidorNome}
            </option>
          ))}
        </select>
      </div>

      <div className="painel">
        <div className="painel-corpo" style={{ padding: 0 }}>
          {isLoading ? (
            <div className="estado-vazio">
              <div className="titulo">Carregando…</div>
            </div>
          ) : isError ? (
            <div className="estado-vazio">
              <div className="titulo">Erro ao carregar despesas</div>
              <div className="subtitulo">Tente novamente em instantes.</div>
            </div>
          ) : despesasFiltradas.length === 0 ? (
            <div className="estado-vazio">
              <IconeDespesas width={28} height={28} />
              <div className="titulo">Nenhuma despesa encontrada</div>
              <div className="subtitulo">Ajuste os filtros ou cadastre uma nova despesa.</div>
            </div>
          ) : (
            <div className="tabela-scroll">
              <table className="dados">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Pagador(es)</th>
                    <th className="num">Itens</th>
                    <th className="num">Documentos</th>
                    <th className="num">Valor</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {despesasFiltradas.map((despesa) => (
                    <tr
                      key={despesa.id}
                      className="clicavel"
                      onClick={() => navigate(`/empreendimentos/${empreendimentoId}/despesas/${despesa.id}`)}
                    >
                      <td>{formatarData(despesa.dataCadastro)}</td>
                      <td>
                        <div>{despesa.descricao}</div>
                        {despesa.fornecedorNome && (
                          <div className="subtitulo" style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>
                            {despesa.fornecedorNome}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="chip-categoria">
                          <span className="amostra" style={{ background: corCategoria(despesa.categoriaId) }} />
                          {despesa.categoriaDescricao}
                        </span>
                      </td>
                      <td>{nomesPagadores(despesa)}</td>
                      <td className="num">{despesa.itens.length}</td>
                      <td className="num">{despesa.documentos.length}</td>
                      <td className="num mono">{formatarMoeda(despesa.valorTotal)}</td>
                      <td>
                        <IconeSeta width={16} height={16} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

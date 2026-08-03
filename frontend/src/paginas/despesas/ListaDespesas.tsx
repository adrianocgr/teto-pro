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

const TAMANHO_PAGINA = 20;

type CampoOrdenacao = 'dataCadastro' | 'dataPagamento' | 'descricao' | 'valorTotal';
type DirecaoOrdenacao = 'asc' | 'desc';

/** Direção "natural" ao clicar pela primeira vez num campo: datas e valor começam do maior/mais recente, texto começa de A→Z. */
const DIRECAO_INICIAL: Record<CampoOrdenacao, DirecaoOrdenacao> = {
  dataCadastro: 'desc',
  dataPagamento: 'desc',
  valorTotal: 'desc',
  descricao: 'asc',
};

function analisarOrdenacao(ordenacao: string): { campo: CampoOrdenacao; direcao: DirecaoOrdenacao } {
  const [campo, direcao] = ordenacao.split(',');
  return { campo: campo as CampoOrdenacao, direcao: (direcao as DirecaoOrdenacao) ?? 'desc' };
}

function rotuloVazio(temFiltro: boolean) {
  return temFiltro ? 'Nenhuma despesa encontrada para os filtros aplicados.' : 'Ajuste os filtros ou cadastre uma nova despesa.';
}

interface PropsCabecalhoOrdenavel {
  campo: CampoOrdenacao;
  rotulo: string;
  numerico?: boolean;
  ordenacaoAtual: { campo: CampoOrdenacao; direcao: DirecaoOrdenacao };
  onOrdenar: (campo: CampoOrdenacao) => void;
}

/**
 * Definido no nível do módulo (não dentro de `ListaDespesas`) para manter a
 * mesma identidade de componente entre renders — se fosse recriado a cada
 * render, o `<th>`/`<button>` seria desmontado e remontado a cada clique,
 * perdendo o foco de teclado logo após a própria interação que o gerou.
 */
function CabecalhoOrdenavel({ campo, rotulo, numerico, ordenacaoAtual, onOrdenar }: PropsCabecalhoOrdenavel) {
  const ativo = ordenacaoAtual.campo === campo;
  return (
    <th
      className={`th-ordenavel${numerico ? ' num' : ''}`}
      aria-sort={ativo ? (ordenacaoAtual.direcao === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button type="button" onClick={() => onOrdenar(campo)}>
        {rotulo}
        {ativo && <span className="seta-ordenacao">{ordenacaoAtual.direcao === 'asc' ? '▲' : '▼'}</span>}
      </button>
    </th>
  );
}

export function ListaDespesas() {
  const { id } = useParams<{ id: string }>();
  const empreendimentoId = Number(id);
  const navigate = useNavigate();
  const { temPapel } = useAutenticacao();

  const [busca, setBusca] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [investidorId, setInvestidorId] = useState('');
  const [dataCadastroDe, setDataCadastroDe] = useState('');
  const [dataCadastroAte, setDataCadastroAte] = useState('');
  const [dataPagamentoDe, setDataPagamentoDe] = useState('');
  const [dataPagamentoAte, setDataPagamentoAte] = useState('');
  const [ordenacao, setOrdenacao] = useState<string>('dataPagamento,desc');
  const [pagina, setPagina] = useState(0);

  const { data, isLoading, isError } = useListaDespesas(empreendimentoId, {
    busca: busca || undefined,
    categoriaId: categoriaId ? Number(categoriaId) : undefined,
    investidorId: investidorId ? Number(investidorId) : undefined,
    dataCadastroDe: dataCadastroDe || undefined,
    dataCadastroAte: dataCadastroAte || undefined,
    dataPagamentoDe: dataPagamentoDe || undefined,
    dataPagamentoAte: dataPagamentoAte || undefined,
    page: pagina,
    size: TAMANHO_PAGINA,
    sort: ordenacao,
  });
  const { data: categoriasResp } = useListaCategorias();
  const { data: empreendimento } = useEmpreendimento(empreendimentoId);

  const despesas = data?.content ?? [];
  const categorias = categoriasResp?.content ?? [];
  const participacoes = empreendimento?.participacoes ?? [];

  const categoriasOrdenadas = useMemo(
    () => [...categorias].sort((a, b) => a.codigo.localeCompare(b.codigo)),
    [categorias],
  );

  function corCategoria(catId: number) {
    const indice = categoriasOrdenadas.findIndex((c) => c.id === catId);
    return CORES_CATEGORIA[indice >= 0 ? indice % CORES_CATEGORIA.length : 0];
  }

  function nomesPagadores(despesa: DespesaResposta) {
    if (despesa.pagadores.length === 0) return '—';
    if (despesa.pagadores.length === 1) return despesa.pagadores[0].investidorNome;
    return `${despesa.pagadores[0].investidorNome} +${despesa.pagadores.length - 1}`;
  }

  function mudarBusca(valor: string) {
    setBusca(valor);
    setPagina(0);
  }

  function mudarCategoria(valor: string) {
    setCategoriaId(valor);
    setPagina(0);
  }

  function mudarInvestidor(valor: string) {
    setInvestidorId(valor);
    setPagina(0);
  }

  function mudarDataCadastroDe(valor: string) {
    setDataCadastroDe(valor);
    setPagina(0);
  }

  function mudarDataCadastroAte(valor: string) {
    setDataCadastroAte(valor);
    setPagina(0);
  }

  function mudarDataPagamentoDe(valor: string) {
    setDataPagamentoDe(valor);
    setPagina(0);
  }

  function mudarDataPagamentoAte(valor: string) {
    setDataPagamentoAte(valor);
    setPagina(0);
  }

  function alternarOrdenacao(campo: CampoOrdenacao) {
    const atual = analisarOrdenacao(ordenacao);
    if (atual.campo === campo) {
      setOrdenacao(`${campo},${atual.direcao === 'asc' ? 'desc' : 'asc'}`);
    } else {
      setOrdenacao(`${campo},${DIRECAO_INICIAL[campo]}`);
    }
    setPagina(0);
  }

  function limparFiltros() {
    setBusca('');
    setCategoriaId('');
    setInvestidorId('');
    setDataCadastroDe('');
    setDataCadastroAte('');
    setDataPagamentoDe('');
    setDataPagamentoAte('');
    setPagina(0);
  }

  const filtrosAtivos =
    !!busca ||
    !!categoriaId ||
    !!investidorId ||
    !!dataCadastroDe ||
    !!dataCadastroAte ||
    !!dataPagamentoDe ||
    !!dataPagamentoAte;

  const ordenacaoAtual = analisarOrdenacao(ordenacao);

  return (
    <div>
      <div className="cabecalho-pagina">
        <div>
          <div className="titulo-pagina">Despesas</div>
          <div className="subtitulo-pagina">
            {isLoading ? 'Carregando…' : `${data?.totalElements ?? 0} despesa(s)`}
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

      <div className="painel">
        <div className="painel-corpo">
          <div className="filtros-grade">
            <div className="campo">
              <label htmlFor="campo-busca">Buscar</label>
              <input
                id="campo-busca"
                type="text"
                placeholder="Descrição da despesa"
                value={busca}
                onChange={(e) => mudarBusca(e.target.value)}
              />
            </div>
            <div className="campo">
              <label htmlFor="campo-categoria">Categoria</label>
              <select id="campo-categoria" value={categoriaId} onChange={(e) => mudarCategoria(e.target.value)}>
                <option value="">Todas as categorias</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.codigo} — {categoria.descricao}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="campo-investidor">Investidor</label>
              <select id="campo-investidor" value={investidorId} onChange={(e) => mudarInvestidor(e.target.value)}>
                <option value="">Todos os investidores</option>
                {participacoes.map((participacao) => (
                  <option key={participacao.investidorId} value={participacao.investidorId}>
                    {participacao.investidorNome}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo campo-datas">
              <label htmlFor="campo-lancamento-de">Lançamento</label>
              <div className="intervalo-datas">
                <input
                  id="campo-lancamento-de"
                  type="date"
                  value={dataCadastroDe}
                  onChange={(e) => mudarDataCadastroDe(e.target.value)}
                  aria-label="Lançado a partir de"
                />
                <span>até</span>
                <input
                  type="date"
                  value={dataCadastroAte}
                  onChange={(e) => mudarDataCadastroAte(e.target.value)}
                  aria-label="Lançado até"
                />
              </div>
            </div>
            <div className="campo campo-datas">
              <label htmlFor="campo-pagamento-de">Pagamento</label>
              <div className="intervalo-datas">
                <input
                  id="campo-pagamento-de"
                  type="date"
                  value={dataPagamentoDe}
                  onChange={(e) => mudarDataPagamentoDe(e.target.value)}
                  aria-label="Pago a partir de"
                />
                <span>até</span>
                <input
                  type="date"
                  value={dataPagamentoAte}
                  onChange={(e) => mudarDataPagamentoAte(e.target.value)}
                  aria-label="Pago até"
                />
              </div>
            </div>
          </div>

          {filtrosAtivos && (
            <div className="rodape-filtros">
              <button type="button" className="botao botao-fantasma botao-pequeno" onClick={limparFiltros}>
                Limpar filtros
              </button>
            </div>
          )}
        </div>
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
          ) : despesas.length === 0 ? (
            <div className="estado-vazio">
              <IconeDespesas width={28} height={28} />
              <div className="titulo">Nenhuma despesa encontrada</div>
              <div className="subtitulo">{rotuloVazio(filtrosAtivos)}</div>
            </div>
          ) : (
            <div className="tabela-scroll">
              <table className="dados">
                <thead>
                  <tr>
                    <CabecalhoOrdenavel
                      campo="dataCadastro"
                      rotulo="Lançamento"
                      ordenacaoAtual={ordenacaoAtual}
                      onOrdenar={alternarOrdenacao}
                    />
                    <CabecalhoOrdenavel
                      campo="dataPagamento"
                      rotulo="Pagamento"
                      ordenacaoAtual={ordenacaoAtual}
                      onOrdenar={alternarOrdenacao}
                    />
                    <CabecalhoOrdenavel
                      campo="descricao"
                      rotulo="Descrição"
                      ordenacaoAtual={ordenacaoAtual}
                      onOrdenar={alternarOrdenacao}
                    />
                    <th>Categoria</th>
                    <th>Pagador(es)</th>
                    <th className="num">Itens</th>
                    <th className="num">Documentos</th>
                    <CabecalhoOrdenavel
                      campo="valorTotal"
                      rotulo="Valor"
                      numerico
                      ordenacaoAtual={ordenacaoAtual}
                      onOrdenar={alternarOrdenacao}
                    />
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {despesas.map((despesa) => (
                    <tr
                      key={despesa.id}
                      className="clicavel"
                      onClick={() => navigate(`/empreendimentos/${empreendimentoId}/despesas/${despesa.id}`)}
                    >
                      <td>{formatarData(despesa.dataCadastro)}</td>
                      <td>{formatarData(despesa.dataPagamento)}</td>
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

        {!isLoading && !isError && data && despesas.length > 0 && (
          <div
            className="painel-corpo"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 0 }}
          >
            <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
              Página {data.number + 1} de {Math.max(data.totalPages, 1)} · {data.totalElements} despesa
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
        )}
      </div>
    </div>
  );
}

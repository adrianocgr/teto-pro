import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipProps } from 'recharts';
import { cliente } from '@/api/cliente';
import type { Pagina } from '@/tipos/pagina';
import { useEmpreendimento } from '@/api/empreendimentos';
import { useListaCategorias } from '@/api/categorias';
import { IconeAlerta } from '@/componentes/Icones';
import { formatarData, formatarMoeda, formatarMoedaResumida } from '@/utilitarios/formatacao';

interface PagadorResumo {
  investidorId: number;
  investidorNome: string;
  valor: number;
}

interface DespesaResumo {
  id: number;
  categoriaId: number;
  categoriaDescricao: string;
  fornecedorId: number | null;
  fornecedorNome: string | null;
  valorTotal: number;
  dataCadastro: string;
  dataAlteracao: string | null;
  descricao: string;
  usuarioCadastroNome: string | null;
  usuarioAlteracaoNome: string | null;
  pagadores: PagadorResumo[];
}

const TOTAL_FORNECEDORES_EXIBIDOS = 5;

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

function buscarDespesasResumo(empreendimentoId: number) {
  return cliente
    .get<Pagina<DespesaResumo>>('/despesas', { params: { empreendimentoId, size: 500 } })
    .then((resposta) => resposta.data);
}

function useDespesasResumo(empreendimentoId: number | undefined) {
  return useQuery({
    queryKey: ['despesas-resumo', empreendimentoId],
    queryFn: () => buscarDespesasResumo(empreendimentoId as number),
    enabled: !!empreendimentoId,
  });
}

function TooltipMoeda({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 11px',
        fontSize: 12.5,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ color: 'var(--ink-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{formatarMoeda(payload[0].value as number)}</div>
    </div>
  );
}

export function Resumo() {
  const { id } = useParams<{ id: string }>();
  const empreendimentoId = Number(id);

  const { data: empreendimento } = useEmpreendimento(empreendimentoId);
  const { data: despesasPagina, isLoading, isError } = useDespesasResumo(empreendimentoId);
  const { data: categoriasPagina } = useListaCategorias();

  const despesas = useMemo(() => despesasPagina?.content ?? [], [despesasPagina]);
  const categorias = categoriasPagina?.content ?? [];
  const participacoes = empreendimento?.participacoes ?? [];
  const somaPercentuais = Number(empreendimento?.somaPercentuais ?? 0);

  const totalGasto = useMemo(() => despesas.reduce((soma, despesa) => soma + Number(despesa.valorTotal ?? 0), 0), [
    despesas,
  ]);
  const ticketMedio = despesas.length > 0 ? totalGasto / despesas.length : 0;

  const gastoPorCategoria = useMemo(() => {
    const mapa = new Map<number, { categoriaId: number; descricao: string; total: number }>();
    despesas.forEach((despesa) => {
      const atual = mapa.get(despesa.categoriaId);
      const categoria = categorias.find((c) => c.id === despesa.categoriaId);
      const codigo = categoria?.codigo ? `${categoria.codigo} · ` : '';
      const descricao = `${codigo}${categoria?.descricao ?? despesa.categoriaDescricao}`;
      if (atual) {
        atual.total += Number(despesa.valorTotal ?? 0);
      } else {
        mapa.set(despesa.categoriaId, {
          categoriaId: despesa.categoriaId,
          descricao,
          total: Number(despesa.valorTotal ?? 0),
        });
      }
    });
    return Array.from(mapa.values())
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [despesas, categorias]);

  const categoriasEmUso = gastoPorCategoria.length;
  const maiorGastoCategoria = gastoPorCategoria[0]?.total ?? 0;

  const curvaAbcCategorias = useMemo(() => {
    let acumulado = 0;
    return gastoPorCategoria.map((item) => {
      acumulado += item.total;
      const percentualAcumulado = totalGasto > 0 ? (acumulado / totalGasto) * 100 : 0;
      const classe: 'A' | 'B' | 'C' =
        percentualAcumulado <= 80 ? 'A' : percentualAcumulado <= 95 ? 'B' : 'C';
      return {
        ...item,
        percentualItem: totalGasto > 0 ? (item.total / totalGasto) * 100 : 0,
        percentualAcumulado,
        classe,
      };
    });
  }, [gastoPorCategoria, totalGasto]);

  const gastoPorInvestidor = useMemo(() => {
    const mapa = new Map<number, { investidorId: number; nome: string; total: number }>();
    despesas.forEach((despesa) => {
      despesa.pagadores?.forEach((pagador) => {
        const atual = mapa.get(pagador.investidorId);
        if (atual) {
          atual.total += Number(pagador.valor ?? 0);
        } else {
          mapa.set(pagador.investidorId, {
            investidorId: pagador.investidorId,
            nome: pagador.investidorNome,
            total: Number(pagador.valor ?? 0),
          });
        }
      });
    });
    return Array.from(mapa.values())
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [despesas]);
  const maiorGastoInvestidor = gastoPorInvestidor[0]?.total ?? 0;

  const principaisFornecedores = useMemo(() => {
    const mapa = new Map<number, { fornecedorId: number; nome: string; total: number }>();
    despesas.forEach((despesa) => {
      if (!despesa.fornecedorId) return;
      const atual = mapa.get(despesa.fornecedorId);
      if (atual) {
        atual.total += Number(despesa.valorTotal ?? 0);
      } else {
        mapa.set(despesa.fornecedorId, {
          fornecedorId: despesa.fornecedorId,
          nome: despesa.fornecedorNome ?? '—',
          total: Number(despesa.valorTotal ?? 0),
        });
      }
    });
    return Array.from(mapa.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, TOTAL_FORNECEDORES_EXIBIDOS);
  }, [despesas]);
  const maiorGastoFornecedor = principaisFornecedores[0]?.total ?? 0;

  const evolucaoMensal = useMemo(() => {
    const mapa = new Map<string, number>();
    despesas.forEach((despesa) => {
      const mes = despesa.dataCadastro?.slice(0, 7);
      if (!mes) return;
      mapa.set(mes, (mapa.get(mes) ?? 0) + Number(despesa.valorTotal ?? 0));
    });
    return Array.from(mapa.entries())
      .sort(([mesA], [mesB]) => mesA.localeCompare(mesB))
      .map(([mes, total]) => ({
        mes: (() => {
          const [ano, mesNumero] = mes.split('-');
          return `${mesNumero}/${ano.slice(2)}`;
        })(),
        total,
      }));
  }, [despesas]);

  const atividadeRecente = useMemo(
    () =>
      [...despesas]
        .sort((a, b) => (b.dataAlteracao ?? b.dataCadastro).localeCompare(a.dataAlteracao ?? a.dataCadastro))
        .slice(0, 5),
    [despesas],
  );

  if (isLoading) {
    return <p>Carregando…</p>;
  }

  if (isError) {
    return <p>Não foi possível carregar as despesas deste empreendimento.</p>;
  }

  return (
    <div>
      {participacoes.length > 0 && Math.abs(somaPercentuais - 100) > 0.01 && (
        <div className="aviso">
          <IconeAlerta width={18} height={18} />
          <div>
            <b>Participações fora de 100%.</b> A soma dos percentuais cadastrados é de{' '}
            {somaPercentuais.toFixed(1)}%. Ajuste as participações dos investidores para fechar em 100%.
          </div>
        </div>
      )}

      <div className="linha-kpi">
        <div className="kpi">
          <div className="kpi-rotulo">Total gasto</div>
          <div className="kpi-valor">{formatarMoeda(totalGasto)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-rotulo">Ticket médio</div>
          <div className="kpi-valor">{formatarMoeda(ticketMedio)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-rotulo">Categorias em uso</div>
          <div className="kpi-valor">{categoriasEmUso}</div>
        </div>
        <div className="kpi">
          <div className="kpi-rotulo">Investidores vinculados</div>
          <div className="kpi-valor">{participacoes.length}</div>
          <div className="kpi-delta">Soma de participação: {somaPercentuais.toFixed(1)}%</div>
        </div>
      </div>

      <div className="duas-colunas">
        <div className="painel">
          <div className="painel-cabecalho">
            <div>
              <div className="painel-titulo">Gasto por categoria</div>
              <div className="painel-subtitulo">Distribuição do total gasto entre as categorias utilizadas</div>
            </div>
          </div>
          <div className="painel-corpo">
            {gastoPorCategoria.length === 0 ? (
              <div className="estado-vazio">
                <div className="titulo">Nenhum gasto registrado</div>
                <div className="subtitulo">Cadastre despesas para ver a distribuição por categoria.</div>
              </div>
            ) : (
              gastoPorCategoria.map((item, indice) => {
                const percentualLargura = maiorGastoCategoria > 0 ? (item.total / maiorGastoCategoria) * 100 : 0;
                return (
                  <div className="linha-barra" key={item.categoriaId}>
                    <div className="rotulo-barra">{item.descricao}</div>
                    <div className="trilho-barra">
                      <div
                        className="preenchimento-barra"
                        style={{
                          width: `${percentualLargura}%`,
                          background: CORES_CATEGORIA[indice % CORES_CATEGORIA.length],
                        }}
                      />
                    </div>
                    <div className="valor-barra">{formatarMoeda(item.total)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="painel">
          <div className="painel-cabecalho">
            <div>
              <div className="painel-titulo">Evolução mensal do gasto</div>
              <div className="painel-subtitulo">Total lançado por mês de cadastro</div>
            </div>
          </div>
          <div className="painel-corpo">
            {evolucaoMensal.length < 2 ? (
              <div className="estado-vazio">
                <div className="titulo">Dados insuficientes para o período.</div>
              </div>
            ) : (
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <AreaChart data={evolucaoMensal} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradienteEvolucao" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold-fill)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--gold-fill)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="mes"
                      stroke="var(--ink-muted)"
                      tick={{ fill: 'var(--ink-muted)', fontSize: 11.5 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="var(--ink-muted)"
                      tick={{ fill: 'var(--ink-muted)', fontSize: 11.5 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(valor: number) => formatarMoedaResumida(valor)}
                      width={64}
                    />
                    <Tooltip content={<TooltipMoeda />} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="var(--gold-fill)"
                      strokeWidth={2}
                      fill="url(#gradienteEvolucao)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="painel">
        <div className="painel-cabecalho">
          <div>
            <div className="painel-titulo">Curva ABC de categorias</div>
            <div className="painel-subtitulo">
              Classificação pelo impacto acumulado no total gasto — A até 80%, B até 95%, C o restante
            </div>
          </div>
        </div>
        <div className="painel-corpo" style={{ padding: 0 }}>
          {curvaAbcCategorias.length === 0 ? (
            <div className="estado-vazio">
              <div className="titulo">Nenhum gasto registrado</div>
              <div className="subtitulo">Cadastre despesas para ver a curva ABC.</div>
            </div>
          ) : (
            <div className="tabela-scroll">
              <table className="dados">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th className="num">Valor</th>
                    <th className="num">% do total</th>
                    <th className="num">% acumulado</th>
                    <th>Classe</th>
                  </tr>
                </thead>
                <tbody>
                  {curvaAbcCategorias.map((item) => (
                    <tr key={item.categoriaId}>
                      <td>{item.descricao}</td>
                      <td className="num">{formatarMoeda(item.total)}</td>
                      <td className="num">{item.percentualItem.toFixed(1)}%</td>
                      <td className="num">{item.percentualAcumulado.toFixed(1)}%</td>
                      <td>
                        <span className={`selo-classe classe-${item.classe.toLowerCase()}`}>{item.classe}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="duas-colunas">
        <div className="painel">
          <div className="painel-cabecalho">
            <div>
              <div className="painel-titulo">Gasto por investidor</div>
              <div className="painel-subtitulo">Total pago por cada investidor vinculado</div>
            </div>
          </div>
          <div className="painel-corpo">
            {gastoPorInvestidor.length === 0 ? (
              <div className="estado-vazio">
                <div className="titulo">Nenhum pagamento registrado</div>
                <div className="subtitulo">Cadastre despesas com pagadores para ver a distribuição.</div>
              </div>
            ) : (
              gastoPorInvestidor.map((item, indice) => {
                const percentualLargura = maiorGastoInvestidor > 0 ? (item.total / maiorGastoInvestidor) * 100 : 0;
                return (
                  <div className="linha-barra" key={item.investidorId}>
                    <div className="rotulo-barra">{item.nome}</div>
                    <div className="trilho-barra">
                      <div
                        className="preenchimento-barra"
                        style={{
                          width: `${percentualLargura}%`,
                          background: CORES_CATEGORIA[indice % CORES_CATEGORIA.length],
                        }}
                      />
                    </div>
                    <div className="valor-barra">{formatarMoeda(item.total)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="painel">
          <div className="painel-cabecalho">
            <div>
              <div className="painel-titulo">Principais fornecedores</div>
              <div className="painel-subtitulo">Os {TOTAL_FORNECEDORES_EXIBIDOS} fornecedores que mais receberam</div>
            </div>
          </div>
          <div className="painel-corpo">
            {principaisFornecedores.length === 0 ? (
              <div className="estado-vazio">
                <div className="titulo">Nenhum fornecedor registrado</div>
                <div className="subtitulo">Cadastre despesas com fornecedor para ver o ranking.</div>
              </div>
            ) : (
              principaisFornecedores.map((item, indice) => {
                const percentualLargura = maiorGastoFornecedor > 0 ? (item.total / maiorGastoFornecedor) * 100 : 0;
                return (
                  <div className="linha-barra" key={item.fornecedorId}>
                    <div className="rotulo-barra">{item.nome}</div>
                    <div className="trilho-barra">
                      <div
                        className="preenchimento-barra"
                        style={{
                          width: `${percentualLargura}%`,
                          background: CORES_CATEGORIA[indice % CORES_CATEGORIA.length],
                        }}
                      />
                    </div>
                    <div className="valor-barra">{formatarMoeda(item.total)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="painel">
        <div className="painel-cabecalho">
          <div>
            <div className="painel-titulo">Atividade recente</div>
            <div className="painel-subtitulo">Últimos lançamentos de despesas</div>
          </div>
        </div>
        <div className="painel-corpo">
          {atividadeRecente.length === 0 ? (
            <div className="estado-vazio">
              <div className="titulo">Nenhuma atividade recente</div>
            </div>
          ) : (
            atividadeRecente.map((despesa) => {
              const foiAtualizada = !!despesa.dataAlteracao && despesa.dataAlteracao !== despesa.dataCadastro;
              return (
                <div className="item-atividade" key={despesa.id}>
                  <div className={`ponto-atividade ${foiAtualizada ? 'atualizacao' : 'criacao'}`} />
                  <div>
                    <div>
                      <b>{despesa.descricao}</b> · {formatarMoeda(despesa.valorTotal)}
                    </div>
                    <div style={{ color: 'var(--ink-muted)' }}>
                      {foiAtualizada
                        ? `Atualizada em ${formatarData(despesa.dataAlteracao)} por ${despesa.usuarioAlteracaoNome ?? '—'}`
                        : `Cadastrada em ${formatarData(despesa.dataCadastro)} por ${despesa.usuarioCadastroNome ?? '—'}`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IconeDespesas, IconeRelatorio } from '@/componentes/Icones';
import { useListaDespesas, type DespesaResposta } from '@/api/despesas';
import { useListaCategorias } from '@/api/categorias';
import { useEmpreendimento } from '@/api/empreendimentos';
import { formatarData, formatarMoeda } from '@/utilitarios/formatacao';

function nomesPagadores(despesa: DespesaResposta) {
  if (despesa.pagadores.length === 0) return '—';
  return despesa.pagadores.map((p) => p.investidorNome).join(', ');
}

export function ExtratoDespesas() {
  const { id } = useParams<{ id: string }>();
  const empreendimentoId = Number(id);

  const [busca, setBusca] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [investidorId, setInvestidorId] = useState('');

  const { data, isLoading, isError } = useListaDespesas(empreendimentoId, { busca });
  const { data: categoriasResp } = useListaCategorias();
  const { data: empreendimento } = useEmpreendimento(empreendimentoId);

  const categorias = categoriasResp?.content ?? [];
  const participacoes = empreendimento?.participacoes ?? [];

  const despesas = useMemo(() => {
    return (data?.content ?? [])
      .filter((despesa) => {
        if (categoriaId && despesa.categoriaId !== Number(categoriaId)) return false;
        if (investidorId && !despesa.pagadores.some((p) => p.investidorId === Number(investidorId))) return false;
        return true;
      })
      .sort((a, b) => a.dataCadastro.localeCompare(b.dataCadastro));
  }, [data, categoriaId, investidorId]);

  const totalGeral = useMemo(() => despesas.reduce((soma, d) => soma + Number(d.valorTotal ?? 0), 0), [despesas]);

  const resumoPorInvestidor = useMemo(() => {
    const mapa = new Map<number, { investidorId: number; nome: string; total: number }>();
    despesas.forEach((despesa) => {
      despesa.pagadores.forEach((pagador) => {
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
    return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  }, [despesas]);

  const totalResumoInvestidor = useMemo(
    () => resumoPorInvestidor.reduce((soma, item) => soma + item.total, 0),
    [resumoPorInvestidor],
  );

  return (
    <div>
      <div className="cabecalho-pagina nao-imprimir">
        <div>
          <div className="titulo-pagina">Extrato de despesas</div>
          <div className="subtitulo-pagina">
            {isLoading ? 'Carregando…' : `${despesas.length} despesa(s) · ${formatarMoeda(totalGeral)}`}
          </div>
        </div>
        <button type="button" className="botao" onClick={() => window.print()}>
          <IconeRelatorio width={14} height={14} />
          Imprimir
        </button>
      </div>

      <div className="filtros nao-imprimir" style={{ marginBottom: 14 }}>
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

      <div className="cabecalho-impressao">
        <div className="titulo-pagina">Extrato de despesas</div>
        <div className="subtitulo-pagina">
          {empreendimento?.descricao} · Emitido em {formatarData(new Date().toISOString().slice(0, 10))}
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
              <div className="subtitulo">Ajuste os filtros para gerar o extrato.</div>
            </div>
          ) : (
            <div className="tabela-scroll">
              <table className="dados">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Fornecedor</th>
                    <th>Pagador(es)</th>
                    <th className="num">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {despesas.map((despesa) => (
                    <tr key={despesa.id}>
                      <td>{formatarData(despesa.dataCadastro)}</td>
                      <td>{despesa.descricao}</td>
                      <td>{despesa.categoriaDescricao}</td>
                      <td>{despesa.fornecedorNome ?? '—'}</td>
                      <td>{nomesPagadores(despesa)}</td>
                      <td className="num mono">{formatarMoeda(despesa.valorTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ fontWeight: 700, textAlign: 'right' }}>
                      Total
                    </td>
                    <td className="num mono" style={{ fontWeight: 700 }}>
                      {formatarMoeda(totalGeral)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {resumoPorInvestidor.length > 0 && (
        <div className="painel">
          <div className="painel-cabecalho">
            <div>
              <div className="painel-titulo">Resumo por investidor</div>
              <div className="painel-subtitulo">Total pago por cada investidor neste extrato</div>
            </div>
          </div>
          <div className="painel-corpo" style={{ padding: 0 }}>
            <div className="tabela-scroll">
              <table className="dados">
                <thead>
                  <tr>
                    <th>Investidor</th>
                    <th className="num">Valor pago</th>
                    <th className="num">% do total</th>
                  </tr>
                </thead>
                <tbody>
                  {resumoPorInvestidor.map((item) => (
                    <tr key={item.investidorId}>
                      <td>{item.nome}</td>
                      <td className="num mono">{formatarMoeda(item.total)}</td>
                      <td className="num">
                        {totalResumoInvestidor > 0 ? ((item.total / totalResumoInvestidor) * 100).toFixed(1) : '0.0'}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Total</td>
                    <td className="num mono" style={{ fontWeight: 700 }}>
                      {formatarMoeda(totalResumoInvestidor)}
                    </td>
                    <td className="num" style={{ fontWeight: 700 }}>
                      100.0%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

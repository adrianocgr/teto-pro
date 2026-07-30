import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAutenticacao } from '@/autenticacao/ContextoAutenticacao';
import { useToast } from '@/componentes/Toast';
import { IconeMais, IconeLixeira } from '@/componentes/Icones';
import { CampoValorMonetario } from '@/componentes/CamposMascarados';
import { formatarMoeda } from '@/utilitarios/formatacao';
import {
  useListaDespesasRecorrentes,
  useCriarDespesaRecorrente,
  useAtualizarDespesaRecorrente,
  useAlternarStatusDespesaRecorrente,
  useExcluirDespesaRecorrente,
  type DespesaRecorrenteResposta,
} from '@/api/despesasRecorrentes';
import { useListaCategorias } from '@/api/categorias';
import { useListaFornecedores } from '@/api/fornecedores';
import { useEmpreendimento } from '@/api/empreendimentos';

interface PagadorRascunho {
  chave: string;
  investidorId: string;
  percentual: string;
}

interface Rascunho {
  categoriaId: string;
  fornecedorId: string;
  descricao: string;
  observacao: string;
  valorPadrao: string;
  diaVencimento: string;
  pagadores: PagadorRascunho[];
}

let proximaChave = 1;
function novaChave(): string {
  proximaChave += 1;
  return `pr-${proximaChave}`;
}

function rascunhoVazio(): Rascunho {
  return { categoriaId: '', fornecedorId: '', descricao: '', observacao: '', valorPadrao: '', diaVencimento: '', pagadores: [] };
}

function paraRascunho(recorrente: DespesaRecorrenteResposta): Rascunho {
  return {
    categoriaId: String(recorrente.categoriaId),
    fornecedorId: recorrente.fornecedorId ? String(recorrente.fornecedorId) : '',
    descricao: recorrente.descricao,
    observacao: recorrente.observacao ?? '',
    valorPadrao: recorrente.valorPadrao !== null ? String(recorrente.valorPadrao) : '',
    diaVencimento: recorrente.diaVencimento !== null ? String(recorrente.diaVencimento) : '',
    pagadores: recorrente.pagadores.map((p) => ({
      chave: novaChave(),
      investidorId: String(p.investidorId),
      percentual: String(p.percentual),
    })),
  };
}

function mesAtual(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

function nomeMes(competenciaISO: string | null): string {
  if (!competenciaISO) return '—';
  const [ano, mes] = competenciaISO.split('-');
  const data = new Date(Number(ano), Number(mes) - 1, 1);
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function DespesasRecorrentes() {
  const { id } = useParams<{ id: string }>();
  const empreendimentoId = Number(id);
  const navigate = useNavigate();
  const { temPapel } = useAutenticacao();
  const { notificar } = useToast();

  const { data: recorrentes, isLoading, isError } = useListaDespesasRecorrentes(empreendimentoId);
  const { data: categoriasResp } = useListaCategorias();
  const { data: fornecedoresResp } = useListaFornecedores();
  const { data: empreendimento } = useEmpreendimento(empreendimentoId);

  const categorias = categoriasResp?.content ?? [];
  const fornecedores = fornecedoresResp?.content ?? [];
  const participacoes = empreendimento?.participacoes ?? [];

  const criar = useCriarDespesaRecorrente(empreendimentoId);
  const atualizar = useAtualizarDespesaRecorrente(empreendimentoId);
  const alternarStatus = useAlternarStatusDespesaRecorrente(empreendimentoId);
  const excluir = useExcluirDespesaRecorrente(empreendimentoId);

  const podeGerenciar = temPapel('ADMIN', 'GESTOR');

  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<DespesaRecorrenteResposta | null>(null);
  const [rascunho, setRascunho] = useState<Rascunho>(rascunhoVazio());

  const [modalLancar, setModalLancar] = useState<DespesaRecorrenteResposta | null>(null);
  const [competenciaEscolhida, setCompetenciaEscolhida] = useState(mesAtual());

  function abrirNovo() {
    setEmEdicao(null);
    setRascunho(rascunhoVazio());
    setModalAberto(true);
  }

  function abrirEdicao(recorrente: DespesaRecorrenteResposta) {
    setEmEdicao(recorrente);
    setRascunho(paraRascunho(recorrente));
    setModalAberto(true);
  }

  function adicionarPagador() {
    setRascunho((r) => ({ ...r, pagadores: [...r.pagadores, { chave: novaChave(), investidorId: '', percentual: '' }] }));
  }

  function removerPagador(chave: string) {
    setRascunho((r) => ({ ...r, pagadores: r.pagadores.filter((p) => p.chave !== chave) }));
  }

  function atualizarPagador(chave: string, campo: 'investidorId' | 'percentual', valor: string) {
    setRascunho((r) => ({
      ...r,
      pagadores: r.pagadores.map((p) => (p.chave === chave ? { ...p, [campo]: valor } : p)),
    }));
  }

  const somaPercentuais = rascunho.pagadores.reduce((soma, p) => soma + (Number(p.percentual) || 0), 0);
  const somaBate = Math.abs(somaPercentuais - 100) < 0.005;
  const formularioValido =
    !!rascunho.categoriaId &&
    rascunho.descricao.trim().length > 0 &&
    rascunho.pagadores.length > 0 &&
    rascunho.pagadores.every((p) => !!p.investidorId && Number(p.percentual) > 0) &&
    somaBate;

  function aoSalvar(evento: FormEvent) {
    evento.preventDefault();
    if (!formularioValido) return;
    const dados = {
      categoriaId: Number(rascunho.categoriaId),
      fornecedorId: rascunho.fornecedorId ? Number(rascunho.fornecedorId) : null,
      descricao: rascunho.descricao.trim(),
      observacao: rascunho.observacao.trim() || null,
      valorPadrao: rascunho.valorPadrao ? Number(rascunho.valorPadrao) : null,
      diaVencimento: rascunho.diaVencimento ? Number(rascunho.diaVencimento) : null,
      pagadores: rascunho.pagadores.map((p) => ({ investidorId: Number(p.investidorId), percentual: Number(p.percentual) })),
    };

    const aoTerminar = {
      onSuccess: () => {
        notificar(emEdicao ? 'Despesa recorrente atualizada' : 'Despesa recorrente criada');
        setModalAberto(false);
      },
      onError: () => notificar('Não foi possível salvar a despesa recorrente', 'erro'),
    };

    if (emEdicao) {
      atualizar.mutate({ id: emEdicao.id, dados }, aoTerminar);
    } else {
      criar.mutate(dados, aoTerminar);
    }
  }

  function aoAlternarStatus(recorrente: DespesaRecorrenteResposta) {
    alternarStatus.mutate(
      { id: recorrente.id, ativar: recorrente.status === 'INATIVO' },
      {
        onSuccess: () => notificar(recorrente.status === 'INATIVO' ? 'Reativada' : 'Inativada'),
        onError: () => notificar('Não foi possível alterar o status', 'erro'),
      },
    );
  }

  function aoExcluir(recorrente: DespesaRecorrenteResposta) {
    if (!window.confirm(`Excluir o modelo "${recorrente.descricao}"?`)) return;
    excluir.mutate(recorrente.id, {
      onSuccess: () => notificar('Despesa recorrente excluída'),
      onError: () => notificar('Não foi possível excluir', 'erro'),
    });
  }

  function abrirLancar(recorrente: DespesaRecorrenteResposta) {
    setModalLancar(recorrente);
    setCompetenciaEscolhida(mesAtual());
  }

  function aoConfirmarLancamento(evento: FormEvent) {
    evento.preventDefault();
    if (!modalLancar || !competenciaEscolhida) return;

    const competencia = `${competenciaEscolhida}-01`;
    const totalPercentual = modalLancar.pagadores.reduce((soma, p) => soma + p.percentual, 0);
    const valorBase = modalLancar.valorPadrao ?? 0;

    const pagadoresPreenchidos = modalLancar.pagadores.map((p, indice) => {
      const bruto = valorBase > 0 ? Math.round(((valorBase * p.percentual) / (totalPercentual || 100)) * 100) / 100 : 0;
      return { investidorId: p.investidorId, valor: bruto, ehUltimo: indice === modalLancar.pagadores.length - 1 };
    });
    // Ajusta o último pagador para a soma bater exatamente com o valor padrão (arredondamento).
    if (valorBase > 0 && pagadoresPreenchidos.length > 0) {
      const somaParcial = pagadoresPreenchidos.reduce((s, p, i) => (i === pagadoresPreenchidos.length - 1 ? s : s + p.valor), 0);
      pagadoresPreenchidos[pagadoresPreenchidos.length - 1].valor = Math.round((valorBase - somaParcial) * 100) / 100;
    }

    navigate(`/empreendimentos/${empreendimentoId}/despesas/novo`, {
      state: {
        recorrenciaId: modalLancar.id,
        competencia,
        categoriaId: modalLancar.categoriaId,
        fornecedorId: modalLancar.fornecedorId,
        descricao: `${modalLancar.descricao} — ${nomeMes(competencia)}`,
        valorPadrao: modalLancar.valorPadrao,
        pagadores: pagadoresPreenchidos.map(({ investidorId, valor }) => ({ investidorId, valor })),
      },
    });
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <div>
          <div className="titulo-pagina">Despesas recorrentes</div>
          <div className="subtitulo-pagina">
            {isLoading ? 'Carregando…' : `${recorrentes?.length ?? 0} modelo(s) cadastrado(s)`}
          </div>
        </div>
        {podeGerenciar && (
          <button className="botao botao-primario" onClick={abrirNovo}>
            <IconeMais width={14} height={14} /> Nova despesa recorrente
          </button>
        )}
      </div>

      {isError && <p>Não foi possível carregar as despesas recorrentes.</p>}

      {!isLoading && !isError && (
        <div className="painel">
          <div className="painel-corpo" style={{ padding: 0 }}>
            {(recorrentes ?? []).length === 0 ? (
              <div className="estado-vazio">
                <div className="titulo">Nenhuma despesa recorrente cadastrada</div>
                <div className="subtitulo">Água, luz, condomínio... cadastre um modelo e lance todo mês com um clique.</div>
              </div>
            ) : (
              <div className="tabela-scroll">
                <table className="dados">
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Rateio</th>
                      <th className="num">Valor padrão</th>
                      <th>Último lançamento</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recorrentes ?? []).map((recorrente) => (
                      <tr key={recorrente.id}>
                        <td style={{ fontWeight: 600 }}>{recorrente.descricao}</td>
                        <td>{recorrente.categoriaDescricao}</td>
                        <td>
                          {recorrente.pagadores.map((p) => `${p.investidorNome} ${p.percentual}%`).join(' · ')}
                        </td>
                        <td className="num">{recorrente.valorPadrao !== null ? formatarMoeda(recorrente.valorPadrao) : '—'}</td>
                        <td>
                          {recorrente.ultimaCompetencia
                            ? `${nomeMes(recorrente.ultimaCompetencia)} — ${formatarMoeda(recorrente.ultimoValor)}`
                            : 'Nunca lançada'}
                        </td>
                        <td>
                          <span className={`pilula-status ${recorrente.status === 'ATIVO' ? 'status-ativo' : 'status-inativo'}`}>
                            <span className="ponto" />
                            {recorrente.status}
                          </span>
                        </td>
                        <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {podeGerenciar && recorrente.status === 'ATIVO' && (
                            <button className="botao botao-dourado botao-pequeno" onClick={() => abrirLancar(recorrente)}>
                              Lançar
                            </button>
                          )}
                          {podeGerenciar && (
                            <>
                              <button className="botao botao-fantasma botao-pequeno" onClick={() => abrirEdicao(recorrente)}>
                                Editar
                              </button>
                              <button className="botao botao-fantasma botao-pequeno" onClick={() => aoAlternarStatus(recorrente)}>
                                {recorrente.status === 'ATIVO' ? 'Inativar' : 'Reativar'}
                              </button>
                              <button className="botao botao-fantasma botao-pequeno" onClick={() => aoExcluir(recorrente)}>
                                Excluir
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {modalAberto && (
        <div className="sobreposicao-modal" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <div className="modal-titulo">{emEdicao ? 'Editar despesa recorrente' : 'Nova despesa recorrente'}</div>
              <button className="fechar-modal" onClick={() => setModalAberto(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={aoSalvar}>
              <div className="modal-corpo">
                <div className="grade-formulario">
                  <div className="campo col-2">
                    <label>Descrição</label>
                    <input
                      type="text"
                      placeholder="Água, Luz, Condomínio…"
                      value={rascunho.descricao}
                      onChange={(e) => setRascunho((r) => ({ ...r, descricao: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="campo">
                    <label>Categoria</label>
                    <select
                      value={rascunho.categoriaId}
                      onChange={(e) => setRascunho((r) => ({ ...r, categoriaId: e.target.value }))}
                      required
                    >
                      <option value="">Selecione…</option>
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.codigo} — {categoria.descricao}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="campo">
                    <label>Fornecedor</label>
                    <select
                      value={rascunho.fornecedorId}
                      onChange={(e) => setRascunho((r) => ({ ...r, fornecedorId: e.target.value }))}
                    >
                      <option value="">Sem fornecedor</option>
                      {fornecedores.map((fornecedor) => (
                        <option key={fornecedor.id} value={fornecedor.id}>
                          {fornecedor.razaoSocial}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="campo">
                    <label>Valor padrão (sugestão)</label>
                    <CampoValorMonetario
                      valor={rascunho.valorPadrao}
                      onValorAlterado={(v) => setRascunho((r) => ({ ...r, valorPadrao: v }))}
                    />
                  </div>
                  <div className="campo">
                    <label>Dia de vencimento</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      placeholder="Opcional"
                      value={rascunho.diaVencimento}
                      onChange={(e) => setRascunho((r) => ({ ...r, diaVencimento: e.target.value }))}
                    />
                  </div>
                  <div className="campo col-2">
                    <label>Observação</label>
                    <input
                      type="text"
                      value={rascunho.observacao}
                      onChange={(e) => setRascunho((r) => ({ ...r, observacao: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <div className="rotulo" style={{ marginTop: 4 }}>
                    Rateio (percentual)
                  </div>
                  {rascunho.pagadores.map((pagador) => (
                    <div className="linha-pagador" key={pagador.chave}>
                      <div className="campo">
                        <label>Investidor</label>
                        <select
                          value={pagador.investidorId}
                          onChange={(e) => atualizarPagador(pagador.chave, 'investidorId', e.target.value)}
                        >
                          <option value="">Selecione…</option>
                          {participacoes.map((participacao) => (
                            <option key={participacao.investidorId} value={participacao.investidorId}>
                              {participacao.investidorNome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="campo">
                        <label>Percentual (%)</label>
                        <input
                          type="number"
                          min={0.01}
                          max={100}
                          step="0.01"
                          value={pagador.percentual}
                          onChange={(e) => atualizarPagador(pagador.chave, 'percentual', e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="botao-icone"
                        onClick={() => removerPagador(pagador.chave)}
                        title="Remover"
                      >
                        <IconeLixeira width={15} height={15} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="botao-adicionar-linha" onClick={adicionarPagador}>
                    <IconeMais width={13} height={13} /> Adicionar pagador
                  </button>
                  <div className={`barra-soma ${somaBate ? 'ok' : 'errado'}`}>
                    <span>Soma dos percentuais: {somaPercentuais.toFixed(2)}% de 100%</span>
                  </div>
                </div>
              </div>
              <div className="modal-rodape">
                <button type="button" className="botao botao-fantasma" onClick={() => setModalAberto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="botao botao-primario" disabled={!formularioValido || criar.isPending || atualizar.isPending}>
                  {criar.isPending || atualizar.isPending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalLancar && (
        <div className="sobreposicao-modal" onClick={() => setModalLancar(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <div className="modal-titulo">Lançar "{modalLancar.descricao}"</div>
              <button className="fechar-modal" onClick={() => setModalLancar(null)}>
                ✕
              </button>
            </div>
            <form onSubmit={aoConfirmarLancamento}>
              <div className="modal-corpo">
                <div className="campo">
                  <label htmlFor="campo-competencia">Mês de referência</label>
                  <input
                    id="campo-competencia"
                    type="month"
                    value={competenciaEscolhida}
                    onChange={(e) => setCompetenciaEscolhida(e.target.value)}
                    required
                  />
                </div>
                <div className="dica">
                  O formulário de despesa abrirá já preenchido com categoria, fornecedor e rateio deste modelo — só falta
                  confirmar o valor deste mês e salvar.
                </div>
              </div>
              <div className="modal-rodape">
                <button type="button" className="botao botao-fantasma" onClick={() => setModalLancar(null)}>
                  Cancelar
                </button>
                <button type="submit" className="botao botao-primario">
                  Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, type ChangeEvent, type CSSProperties } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAutenticacao } from '@/autenticacao/ContextoAutenticacao';
import { useToast } from '@/componentes/Toast';
import { IconeArquivo, IconeCheck, IconeDownload, IconeLixeira, IconeMais, IconeSeta } from '@/componentes/Icones';
import { CampoValorMonetario } from '@/componentes/CamposMascarados';
import {
  baixarDocumento,
  useAtualizarDespesa,
  useCriarDespesa,
  useDespesa,
  useRemoverDocumento,
  useUploadDocumentos,
  type DespesaRequisicao,
  type DespesaResposta,
} from '@/api/despesas';
import { useListaCategorias } from '@/api/categorias';
import { useListaFornecedores } from '@/api/fornecedores';
import { useListaInsumos } from '@/api/insumos';
import { useEmpreendimento } from '@/api/empreendimentos';
import { formatarData, formatarMoeda } from '@/utilitarios/formatacao';

type Modo = 'visualizacao' | 'edicao' | 'criacao';

interface ItemRascunho {
  chave: string;
  insumoId: string;
  quantidade: string;
  valorUnitario: string;
}

interface PagadorRascunho {
  chave: string;
  investidorId: string;
  valor: string;
}

interface Rascunho {
  descricao: string;
  categoriaId: string;
  fornecedorId: string;
  observacao: string;
  valorTotal: string;
  itens: ItemRascunho[];
  pagadores: PagadorRascunho[];
}

let proximaChave = 1;
function novaChave(): string {
  proximaChave += 1;
  return `linha-${proximaChave}`;
}

const RASCUNHO_VAZIO: Rascunho = {
  descricao: '',
  categoriaId: '',
  fornecedorId: '',
  observacao: '',
  valorTotal: '',
  itens: [],
  pagadores: [],
};

/** Estado de navegação enviado pela tela de Despesas recorrentes ao "Lançar" um modelo. */
interface OrigemRecorrente {
  recorrenciaId: number;
  competencia: string;
  categoriaId: number;
  fornecedorId: number | null;
  descricao: string;
  valorPadrao: number | null;
  pagadores: { investidorId: number; valor: number }[];
}

function rascunhoDaOrigemRecorrente(origem: OrigemRecorrente): Rascunho {
  return {
    descricao: origem.descricao,
    categoriaId: String(origem.categoriaId),
    fornecedorId: origem.fornecedorId ? String(origem.fornecedorId) : '',
    observacao: '',
    valorTotal: origem.valorPadrao !== null ? String(origem.valorPadrao) : '',
    itens: [],
    pagadores: origem.pagadores.map((p) => ({
      chave: novaChave(),
      investidorId: String(p.investidorId),
      valor: p.valor > 0 ? String(p.valor) : '',
    })),
  };
}

function paraRascunho(despesa: DespesaResposta): Rascunho {
  return {
    descricao: despesa.descricao,
    categoriaId: String(despesa.categoriaId),
    fornecedorId: despesa.fornecedorId ? String(despesa.fornecedorId) : '',
    observacao: despesa.observacao ?? '',
    valorTotal: despesa.itens.length === 0 ? String(despesa.valorTotal) : '',
    itens: despesa.itens.map((item) => ({
      chave: novaChave(),
      insumoId: String(item.insumoId),
      quantidade: String(item.quantidade),
      valorUnitario: String(item.valorUnitario),
    })),
    pagadores: despesa.pagadores.map((pagador) => ({
      chave: novaChave(),
      investidorId: String(pagador.investidorId),
      valor: String(pagador.valor),
    })),
  };
}

const estiloBotaoChip: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  color: 'inherit',
};

export function DespesaDetalhe() {
  const { id, despesaId } = useParams<{ id: string; despesaId?: string }>();
  const empreendimentoId = Number(id);
  const ehCriacao = !despesaId;
  const navigate = useNavigate();
  const location = useLocation();
  const { temPapel } = useAutenticacao();
  const { notificar } = useToast();

  // Presente só quando se chega aqui pelo botão "Lançar" de uma despesa
  // recorrente (ver DespesasRecorrentes.tsx) — pré-preenche o rascunho e
  // marca de onde esta despesa vem, pra mandar junto ao salvar.
  const origemRecorrente = ehCriacao ? (location.state as OrigemRecorrente | null) : null;

  const [modo, setModo] = useState<Modo>(ehCriacao ? 'criacao' : 'visualizacao');
  const [rascunho, setRascunho] = useState<Rascunho>(
    origemRecorrente ? rascunhoDaOrigemRecorrente(origemRecorrente) : RASCUNHO_VAZIO,
  );

  const { data: despesa, isLoading, isError } = useDespesa(ehCriacao ? undefined : Number(despesaId));
  const { data: categoriasResp } = useListaCategorias();
  const { data: fornecedoresResp } = useListaFornecedores();
  const { data: insumosResp } = useListaInsumos();
  const { data: empreendimento } = useEmpreendimento(empreendimentoId);

  const categorias = categoriasResp?.content ?? [];
  const fornecedores = fornecedoresResp?.content ?? [];
  const insumos = insumosResp?.content ?? [];
  const participacoes = empreendimento?.participacoes ?? [];

  const criarDespesa = useCriarDespesa();
  const atualizarDespesa = useAtualizarDespesa(despesa?.id);
  const uploadDocumentos = useUploadDocumentos(despesa?.id);
  const removerDocumento = useRemoverDocumento(despesa?.id);

  useEffect(() => {
    if (despesa) {
      setRascunho(paraRascunho(despesa));
    }
  }, [despesa]);

  if (!ehCriacao && isLoading) {
    return <p>Carregando…</p>;
  }

  if (!ehCriacao && (isError || !despesa)) {
    return (
      <div>
        <Link to={`/empreendimentos/${empreendimentoId}/despesas`} className="link-voltar">
          <IconeSeta /> Voltar para despesas
        </Link>
        <div className="estado-vazio">
          <div className="titulo">Despesa não encontrada</div>
          <div className="subtitulo">Verifique se o link está correto ou volte para a lista.</div>
        </div>
      </div>
    );
  }

  const temItens = rascunho.itens.length > 0;

  const valorTotalCalculado = temItens
    ? rascunho.itens.reduce(
        (soma, item) => soma + (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0),
        0,
      )
    : Number(rascunho.valorTotal) || 0;

  const somaPagadores = rascunho.pagadores.reduce((soma, pagador) => soma + (Number(pagador.valor) || 0), 0);
  const diferenca = Math.round((valorTotalCalculado - somaPagadores) * 100) / 100;
  const somaBate = Math.abs(diferenca) < 0.005 && valorTotalCalculado > 0;

  const itensValidos = rascunho.itens.every(
    (item) => !!item.insumoId && Number(item.quantidade) > 0 && Number(item.valorUnitario) > 0,
  );
  const pagadoresValidos =
    rascunho.pagadores.length > 0 &&
    rascunho.pagadores.every((pagador) => !!pagador.investidorId && Number(pagador.valor) > 0);

  const formularioValido =
    rascunho.descricao.trim().length > 0 &&
    !!rascunho.categoriaId &&
    itensValidos &&
    pagadoresValidos &&
    somaBate;

  const salvando = criarDespesa.isPending || atualizarDespesa.isPending;

  function adicionarItem() {
    setRascunho((r) => ({
      ...r,
      itens: [...r.itens, { chave: novaChave(), insumoId: '', quantidade: '', valorUnitario: '' }],
    }));
  }

  function removerItem(chave: string) {
    setRascunho((r) => ({ ...r, itens: r.itens.filter((item) => item.chave !== chave) }));
  }

  function atualizarItem(chave: string, campo: keyof Omit<ItemRascunho, 'chave'>, valor: string) {
    setRascunho((r) => ({
      ...r,
      itens: r.itens.map((item) => {
        if (item.chave !== chave) return item;
        const atualizado = { ...item, [campo]: valor };
        if (campo === 'insumoId') {
          const insumo = insumos.find((i) => String(i.id) === valor);
          if (insumo) {
            atualizado.valorUnitario = String(insumo.precoReferencia);
          }
        }
        return atualizado;
      }),
    }));
  }

  function adicionarPagador() {
    setRascunho((r) => ({
      ...r,
      pagadores: [...r.pagadores, { chave: novaChave(), investidorId: '', valor: '' }],
    }));
  }

  function removerPagador(chave: string) {
    setRascunho((r) => ({ ...r, pagadores: r.pagadores.filter((pagador) => pagador.chave !== chave) }));
  }

  function atualizarPagador(chave: string, campo: keyof Omit<PagadorRascunho, 'chave'>, valor: string) {
    setRascunho((r) => ({
      ...r,
      pagadores: r.pagadores.map((pagador) => (pagador.chave === chave ? { ...pagador, [campo]: valor } : pagador)),
    }));
  }

  function montarPayload(): DespesaRequisicao {
    return {
      empreendimentoId,
      categoriaId: Number(rascunho.categoriaId),
      fornecedorId: rascunho.fornecedorId ? Number(rascunho.fornecedorId) : null,
      descricao: rascunho.descricao.trim(),
      observacao: rascunho.observacao.trim() || null,
      valorTotal: temItens ? null : Number(rascunho.valorTotal) || null,
      itens: rascunho.itens.map((item) => ({
        insumoId: Number(item.insumoId),
        quantidade: Number(item.quantidade),
        valorUnitario: Number(item.valorUnitario),
      })),
      pagadores: rascunho.pagadores.map((pagador) => ({
        investidorId: Number(pagador.investidorId),
        valor: Number(pagador.valor),
      })),
      recorrenciaId: origemRecorrente?.recorrenciaId,
      competencia: origemRecorrente?.competencia,
    };
  }

  function aoSalvar() {
    if (!formularioValido) return;
    const payload = montarPayload();
    if (ehCriacao) {
      criarDespesa.mutate(payload, {
        onSuccess: (despesaCriada) => {
          notificar('Despesa criada com sucesso.');
          navigate(`/empreendimentos/${empreendimentoId}/despesas/${despesaCriada.id}`, { replace: true });
        },
        onError: () => notificar('Não foi possível criar a despesa.', 'erro'),
      });
    } else {
      atualizarDespesa.mutate(payload, {
        onSuccess: () => {
          notificar('Despesa atualizada com sucesso.');
          setModo('visualizacao');
        },
        onError: () => notificar('Não foi possível atualizar a despesa.', 'erro'),
      });
    }
  }

  function aoCancelar() {
    if (ehCriacao) {
      navigate(`/empreendimentos/${empreendimentoId}/despesas`);
      return;
    }
    if (despesa) {
      setRascunho(paraRascunho(despesa));
    }
    setModo('visualizacao');
  }

  function aoSelecionarArquivos(evento: ChangeEvent<HTMLInputElement>) {
    const arquivos = evento.target.files;
    if (!arquivos || arquivos.length === 0 || !despesa) return;
    uploadDocumentos.mutate(Array.from(arquivos), {
      onSuccess: () => notificar('Documento(s) enviado(s) com sucesso.'),
      onError: () => notificar('Não foi possível enviar os documentos.', 'erro'),
    });
    evento.target.value = '';
  }

  function aoRemoverDocumento(documentoId: number) {
    removerDocumento.mutate(documentoId, {
      onSuccess: () => notificar('Documento removido.'),
      onError: () => notificar('Não foi possível remover o documento.', 'erro'),
    });
  }

  async function aoBaixarDocumento(documentoId: number, nomeArquivo: string) {
    if (!despesa) return;
    try {
      await baixarDocumento(despesa.id, documentoId, nomeArquivo);
    } catch {
      notificar('Não foi possível baixar o documento.', 'erro');
    }
  }

  const titulo = ehCriacao ? 'Nova despesa' : (despesa?.descricao ?? '');
  const rotuloModo = modo === 'criacao' ? 'Nova' : modo === 'edicao' ? 'Edição' : 'Visualização';
  const emEdicaoOuCriacao = modo === 'edicao' || modo === 'criacao';
  const documentos = despesa?.documentos ?? [];

  return (
    <div>
      <Link to={`/empreendimentos/${empreendimentoId}/despesas`} className="link-voltar">
        <IconeSeta /> Voltar para despesas
      </Link>

      <div className="cabecalho-pagina">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className="titulo-pagina">{titulo}</div>
            <span className={`selo-modo modo-${modo}`}>{rotuloModo}</span>
          </div>
          {!ehCriacao && despesa && (
            <div className="subtitulo-pagina">
              Cadastrada por {despesa.usuarioCadastroNome} em {formatarData(despesa.dataCadastro)}
              {despesa.dataAlteracao && despesa.usuarioAlteracaoNome && (
                <>
                  {' '}
                  · atualizada por {despesa.usuarioAlteracaoNome} em {formatarData(despesa.dataAlteracao)}
                </>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {modo === 'visualizacao' && temPapel('ADMIN', 'GESTOR') && (
            <button type="button" className="botao" onClick={() => setModo('edicao')}>
              Editar
            </button>
          )}
          {emEdicaoOuCriacao && (
            <>
              <button type="button" className="botao" onClick={aoCancelar}>
                Cancelar
              </button>
              <button
                type="button"
                className="botao botao-primario"
                disabled={!formularioValido || salvando}
                onClick={aoSalvar}
              >
                {salvando ? 'Salvando…' : 'Salvar despesa'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="painel">
        <div className="painel-cabecalho">
          <div className="painel-titulo">Dados da despesa</div>
        </div>
        <div className="painel-corpo">
          {!emEdicaoOuCriacao ? (
            <div className="grade-formulario">
              <div className="campo col-2">
                <label>Descrição</label>
                <div className="campo-estatico">{despesa?.descricao}</div>
              </div>
              <div className="campo">
                <label>Categoria</label>
                <div className="campo-estatico">{despesa?.categoriaDescricao}</div>
              </div>
              <div className="campo">
                <label>Fornecedor</label>
                <div className="campo-estatico">{despesa?.fornecedorNome ?? 'Sem fornecedor'}</div>
              </div>
              <div className="campo col-2">
                <label>Observação</label>
                <div className="campo-estatico">{despesa?.observacao || '—'}</div>
              </div>
            </div>
          ) : (
            <div className="grade-formulario">
              <div className="campo col-2">
                <label>Descrição</label>
                <input
                  type="text"
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
              <div className="campo col-2">
                <label>Observação</label>
                <input
                  type="text"
                  value={rascunho.observacao}
                  onChange={(e) => setRascunho((r) => ({ ...r, observacao: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="painel">
        <div className="painel-cabecalho">
          <div className="painel-titulo">Itens da despesa</div>
          <div className="painel-subtitulo">
            Se houver itens, o valor total é a soma de quantidade × valor unitário de cada um.
          </div>
        </div>
        <div className="painel-corpo">
          {emEdicaoOuCriacao ? (
            <>
              {rascunho.itens.map((item) => (
                <div className="linha-item" key={item.chave}>
                  <div className="campo">
                    <label>Insumo</label>
                    <select
                      value={item.insumoId}
                      onChange={(e) => atualizarItem(item.chave, 'insumoId', e.target.value)}
                    >
                      <option value="">Selecione…</option>
                      {insumos.map((insumo) => (
                        <option key={insumo.id} value={insumo.id}>
                          {insumo.descricao} ({insumo.unidadeMedidaSigla})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="campo">
                    <label>Quantidade</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={item.quantidade}
                      onChange={(e) => atualizarItem(item.chave, 'quantidade', e.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label>Valor unitário</label>
                    <CampoValorMonetario
                      valor={item.valorUnitario}
                      onValorAlterado={(v) => atualizarItem(item.chave, 'valorUnitario', v)}
                    />
                  </div>
                  <div className="campo">
                    <label>Total</label>
                    <div className="apenas-leitura">
                      {formatarMoeda((Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="botao-icone"
                    onClick={() => removerItem(item.chave)}
                    title="Remover item"
                  >
                    <IconeLixeira width={15} height={15} />
                  </button>
                </div>
              ))}
              <button type="button" className="botao-adicionar-linha" onClick={adicionarItem}>
                <IconeMais width={13} height={13} /> Adicionar item
              </button>

              {temItens ? (
                <div className="campo" style={{ maxWidth: 280, marginTop: 14 }}>
                  <label>Valor total (soma dos itens)</label>
                  <div className="apenas-leitura mono" style={{ textAlign: 'left' }}>
                    {formatarMoeda(valorTotalCalculado)}
                  </div>
                </div>
              ) : (
                <div className="campo" style={{ maxWidth: 280, marginTop: 14 }}>
                  <label>Valor total</label>
                  <CampoValorMonetario
                    valor={rascunho.valorTotal}
                    onValorAlterado={(v) => setRascunho((r) => ({ ...r, valorTotal: v }))}
                  />
                  <div className="dica">
                    Sem itens cadastrados — informe o valor diretamente, como uma escritura ou taxa.
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {(despesa?.itens.length ?? 0) === 0 ? (
                <div className="estado-vazio" style={{ padding: '20px 0' }}>
                  <div className="subtitulo">Nenhum item cadastrado — valor informado diretamente.</div>
                </div>
              ) : (
                <div className="tabela-scroll">
                  <table className="dados">
                    <thead>
                      <tr>
                        <th>Insumo</th>
                        <th className="num">Quantidade</th>
                        <th className="num">Valor unitário</th>
                        <th className="num">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {despesa?.itens.map((item) => (
                        <tr key={item.id}>
                          <td>{item.insumoDescricao}</td>
                          <td className="num">
                            {item.quantidade} {item.unidadeSigla}
                          </td>
                          <td className="num mono">{formatarMoeda(item.valorUnitario)}</td>
                          <td className="num mono">{formatarMoeda(item.valorTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="campo" style={{ maxWidth: 280, marginTop: 14 }}>
                <label>{(despesa?.itens.length ?? 0) > 0 ? 'Valor total (soma dos itens)' : 'Valor total'}</label>
                <div className="campo-estatico mono">{formatarMoeda(despesa?.valorTotal)}</div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="painel">
        <div className="painel-cabecalho">
          <div className="painel-titulo">Pagadores</div>
          <div className="painel-subtitulo">A soma dos valores pagos deve ser exatamente igual ao valor total.</div>
        </div>
        <div className="painel-corpo">
          {emEdicaoOuCriacao ? (
            <>
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
                    <label>Valor</label>
                    <CampoValorMonetario
                      valor={pagador.valor}
                      onValorAlterado={(v) => atualizarPagador(pagador.chave, 'valor', v)}
                    />
                  </div>
                  <button
                    type="button"
                    className="botao-icone"
                    onClick={() => removerPagador(pagador.chave)}
                    title="Remover pagador"
                  >
                    <IconeLixeira width={15} height={15} />
                  </button>
                </div>
              ))}
              <button type="button" className="botao-adicionar-linha" onClick={adicionarPagador}>
                <IconeMais width={13} height={13} /> Adicionar pagador
              </button>

              <div className={`barra-soma ${somaBate ? 'ok' : 'errado'}`}>
                <span>
                  Soma dos pagadores: {formatarMoeda(somaPagadores)} de {formatarMoeda(valorTotalCalculado)}
                </span>
                {somaBate ? (
                  <IconeCheck width={15} height={15} />
                ) : (
                  <span>Diferença: {formatarMoeda(Math.abs(diferenca))}</span>
                )}
              </div>
            </>
          ) : (despesa?.pagadores.length ?? 0) === 0 ? (
            <div className="estado-vazio" style={{ padding: '20px 0' }}>
              <div className="subtitulo">Nenhum pagador cadastrado.</div>
            </div>
          ) : (
            <div>
              {despesa?.pagadores.map((pagador) => (
                <div
                  key={pagador.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span>{pagador.investidorNome}</span>
                  <span className="mono">{formatarMoeda(pagador.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="painel">
        <div className="painel-cabecalho">
          <div className="painel-titulo">Documentos</div>
        </div>
        <div className="painel-corpo">
          {emEdicaoOuCriacao && (
            <div className="campo" style={{ marginBottom: 14 }}>
              <label>Anexar documentos</label>
              <input type="file" multiple disabled={ehCriacao} onChange={aoSelecionarArquivos} />
              {ehCriacao && <div className="dica">Salve a despesa antes de anexar documentos.</div>}
            </div>
          )}

          {documentos.length === 0 ? (
            <div className="estado-vazio" style={{ padding: '20px 0' }}>
              <div className="subtitulo">Nenhum documento anexado.</div>
            </div>
          ) : (
            <div>
              {documentos.map((documento) => (
                <span className="chip-arquivo" key={documento.id}>
                  <IconeArquivo width={13} height={13} />
                  {documento.filename}
                  <button
                    type="button"
                    style={estiloBotaoChip}
                    onClick={() => aoBaixarDocumento(documento.id, documento.filename)}
                    title="Baixar documento"
                  >
                    <IconeDownload width={12} height={12} />
                  </button>
                  {emEdicaoOuCriacao && (
                    <button
                      type="button"
                      style={estiloBotaoChip}
                      onClick={() => aoRemoverDocumento(documento.id)}
                      title="Remover documento"
                    >
                      <IconeLixeira width={12} height={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

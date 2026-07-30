import { useState, type FormEvent } from 'react';
import { useAutenticacao } from '@/autenticacao/ContextoAutenticacao';
import { useToast } from '@/componentes/Toast';
import { IconeMais, IconeCaixa } from '@/componentes/Icones';
import { formatarMoeda } from '@/utilitarios/formatacao';
import { useCriarInsumo, useListaInsumos, type InsumoResposta } from '@/api/insumos';
import { useCriarUnidadeMedida, useListaUnidadesMedida } from '@/api/unidadesMedida';
import { useCriarClassificacao, useListaClassificacoes } from '@/api/classificacoes';
import { CampoValorMonetario } from '@/componentes/CamposMascarados';

export function Insumos() {
  const { temPapel } = useAutenticacao();
  const { notificar } = useToast();

  const { data: dadosInsumos, isLoading: carregandoInsumos, isError: erroInsumos } = useListaInsumos();
  const { data: dadosUnidades, isLoading: carregandoUnidades } = useListaUnidadesMedida();
  const { data: dadosClassificacoes, isLoading: carregandoClassificacoes } = useListaClassificacoes();

  const criarInsumo = useCriarInsumo();
  const criarUnidadeMedida = useCriarUnidadeMedida();
  const criarClassificacao = useCriarClassificacao();

  const insumos = dadosInsumos?.content ?? [];
  const unidades = dadosUnidades?.content ?? [];
  const classificacoes = dadosClassificacoes?.content ?? [];

  const [modalAberto, setModalAberto] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [unidadeMedidaId, setUnidadeMedidaId] = useState('');
  const [classificacaoId, setClassificacaoId] = useState('');
  const [precoReferencia, setPrecoReferencia] = useState('');

  const [novaSigla, setNovaSigla] = useState('');
  const [novaDescricaoUnidade, setNovaDescricaoUnidade] = useState('');

  const [novaDescricaoClassificacao, setNovaDescricaoClassificacao] = useState('');

  function abrirModal() {
    setCodigo('');
    setDescricao('');
    setUnidadeMedidaId('');
    setClassificacaoId('');
    setPrecoReferencia('');
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  function aoSubmeterInsumo(evento: FormEvent) {
    evento.preventDefault();
    criarInsumo.mutate(
      {
        codigo,
        descricao,
        unidadeMedidaId: Number(unidadeMedidaId),
        classificacaoId: Number(classificacaoId),
        precoReferencia: Number(precoReferencia),
      },
      {
        onSuccess: () => {
          notificar('Insumo criado com sucesso.');
          fecharModal();
        },
        onError: () => {
          notificar('Não foi possível criar o insumo.', 'erro');
        },
      },
    );
  }

  function aoSubmeterUnidade(evento: FormEvent) {
    evento.preventDefault();
    if (!novaSigla.trim() || !novaDescricaoUnidade.trim()) return;
    criarUnidadeMedida.mutate(
      { sigla: novaSigla, descricao: novaDescricaoUnidade },
      {
        onSuccess: () => {
          notificar('Unidade de medida criada com sucesso.');
          setNovaSigla('');
          setNovaDescricaoUnidade('');
        },
        onError: () => {
          notificar('Não foi possível criar a unidade de medida.', 'erro');
        },
      },
    );
  }

  function aoSubmeterClassificacao(evento: FormEvent) {
    evento.preventDefault();
    if (!novaDescricaoClassificacao.trim()) return;
    criarClassificacao.mutate(
      { descricao: novaDescricaoClassificacao, status: 'ATIVO' },
      {
        onSuccess: () => {
          notificar('Classificação criada com sucesso.');
          setNovaDescricaoClassificacao('');
        },
        onError: () => {
          notificar('Não foi possível criar a classificação.', 'erro');
        },
      },
    );
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <div>
          <div className="titulo-pagina">Insumos</div>
          <div className="subtitulo-pagina">
            {carregandoInsumos ? 'Carregando…' : `${insumos.length} insumo(s) cadastrado(s)`}
          </div>
        </div>
        {temPapel('ADMIN') && (
          <button type="button" className="botao botao-primario" onClick={abrirModal}>
            <IconeMais width={14} height={14} />
            Novo insumo
          </button>
        )}
      </div>

      <div className="painel">
        <div className="painel-corpo" style={{ padding: 0 }}>
          {carregandoInsumos ? (
            <div className="estado-vazio">
              <div className="titulo">Carregando…</div>
            </div>
          ) : erroInsumos ? (
            <div className="estado-vazio">
              <div className="titulo">Erro ao carregar insumos</div>
              <div className="subtitulo">Tente novamente em instantes.</div>
            </div>
          ) : insumos.length === 0 ? (
            <div className="estado-vazio">
              <IconeCaixa width={28} height={28} />
              <div className="titulo">Nenhum insumo cadastrado</div>
              <div className="subtitulo">Cadastre insumos para utilizá-los nas despesas.</div>
            </div>
          ) : (
            <div className="tabela-scroll">
              <table className="dados">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descrição</th>
                    <th>Classificação</th>
                    <th>Unidade</th>
                    <th className="num">Preço de referência</th>
                  </tr>
                </thead>
                <tbody>
                  {insumos.map((insumo: InsumoResposta) => (
                    <tr key={insumo.id}>
                      <td>{insumo.codigo}</td>
                      <td>{insumo.descricao}</td>
                      <td>{insumo.classificacaoDescricao}</td>
                      <td>{insumo.unidadeMedidaSigla}</td>
                      <td className="num">{formatarMoeda(insumo.precoReferencia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="painel">
        <div className="painel-cabecalho">
          <div>
            <div className="painel-titulo">Unidades de medida</div>
            <div className="painel-subtitulo">
              {carregandoUnidades ? 'Carregando…' : `${unidades.length} unidade(s) cadastrada(s)`}
            </div>
          </div>
        </div>
        <div className="painel-corpo">
          {temPapel('ADMIN') && (
            <form
              onSubmit={aoSubmeterUnidade}
              style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}
            >
              <div className="campo" style={{ maxWidth: 120 }}>
                <label>Sigla</label>
                <input type="text" value={novaSigla} onChange={(e) => setNovaSigla(e.target.value)} />
              </div>
              <div className="campo" style={{ flex: 1, minWidth: 180 }}>
                <label>Descrição</label>
                <input
                  type="text"
                  value={novaDescricaoUnidade}
                  onChange={(e) => setNovaDescricaoUnidade(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="botao botao-primario"
                disabled={criarUnidadeMedida.isPending}
              >
                <IconeMais width={14} height={14} />
                Adicionar
              </button>
            </form>
          )}

          {unidades.length === 0 ? (
            <div className="estado-vazio">
              <div className="titulo">Nenhuma unidade cadastrada</div>
            </div>
          ) : (
            <div className="tabela-scroll">
              <table className="dados">
                <thead>
                  <tr>
                    <th>Sigla</th>
                    <th>Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {unidades.map((unidade) => (
                    <tr key={unidade.id}>
                      <td>{unidade.sigla}</td>
                      <td>{unidade.descricao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="painel">
        <div className="painel-cabecalho">
          <div>
            <div className="painel-titulo">Classificações</div>
            <div className="painel-subtitulo">
              {carregandoClassificacoes ? 'Carregando…' : `${classificacoes.length} classificação(ões) cadastrada(s)`}
            </div>
          </div>
        </div>
        <div className="painel-corpo">
          {temPapel('ADMIN') && (
            <form
              onSubmit={aoSubmeterClassificacao}
              style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}
            >
              <div className="campo" style={{ flex: 1, minWidth: 180 }}>
                <label>Descrição</label>
                <input
                  type="text"
                  value={novaDescricaoClassificacao}
                  onChange={(e) => setNovaDescricaoClassificacao(e.target.value)}
                />
              </div>
              <button type="submit" className="botao botao-primario" disabled={criarClassificacao.isPending}>
                <IconeMais width={14} height={14} />
                Adicionar
              </button>
            </form>
          )}

          {classificacoes.length === 0 ? (
            <div className="estado-vazio">
              <div className="titulo">Nenhuma classificação cadastrada</div>
            </div>
          ) : (
            <div className="tabela-scroll">
              <table className="dados">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {classificacoes.map((classificacao) => (
                    <tr key={classificacao.id}>
                      <td>{classificacao.descricao}</td>
                      <td>
                        <span
                          className={`pilula-status ${classificacao.status === 'ATIVO' ? 'status-ativo' : 'status-inativo'}`}
                        >
                          <span className="ponto" />
                          {classificacao.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalAberto && (
        <div className="sobreposicao-modal" onClick={fecharModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <div className="modal-titulo">Novo insumo</div>
              <button type="button" className="fechar-modal" onClick={fecharModal}>
                ×
              </button>
            </div>
            <form onSubmit={aoSubmeterInsumo}>
              <div className="modal-corpo">
                <div className="grade-formulario">
                  <div className="campo">
                    <label>Código</label>
                    <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
                  </div>
                  <div className="campo">
                    <label>Descrição</label>
                    <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
                  </div>
                  <div className="campo">
                    <label>Classificação</label>
                    <select
                      value={classificacaoId}
                      onChange={(e) => setClassificacaoId(e.target.value)}
                      required
                    >
                      <option value="">Selecione…</option>
                      {classificacoes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.descricao}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="campo">
                    <label>Unidade de medida</label>
                    <select
                      value={unidadeMedidaId}
                      onChange={(e) => setUnidadeMedidaId(e.target.value)}
                      required
                    >
                      <option value="">Selecione…</option>
                      {unidades.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.sigla} — {u.descricao}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="campo col-2">
                    <label>Preço de referência</label>
                    <CampoValorMonetario valor={precoReferencia} onValorAlterado={setPrecoReferencia} required />
                  </div>
                </div>
              </div>
              <div className="modal-rodape">
                <button type="button" className="botao" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="botao botao-primario" disabled={criarInsumo.isPending}>
                  {criarInsumo.isPending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

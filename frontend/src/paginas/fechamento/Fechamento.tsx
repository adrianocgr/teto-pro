import { useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { cliente } from '@/api/cliente';
import { useAutenticacao } from '@/autenticacao/ContextoAutenticacao';
import { useToast } from '@/componentes/Toast';
import { formatarMoeda, formatarData } from '@/utilitarios/formatacao';
import { useFechamento, useRegistrarVenda, useAtualizarVenda, type VendaRequisicao } from '@/api/vendas';
import { CampoValorMonetario } from '@/componentes/CamposMascarados';

/** Campos mínimos usados aqui — não criamos api/despesas.ts para não conflitar
 * com o trabalho em paralelo de outro agente nesse mesmo arquivo. */
interface DespesaResumo {
  valorTotal: number | string;
}

/** Idem para empreendimentos: só o recorte de campos que esta tela precisa. */
interface ParticipacaoResumo {
  investidorId: number;
  investidorNome: string;
  percentual: number | string;
}

interface EmpreendimentoResumo {
  participacoes: ParticipacaoResumo[];
}

interface ValoresFormularioVenda {
  valorVenda: string;
  comprador: string;
  dataVenda: string;
  comissaoCorretor: string;
  custosVendaAdicionais: string;
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

function valoresVazios(): ValoresFormularioVenda {
  return {
    valorVenda: '',
    comprador: '',
    dataVenda: hoje(),
    comissaoCorretor: '',
    custosVendaAdicionais: '',
  };
}

function paraNumero(valor: string): number {
  if (valor.trim() === '') return 0;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

export function Fechamento() {
  const { id } = useParams<{ id: string }>();
  const empreendimentoId = Number(id);
  const { temPapel } = useAutenticacao();
  const { notificar } = useToast();
  const admin = temPapel('ADMIN');

  const { data: fechamento, isLoading, error } = useFechamento(empreendimentoId);
  const registrarVenda = useRegistrarVenda(empreendimentoId);
  const atualizarVenda = useAtualizarVenda(empreendimentoId);

  const semVendaRegistrada = axios.isAxiosError(error) && error.response?.status === 404;
  const erroReal = !!error && !semVendaRegistrada;

  const [formulario, setFormulario] = useState<ValoresFormularioVenda>(valoresVazios);
  const [editando, setEditando] = useState(false);

  const { data: despesas } = useQuery({
    queryKey: ['despesas-soma-fechamento', empreendimentoId],
    queryFn: () =>
      cliente
        .get<{ content: DespesaResumo[] }>('/despesas', { params: { empreendimentoId, size: 500 } })
        .then((resposta) => resposta.data),
    enabled: !!empreendimentoId && semVendaRegistrada,
  });

  const { data: empreendimento } = useQuery({
    queryKey: ['empreendimento-participacoes-fechamento', empreendimentoId],
    queryFn: () => cliente.get<EmpreendimentoResumo>(`/empreendimentos/${empreendimentoId}`).then((r) => r.data),
    enabled: !!empreendimentoId && semVendaRegistrada,
  });

  const totalGastoObra = useMemo(
    () => (despesas?.content ?? []).reduce((soma, despesa) => soma + Number(despesa.valorTotal ?? 0), 0),
    [despesas],
  );

  const participacoes = empreendimento?.participacoes ?? [];

  const lucroEstimado =
    paraNumero(formulario.valorVenda) -
    totalGastoObra -
    paraNumero(formulario.comissaoCorretor) -
    paraNumero(formulario.custosVendaAdicionais);

  const podeSalvar = formulario.valorVenda.trim() !== '' && formulario.comprador.trim() !== '';

  function atualizarCampo(nome: keyof ValoresFormularioVenda, valor: string) {
    setFormulario((atual) => ({ ...atual, [nome]: valor }));
  }

  function montarRequisicao(): VendaRequisicao {
    return {
      dataVenda: formulario.dataVenda || hoje(),
      valorVenda: paraNumero(formulario.valorVenda),
      comprador: formulario.comprador.trim(),
      comissaoCorretor: paraNumero(formulario.comissaoCorretor),
      custosVendaAdicionais: paraNumero(formulario.custosVendaAdicionais),
    };
  }

  function aoRegistrar(evento: FormEvent) {
    evento.preventDefault();
    if (!podeSalvar) return;
    registrarVenda.mutate(montarRequisicao(), {
      onSuccess: () => notificar('Venda registrada com sucesso'),
      onError: () => notificar('Não foi possível registrar a venda', 'erro'),
    });
  }

  function abrirEdicao() {
    if (!fechamento) return;
    setFormulario({
      valorVenda: String(fechamento.valorVenda ?? ''),
      comprador: fechamento.comprador ?? '',
      dataVenda: fechamento.dataVenda ?? hoje(),
      comissaoCorretor: String(fechamento.comissaoCorretor ?? ''),
      custosVendaAdicionais: String(fechamento.custosVendaAdicionais ?? ''),
    });
    setEditando(true);
  }

  function aoAtualizar(evento: FormEvent) {
    evento.preventDefault();
    if (!podeSalvar) return;
    atualizarVenda.mutate(montarRequisicao(), {
      onSuccess: () => {
        notificar('Venda atualizada com sucesso');
        setEditando(false);
      },
      onError: () => notificar('Não foi possível atualizar a venda', 'erro'),
    });
  }

  if (isLoading) {
    return <p>Carregando…</p>;
  }

  if (erroReal) {
    return <p>Não foi possível carregar o fechamento deste empreendimento.</p>;
  }

  if (semVendaRegistrada) {
    return (
      <div>
        <div className="painel">
          <div className="painel-cabecalho">
            <div>
              <div className="rotulo">Registrar venda</div>
              <div className="painel-titulo">Este empreendimento ainda não teve a venda registrada</div>
            </div>
          </div>
          <div className="painel-corpo">
            <form onSubmit={aoRegistrar}>
              <div className="grade-formulario">
                <div className="campo">
                  <label htmlFor="campo-valor-venda">Valor de venda *</label>
                  <CampoValorMonetario
                    id="campo-valor-venda"
                    valor={formulario.valorVenda}
                    onValorAlterado={(v) => atualizarCampo('valorVenda', v)}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="campo-comprador">Comprador *</label>
                  <input
                    id="campo-comprador"
                    type="text"
                    value={formulario.comprador}
                    onChange={(evento) => atualizarCampo('comprador', evento.target.value)}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="campo-data-venda">Data da venda</label>
                  <input
                    id="campo-data-venda"
                    type="date"
                    value={formulario.dataVenda}
                    onChange={(evento) => atualizarCampo('dataVenda', evento.target.value)}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="campo-comissao">Comissão do corretor</label>
                  <CampoValorMonetario
                    id="campo-comissao"
                    valor={formulario.comissaoCorretor}
                    onValorAlterado={(v) => atualizarCampo('comissaoCorretor', v)}
                  />
                </div>
                <div className="campo col-2">
                  <label htmlFor="campo-custos-adicionais">Custos adicionais (ITBI, cartório etc.)</label>
                  <CampoValorMonetario
                    id="campo-custos-adicionais"
                    valor={formulario.custosVendaAdicionais}
                    onValorAlterado={(v) => atualizarCampo('custosVendaAdicionais', v)}
                  />
                </div>
              </div>

              <div className="linha-kpi" style={{ gridTemplateColumns: '1fr', marginTop: 16 }}>
                <div className="kpi">
                  <div className="kpi-rotulo">Lucro estimado</div>
                  <div className={`kpi-valor ${lucroEstimado >= 0 ? 'positivo' : 'negativo'}`}>
                    {formatarMoeda(lucroEstimado)}
                  </div>
                  <div className="kpi-delta">Custos da obra já apurados: {formatarMoeda(totalGastoObra)}</div>
                </div>
              </div>

              {participacoes.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div className="rotulo">Prévia do rateio por percentual de participação</div>
                  <div className="tabela-scroll">
                    <table className="dados">
                      <thead>
                        <tr>
                          <th>Investidor</th>
                          <th className="num">% Participação</th>
                          <th className="num">Lucro estimado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participacoes.map((participacao) => (
                          <tr key={participacao.investidorId}>
                            <td>{participacao.investidorNome}</td>
                            <td className="num">{Number(participacao.percentual).toFixed(1)}%</td>
                            <td className="num">
                              {formatarMoeda((lucroEstimado * Number(participacao.percentual)) / 100)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {admin && (
                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="botao botao-dourado"
                    disabled={!podeSalvar || registrarVenda.isPending}
                  >
                    {registrarVenda.isPending ? 'Registrando…' : 'Registrar venda'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!fechamento) {
    return null;
  }

  const comissaoMaisCustos = Number(fechamento.comissaoCorretor) + Number(fechamento.custosVendaAdicionais);

  return (
    <div>
      <div className="linha-kpi">
        <div className="kpi">
          <div className="kpi-rotulo">Valor de venda</div>
          <div className="kpi-valor">{formatarMoeda(fechamento.valorVenda)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-rotulo">Custos totais da obra</div>
          <div className="kpi-valor">{formatarMoeda(fechamento.totalGasto)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-rotulo">Comissão + custos de venda</div>
          <div className="kpi-valor">{formatarMoeda(comissaoMaisCustos)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-rotulo">Lucro líquido</div>
          <div className={`kpi-valor ${Number(fechamento.lucro) >= 0 ? 'positivo' : 'negativo'}`}>
            {formatarMoeda(fechamento.lucro)}
          </div>
        </div>
      </div>

      <div className="painel">
        <div className="painel-cabecalho">
          <div className="painel-titulo">Detalhes da venda</div>
          {admin && !editando && (
            <button type="button" className="botao botao-fantasma" onClick={abrirEdicao}>
              Editar venda
            </button>
          )}
        </div>
        <div className="painel-corpo">
          {!editando && (
            <div className="grade-formulario">
              <div className="campo">
                <div className="rotulo">Comprador</div>
                <div className="campo-estatico">{fechamento.comprador ?? '—'}</div>
              </div>
              <div className="campo">
                <div className="rotulo">Data da venda</div>
                <div className="campo-estatico">{formatarData(fechamento.dataVenda)}</div>
              </div>
              <div className="campo">
                <div className="rotulo">Comissão do corretor</div>
                <div className="campo-estatico">{formatarMoeda(fechamento.comissaoCorretor)}</div>
              </div>
              <div className="campo">
                <div className="rotulo">Custos adicionais</div>
                <div className="campo-estatico">{formatarMoeda(fechamento.custosVendaAdicionais)}</div>
              </div>
            </div>
          )}

          {editando && (
            <form onSubmit={aoAtualizar}>
              <div className="grade-formulario">
                <div className="campo">
                  <label htmlFor="campo-edicao-valor-venda">Valor de venda *</label>
                  <CampoValorMonetario
                    id="campo-edicao-valor-venda"
                    valor={formulario.valorVenda}
                    onValorAlterado={(v) => atualizarCampo('valorVenda', v)}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="campo-edicao-comprador">Comprador *</label>
                  <input
                    id="campo-edicao-comprador"
                    type="text"
                    value={formulario.comprador}
                    onChange={(evento) => atualizarCampo('comprador', evento.target.value)}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="campo-edicao-data-venda">Data da venda</label>
                  <input
                    id="campo-edicao-data-venda"
                    type="date"
                    value={formulario.dataVenda}
                    onChange={(evento) => atualizarCampo('dataVenda', evento.target.value)}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="campo-edicao-comissao">Comissão do corretor</label>
                  <CampoValorMonetario
                    id="campo-edicao-comissao"
                    valor={formulario.comissaoCorretor}
                    onValorAlterado={(v) => atualizarCampo('comissaoCorretor', v)}
                  />
                </div>
                <div className="campo col-2">
                  <label htmlFor="campo-edicao-custos-adicionais">Custos adicionais (ITBI, cartório etc.)</label>
                  <CampoValorMonetario
                    id="campo-edicao-custos-adicionais"
                    valor={formulario.custosVendaAdicionais}
                    onValorAlterado={(v) => atualizarCampo('custosVendaAdicionais', v)}
                  />
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="botao botao-fantasma" onClick={() => setEditando(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="botao botao-primario"
                  disabled={!podeSalvar || atualizarVenda.isPending}
                >
                  {atualizarVenda.isPending ? 'Salvando…' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="painel">
        <div className="painel-cabecalho">
          <div className="painel-titulo">Rateio do lucro por percentual de participação</div>
        </div>
        <div className="painel-corpo">
          {fechamento.rateio.length === 0 ? (
            <div className="estado-vazio">
              <div className="titulo">Nenhum investidor participante</div>
              <div className="subtitulo">Cadastre participações no empreendimento para ratear o lucro.</div>
            </div>
          ) : (
            <div className="tabela-scroll">
              <table className="dados">
                <thead>
                  <tr>
                    <th>Investidor</th>
                    <th className="num">% Participação</th>
                    <th className="num">Total investido</th>
                    <th className="num">Lucro rateado</th>
                  </tr>
                </thead>
                <tbody>
                  {fechamento.rateio.map((linha) => (
                    <tr key={linha.investidorId}>
                      <td>{linha.investidorNome}</td>
                      <td className="num">{Number(linha.percentual).toFixed(1)}%</td>
                      <td className="num">{formatarMoeda(linha.totalInvestido)}</td>
                      <td className="num">{formatarMoeda(linha.lucroRateado)}</td>
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

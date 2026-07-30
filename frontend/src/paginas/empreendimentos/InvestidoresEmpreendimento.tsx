import { useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useAutenticacao } from '@/autenticacao/ContextoAutenticacao';
import { useToast } from '@/componentes/Toast';
import { IconeMais, IconeLixeira } from '@/componentes/Icones';
import { formatarData } from '@/utilitarios/formatacao';
import {
  useAdicionarParticipacao,
  useEmpreendimento,
  useParticipacoes,
  useRemoverParticipacao,
} from '@/api/empreendimentos';
import { useListaInvestidores } from '@/api/investidores';

export function InvestidoresEmpreendimento() {
  const { id } = useParams<{ id: string }>();
  const empreendimentoId = Number(id);
  const { temPapel } = useAutenticacao();
  const { notificar } = useToast();

  const { data: participacoes, isLoading, isError } = useParticipacoes(empreendimentoId);
  const { data: empreendimento } = useEmpreendimento(empreendimentoId);
  const { data: investidoresPagina } = useListaInvestidores();

  const adicionarParticipacao = useAdicionarParticipacao(empreendimentoId);
  const removerParticipacao = useRemoverParticipacao(empreendimentoId);

  const [modalAberto, setModalAberto] = useState(false);
  const [investidorId, setInvestidorId] = useState('');
  const [percentual, setPercentual] = useState('');

  const podeGerenciar = temPapel('ADMIN');
  const investidores = investidoresPagina?.content ?? [];
  const mapaInvestidores = useMemo(() => new Map(investidores.map((inv) => [inv.id, inv])), [investidores]);

  const somaAtual = Number(empreendimento?.somaPercentuais ?? 0);
  const percentualNovo = Number(percentual.replace(',', '.')) || 0;
  const somaProjetada = somaAtual + percentualNovo;

  function abrirModal() {
    setInvestidorId('');
    setPercentual('');
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (!investidorId) {
      notificar('Selecione um investidor', 'erro');
      return;
    }
    const percentualDigitado = percentual.trim();
    let valorPercentual: number | null = null;
    if (percentualDigitado !== '') {
      valorPercentual = Number(percentualDigitado.replace(',', '.'));
      if (!valorPercentual || valorPercentual <= 0 || valorPercentual > 100) {
        notificar('Informe um percentual válido entre 0 e 100, ou deixe em branco', 'erro');
        return;
      }
    }
    adicionarParticipacao.mutate(
      { investidorId: Number(investidorId), percentual: valorPercentual },
      {
        onSuccess: () => {
          notificar('Investidor adicionado ao empreendimento');
          fecharModal();
        },
        onError: () => {
          notificar('Não foi possível adicionar o investidor', 'erro');
        },
      },
    );
  }

  function remover(participacaoId: number, nome: string) {
    if (!window.confirm(`Remover a participação de ${nome} neste empreendimento?`)) return;
    removerParticipacao.mutate(participacaoId, {
      onSuccess: () => notificar('Participação removida'),
      onError: () => notificar('Não foi possível remover a participação', 'erro'),
    });
  }

  return (
    <div>
      <div className="painel">
        <div className="painel-cabecalho">
          <div>
            <div className="painel-titulo">Investidores participantes</div>
            <div className="painel-subtitulo">Soma atual de participação: {somaAtual.toFixed(1)}%</div>
          </div>
          {podeGerenciar && (
            <button className="botao botao-dourado botao-pequeno" onClick={abrirModal}>
              <IconeMais /> Adicionar investidor
            </button>
          )}
        </div>
        <div className="painel-corpo" style={{ padding: 0 }}>
          {isLoading && (
            <p style={{ padding: 18 }}>Carregando…</p>
          )}
          {isError && (
            <p style={{ padding: 18 }}>Não foi possível carregar as participações.</p>
          )}
          {!isLoading && !isError && (!participacoes || participacoes.length === 0) && (
            <div className="estado-vazio">
              <div className="titulo">Nenhum investidor vinculado</div>
              <div className="subtitulo">Adicione investidores para acompanhar a participação neste empreendimento.</div>
            </div>
          )}
          {!isLoading && !isError && participacoes && participacoes.length > 0 && (
            <div className="tabela-scroll">
              <table className="dados">
                <thead>
                  <tr>
                    <th>Investidor</th>
                    <th className="num">Participação</th>
                    <th>Data de entrada</th>
                    {podeGerenciar && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {participacoes.map((participacao) => {
                    const investidor = mapaInvestidores.get(participacao.investidorId);
                    const tipoPessoa = investidor?.tipoPessoa;
                    return (
                      <tr key={participacao.id}>
                        <td>
                          <div>{participacao.investidorNome}</div>
                          {tipoPessoa && (
                            <span className={`pilula-status ${tipoPessoa === 'FISICA' ? 'status-fisica' : 'status-juridica'}`}>
                              <span className="ponto" /> {tipoPessoa === 'FISICA' ? 'Pessoa física' : 'Pessoa jurídica'}
                            </span>
                          )}
                        </td>
                        <td className="num">
                          {participacao.percentual === null ? '—' : `${Number(participacao.percentual).toFixed(2)}%`}
                        </td>
                        <td>{formatarData(participacao.dataEntrada)}</td>
                        {podeGerenciar && (
                          <td className="num">
                            <button
                              className="botao-icone"
                              title="Remover"
                              onClick={() => remover(participacao.id, participacao.investidorNome)}
                            >
                              <IconeLixeira />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalAberto && (
        <div className="sobreposicao-modal" onClick={fecharModal}>
          <div className="modal" onClick={(evento) => evento.stopPropagation()}>
            <form onSubmit={salvar}>
              <div className="modal-cabecalho">
                <div className="modal-titulo">Adicionar investidor</div>
                <button type="button" className="fechar-modal" onClick={fecharModal}>
                  ×
                </button>
              </div>
              <div className="modal-corpo">
                <div className="campo">
                  <label htmlFor="campo-investidor">Investidor *</label>
                  <select
                    id="campo-investidor"
                    value={investidorId}
                    onChange={(evento) => setInvestidorId(evento.target.value)}
                    required
                  >
                    <option value="">Selecione…</option>
                    {investidores.map((investidor) => (
                      <option key={investidor.id} value={investidor.id}>
                        {investidor.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label htmlFor="campo-percentual">Percentual de participação (%)</label>
                  <input
                    id="campo-percentual"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="Pode preencher depois"
                    value={percentual}
                    onChange={(evento) => setPercentual(evento.target.value)}
                  />
                </div>
                {percentualNovo > 0 && (
                  <div className={`barra-soma ${somaProjetada > 100 ? 'errado' : 'ok'}`}>
                    <span>Soma projetada de participação</span>
                    <b>{somaProjetada.toFixed(1)}%</b>
                  </div>
                )}
                {percentualNovo > 0 && somaProjetada > 100 && (
                  <div className="campo">
                    <span className="dica">
                      Atenção: a soma das participações ultrapassará 100%. O cadastro é permitido, mas revise os
                      percentuais.
                    </span>
                  </div>
                )}
              </div>
              <div className="modal-rodape">
                <button type="button" className="botao botao-fantasma" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="botao botao-primario" disabled={adicionarParticipacao.isPending}>
                  {adicionarParticipacao.isPending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

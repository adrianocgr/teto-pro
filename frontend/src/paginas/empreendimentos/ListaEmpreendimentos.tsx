import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAutenticacao } from '@/autenticacao/ContextoAutenticacao';
import { useToast } from '@/componentes/Toast';
import { IconeMais, IconeInvestidores } from '@/componentes/Icones';
import { iniciaisNome } from '@/utilitarios/formatacao';
import { useCriarEmpreendimento, useListaEmpreendimentos, type EmpreendimentoRequisicao } from '@/api/empreendimentos';

const CAMPOS_VAZIOS: EmpreendimentoRequisicao = {
  descricao: '',
  endereco: '',
  numero: '',
  complemento: '',
  quadra: '',
  lote: '',
  matricula: '',
  inscricaoMunicipal: '',
};

export function ListaEmpreendimentos() {
  const { temPapel } = useAutenticacao();
  const { notificar } = useToast();
  const [busca, setBusca] = useState('');
  const [buscaEfetiva, setBuscaEfetiva] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [campos, setCampos] = useState<EmpreendimentoRequisicao>(CAMPOS_VAZIOS);

  useEffect(() => {
    const temporizador = setTimeout(() => setBuscaEfetiva(busca), 300);
    return () => clearTimeout(temporizador);
  }, [busca]);

  const { data: pagina, isLoading, isError } = useListaEmpreendimentos(buscaEfetiva);
  const criarEmpreendimento = useCriarEmpreendimento();

  const podeCriar = temPapel('ADMIN');

  function abrirModal() {
    setCampos(CAMPOS_VAZIOS);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  function atualizarCampo(nome: keyof EmpreendimentoRequisicao, valor: string) {
    setCampos((atual) => ({ ...atual, [nome]: valor }));
  }

  function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (!campos.descricao.trim()) {
      notificar('A descrição é obrigatória', 'erro');
      return;
    }
    criarEmpreendimento.mutate(campos, {
      onSuccess: () => {
        notificar('Empreendimento cadastrado com sucesso');
        fecharModal();
      },
      onError: () => {
        notificar('Não foi possível cadastrar o empreendimento', 'erro');
      },
    });
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Empreendimentos</h1>
          <p className="subtitulo-pagina">Obras e loteamentos sob controle de custos</p>
        </div>
        {podeCriar && (
          <button className="botao botao-dourado" onClick={abrirModal}>
            <IconeMais /> Novo empreendimento
          </button>
        )}
      </div>

      <div className="filtros" style={{ marginBottom: 18 }}>
        <input
          type="text"
          placeholder="Buscar por descrição, endereço ou matrícula…"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          style={{ minWidth: 280 }}
        />
      </div>

      {isLoading && <p>Carregando…</p>}
      {isError && <p>Não foi possível carregar os empreendimentos.</p>}

      {!isLoading && !isError && pagina && pagina.content.length === 0 && (
        <div className="estado-vazio">
          <div className="titulo">Nenhum empreendimento encontrado</div>
          <div className="subtitulo">Ajuste a busca ou cadastre um novo empreendimento.</div>
        </div>
      )}

      {!isLoading && !isError && pagina && pagina.content.length > 0 && (
        <div className="grade-cartoes">
          {pagina.content.map((emp) => {
            const enderecoCompleto = [emp.endereco, emp.numero].filter(Boolean).join(', ');
            const metaPartes = [
              emp.matricula ? `Matrícula ${emp.matricula}` : null,
              emp.quadra ? `Quadra ${emp.quadra}` : null,
              emp.lote ? `Lote ${emp.lote}` : null,
            ].filter(Boolean);
            const investidores = emp.participacoes ?? [];

            return (
              <Link key={emp.id} to={`/empreendimentos/${emp.id}`} className="cartao cartao-empreendimento">
                <div>
                  <div className="nome-empreendimento">{emp.descricao}</div>
                  {enderecoCompleto && <div className="endereco-empreendimento">{enderecoCompleto}</div>}
                  {metaPartes.length > 0 && <div className="linha-meta">{metaPartes.join(' · ')}</div>}
                </div>

                <div className="linha-metricas">
                  <div>
                    <div className="rotulo-metrica">Investidores</div>
                    <div className="valor-metrica">{investidores.length}</div>
                  </div>
                  <div>
                    <div className="rotulo-metrica">Participação</div>
                    <div className="valor-metrica">{Number(emp.somaPercentuais ?? 0).toFixed(1)}%</div>
                  </div>
                </div>

                <div className="rodape-cartao">
                  <span>
                    <IconeInvestidores width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {investidores.length} vinculado{investidores.length === 1 ? '' : 's'}
                  </span>
                  {investidores.length > 0 && (
                    <div className="pilha-avatares">
                      {investidores.slice(0, 4).map((participacao) => (
                        <div key={participacao.id} className="avatar" title={participacao.investidorNome}>
                          {iniciaisNome(participacao.investidorNome)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {modalAberto && (
        <div className="sobreposicao-modal" onClick={fecharModal}>
          <div className="modal" onClick={(evento) => evento.stopPropagation()}>
            <form onSubmit={salvar}>
              <div className="modal-cabecalho">
                <div className="modal-titulo">Novo empreendimento</div>
                <button type="button" className="fechar-modal" onClick={fecharModal}>
                  ×
                </button>
              </div>
              <div className="modal-corpo">
                <div className="campo">
                  <label htmlFor="campo-descricao">Descrição *</label>
                  <input
                    id="campo-descricao"
                    type="text"
                    value={campos.descricao}
                    onChange={(evento) => atualizarCampo('descricao', evento.target.value)}
                    required
                  />
                </div>
                <div className="grade-formulario">
                  <div className="campo col-2">
                    <label htmlFor="campo-endereco">Endereço</label>
                    <input
                      id="campo-endereco"
                      type="text"
                      value={campos.endereco ?? ''}
                      onChange={(evento) => atualizarCampo('endereco', evento.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="campo-numero">Número</label>
                    <input
                      id="campo-numero"
                      type="text"
                      value={campos.numero ?? ''}
                      onChange={(evento) => atualizarCampo('numero', evento.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="campo-complemento">Complemento</label>
                    <input
                      id="campo-complemento"
                      type="text"
                      value={campos.complemento ?? ''}
                      onChange={(evento) => atualizarCampo('complemento', evento.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="campo-quadra">Quadra</label>
                    <input
                      id="campo-quadra"
                      type="text"
                      value={campos.quadra ?? ''}
                      onChange={(evento) => atualizarCampo('quadra', evento.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="campo-lote">Lote</label>
                    <input
                      id="campo-lote"
                      type="text"
                      value={campos.lote ?? ''}
                      onChange={(evento) => atualizarCampo('lote', evento.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="campo-matricula">Matrícula</label>
                    <input
                      id="campo-matricula"
                      type="text"
                      value={campos.matricula ?? ''}
                      onChange={(evento) => atualizarCampo('matricula', evento.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="campo-inscricao">Inscrição municipal</label>
                    <input
                      id="campo-inscricao"
                      type="text"
                      value={campos.inscricaoMunicipal ?? ''}
                      onChange={(evento) => atualizarCampo('inscricaoMunicipal', evento.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-rodape">
                <button type="button" className="botao botao-fantasma" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="botao botao-primario" disabled={criarEmpreendimento.isPending}>
                  {criarEmpreendimento.isPending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

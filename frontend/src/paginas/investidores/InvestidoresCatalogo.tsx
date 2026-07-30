import { useMemo, useState, type FormEvent } from 'react';
import { useAutenticacao } from '@/autenticacao/ContextoAutenticacao';
import { useToast } from '@/componentes/Toast';
import { IconeMais, IconeInvestidores } from '@/componentes/Icones';
import { useCriarInvestidor, useListaInvestidores, type InvestidorResposta, type TipoPessoa } from '@/api/investidores';
import { CampoCpfCnpj, CampoTelefone } from '@/componentes/CamposMascarados';

export function InvestidoresCatalogo() {
  const { temPapel } = useAutenticacao();
  const { notificar } = useToast();

  const { data, isLoading, isError } = useListaInvestidores();
  const criarInvestidor = useCriarInvestidor();

  const [busca, setBusca] = useState('');
  const investidores = data?.content ?? [];

  const investidoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return investidores;
    return investidores.filter(
      (i) => i.nome.toLowerCase().includes(termo) || i.cpfCnpj.toLowerCase().includes(termo),
    );
  }, [investidores, busca]);

  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>('FISICA');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');

  function abrirModal() {
    setNome('');
    setCpfCnpj('');
    setTipoPessoa('FISICA');
    setEmail('');
    setTelefone('');
    setObservacoes('');
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    criarInvestidor.mutate(
      {
        nome,
        cpfCnpj,
        tipoPessoa,
        email: email || null,
        telefone: telefone || null,
        observacoes: observacoes || null,
      },
      {
        onSuccess: () => {
          notificar('Investidor criado com sucesso.');
          fecharModal();
        },
        onError: () => {
          notificar('Não foi possível criar o investidor.', 'erro');
        },
      },
    );
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <div>
          <div className="titulo-pagina">Investidores</div>
          <div className="subtitulo-pagina">
            {isLoading ? 'Carregando…' : `${investidores.length} investidor(es) cadastrado(s)`}
          </div>
        </div>
        {temPapel('ADMIN') && (
          <button type="button" className="botao botao-primario" onClick={abrirModal}>
            <IconeMais width={14} height={14} />
            Novo investidor
          </button>
        )}
      </div>

      <div className="filtros" style={{ marginBottom: 14 }}>
        <input
          type="text"
          placeholder="Buscar por nome ou CPF/CNPJ…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ minWidth: 280 }}
        />
      </div>

      <div className="painel">
        <div className="painel-corpo" style={{ padding: 0 }}>
          {isLoading ? (
            <div className="estado-vazio">
              <div className="titulo">Carregando…</div>
            </div>
          ) : isError ? (
            <div className="estado-vazio">
              <div className="titulo">Erro ao carregar investidores</div>
              <div className="subtitulo">Tente novamente em instantes.</div>
            </div>
          ) : investidoresFiltrados.length === 0 ? (
            <div className="estado-vazio">
              <IconeInvestidores width={28} height={28} />
              <div className="titulo">Nenhum investidor encontrado</div>
              <div className="subtitulo">Ajuste a busca ou cadastre um novo investidor.</div>
            </div>
          ) : (
            <div className="tabela-scroll">
              <table className="dados">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>CPF/CNPJ</th>
                    <th>E-mail</th>
                    <th>Telefone</th>
                  </tr>
                </thead>
                <tbody>
                  {investidoresFiltrados.map((investidor: InvestidorResposta) => (
                    <tr key={investidor.id}>
                      <td>{investidor.nome}</td>
                      <td>
                        <span
                          className={`pilula-status ${
                            investidor.tipoPessoa === 'FISICA' ? 'status-fisica' : 'status-juridica'
                          }`}
                        >
                          <span className="ponto" />
                          {investidor.tipoPessoa === 'FISICA' ? 'Pessoa física' : 'Pessoa jurídica'}
                        </span>
                      </td>
                      <td>{investidor.cpfCnpj}</td>
                      <td>{investidor.email ?? '—'}</td>
                      <td>{investidor.telefone ?? '—'}</td>
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
              <div className="modal-titulo">Novo investidor</div>
              <button type="button" className="fechar-modal" onClick={fecharModal}>
                ×
              </button>
            </div>
            <form onSubmit={aoSubmeter}>
              <div className="modal-corpo">
                <div className="grade-formulario">
                  <div className="campo col-2">
                    <label>Nome</label>
                    <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
                  </div>
                  <div className="campo">
                    <label>CPF/CNPJ</label>
                    <CampoCpfCnpj valor={cpfCnpj} onValorAlterado={setCpfCnpj} required />
                  </div>
                  <div className="campo">
                    <label>Tipo de pessoa</label>
                    <select
                      value={tipoPessoa}
                      onChange={(e) => setTipoPessoa(e.target.value as TipoPessoa)}
                      required
                    >
                      <option value="FISICA">Pessoa física</option>
                      <option value="JURIDICA">Pessoa jurídica</option>
                    </select>
                  </div>
                  <div className="campo">
                    <label>E-mail</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="campo">
                    <label>Telefone</label>
                    <CampoTelefone valor={telefone} onValorAlterado={setTelefone} />
                  </div>
                  <div className="campo col-2">
                    <label>Observações</label>
                    <textarea
                      rows={3}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-rodape">
                <button type="button" className="botao" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="botao botao-primario" disabled={criarInvestidor.isPending}>
                  {criarInvestidor.isPending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

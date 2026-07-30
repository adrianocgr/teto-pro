import { useMemo, useState, type FormEvent } from 'react';
import { useAutenticacao } from '@/autenticacao/ContextoAutenticacao';
import { useToast } from '@/componentes/Toast';
import { IconeMais, IconeCaminhao } from '@/componentes/Icones';
import {
  useCriarFornecedor,
  useListaFornecedores,
  useAdicionarRepresentante,
  useRemoverRepresentante,
  type FornecedorResposta,
} from '@/api/fornecedores';
import { useListaEstados, useListaCidades } from '@/api/localidades';
import { CampoCpfCnpj, CampoTelefone } from '@/componentes/CamposMascarados';

export function Fornecedores() {
  const { temPapel } = useAutenticacao();
  const { notificar } = useToast();

  const { data, isLoading, isError } = useListaFornecedores();
  const { data: estados } = useListaEstados();
  const { data: cidades } = useListaCidades();
  const criarFornecedor = useCriarFornecedor();
  const adicionarRepresentante = useAdicionarRepresentante();
  const removerRepresentante = useRemoverRepresentante();

  const [busca, setBusca] = useState('');
  const fornecedores = data?.content ?? [];

  const fornecedoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return fornecedores;
    return fornecedores.filter(
      (f) =>
        f.razaoSocial.toLowerCase().includes(termo) ||
        f.cnpjCpf.toLowerCase().includes(termo) ||
        (f.cidadeNome ?? '').toLowerCase().includes(termo),
    );
  }, [fornecedores, busca]);

  const [modalAberto, setModalAberto] = useState(false);
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [estadoId, setEstadoId] = useState('');
  const [cidadeId, setCidadeId] = useState('');

  const estadosOrdenados = useMemo(
    () => (estados ?? []).slice().sort((a, b) => a.nome.localeCompare(b.nome)),
    [estados],
  );
  const cidadesDoEstado = useMemo(
    () =>
      (cidades ?? [])
        .filter((cidade) => String(cidade.estadoId) === estadoId)
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [cidades, estadoId],
  );

  function aoTrocarEstado(novoEstadoId: string) {
    setEstadoId(novoEstadoId);
    setCidadeId('');
  }

  const [fornecedorRepresentantesId, setFornecedorRepresentantesId] = useState<number | null>(null);
  const [nomeRepresentante, setNomeRepresentante] = useState('');
  const [emailRepresentante, setEmailRepresentante] = useState('');
  const [telefoneRepresentante, setTelefoneRepresentante] = useState('');
  const fornecedorRepresentantes = fornecedores.find((f) => f.id === fornecedorRepresentantesId) ?? null;

  function abrirRepresentantes(fornecedor: FornecedorResposta) {
    setFornecedorRepresentantesId(fornecedor.id);
    setNomeRepresentante('');
    setEmailRepresentante('');
    setTelefoneRepresentante('');
  }

  function fecharRepresentantes() {
    setFornecedorRepresentantesId(null);
  }

  function aoAdicionarRepresentante(evento: FormEvent) {
    evento.preventDefault();
    if (!fornecedorRepresentantesId || !nomeRepresentante.trim()) return;
    adicionarRepresentante.mutate(
      {
        fornecedorId: fornecedorRepresentantesId,
        dados: { nome: nomeRepresentante.trim(), email: emailRepresentante || null, telefone: telefoneRepresentante || null },
      },
      {
        onSuccess: () => {
          notificar('Representante adicionado com sucesso.');
          setNomeRepresentante('');
          setEmailRepresentante('');
          setTelefoneRepresentante('');
        },
        onError: () => notificar('Não foi possível adicionar o representante.', 'erro'),
      },
    );
  }

  function aoRemoverRepresentante(representanteId: number, nome: string) {
    if (!fornecedorRepresentantesId) return;
    if (!window.confirm(`Remover o representante "${nome}"?`)) return;
    removerRepresentante.mutate(
      { fornecedorId: fornecedorRepresentantesId, representanteId },
      {
        onSuccess: () => notificar('Representante removido'),
        onError: () => notificar('Não foi possível remover o representante.', 'erro'),
      },
    );
  }

  function abrirModal() {
    setRazaoSocial('');
    setCnpjCpf('');
    setEmail('');
    setTelefone('');
    setEstadoId('');
    setCidadeId('');
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    criarFornecedor.mutate(
      {
        razaoSocial,
        cnpjCpf,
        email: email || null,
        telefone: telefone || null,
        logradouro: null,
        numero: null,
        complemento: null,
        bairro: null,
        cep: null,
        cidadeId: cidadeId ? Number(cidadeId) : null,
        status: 'ATIVO',
        representantes: [],
      },
      {
        onSuccess: () => {
          notificar('Fornecedor criado com sucesso.');
          fecharModal();
        },
        onError: () => {
          notificar('Não foi possível criar o fornecedor.', 'erro');
        },
      },
    );
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <div>
          <div className="titulo-pagina">Fornecedores</div>
          <div className="subtitulo-pagina">
            {isLoading ? 'Carregando…' : `${fornecedores.length} fornecedor(es) cadastrado(s)`}
          </div>
        </div>
        {temPapel('ADMIN') && (
          <button type="button" className="botao botao-primario" onClick={abrirModal}>
            <IconeMais width={14} height={14} />
            Novo fornecedor
          </button>
        )}
      </div>

      <div className="filtros" style={{ marginBottom: 14 }}>
        <input
          type="text"
          placeholder="Buscar por razão social, CNPJ/CPF ou cidade…"
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
              <div className="titulo">Erro ao carregar fornecedores</div>
              <div className="subtitulo">Tente novamente em instantes.</div>
            </div>
          ) : fornecedoresFiltrados.length === 0 ? (
            <div className="estado-vazio">
              <IconeCaminhao width={28} height={28} />
              <div className="titulo">Nenhum fornecedor encontrado</div>
              <div className="subtitulo">Ajuste a busca ou cadastre um novo fornecedor.</div>
            </div>
          ) : (
            <div className="tabela-scroll">
              <table className="dados">
                <thead>
                  <tr>
                    <th>Razão social</th>
                    <th>CNPJ/CPF</th>
                    <th>Cidade</th>
                    <th>Status</th>
                    <th className="num">Representantes</th>
                  </tr>
                </thead>
                <tbody>
                  {fornecedoresFiltrados.map((fornecedor: FornecedorResposta) => (
                    <tr key={fornecedor.id}>
                      <td>{fornecedor.razaoSocial}</td>
                      <td>{fornecedor.cnpjCpf}</td>
                      <td>
                        {fornecedor.cidadeNome
                          ? `${fornecedor.cidadeNome} — ${fornecedor.estadoSigla}`
                          : '—'}
                      </td>
                      <td>
                        <span
                          className={`pilula-status ${
                            fornecedor.status === 'ATIVO' ? 'status-ativo' : 'status-inativo'
                          }`}
                        >
                          <span className="ponto" />
                          {fornecedor.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="num">
                        <button
                          type="button"
                          className="botao botao-fantasma botao-pequeno"
                          onClick={() => abrirRepresentantes(fornecedor)}
                        >
                          {fornecedor.representantes.length} representante(s)
                        </button>
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
              <div className="modal-titulo">Novo fornecedor</div>
              <button type="button" className="fechar-modal" onClick={fecharModal}>
                ×
              </button>
            </div>
            <form onSubmit={aoSubmeter}>
              <div className="modal-corpo">
                <div className="grade-formulario">
                  <div className="campo col-2">
                    <label>Razão social</label>
                    <input
                      type="text"
                      value={razaoSocial}
                      onChange={(e) => setRazaoSocial(e.target.value)}
                      required
                    />
                  </div>
                  <div className="campo">
                    <label>CNPJ/CPF</label>
                    <CampoCpfCnpj valor={cnpjCpf} onValorAlterado={setCnpjCpf} required />
                  </div>
                  <div className="campo">
                    <label>Estado</label>
                    <select value={estadoId} onChange={(e) => aoTrocarEstado(e.target.value)}>
                      <option value="">Selecione…</option>
                      {estadosOrdenados.map((estado) => (
                        <option key={estado.id} value={estado.id}>
                          {estado.sigla} — {estado.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="campo">
                    <label>Cidade</label>
                    <select value={cidadeId} onChange={(e) => setCidadeId(e.target.value)} disabled={!estadoId}>
                      <option value="">{estadoId ? 'Selecione…' : 'Selecione o estado primeiro'}</option>
                      {cidadesDoEstado.map((cidade) => (
                        <option key={cidade.id} value={cidade.id}>
                          {cidade.nome}
                        </option>
                      ))}
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
                </div>
              </div>
              <div className="modal-rodape">
                <button type="button" className="botao" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="botao botao-primario" disabled={criarFornecedor.isPending}>
                  {criarFornecedor.isPending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {fornecedorRepresentantes && (
        <div className="sobreposicao-modal" onClick={fecharRepresentantes}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <div className="modal-titulo">Representantes de "{fornecedorRepresentantes.razaoSocial}"</div>
              <button type="button" className="fechar-modal" onClick={fecharRepresentantes}>
                ×
              </button>
            </div>
            <div className="modal-corpo">
              {temPapel('ADMIN') && (
                <form
                  onSubmit={aoAdicionarRepresentante}
                  style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}
                >
                  <div className="campo" style={{ flex: 1, minWidth: 160 }}>
                    <label>Nome</label>
                    <input type="text" value={nomeRepresentante} onChange={(e) => setNomeRepresentante(e.target.value)} />
                  </div>
                  <div className="campo" style={{ flex: 1, minWidth: 160 }}>
                    <label>E-mail</label>
                    <input type="email" value={emailRepresentante} onChange={(e) => setEmailRepresentante(e.target.value)} />
                  </div>
                  <div className="campo" style={{ minWidth: 140 }}>
                    <label>Telefone</label>
                    <CampoTelefone valor={telefoneRepresentante} onValorAlterado={setTelefoneRepresentante} />
                  </div>
                  <button type="submit" className="botao botao-primario" disabled={adicionarRepresentante.isPending}>
                    <IconeMais width={14} height={14} />
                    Adicionar
                  </button>
                </form>
              )}

              {fornecedorRepresentantes.representantes.length === 0 ? (
                <div className="estado-vazio">
                  <div className="titulo">Nenhum representante cadastrado</div>
                </div>
              ) : (
                <div className="tabela-scroll">
                  <table className="dados">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>E-mail</th>
                        <th>Telefone</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fornecedorRepresentantes.representantes.map((representante) => (
                        <tr key={representante.id}>
                          <td>{representante.nome}</td>
                          <td>{representante.email ?? '—'}</td>
                          <td>{representante.telefone ?? '—'}</td>
                          <td style={{ textAlign: 'right' }}>
                            {temPapel('ADMIN') && (
                              <button
                                type="button"
                                className="botao botao-fantasma botao-pequeno"
                                onClick={() => aoRemoverRepresentante(representante.id, representante.nome)}
                              >
                                Remover
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-rodape">
              <button type="button" className="botao" onClick={fecharRepresentantes}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

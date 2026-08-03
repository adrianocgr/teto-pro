import { useState, type FormEvent } from 'react';
import { useToast } from '@/componentes/Toast';
import { IconeMais } from '@/componentes/Icones';
import { formatarData } from '@/utilitarios/formatacao';
import {
  useListaEmpresas,
  useListaUsuariosAdmin,
  useCriarUsuarioAdmin,
  useAtualizarUsuarioAdmin,
  useExcluirUsuarioAdmin,
  useAdicionarVinculo,
  useAtualizarVinculo,
  useRemoverVinculo,
  useListaInvestidoresDaEmpresa,
  type UsuarioAdminResposta,
} from '@/api/administracao';
import type { Papel } from '@/tipos/usuario';

const PAPEIS: { valor: Papel; rotulo: string }[] = [
  { valor: 'ADMIN', rotulo: 'Administrador da empresa' },
  { valor: 'GESTOR', rotulo: 'Gestor' },
  { valor: 'INVESTIDOR_VISUALIZADOR', rotulo: 'Investidor (somente leitura)' },
];

function rotuloPapel(papel: Papel) {
  return PAPEIS.find((p) => p.valor === papel)?.rotulo ?? papel;
}

interface FormularioUsuario {
  tenantId: string;
  nome: string;
  sobrenome: string;
  username: string;
  email: string;
  papel: Papel;
  /** Só é usado (e obrigatório) quando `papel` é INVESTIDOR_VISUALIZADOR. */
  investidorId: string;
}

function formularioVazio(tenantIdPadrao: string): FormularioUsuario {
  return {
    tenantId: tenantIdPadrao,
    nome: '',
    sobrenome: '',
    username: '',
    email: '',
    papel: 'GESTOR',
    investidorId: '',
  };
}

export function Usuarios() {
  const { data: empresas } = useListaEmpresas();
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const { data: usuarios, isLoading, isError } = useListaUsuariosAdmin(filtroEmpresa || undefined);

  const criar = useCriarUsuarioAdmin();
  const atualizar = useAtualizarUsuarioAdmin();
  const excluir = useExcluirUsuarioAdmin();
  const adicionarVinculo = useAdicionarVinculo();
  const atualizarVinculo = useAtualizarVinculo();
  const removerVinculo = useRemoverVinculo();
  const { notificar } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<UsuarioAdminResposta | null>(null);
  const [formulario, setFormulario] = useState<FormularioUsuario>(formularioVazio(''));

  const [modalVinculo, setModalVinculo] = useState<UsuarioAdminResposta | null>(null);
  const [vinculoEmEdicao, setVinculoEmEdicao] = useState<string | null>(null); // tenantId, quando é edição de papel
  const [empresaEscolhida, setEmpresaEscolhida] = useState('');
  const [papelEscolhido, setPapelEscolhido] = useState<Papel>('GESTOR');
  const [investidorEscolhido, setInvestidorEscolhido] = useState('');
  const { data: investidoresDaEmpresaEscolhida } = useListaInvestidoresDaEmpresa(empresaEscolhida || undefined);

  function abrirNovoUsuario() {
    setUsuarioEmEdicao(null);
    setFormulario(formularioVazio(empresas?.[0]?.id ?? ''));
    setModalAberto(true);
  }

  function abrirEdicao(usuario: UsuarioAdminResposta) {
    setUsuarioEmEdicao(usuario);
    const vinculoUnico = usuario.empresas.length === 1 ? usuario.empresas[0] : null;
    setFormulario({
      tenantId: '',
      nome: usuario.nome,
      sobrenome: usuario.sobrenome ?? '',
      username: usuario.username,
      email: usuario.email,
      papel: vinculoUnico?.papel ?? 'GESTOR',
      investidorId: vinculoUnico?.investidorId ? String(vinculoUnico.investidorId) : '',
    });
    setModalAberto(true);
  }

  // Papel é um dado do VÍNCULO com a empresa, não da pessoa — só dá pra
  // editá-lo direto no modal de "Editar usuário" quando há um único vínculo
  // (sem ambiguidade sobre qual empresa). Com múltiplos vínculos (ou nenhum),
  // a edição continua pelo chip de empresa na listagem (abrirVinculoEdicao).
  const vinculoUnicoEmEdicao =
    usuarioEmEdicao && usuarioEmEdicao.empresas.length === 1 ? usuarioEmEdicao.empresas[0] : null;

  // Empresa "dona" do papel sendo editado no modal de usuário — a empresa
  // recém-selecionada (criação) ou a do vínculo único (edição). Usada para
  // buscar os investidores disponíveis quando o papel é INVESTIDOR_VISUALIZADOR.
  const tenantIdDoPapelEmEdicao = usuarioEmEdicao ? (vinculoUnicoEmEdicao?.tenantId ?? '') : formulario.tenantId;
  const { data: investidoresDaEmpresa } = useListaInvestidoresDaEmpresa(tenantIdDoPapelEmEdicao || undefined);

  function atualizarCampo(campo: keyof FormularioUsuario, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function aoSalvar(evento: FormEvent) {
    evento.preventDefault();
    if (
      !formulario.nome.trim() ||
      !formulario.sobrenome.trim() ||
      !formulario.username.trim() ||
      !formulario.email.trim()
    )
      return;

    // O papel só é editável aqui na criação, ou na edição quando há um único
    // vínculo (ver vinculoUnicoEmEdicao) — nesses casos, INVESTIDOR_VISUALIZADOR
    // exige um investidor selecionado (é o que faltava e quebrava o acesso do
    // investidor: vínculo sem investidor associado).
    const papelEditavelAgora = !usuarioEmEdicao || !!vinculoUnicoEmEdicao;
    if (papelEditavelAgora && formulario.papel === 'INVESTIDOR_VISUALIZADOR' && !formulario.investidorId) {
      notificar('Selecione o investidor correspondente a este usuário', 'erro');
      return;
    }

    if (usuarioEmEdicao) {
      const usuarioId = usuarioEmEdicao.id;
      atualizar.mutate(
        {
          id: usuarioId,
          dados: {
            nome: formulario.nome.trim(),
            sobrenome: formulario.sobrenome.trim(),
            username: formulario.username.trim(),
            email: formulario.email.trim(),
          },
        },
        {
          onSuccess: () => {
            const papelMudou = vinculoUnicoEmEdicao && vinculoUnicoEmEdicao.papel !== formulario.papel;
            const investidorMudou =
              vinculoUnicoEmEdicao &&
              formulario.papel === 'INVESTIDOR_VISUALIZADOR' &&
              String(vinculoUnicoEmEdicao.investidorId ?? '') !== formulario.investidorId;

            if (vinculoUnicoEmEdicao && (papelMudou || investidorMudou)) {
              atualizarVinculo.mutate(
                {
                  id: usuarioId,
                  tenantId: vinculoUnicoEmEdicao.tenantId,
                  papel: formulario.papel,
                  investidorId: formulario.investidorId ? Number(formulario.investidorId) : null,
                },
                {
                  onSuccess: () => {
                    notificar('Usuário atualizado com sucesso');
                    setModalAberto(false);
                  },
                  onError: () => notificar('Dados salvos, mas não foi possível atualizar o papel', 'erro'),
                },
              );
            } else {
              notificar('Usuário atualizado com sucesso');
              setModalAberto(false);
            }
          },
          onError: () => notificar('Não foi possível atualizar o usuário', 'erro'),
        },
      );
    } else {
      if (!formulario.tenantId) {
        notificar('Selecione a empresa do usuário', 'erro');
        return;
      }
      criar.mutate(
        {
          ...formulario,
          nome: formulario.nome.trim(),
          sobrenome: formulario.sobrenome.trim(),
          username: formulario.username.trim(),
          email: formulario.email.trim(),
          investidorId: formulario.investidorId ? Number(formulario.investidorId) : null,
        },
        {
          onSuccess: () => {
            notificar('Usuário cadastrado com sucesso — senha temporária padrão enviada no Keycloak');
            setModalAberto(false);
          },
          onError: () => notificar('Não foi possível cadastrar o usuário', 'erro'),
        },
      );
    }
  }

  function aoExcluir(usuario: UsuarioAdminResposta) {
    if (!window.confirm(`Excluir o usuário "${usuario.nome}" e todos os seus vínculos?`)) return;
    excluir.mutate(usuario.id, {
      onSuccess: () => notificar('Usuário excluído'),
      onError: () => notificar('Não foi possível excluir o usuário', 'erro'),
    });
  }

  function abrirVinculoNovo(usuario: UsuarioAdminResposta) {
    setModalVinculo(usuario);
    setVinculoEmEdicao(null);
    const jaVinculadas = new Set(usuario.empresas.map((e) => e.tenantId));
    setEmpresaEscolhida((empresas ?? []).find((e) => !jaVinculadas.has(e.id))?.id ?? '');
    setPapelEscolhido('GESTOR');
    setInvestidorEscolhido('');
  }

  function abrirVinculoEdicao(usuario: UsuarioAdminResposta, tenantId: string, papelAtual: Papel, investidorIdAtual: number | null) {
    setModalVinculo(usuario);
    setVinculoEmEdicao(tenantId);
    setEmpresaEscolhida(tenantId);
    setPapelEscolhido(papelAtual);
    setInvestidorEscolhido(investidorIdAtual ? String(investidorIdAtual) : '');
  }

  function aoSalvarVinculo(evento: FormEvent) {
    evento.preventDefault();
    if (!modalVinculo) return;

    if (papelEscolhido === 'INVESTIDOR_VISUALIZADOR' && !investidorEscolhido) {
      notificar('Selecione o investidor correspondente a este usuário', 'erro');
      return;
    }
    const investidorId = investidorEscolhido ? Number(investidorEscolhido) : null;

    if (vinculoEmEdicao) {
      atualizarVinculo.mutate(
        { id: modalVinculo.id, tenantId: vinculoEmEdicao, papel: papelEscolhido, investidorId },
        {
          onSuccess: () => {
            notificar('Papel atualizado com sucesso');
            setModalVinculo(null);
          },
          onError: () => notificar('Não foi possível atualizar o papel', 'erro'),
        },
      );
    } else {
      if (!empresaEscolhida) {
        notificar('Selecione a empresa', 'erro');
        return;
      }
      adicionarVinculo.mutate(
        { id: modalVinculo.id, dados: { tenantId: empresaEscolhida, papel: papelEscolhido, investidorId } },
        {
          onSuccess: () => {
            notificar('Usuário vinculado à empresa com sucesso');
            setModalVinculo(null);
          },
          onError: () => notificar('Não foi possível vincular o usuário a esta empresa', 'erro'),
        },
      );
    }
  }

  function aoRemoverVinculo(usuario: UsuarioAdminResposta, tenantId: string, tenantNome: string) {
    if (!window.confirm(`Remover o vínculo de "${usuario.nome}" com "${tenantNome}"?`)) return;
    removerVinculo.mutate(
      { id: usuario.id, tenantId },
      {
        onSuccess: () => notificar('Vínculo removido'),
        onError: () => notificar('Não foi possível remover o vínculo', 'erro'),
      },
    );
  }

  const empresasDisponiveisParaVinculo = (empresas ?? []).filter(
    (empresa) => vinculoEmEdicao !== null || !modalVinculo?.empresas.some((e) => e.tenantId === empresa.id),
  );

  return (
    <div>
      <div className="cabecalho-pagina">
        <div>
          <div className="titulo-pagina">Usuários</div>
          <div className="subtitulo-pagina">{isLoading ? 'Carregando…' : `${usuarios?.length ?? 0} pessoa(s)`}</div>
        </div>
        <button className="botao botao-primario" onClick={abrirNovoUsuario}>
          <IconeMais width={14} height={14} /> Novo usuário
        </button>
      </div>

      <div className="filtros" style={{ marginBottom: 16 }}>
        <select value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)}>
          <option value="">Todas as empresas</option>
          {(empresas ?? []).map((empresa) => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.nome}
            </option>
          ))}
        </select>
      </div>

      {isError && <p>Não foi possível carregar os usuários.</p>}

      {!isLoading && !isError && (
        <div className="painel">
          <div className="tabela-scroll">
            <table className="dados">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Usuário / e-mail</th>
                  <th>Empresas</th>
                  <th>Status</th>
                  <th>Desde</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(usuarios ?? []).map((usuario) => (
                  <tr key={usuario.id}>
                    <td style={{ fontWeight: 600, verticalAlign: 'top' }}>
                      {usuario.nome} {usuario.sobrenome ?? ''}
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      <div>{usuario.username}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{usuario.email}</div>
                    </td>
                    <td style={{ verticalAlign: 'top', maxWidth: 320 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {usuario.empresas.map((vinculo) => (
                          <span
                            key={vinculo.tenantId}
                            className="pilula-status status-ativo pilula-vinculo"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            title="Clique para editar o papel"
                            onClick={() => abrirVinculoEdicao(usuario, vinculo.tenantId, vinculo.papel, vinculo.investidorId)}
                          >
                            {vinculo.tenantNome} · {rotuloPapel(vinculo.papel)}
                            <button
                              type="button"
                              aria-label="Remover vínculo"
                              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0 }}
                              onClick={(evento) => {
                                evento.stopPropagation();
                                aoRemoverVinculo(usuario, vinculo.tenantId, vinculo.tenantNome);
                              }}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                        {usuario.empresas.length === 0 && (
                          <span style={{ color: 'var(--ink-muted)', fontSize: 12.5 }}>Sem empresa vinculada</span>
                        )}
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      <span className={`pilula-status ${usuario.status === 'ATIVO' ? 'status-ativo' : 'status-inativo'}`}>
                        <span className="ponto" />
                        {usuario.status}
                      </span>
                    </td>
                    <td style={{ verticalAlign: 'top' }}>{formatarData(usuario.createdAt.slice(0, 10))}</td>
                    <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap', verticalAlign: 'top' }}>
                      <button className="botao botao-fantasma botao-pequeno" onClick={() => abrirEdicao(usuario)}>
                        Editar
                      </button>
                      <button className="botao botao-fantasma botao-pequeno" onClick={() => abrirVinculoNovo(usuario)}>
                        + Vincular empresa
                      </button>
                      <button className="botao botao-fantasma botao-pequeno" onClick={() => aoExcluir(usuario)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
                {(usuarios ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="estado-vazio">
                        <div className="titulo">Nenhum usuário encontrado</div>
                        <div className="subtitulo">Ajuste o filtro ou cadastre um novo usuário.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalAberto && (
        <div className="sobreposicao-modal" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <div className="modal-titulo">{usuarioEmEdicao ? 'Editar usuário' : 'Novo usuário'}</div>
              <button className="fechar-modal" onClick={() => setModalAberto(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={aoSalvar}>
              <div className="modal-corpo">
                <div className="grade-formulario">
                  {!usuarioEmEdicao && (
                    <div className="campo col-2">
                      <label htmlFor="campo-empresa">Empresa</label>
                      <select
                        id="campo-empresa"
                        value={formulario.tenantId}
                        onChange={(e) =>
                          setFormulario((atual) => ({ ...atual, tenantId: e.target.value, investidorId: '' }))
                        }
                      >
                        <option value="">Selecione…</option>
                        {(empresas ?? []).map((empresa) => (
                          <option key={empresa.id} value={empresa.id}>
                            {empresa.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="campo">
                    <label htmlFor="campo-nome-usuario">Nome</label>
                    <input
                      id="campo-nome-usuario"
                      type="text"
                      value={formulario.nome}
                      onChange={(e) => atualizarCampo('nome', e.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="campo-sobrenome-usuario">Sobrenome</label>
                    <input
                      id="campo-sobrenome-usuario"
                      type="text"
                      value={formulario.sobrenome}
                      onChange={(e) => atualizarCampo('sobrenome', e.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="campo-username">Usuário de acesso</label>
                    <input
                      id="campo-username"
                      type="text"
                      value={formulario.username}
                      onChange={(e) => atualizarCampo('username', e.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="campo-email-usuario">E-mail</label>
                    <input
                      id="campo-email-usuario"
                      type="email"
                      value={formulario.email}
                      onChange={(e) => atualizarCampo('email', e.target.value)}
                    />
                  </div>
                  {!usuarioEmEdicao || vinculoUnicoEmEdicao ? (
                    <>
                      <div className={formulario.papel === 'INVESTIDOR_VISUALIZADOR' ? 'campo' : 'campo col-2'}>
                        <label htmlFor="campo-papel">
                          {vinculoUnicoEmEdicao ? `Papel em ${vinculoUnicoEmEdicao.tenantNome}` : 'Papel'}
                        </label>
                        <select
                          id="campo-papel"
                          value={formulario.papel}
                          onChange={(e) =>
                            setFormulario((atual) => ({ ...atual, papel: e.target.value as Papel, investidorId: '' }))
                          }
                        >
                          {PAPEIS.map((p) => (
                            <option key={p.valor} value={p.valor}>
                              {p.rotulo}
                            </option>
                          ))}
                        </select>
                      </div>
                      {formulario.papel === 'INVESTIDOR_VISUALIZADOR' && (
                        <div className="campo">
                          <label htmlFor="campo-investidor">Investidor</label>
                          <select
                            id="campo-investidor"
                            value={formulario.investidorId}
                            disabled={!tenantIdDoPapelEmEdicao}
                            onChange={(e) => atualizarCampo('investidorId', e.target.value)}
                          >
                            <option value="">Selecione…</option>
                            {(investidoresDaEmpresa ?? []).map((investidor) => (
                              <option key={investidor.id} value={investidor.id}>
                                {investidor.nome}
                              </option>
                            ))}
                          </select>
                          {!tenantIdDoPapelEmEdicao && <div className="dica">Selecione a empresa primeiro.</div>}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="campo col-2">
                      <label>Papel</label>
                      <div className="dica">
                        {usuarioEmEdicao.empresas.length === 0
                          ? 'Este usuário ainda não está vinculado a nenhuma empresa — use "+ Vincular empresa" para definir o papel.'
                          : 'Este usuário está vinculado a mais de uma empresa — clique na empresa desejada, na lista, para editar o papel dela.'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-rodape">
                <button type="button" className="botao botao-fantasma" onClick={() => setModalAberto(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="botao botao-primario"
                  disabled={criar.isPending || atualizar.isPending || atualizarVinculo.isPending}
                >
                  {criar.isPending || atualizar.isPending || atualizarVinculo.isPending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalVinculo && (
        <div className="sobreposicao-modal" onClick={() => setModalVinculo(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecalho">
              <div className="modal-titulo">
                {vinculoEmEdicao ? `Papel de "${modalVinculo.nome}"` : `Vincular "${modalVinculo.nome}" a uma empresa`}
              </div>
              <button className="fechar-modal" onClick={() => setModalVinculo(null)}>
                ✕
              </button>
            </div>
            <form onSubmit={aoSalvarVinculo}>
              <div className="modal-corpo">
                <div className="campo">
                  <label htmlFor="campo-empresa-vinculo">Empresa</label>
                  <select
                    id="campo-empresa-vinculo"
                    value={empresaEscolhida}
                    disabled={!!vinculoEmEdicao}
                    onChange={(e) => {
                      setEmpresaEscolhida(e.target.value);
                      setInvestidorEscolhido('');
                    }}
                  >
                    <option value="">Selecione…</option>
                    {empresasDisponiveisParaVinculo.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="campo" style={{ marginTop: 12 }}>
                  <label htmlFor="campo-papel-vinculo">Papel</label>
                  <select
                    id="campo-papel-vinculo"
                    value={papelEscolhido}
                    onChange={(e) => {
                      setPapelEscolhido(e.target.value as Papel);
                      setInvestidorEscolhido('');
                    }}
                  >
                    {PAPEIS.map((p) => (
                      <option key={p.valor} value={p.valor}>
                        {p.rotulo}
                      </option>
                    ))}
                  </select>
                </div>
                {papelEscolhido === 'INVESTIDOR_VISUALIZADOR' && (
                  <div className="campo" style={{ marginTop: 12 }}>
                    <label htmlFor="campo-investidor-vinculo">Investidor</label>
                    <select
                      id="campo-investidor-vinculo"
                      value={investidorEscolhido}
                      disabled={!empresaEscolhida}
                      onChange={(e) => setInvestidorEscolhido(e.target.value)}
                    >
                      <option value="">Selecione…</option>
                      {(investidoresDaEmpresaEscolhida ?? []).map((investidor) => (
                        <option key={investidor.id} value={investidor.id}>
                          {investidor.nome}
                        </option>
                      ))}
                    </select>
                    {!empresaEscolhida && <div className="dica">Selecione a empresa primeiro.</div>}
                  </div>
                )}
              </div>
              <div className="modal-rodape">
                <button type="button" className="botao botao-fantasma" onClick={() => setModalVinculo(null)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="botao botao-primario"
                  disabled={adicionarVinculo.isPending || atualizarVinculo.isPending}
                >
                  {adicionarVinculo.isPending || atualizarVinculo.isPending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

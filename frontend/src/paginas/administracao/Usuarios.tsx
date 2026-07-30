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
  username: string;
  email: string;
  papel: Papel;
}

function formularioVazio(tenantIdPadrao: string): FormularioUsuario {
  return { tenantId: tenantIdPadrao, nome: '', username: '', email: '', papel: 'GESTOR' };
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

  function abrirNovoUsuario() {
    setUsuarioEmEdicao(null);
    setFormulario(formularioVazio(empresas?.[0]?.id ?? ''));
    setModalAberto(true);
  }

  function abrirEdicao(usuario: UsuarioAdminResposta) {
    setUsuarioEmEdicao(usuario);
    setFormulario({ tenantId: '', nome: usuario.nome, username: usuario.username, email: usuario.email, papel: 'GESTOR' });
    setModalAberto(true);
  }

  function atualizarCampo(campo: keyof FormularioUsuario, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function aoSalvar(evento: FormEvent) {
    evento.preventDefault();
    if (!formulario.nome.trim() || !formulario.username.trim() || !formulario.email.trim()) return;

    if (usuarioEmEdicao) {
      atualizar.mutate(
        {
          id: usuarioEmEdicao.id,
          dados: { nome: formulario.nome.trim(), username: formulario.username.trim(), email: formulario.email.trim() },
        },
        {
          onSuccess: () => {
            notificar('Usuário atualizado com sucesso');
            setModalAberto(false);
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
        { ...formulario, nome: formulario.nome.trim(), username: formulario.username.trim(), email: formulario.email.trim() },
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
  }

  function abrirVinculoEdicao(usuario: UsuarioAdminResposta, tenantId: string, papelAtual: Papel) {
    setModalVinculo(usuario);
    setVinculoEmEdicao(tenantId);
    setEmpresaEscolhida(tenantId);
    setPapelEscolhido(papelAtual);
  }

  function aoSalvarVinculo(evento: FormEvent) {
    evento.preventDefault();
    if (!modalVinculo) return;

    if (vinculoEmEdicao) {
      atualizarVinculo.mutate(
        { id: modalVinculo.id, tenantId: vinculoEmEdicao, papel: papelEscolhido },
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
        { id: modalVinculo.id, dados: { tenantId: empresaEscolhida, papel: papelEscolhido } },
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
                    <td style={{ fontWeight: 600 }}>{usuario.nome}</td>
                    <td>
                      <div>{usuario.username}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{usuario.email}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 320 }}>
                        {usuario.empresas.map((vinculo) => (
                          <span
                            key={vinculo.tenantId}
                            className="pilula-status status-ativo"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            title="Clique para editar o papel"
                            onClick={() => abrirVinculoEdicao(usuario, vinculo.tenantId, vinculo.papel)}
                          >
                            {vinculo.tenantNome} · {rotuloPapel(vinculo.papel)}
                            <button
                              type="button"
                              aria-label="Remover vínculo"
                              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
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
                    <td>
                      <span className={`pilula-status ${usuario.status === 'ATIVO' ? 'status-ativo' : 'status-inativo'}`}>
                        <span className="ponto" />
                        {usuario.status}
                      </span>
                    </td>
                    <td>{formatarData(usuario.createdAt.slice(0, 10))}</td>
                    <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
                        onChange={(e) => atualizarCampo('tenantId', e.target.value)}
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
                  <div className="campo col-2">
                    <label htmlFor="campo-nome-usuario">Nome</label>
                    <input
                      id="campo-nome-usuario"
                      type="text"
                      value={formulario.nome}
                      onChange={(e) => atualizarCampo('nome', e.target.value)}
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
                  {!usuarioEmEdicao && (
                    <div className="campo col-2">
                      <label htmlFor="campo-papel">Papel</label>
                      <select
                        id="campo-papel"
                        value={formulario.papel}
                        onChange={(e) => atualizarCampo('papel', e.target.value)}
                      >
                        {PAPEIS.map((p) => (
                          <option key={p.valor} value={p.valor}>
                            {p.rotulo}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-rodape">
                <button type="button" className="botao botao-fantasma" onClick={() => setModalAberto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="botao botao-primario" disabled={criar.isPending || atualizar.isPending}>
                  {criar.isPending || atualizar.isPending ? 'Salvando…' : 'Salvar'}
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
                    onChange={(e) => setEmpresaEscolhida(e.target.value)}
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
                    onChange={(e) => setPapelEscolhido(e.target.value as Papel)}
                  >
                    {PAPEIS.map((p) => (
                      <option key={p.valor} value={p.valor}>
                        {p.rotulo}
                      </option>
                    ))}
                  </select>
                </div>
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

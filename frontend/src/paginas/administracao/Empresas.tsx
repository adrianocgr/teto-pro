import { useState, type FormEvent } from 'react';
import { useToast } from '@/componentes/Toast';
import { IconeMais } from '@/componentes/Icones';
import {
  useListaEmpresas,
  useCriarEmpresa,
  useAtualizarEmpresa,
  useAlternarStatusEmpresa,
  type EmpresaResposta,
} from '@/api/administracao';

export function Empresas() {
  const { data: empresas, isLoading, isError } = useListaEmpresas();
  const criar = useCriarEmpresa();
  const atualizar = useAtualizarEmpresa();
  const alternarStatus = useAlternarStatusEmpresa();
  const { notificar } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [empresaEmEdicao, setEmpresaEmEdicao] = useState<EmpresaResposta | null>(null);
  const [nome, setNome] = useState('');

  function abrirNovaEmpresa() {
    setEmpresaEmEdicao(null);
    setNome('');
    setModalAberto(true);
  }

  function abrirEdicao(empresa: EmpresaResposta) {
    setEmpresaEmEdicao(empresa);
    setNome(empresa.nome);
    setModalAberto(true);
  }

  function aoSalvar(evento: FormEvent) {
    evento.preventDefault();
    if (!nome.trim()) return;

    if (empresaEmEdicao) {
      atualizar.mutate(
        { id: empresaEmEdicao.id, dados: { nome: nome.trim() } },
        {
          onSuccess: () => {
            notificar('Empresa atualizada com sucesso');
            setModalAberto(false);
          },
          onError: () => notificar('Não foi possível atualizar a empresa', 'erro'),
        },
      );
    } else {
      criar.mutate(
        { nome: nome.trim() },
        {
          onSuccess: () => {
            notificar('Empresa cadastrada com sucesso');
            setModalAberto(false);
          },
          onError: () => notificar('Não foi possível cadastrar a empresa', 'erro'),
        },
      );
    }
  }

  function aoAlternarStatus(empresa: EmpresaResposta) {
    alternarStatus.mutate(
      { id: empresa.id, ativar: empresa.status === 'INATIVO' },
      {
        onSuccess: () => notificar(empresa.status === 'INATIVO' ? 'Empresa reativada' : 'Empresa inativada'),
        onError: () => notificar('Não foi possível alterar o status da empresa', 'erro'),
      },
    );
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <div>
          <div className="titulo-pagina">Empresas</div>
          <div className="subtitulo-pagina">
            {isLoading ? 'Carregando…' : `${empresas?.length ?? 0} empresa(s) cadastradas na plataforma`}
          </div>
        </div>
        <button className="botao botao-primario" onClick={abrirNovaEmpresa}>
          <IconeMais width={14} height={14} /> Nova empresa
        </button>
      </div>

      {isError && <p>Não foi possível carregar as empresas.</p>}

      {!isLoading && !isError && (
        <div className="painel">
          <div className="tabela-scroll">
            <table className="dados">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Identificador (tenant)</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(empresas ?? []).map((empresa) => (
                  <tr key={empresa.id}>
                    <td style={{ fontWeight: 600 }}>{empresa.nome}</td>
                    <td className="mono">{empresa.id}</td>
                    <td>
                      <span className={`pilula-status ${empresa.status === 'ATIVO' ? 'status-ativo' : 'status-inativo'}`}>
                        <span className="ponto" />
                        {empresa.status}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="botao botao-fantasma botao-pequeno" onClick={() => abrirEdicao(empresa)}>
                        Editar
                      </button>
                      <button className="botao botao-fantasma botao-pequeno" onClick={() => aoAlternarStatus(empresa)}>
                        {empresa.status === 'ATIVO' ? 'Inativar' : 'Reativar'}
                      </button>
                    </td>
                  </tr>
                ))}
                {(empresas ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="estado-vazio">
                        <div className="titulo">Nenhuma empresa cadastrada</div>
                        <div className="subtitulo">Cadastre a primeira empresa para começar.</div>
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
              <div className="modal-titulo">{empresaEmEdicao ? 'Editar empresa' : 'Nova empresa'}</div>
              <button className="fechar-modal" onClick={() => setModalAberto(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={aoSalvar}>
              <div className="modal-corpo">
                <div className="campo">
                  <label htmlFor="campo-nome-empresa">Nome da empresa</label>
                  <input
                    id="campo-nome-empresa"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex.: Andrade Empreendimentos Ltda"
                    autoFocus
                  />
                  {!empresaEmEdicao && (
                    <span className="dica">
                      O identificador único (usado no atributo tenant_id do Keycloak) é gerado automaticamente a
                      partir do nome.
                    </span>
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
                  disabled={!nome.trim() || criar.isPending || atualizar.isPending}
                >
                  {criar.isPending || atualizar.isPending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

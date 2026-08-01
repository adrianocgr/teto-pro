import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useMatch, Link } from 'react-router-dom';
import { useAutenticacao } from '@/autenticacao/ContextoAutenticacao';
import { useEmpreendimentoAtual, useLimparEmpreendimentoAtual } from './ContextoEmpreendimentoAtual';
import { AlternadorTema } from './AlternadorTema';
import logo from '@/assets/logo.svg';
import {
  IconePredio,
  IconeCaminhao,
  IconeEtiqueta,
  IconeCaixa,
  IconeInvestidores,
  IconeAuditoria,
  IconeResumo,
  IconeDespesas,
  IconeFechamento,
  IconeEmpresa,
  IconeUsuarios,
  IconeLocalidade,
  IconeRepetir,
  IconeCadeado,
  IconeMenu,
  IconeFechar,
  IconeSeta,
  IconeRelatorio,
} from './Icones';

function iniciais(nome: string) {
  const partes = nome.split(/\s+/).filter((p) => p.length > 1);
  return (partes.slice(0, 2).map((p) => p[0]).join('') || nome.slice(0, 2)).toUpperCase();
}

export function AppShell() {
  const { usuario, sair, alterarSenha, temPapel, empresas, trocarEmpresa } = useAutenticacao();
  const empreendimentoAtual = useEmpreendimentoAtual();
  const limparEmpreendimentoAtual = useLimparEmpreendimentoAtual();
  const dentroDeEmpreendimento = useMatch('/empreendimentos/:id/*');
  const localizacao = useLocation();

  const [menuAberto, setMenuAberto] = useState(false);

  // Fecha o menu mobile sempre que a rota muda (clicou num item de navegação).
  useEffect(() => {
    setMenuAberto(false);
  }, [localizacao.pathname]);

  if (!usuario) return null;

  const podeGerenciar = temPapel('ADMIN', 'GESTOR');
  const ehAdmin = temPapel('ADMIN');
  const ehAdminDaPlataforma = temPapel('PLATAFORMA_ADMIN');

  const botaoMenu = (
    <button
      type="button"
      className="botao-menu"
      onClick={() => setMenuAberto((aberto) => !aberto)}
      aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
    >
      {menuAberto ? <IconeFechar width={17} height={17} /> : <IconeMenu width={17} height={17} />}
    </button>
  );

  const veuMenu = <div className={`veu-menu ${menuAberto ? 'aberto' : ''}`} onClick={() => setMenuAberto(false)} />;

  function aoTrocarEmpresa() {
    limparEmpreendimentoAtual();
    trocarEmpresa();
  }

  if (ehAdminDaPlataforma) {
    return (
      <div className="layout-shell">
        {veuMenu}
        <aside className={`barra-lateral ${menuAberto ? 'aberta' : ''}`}>
          <div className="marca">
            <img src={logo} alt="" width={30} height={30} />
            <div>
              <div className="marca-nome">
                Teto<b>Pro</b>
              </div>
              <div className="marca-sub">Administração da Plataforma</div>
            </div>
          </div>

          <NavLink to="/administracao/empresas" className={({ isActive }) => `item-nav ${isActive ? 'ativo' : ''}`}>
            <IconeEmpresa /> <span>Empresas</span>
          </NavLink>
          <NavLink to="/administracao/usuarios" className={({ isActive }) => `item-nav ${isActive ? 'ativo' : ''}`}>
            <IconeUsuarios /> <span>Usuários</span>
          </NavLink>
          <NavLink to="/administracao/localidades" className={({ isActive }) => `item-nav ${isActive ? 'ativo' : ''}`}>
            <IconeLocalidade /> <span>Localidades</span>
          </NavLink>

          <div className="rodape-lateral">
            <div className="pilula-usuario">
              <div className="avatar">{iniciais(usuario.nome)}</div>
              <div style={{ minWidth: 0 }}>
                <div className="usuario-nome">{usuario.nome}</div>
                <div className="usuario-papel">Administrador da plataforma</div>
              </div>
            </div>
            <button className="botao botao-fantasma botao-pequeno" style={{ width: '100%', marginTop: 8 }} onClick={alterarSenha}>
              <IconeCadeado width={13} height={13} /> Alterar senha
            </button>
            <button className="botao botao-fantasma botao-pequeno" style={{ width: '100%', marginTop: 6 }} onClick={sair}>
              Sair
            </button>
          </div>
        </aside>

        <div className="principal">
          <header className="topo">
            {botaoMenu}
            <div className="trilha">
              <span className="marca-tenant">Plataforma</span>
            </div>
            <div className="espaco-flex" />
            <AlternadorTema />
          </header>
          <div className="conteudo">
            <div className="conteudo-interno">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-shell">
      {veuMenu}
      <aside className={`barra-lateral ${menuAberto ? 'aberta' : ''}`}>
        <div className="marca">
          <img src={logo} alt="" width={30} height={30} />
          <div>
            <div className="marca-nome">
              Teto<b>Pro</b>
            </div>
            <div className="marca-sub">Obra · Controle de Custos</div>
          </div>
        </div>

        <NavLink to="/empreendimentos" className={({ isActive }) => `item-nav ${isActive ? 'ativo' : ''}`}>
          <IconePredio /> <span>Empreendimentos</span>
        </NavLink>

        {dentroDeEmpreendimento && empreendimentoAtual && (
          <div className="subcontexto">
            <div className="subcontexto-titulo">{empreendimentoAtual.nome}</div>
            <NavLink
              to={`/empreendimentos/${empreendimentoAtual.id}/resumo`}
              className={({ isActive }) => `item-nav ${isActive ? 'ativo' : ''}`}
            >
              <IconeResumo /> <span>Resumo</span>
            </NavLink>
            <NavLink
              to={`/empreendimentos/${empreendimentoAtual.id}/despesas`}
              className={({ isActive }) => `item-nav ${isActive ? 'ativo' : ''}`}
            >
              <IconeDespesas /> <span>Despesas</span>
            </NavLink>
            <NavLink
              to={`/empreendimentos/${empreendimentoAtual.id}/despesas-recorrentes`}
              className={({ isActive }) => `item-nav ${isActive ? 'ativo' : ''}`}
            >
              <IconeRepetir /> <span>Recorrentes</span>
            </NavLink>
            <NavLink
              to={`/empreendimentos/${empreendimentoAtual.id}/investidores`}
              className={({ isActive }) => `item-nav ${isActive ? 'ativo' : ''}`}
            >
              <IconeInvestidores /> <span>Investidores</span>
            </NavLink>
            {podeGerenciar && (
              <NavLink
                to={`/empreendimentos/${empreendimentoAtual.id}/fechamento`}
                className={({ isActive }) => `item-nav ${isActive ? 'ativo' : ''}`}
              >
                <IconeFechamento /> <span>Fechamento</span>
              </NavLink>
            )}

            <div className="rotulo-nav">Relatórios</div>
            <NavLink
              to={`/empreendimentos/${empreendimentoAtual.id}/relatorios/extrato-despesas`}
              className={({ isActive }) => `item-nav ${isActive ? 'ativo' : ''}`}
            >
              <IconeRelatorio /> <span>Extrato de despesas</span>
            </NavLink>
          </div>
        )}

        {!dentroDeEmpreendimento && empreendimentoAtual && (
          <Link
            to={`/empreendimentos/${empreendimentoAtual.id}/resumo`}
            className="item-nav"
            title={`Voltar para ${empreendimentoAtual.nome}`}
          >
            <IconeSeta style={{ transform: 'rotate(180deg)' }} width={14} height={14} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Voltar para {empreendimentoAtual.nome}
            </span>
          </Link>
        )}

        {podeGerenciar && (
          <>
            <div className="rotulo-nav">Cadastros globais</div>
            <NavLink to="/fornecedores" className={({ isActive }) => `item-nav ${isActive ? 'ativo' : ''}`}>
              <IconeCaminhao /> <span>Fornecedores</span>
            </NavLink>
            <NavLink to="/categorias" className={({ isActive }) => `item-nav ${isActive ? 'ativo' : ''}`}>
              <IconeEtiqueta /> <span>Categorias</span>
            </NavLink>
            <NavLink to="/insumos" className={({ isActive }) => `item-nav ${isActive ? 'ativo' : ''}`}>
              <IconeCaixa /> <span>Insumos</span>
            </NavLink>
            <div className="rotulo-nav">Empresa</div>
            <NavLink to="/investidores" className={({ isActive }) => `item-nav ${isActive ? 'ativo' : ''}`}>
              <IconeInvestidores /> <span>Investidores</span>
            </NavLink>
          </>
        )}
        {ehAdmin && (
          <NavLink to="/auditoria" className={({ isActive }) => `item-nav ${isActive ? 'ativo' : ''}`}>
            <IconeAuditoria /> <span>Auditoria</span>
          </NavLink>
        )}

        <div className="rodape-lateral">
          <div className="pilula-usuario">
            <div className="avatar">{iniciais(usuario.nome)}</div>
            <div style={{ minWidth: 0 }}>
              <div className="usuario-nome">{usuario.nome}</div>
              <div className="usuario-papel">
                {usuario.papel === 'ADMIN'
                  ? 'Administrador'
                  : usuario.papel === 'GESTOR'
                    ? 'Gestor'
                    : 'Investidor · somente leitura'}
              </div>
            </div>
          </div>
          {empresas.length > 1 && (
            <button className="botao botao-fantasma botao-pequeno" style={{ width: '100%', marginTop: 8 }} onClick={aoTrocarEmpresa}>
              Trocar empresa
            </button>
          )}
          <button className="botao botao-fantasma botao-pequeno" style={{ width: '100%', marginTop: 6 }} onClick={alterarSenha}>
            <IconeCadeado width={13} height={13} /> Alterar senha
          </button>
          <button className="botao botao-fantasma botao-pequeno" style={{ width: '100%', marginTop: 6 }} onClick={sair}>
            Sair
          </button>
        </div>
      </aside>

      <div className="principal">
        <header className="topo">
          {botaoMenu}
          <div className="trilha">
            {empresas.length > 1 && (
              <span className="marca-tenant">{empresas.find((e) => e.tenantId === usuario.tenantId)?.tenantNome}</span>
            )}
            <Link to="/empreendimentos" className="trilha-link">
              Empreendimentos
            </Link>
          </div>
          <div className="espaco-flex" />
          <AlternadorTema />
        </header>
        <div className="conteudo">
          <div className="conteudo-interno">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

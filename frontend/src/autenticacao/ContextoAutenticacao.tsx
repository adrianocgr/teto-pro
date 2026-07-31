import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { keycloak } from './keycloak';
import { obterEmpresaAtiva, definirEmpresaAtiva } from './empresaAtiva';
import { cliente } from '@/api/cliente';
import type { MinhaEmpresaResposta, Papel, UsuarioAutenticado } from '@/tipos/usuario';

interface ValorContextoAutenticacao {
  carregando: boolean;
  autenticado: boolean;
  usuario: UsuarioAutenticado | null;
  temPapel: (...papeis: Papel[]) => boolean;
  sair: () => void;
  /** Leva para o console de conta do Keycloak, onde a pessoa troca a própria senha. */
  alterarSenha: () => void;
  /** Todas as empresas do usuário logado (vazio para PLATAFORMA_ADMIN, que não pertence a nenhuma). */
  empresas: MinhaEmpresaResposta[];
  /** Limpa a empresa ativa para que o seletor apareça de novo (ver AppShell). */
  trocarEmpresa: () => void;
}

const ContextoAutenticacao = createContext<ValorContextoAutenticacao | undefined>(undefined);

// `keycloak` é um singleton em nível de módulo (ver keycloak.ts) e a própria
// biblioteca lança erro se `.init()` for chamado mais de uma vez nele. Em
// desenvolvimento, o StrictMode do React 18 monta/desmonta/remonta os efeitos
// de propósito — sem essa trava em nível de módulo (sobrevive ao remonte),
// a segunda montagem chamaria `.init()` de novo e quebraria a autenticação.
let inicializacaoSolicitada = false;

interface ClaimsToken {
  email?: string;
  name?: string;
  realm_access?: { roles?: string[] };
}

function extrairClaims(): ClaimsToken | null {
  return (keycloak.tokenParsed as ClaimsToken) ?? null;
}

export function ProvedorAutenticacao({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [carregando, setCarregando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);
  const [ehPlataformaAdmin, setEhPlataformaAdmin] = useState(false);
  const [identidadeBase, setIdentidadeBase] = useState<{ nome: string; email: string } | null>(null);
  const [empresas, setEmpresas] = useState<MinhaEmpresaResposta[]>([]);
  const [empresaAtivaId, setEmpresaAtivaId] = useState<string | null>(null);
  const [buscouEmpresas, setBuscouEmpresas] = useState(false);

  useEffect(() => {
    if (inicializacaoSolicitada) return;
    inicializacaoSolicitada = true;

    keycloak
      .init({ onLoad: 'login-required', pkceMethod: 'S256', checkLoginIframe: false })
      .then(async (logado) => {
        setAutenticado(logado);
        if (!logado) {
          setCarregando(false);
          return;
        }

        const claims = extrairClaims();
        const papeis = claims?.realm_access?.roles ?? [];
        setIdentidadeBase({ nome: claims?.name ?? claims?.email ?? 'Usuário', email: claims?.email ?? '' });

        if (papeis.includes('PLATAFORMA_ADMIN')) {
          setEhPlataformaAdmin(true);
          setCarregando(false);
          return;
        }

        try {
          const resposta = await cliente.get<MinhaEmpresaResposta[]>('/usuarios/minhas-empresas');
          setEmpresas(resposta.data);
          const salva = obterEmpresaAtiva();
          const ativaValida = resposta.data.find((e) => e.tenantId === salva);
          if (ativaValida) {
            setEmpresaAtivaId(ativaValida.tenantId);
          } else if (resposta.data.length === 1) {
            definirEmpresaAtiva(resposta.data[0].tenantId);
            setEmpresaAtivaId(resposta.data[0].tenantId);
          } else {
            definirEmpresaAtiva(null);
          }
        } finally {
          setBuscouEmpresas(true);
          setCarregando(false);
        }
      })
      .catch(() => setCarregando(false));

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => keycloak.login());
    };
  }, []);

  function selecionarEmpresa(tenantId: string) {
    definirEmpresaAtiva(tenantId);
    setEmpresaAtivaId(tenantId);
  }

  function trocarEmpresa() {
    // Sem isso, dados em cache da empresa anterior (React Query) e a URL de
    // um empreendimento específico sobrevivem à troca — ao selecionar a nova
    // empresa a tela remonta na mesma rota, que ou reaproveita dados da
    // empresa antiga (mesma queryKey) ou tenta abrir um empreendimento que
    // não existe nela.
    queryClient.clear();
    window.history.replaceState(null, '', '/');
    definirEmpresaAtiva(null);
    setEmpresaAtivaId(null);
  }

  function sair() {
    definirEmpresaAtiva(null);
    keycloak.logout({ redirectUri: window.location.origin });
  }

  function alterarSenha() {
    keycloak.accountManagement();
  }

  const empresaAtiva = empresas.find((e) => e.tenantId === empresaAtivaId) ?? null;

  const usuario: UsuarioAutenticado | null = !identidadeBase
    ? null
    : ehPlataformaAdmin
      ? { id: null, nome: identidadeBase.nome, email: identidadeBase.email, papel: 'PLATAFORMA_ADMIN', tenantId: null, investidorId: null }
      : empresaAtiva
        ? {
            id: null,
            nome: identidadeBase.nome,
            email: identidadeBase.email,
            papel: empresaAtiva.papel,
            tenantId: empresaAtiva.tenantId,
            investidorId: empresaAtiva.investidorId,
          }
        : null;

  function temPapel(...papeis: Papel[]) {
    return !!usuario && papeis.includes(usuario.papel);
  }

  if (carregando) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        Carregando...
      </div>
    );
  }

  if (autenticado && !ehPlataformaAdmin && buscouEmpresas && empresas.length === 0) {
    return <TelaSemEmpresaVinculada sair={sair} />;
  }

  if (autenticado && !ehPlataformaAdmin && buscouEmpresas && !empresaAtivaId) {
    return <TelaSelecionarEmpresa empresas={empresas} onSelecionar={selecionarEmpresa} sair={sair} />;
  }

  return (
    <ContextoAutenticacao.Provider
      value={{ carregando, autenticado, usuario, temPapel, sair, alterarSenha, empresas, trocarEmpresa }}
    >
      {children}
    </ContextoAutenticacao.Provider>
  );
}

function TelaSemEmpresaVinculada({ sair }: { sair: () => void }) {
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 18 }}>Nenhuma empresa vinculada</div>
      <div style={{ color: 'var(--ink-muted)' }}>Fale com o administrador da plataforma para vincular seu usuário a uma empresa.</div>
      <button className="botao botao-fantasma" onClick={sair}>
        Sair
      </button>
    </div>
  );
}

function TelaSelecionarEmpresa({
  empresas,
  onSelecionar,
  sair,
}: {
  empresas: MinhaEmpresaResposta[];
  onSelecionar: (tenantId: string) => void;
  sair: () => void;
}) {
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="painel" style={{ width: 380, padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Selecione a empresa</div>
        <div style={{ color: 'var(--ink-muted)', marginBottom: 16 }}>Você está vinculado a mais de uma empresa.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {empresas.map((empresa) => (
            <button
              key={empresa.tenantId}
              className="botao botao-fantasma"
              style={{ justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={() => onSelecionar(empresa.tenantId)}
            >
              {empresa.tenantNome}
            </button>
          ))}
        </div>
        <button className="botao botao-fantasma botao-pequeno" style={{ width: '100%', marginTop: 16 }} onClick={sair}>
          Sair
        </button>
      </div>
    </div>
  );
}

export function useAutenticacao() {
  const contexto = useContext(ContextoAutenticacao);
  if (!contexto) throw new Error('useAutenticacao precisa estar dentro de ProvedorAutenticacao');
  return contexto;
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface EmpreendimentoAtual {
  id: number;
  nome: string;
}

interface ValorContexto {
  empreendimentoAtual: EmpreendimentoAtual | null;
  definirEmpreendimentoAtual: (valor: EmpreendimentoAtual | null) => void;
}

const Contexto = createContext<ValorContexto | undefined>(undefined);

export function ProvedorEmpreendimentoAtual({ children }: { children: ReactNode }) {
  const [empreendimentoAtual, definirEmpreendimentoAtual] = useState<EmpreendimentoAtual | null>(null);
  return (
    <Contexto.Provider value={{ empreendimentoAtual, definirEmpreendimentoAtual }}>{children}</Contexto.Provider>
  );
}

function useContextoEmpreendimentoAtual() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useContextoEmpreendimentoAtual precisa estar dentro de ProvedorEmpreendimentoAtual');
  return contexto;
}

/** Usado pela barra lateral/topo para exibir o nome do empreendimento atual. */
export function useEmpreendimentoAtual() {
  return useContextoEmpreendimentoAtual().empreendimentoAtual;
}

/** As páginas de detalhe do empreendimento chamam isto para "publicar" o nome
 * carregado — assim que o `id`/`nome` mudarem, a barra lateral atualiza sozinha.
 * Deliberadamente NÃO limpa ao desmontar: sair para um cadastro global
 * (Fornecedores, Categorias...) e depois voltar não deve exigir escolher o
 * empreendimento de novo — a barra lateral usa esse valor "lembrado" para
 * oferecer um atalho de volta (ver AppShell). Só é sobrescrito quando outro
 * empreendimento é aberto. */
export function useDefinirEmpreendimentoAtual(id: number | undefined, nome: string | undefined) {
  const { definirEmpreendimentoAtual } = useContextoEmpreendimentoAtual();
  useEffect(() => {
    if (id && nome) {
      definirEmpreendimentoAtual({ id, nome });
    }
  }, [id, nome, definirEmpreendimentoAtual]);
}

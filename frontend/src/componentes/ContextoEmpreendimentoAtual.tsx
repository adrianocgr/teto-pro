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
 * Sempre limpa ao desmontar, para não vazar o nome para outras telas. */
export function useDefinirEmpreendimentoAtual(id: number | undefined, nome: string | undefined) {
  const { definirEmpreendimentoAtual } = useContextoEmpreendimentoAtual();
  useEffect(() => {
    if (id && nome) {
      definirEmpreendimentoAtual({ id, nome });
    }
    return () => definirEmpreendimentoAtual(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, nome]);
}

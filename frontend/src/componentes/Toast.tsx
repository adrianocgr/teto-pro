import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { IconeCheck, IconeAlerta } from './Icones';

interface ItemToast {
  id: number;
  mensagem: string;
  tipo: 'sucesso' | 'erro';
}

interface ValorToast {
  notificar: (mensagem: string, tipo?: 'sucesso' | 'erro') => void;
}

const ContextoToast = createContext<ValorToast | undefined>(undefined);

let proximoId = 1;

export function ProvedorToast({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemToast[]>([]);

  const notificar = useCallback((mensagem: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    const id = proximoId++;
    setItens((atual) => [...atual, { id, mensagem, tipo }]);
    setTimeout(() => {
      setItens((atual) => atual.filter((i) => i.id !== id));
    }, 3200);
  }, []);

  return (
    <ContextoToast.Provider value={{ notificar }}>
      {children}
      <div id="area-toast">
        {itens.map((item) => (
          <div key={item.id} className="item-toast">
            {item.tipo === 'erro' ? <IconeAlerta width={16} height={16} /> : <IconeCheck width={16} height={16} />}
            <span>{item.mensagem}</span>
          </div>
        ))}
      </div>
    </ContextoToast.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ContextoToast);
  if (!contexto) throw new Error('useToast precisa estar dentro de ProvedorToast');
  return contexto;
}

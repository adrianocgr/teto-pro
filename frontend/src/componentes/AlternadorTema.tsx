import { useEffect, useState } from 'react';
import { IconeLua, IconeSol } from './Icones';

type Tema = 'claro' | 'escuro';

function temaInicial(): Tema | null {
  const salvo = localStorage.getItem('tetopro-obra:tema');
  return salvo === 'claro' || salvo === 'escuro' ? salvo : null;
}

export function AlternadorTema() {
  const [tema, setTema] = useState<Tema | null>(temaInicial);

  useEffect(() => {
    if (tema) {
      document.documentElement.setAttribute('data-tema', tema);
      localStorage.setItem('tetopro-obra:tema', tema);
    } else {
      document.documentElement.removeAttribute('data-tema');
    }
  }, [tema]);

  const escuroAtivo =
    tema === 'escuro' || (!tema && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      className="alternador-tema"
      onClick={() => setTema(escuroAtivo ? 'claro' : 'escuro')}
      title="Alternar tema"
      aria-label="Alternar tema"
    >
      {escuroAtivo ? <IconeSol width={16} height={16} /> : <IconeLua width={16} height={16} />}
    </button>
  );
}

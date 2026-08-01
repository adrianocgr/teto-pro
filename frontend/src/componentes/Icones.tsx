import type { SVGProps } from 'react';

const base = (props: SVGProps<SVGSVGElement>) => ({
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const IconePredio = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
  </svg>
);

export const IconeCaminhao = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="2" y="7" width="13" height="10" rx="1" />
    <path d="M15 10h4l3 3v4h-7z" />
    <circle cx="7" cy="19" r="1.6" />
    <circle cx="17.5" cy="19" r="1.6" />
  </svg>
);

export const IconeResumo = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 3v18h18" />
    <path d="M7 15l4-5 3 3 5-7" />
  </svg>
);

export const IconeDespesas = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M15 3v4h4" />
    <path d="M9 12h6M9 16h6M9 8h2" />
  </svg>
);

export const IconeInvestidores = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3" />
    <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    <circle cx="17" cy="8" r="2.6" />
    <path d="M17 5c1.8 0 3.5 1.4 3.8 3.4" />
  </svg>
);

export const IconeMais = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconeLixeira = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
);

export const IconeSeta = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const IconeArquivo = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M7 3h7l5 5v13H7z" />
    <path d="M14 3v5h5" />
  </svg>
);

export const IconeCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const IconeAlerta = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M12 9v4M12 17h.01" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export const IconeLua = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
  </svg>
);

export const IconeSol = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const IconeCadeado = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="5" y="11" width="14" height="9" rx="1.5" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const IconeDownload = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 4v12M7 11l5 5 5-5" />
    <path d="M4 19h16" />
  </svg>
);

export const IconeEtiqueta = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20.5 12.5L12 21l-9-9V4h8z" />
    <circle cx="7.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const IconeCaixa = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M21 8l-9-5-9 5 9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8" />
    <path d="M12 13v8" />
  </svg>
);

export const IconeAuditoria = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 3h6l3 3v15H6V3z" />
    <path d="M9 3v4H5" />
    <path d="M9 13l2 2 4-4" />
  </svg>
);

export const IconeFechamento = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 12.5l2 2 4-5" />
  </svg>
);

export const IconeEmpresa = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="7" width="12" height="14" rx="1" />
    <path d="M9 3h8a1 1 0 0 1 1 1v17h-9" />
    <path d="M6.5 11h1M6.5 14h1M6.5 17h1M12 7h1M12 10h1M12 13h1M12 16h1" />
  </svg>
);

export const IconeUsuarios = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="9" cy="7" r="3.2" />
    <path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6" />
    <path d="M16 4.2c1.6.4 2.8 1.9 2.8 3.6 0 1.7-1.2 3.2-2.8 3.6" />
    <path d="M18 14c2 .5 3.5 2.2 3.5 4.4" />
  </svg>
);

export const IconeLocalidade = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export const IconeMenu = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const IconeFechar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconeRepetir = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 12a8 8 0 0 1 13.3-5.9M20 12a8 8 0 0 1-13.3 5.9" />
    <path d="M17 3v4h-4M7 21v-4h4" />
  </svg>
);

export const IconeOlho = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconeRelatorio = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);

export const IconeImportar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M7 3h7l5 5v13H7z" />
    <path d="M14 3v5h5" />
    <path d="M12 18v-7M9 14l3-3 3 3" />
  </svg>
);

export const IconeEditar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

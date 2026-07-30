const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

export function formatarMoeda(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined) return formatadorMoeda.format(0);
  const numero = typeof valor === 'string' ? Number(valor) : valor;
  return formatadorMoeda.format(Number.isFinite(numero) ? numero : 0);
}

export function formatarMoedaResumida(valor: number | string | null | undefined): string {
  const numero = typeof valor === 'string' ? Number(valor) : (valor ?? 0);
  const abs = Math.abs(numero);
  if (abs >= 1_000_000) return `R$ ${(numero / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000) return `R$ ${(numero / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}mil`;
  return formatarMoeda(numero);
}

export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  const data = new Date(iso);
  return `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export function iniciaisNome(nome: string): string {
  const partes = nome.split(/\s+/).filter((p) => p.length > 1);
  return (partes.slice(0, 2).map((p) => p[0]).join('') || nome.slice(0, 2)).toUpperCase();
}

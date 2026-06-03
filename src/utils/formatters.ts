export function formatNumber(n: number, dec = 0): string {
  return Number(n).toLocaleString('pt-BR', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function formatUfDisplay(v: string): string {
  return String(v ?? '').toUpperCase().slice(0, 2);
}

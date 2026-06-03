export function onlyDigits(v: string): string {
  return v.replace(/\D/g, '');
}

export function formatCnpj(v: string): string {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function unmaskCnpj(v: string): string {
  return onlyDigits(v);
}

export function formatUf(v: string): string {
  return String(v ?? '').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
}

export function parseDecimalInput(v: string): number {
  const normalized = v.replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function formatCoordinate(v: number): string {
  return Number.isFinite(v) ? v.toFixed(6) : '';
}

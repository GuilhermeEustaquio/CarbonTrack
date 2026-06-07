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

/** CPF: 000.000.000-00 (formata progressivamente conforme digita). */
export function formatCpf(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function unmaskCpf(v: string): string {
  return onlyDigits(v);
}

/** CNH: documento numérico de 11 dígitos (apenas dígitos). */
export function formatCnh(v: string): string {
  return onlyDigits(v).slice(0, 11);
}

/**
 * Placa: aceita padrão antigo (ABC-1234) e Mercosul (ABC1D23).
 * Mantém só alfanuméricos em maiúsculo (até 7) e aplica o hífen
 * apenas no formato antigo (3 letras + 4 dígitos).
 */
export function formatPlaca(v: string): string {
  const s = String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  if (/^[A-Z]{3}[0-9]{4}$/.test(s)) return `${s.slice(0, 3)}-${s.slice(3)}`;
  return s;
}

export function unmaskPlaca(v: string): string {
  return String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
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

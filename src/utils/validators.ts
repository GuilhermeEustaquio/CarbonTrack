import { onlyDigits } from './masks';

export function isCnpjLengthValid(v: string): boolean {
  return onlyDigits(v).length === 14;
}

export function normalizeAtivo(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  return value === true || value === 'S' || value === 's' ||
    value === 1 || value === '1' || value === 'true';
}

export function isMissingValue(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === '';
}

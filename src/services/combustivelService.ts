import { isApiEnabled, apiRequest } from './api';
import { toCombustivel } from '../adapters/combustivelAdapter';
import { readStorage, writeStorage } from '../lib/storage';
import type { Combustivel } from '../types/combustivel';

export async function listarCombustiveis(): Promise<Combustivel[]> {
  if (!isApiEnabled) return readStorage<Combustivel>('combustiveis');
  try {
    const data = await apiRequest<Record<string, unknown>[]>('/combustiveis');
    const list = data.map(toCombustivel);
    writeStorage('combustiveis', list);
    return list;
  } catch {
    return readStorage<Combustivel>('combustiveis');
  }
}

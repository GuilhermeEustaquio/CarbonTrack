import { isApiEnabled, apiRequest } from './api';
import { toUnidade } from '../adapters/unidadeAdapter';
import { readStorage, writeStorage } from '../lib/storage';
import type { Unidade } from '../types/unidade';

export async function listarUnidades(): Promise<Unidade[]> {
  if (!isApiEnabled) return readStorage<Unidade>('unidades');
  try {
    const data = await apiRequest<Record<string, unknown>[]>('/unidades');
    const list = data.map(toUnidade);
    writeStorage('unidades', list);
    return list;
  } catch {
    return readStorage<Unidade>('unidades');
  }
}

export const listUnidades = listarUnidades;

export async function criarUnidade(input: Unidade): Promise<Unidade> {
  if (!isApiEnabled) {
    const list = [input, ...readStorage<Unidade>('unidades')];
    writeStorage('unidades', list);
    return input;
  }
  try {
    const raw = await apiRequest<Record<string, unknown>>('/unidades', { method: 'POST', body: JSON.stringify(input) });
    return toUnidade(raw);
  } catch {
    const list = [input, ...readStorage<Unidade>('unidades')];
    writeStorage('unidades', list);
    return input;
  }
}

export async function atualizarUnidade(id: string, input: Unidade): Promise<Unidade> {
  if (!isApiEnabled) {
    const list = readStorage<Unidade>('unidades').map(u => u.id === id ? input : u);
    writeStorage('unidades', list);
    return input;
  }
  try {
    const raw = await apiRequest<Record<string, unknown>>(`/unidades/${id}`, { method: 'PUT', body: JSON.stringify(input) });
    return toUnidade(raw);
  } catch {
    const list = readStorage<Unidade>('unidades').map(u => u.id === id ? input : u);
    writeStorage('unidades', list);
    return input;
  }
}

export async function removerUnidade(id: string): Promise<void> {
  if (!isApiEnabled) {
    writeStorage('unidades', readStorage<Unidade>('unidades').filter(u => u.id !== id));
    return;
  }
  try {
    await apiRequest<void>(`/unidades/${id}`, { method: 'DELETE' });
  } catch {
    writeStorage('unidades', readStorage<Unidade>('unidades').filter(u => u.id !== id));
  }
}

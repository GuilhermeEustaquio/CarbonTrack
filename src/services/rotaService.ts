import { isApiEnabled, apiRequest } from './api';
import { toRota } from '../adapters/rotaAdapter';
import { readStorage, writeStorage } from '../lib/storage';
import { rotaPayload } from '../lib/javaPayload';
import type { Rota } from '../types/rota';

export async function listarRotas(): Promise<Rota[]> {
  if (!isApiEnabled) return readStorage<Rota>('rotas');
  try {
    const data = await apiRequest<Record<string, unknown>[]>('/rotas');
    const list = data.map(toRota);
    writeStorage('rotas', list);
    return list;
  } catch {
    return readStorage<Rota>('rotas');
  }
}

export async function criarRota(input: Rota): Promise<Rota> {
  if (!isApiEnabled) {
    const list = [input, ...readStorage<Rota>('rotas')];
    writeStorage('rotas', list);
    return input;
  }
  try {
    return toRota(await apiRequest<Record<string, unknown>>('/rotas', { method: 'POST', body: JSON.stringify(rotaPayload(input as unknown as Record<string, unknown>)) }));
  } catch {
    const list = [input, ...readStorage<Rota>('rotas')];
    writeStorage('rotas', list);
    return input;
  }
}

export async function atualizarRota(id: string, input: Rota): Promise<Rota> {
  if (!isApiEnabled) {
    const list = readStorage<Rota>('rotas').map(r => r.id === id ? input : r);
    writeStorage('rotas', list);
    return input;
  }
  try {
    return toRota(await apiRequest<Record<string, unknown>>(`/rotas/${id}`, { method: 'PUT', body: JSON.stringify(rotaPayload(input as unknown as Record<string, unknown>)) }));
  } catch {
    const list = readStorage<Rota>('rotas').map(r => r.id === id ? input : r);
    writeStorage('rotas', list);
    return input;
  }
}

export async function removerRota(id: string): Promise<void> {
  if (!isApiEnabled) {
    writeStorage('rotas', readStorage<Rota>('rotas').map(r => r.id === id ? { ...r, ativo: false } : r));
    return;
  }
  try {
    await apiRequest<void>(`/rotas/${id}`, { method: 'DELETE' });
  } catch {
    writeStorage('rotas', readStorage<Rota>('rotas').map(r => r.id === id ? { ...r, ativo: false } : r));
  }
}

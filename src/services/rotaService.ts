import { apiRequest } from './api';
import { toRota } from '../adapters/rotaAdapter';
import { readStorage, writeStorage } from '../lib/storage';
import { rotaPayload } from '../lib/javaPayload';
import type { Rota } from '../types/rota';

const numId = (id: string) => { const n = Number(id); return Number.isFinite(n) && n > 0 ? n : id; };

export async function listarRotas(): Promise<Rota[]> {
  try {
    const data = await apiRequest<Record<string, unknown>[]>('/rotas');
    const list = data.map(toRota);
    writeStorage('rotas', list);
    return list;
  } catch {
    return readStorage<Rota>('rotas');
  }
}

export async function criarRota(input: Rota): Promise<void> {
  await apiRequest<unknown>('/rotas', {
    method: 'POST',
    body: JSON.stringify(rotaPayload(input as unknown as Record<string, unknown>)),
  });
}

export async function atualizarRota(id: string, input: Rota): Promise<void> {
  await apiRequest<unknown>(`/rotas/${numId(id)}`, {
    method: 'PUT',
    body: JSON.stringify(rotaPayload(input as unknown as Record<string, unknown>)),
  });
}

export async function removerRota(id: string): Promise<void> {
  await apiRequest<unknown>(`/rotas/${numId(id)}`, { method: 'DELETE' });
}

import { apiRequest } from './api';
import { toViagem } from '../adapters/viagemAdapter';
import { readStorage, writeStorage } from '../lib/storage';
import { viagemPayload } from '../lib/javaPayload';
import type { Viagem } from '../types/viagem';

const numId = (id: string) => { const n = Number(id); return Number.isFinite(n) && n > 0 ? n : id; };

export async function listarViagens(): Promise<Viagem[]> {
  try {
    const data = await apiRequest<Record<string, unknown>[]>('/viagens');
    const list = data.map(toViagem);
    writeStorage('viagens', list);
    return list;
  } catch {
    return readStorage<Viagem>('viagens');
  }
}

export async function criarViagem(input: Viagem): Promise<void> {
  await apiRequest<unknown>('/viagens', {
    method: 'POST',
    body: JSON.stringify(viagemPayload(input as unknown as Record<string, unknown>)),
  });
}

export async function atualizarViagem(id: string, input: Viagem): Promise<void> {
  await apiRequest<unknown>(`/viagens/${numId(id)}`, {
    method: 'PUT',
    body: JSON.stringify(viagemPayload(input as unknown as Record<string, unknown>)),
  });
}

export async function removerViagem(id: string): Promise<void> {
  await apiRequest<unknown>(`/viagens/${numId(id)}`, { method: 'DELETE' });
}

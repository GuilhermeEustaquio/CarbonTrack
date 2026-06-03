import { isApiEnabled, apiRequest } from './api';
import { toViagem } from '../adapters/viagemAdapter';
import { readStorage, writeStorage } from '../lib/storage';
import { viagemPayload } from '../lib/javaPayload';
import type { Viagem } from '../types/viagem';

export async function listarViagens(): Promise<Viagem[]> {
  if (!isApiEnabled) return readStorage<Viagem>('viagens');
  try {
    const data = await apiRequest<Record<string, unknown>[]>('/viagens');
    const list = data.map(toViagem);
    writeStorage('viagens', list);
    return list;
  } catch {
    return readStorage<Viagem>('viagens');
  }
}

export async function criarViagem(input: Viagem): Promise<Viagem> {
  if (!isApiEnabled) {
    const list = [input, ...readStorage<Viagem>('viagens')];
    writeStorage('viagens', list);
    return input;
  }
  try {
    return toViagem(await apiRequest<Record<string, unknown>>('/viagens', { method: 'POST', body: JSON.stringify(viagemPayload(input as unknown as Record<string, unknown>)) }));
  } catch {
    const list = [input, ...readStorage<Viagem>('viagens')];
    writeStorage('viagens', list);
    return input;
  }
}

export async function atualizarViagem(id: string, input: Viagem): Promise<Viagem> {
  if (!isApiEnabled) {
    const list = readStorage<Viagem>('viagens').map(v => v.id === id ? input : v);
    writeStorage('viagens', list);
    return input;
  }
  try {
    return toViagem(await apiRequest<Record<string, unknown>>(`/viagens/${id}`, { method: 'PUT', body: JSON.stringify(viagemPayload(input as unknown as Record<string, unknown>)) }));
  } catch {
    const list = readStorage<Viagem>('viagens').map(v => v.id === id ? input : v);
    writeStorage('viagens', list);
    return input;
  }
}

export async function removerViagem(id: string): Promise<void> {
  if (!isApiEnabled) {
    writeStorage('viagens', readStorage<Viagem>('viagens').filter(v => v.id !== id));
    return;
  }
  try {
    await apiRequest<void>(`/viagens/${id}`, { method: 'DELETE' });
  } catch {
    writeStorage('viagens', readStorage<Viagem>('viagens').filter(v => v.id !== id));
  }
}

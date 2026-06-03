import { isApiEnabled, apiRequest } from './api';
import { toCaminhao } from '../adapters/caminhaoAdapter';
import { readStorage, writeStorage } from '../lib/storage';
import { caminhaoPayload } from '../lib/javaPayload';
import type { Caminhao } from '../types/caminhao';

export async function listarCaminhoes(): Promise<Caminhao[]> {
  if (!isApiEnabled) return readStorage<Caminhao>('caminhoes');
  try {
    const data = await apiRequest<Record<string, unknown>[]>('/caminhoes');
    const list = data.map(toCaminhao);
    writeStorage('caminhoes', list);
    return list;
  } catch {
    return readStorage<Caminhao>('caminhoes');
  }
}

export async function criarCaminhao(input: Caminhao): Promise<Caminhao> {
  if (!isApiEnabled) {
    const list = [input, ...readStorage<Caminhao>('caminhoes')];
    writeStorage('caminhoes', list);
    return input;
  }
  try {
    return toCaminhao(await apiRequest<Record<string, unknown>>('/caminhoes', { method: 'POST', body: JSON.stringify(caminhaoPayload(input as unknown as Record<string, unknown>)) }));
  } catch {
    const list = [input, ...readStorage<Caminhao>('caminhoes')];
    writeStorage('caminhoes', list);
    return input;
  }
}

export async function atualizarCaminhao(id: string, input: Caminhao): Promise<Caminhao> {
  if (!isApiEnabled) {
    const list = readStorage<Caminhao>('caminhoes').map(c => c.id === id ? input : c);
    writeStorage('caminhoes', list);
    return input;
  }
  try {
    return toCaminhao(await apiRequest<Record<string, unknown>>(`/caminhoes/${id}`, { method: 'PUT', body: JSON.stringify(caminhaoPayload(input as unknown as Record<string, unknown>)) }));
  } catch {
    const list = readStorage<Caminhao>('caminhoes').map(c => c.id === id ? input : c);
    writeStorage('caminhoes', list);
    return input;
  }
}

export async function removerCaminhao(id: string): Promise<void> {
  if (!isApiEnabled) {
    writeStorage('caminhoes', readStorage<Caminhao>('caminhoes').map(c => c.id === id ? { ...c, ativo: false } : c));
    return;
  }
  try {
    await apiRequest<void>(`/caminhoes/${id}`, { method: 'DELETE' });
  } catch {
    writeStorage('caminhoes', readStorage<Caminhao>('caminhoes').map(c => c.id === id ? { ...c, ativo: false } : c));
  }
}

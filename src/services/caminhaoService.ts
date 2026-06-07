import { apiRequest } from './api';
import { toCaminhao } from '../adapters/caminhaoAdapter';
import { readStorage, writeStorage } from '../lib/storage';
import { caminhaoPayload } from '../lib/javaPayload';
import type { Caminhao } from '../types/caminhao';

const numId = (id: string) => { const n = Number(id); return Number.isFinite(n) && n > 0 ? n : id; };

export async function listarCaminhoes(): Promise<Caminhao[]> {
  try {
    const data = await apiRequest<Record<string, unknown>[]>('/caminhoes');
    const list = data.map(toCaminhao);
    writeStorage('caminhoes', list);
    return list;
  } catch {
    return readStorage<Caminhao>('caminhoes');
  }
}

export async function criarCaminhao(input: Caminhao): Promise<void> {
  await apiRequest<unknown>('/caminhoes', {
    method: 'POST',
    body: JSON.stringify(caminhaoPayload(input as unknown as Record<string, unknown>)),
  });
}

export async function atualizarCaminhao(id: string, input: Caminhao): Promise<void> {
  await apiRequest<unknown>(`/caminhoes/${numId(id)}`, {
    method: 'PUT',
    body: JSON.stringify(caminhaoPayload(input as unknown as Record<string, unknown>)),
  });
}

export async function removerCaminhao(id: string): Promise<void> {
  await apiRequest<unknown>(`/caminhoes/${numId(id)}`, { method: 'DELETE' });
}

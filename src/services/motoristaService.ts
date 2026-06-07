import { apiRequest } from './api';
import { toMotorista } from '../adapters/motoristaAdapter';
import { readStorage, writeStorage } from '../lib/storage';
import { motoristaPayload } from '../lib/javaPayload';
import type { Motorista } from '../types/motorista';

const numId = (id: string) => { const n = Number(id); return Number.isFinite(n) && n > 0 ? n : id; };

export async function listarMotoristas(): Promise<Motorista[]> {
  try {
    const data = await apiRequest<Record<string, unknown>[]>('/motoristas');
    const list = data.map(toMotorista);
    writeStorage('motoristas', list);
    return list;
  } catch {
    return readStorage<Motorista>('motoristas');
  }
}

export async function criarMotorista(input: Motorista): Promise<void> {
  await apiRequest<unknown>('/motoristas', {
    method: 'POST',
    body: JSON.stringify(motoristaPayload(input as unknown as Record<string, unknown>)),
  });
}

export async function atualizarMotorista(id: string, input: Motorista): Promise<void> {
  await apiRequest<unknown>(`/motoristas/${numId(id)}`, {
    method: 'PUT',
    body: JSON.stringify(motoristaPayload(input as unknown as Record<string, unknown>)),
  });
}

export async function removerMotorista(id: string): Promise<void> {
  await apiRequest<unknown>(`/motoristas/${numId(id)}`, { method: 'DELETE' });
}

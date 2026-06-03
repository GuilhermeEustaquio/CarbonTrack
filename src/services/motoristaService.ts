import { isApiEnabled, apiRequest } from './api';
import { toMotorista } from '../adapters/motoristaAdapter';
import { readStorage, writeStorage } from '../lib/storage';
import { motoristaPayload } from '../lib/javaPayload';
import type { Motorista } from '../types/motorista';

export async function listarMotoristas(): Promise<Motorista[]> {
  if (!isApiEnabled) return readStorage<Motorista>('motoristas');
  try {
    const data = await apiRequest<Record<string, unknown>[]>('/motoristas');
    const list = data.map(toMotorista);
    writeStorage('motoristas', list);
    return list;
  } catch {
    return readStorage<Motorista>('motoristas');
  }
}

export async function criarMotorista(input: Motorista): Promise<Motorista> {
  if (!isApiEnabled) {
    const list = [input, ...readStorage<Motorista>('motoristas')];
    writeStorage('motoristas', list);
    return input;
  }
  try {
    return toMotorista(await apiRequest<Record<string, unknown>>('/motoristas', { method: 'POST', body: JSON.stringify(motoristaPayload(input as unknown as Record<string, unknown>)) }));
  } catch {
    const list = [input, ...readStorage<Motorista>('motoristas')];
    writeStorage('motoristas', list);
    return input;
  }
}

export async function atualizarMotorista(id: string, input: Motorista): Promise<Motorista> {
  if (!isApiEnabled) {
    const list = readStorage<Motorista>('motoristas').map(m => m.id === id ? input : m);
    writeStorage('motoristas', list);
    return input;
  }
  try {
    return toMotorista(await apiRequest<Record<string, unknown>>(`/motoristas/${id}`, { method: 'PUT', body: JSON.stringify(motoristaPayload(input as unknown as Record<string, unknown>)) }));
  } catch {
    const list = readStorage<Motorista>('motoristas').map(m => m.id === id ? input : m);
    writeStorage('motoristas', list);
    return input;
  }
}

export async function removerMotorista(id: string): Promise<void> {
  if (!isApiEnabled) {
    writeStorage('motoristas', readStorage<Motorista>('motoristas').map(m => m.id === id ? { ...m, ativo: false } : m));
    return;
  }
  try {
    await apiRequest<void>(`/motoristas/${id}`, { method: 'DELETE' });
  } catch {
    writeStorage('motoristas', readStorage<Motorista>('motoristas').map(m => m.id === id ? { ...m, ativo: false } : m));
  }
}

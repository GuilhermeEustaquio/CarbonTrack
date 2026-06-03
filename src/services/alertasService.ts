import { isApiEnabled, apiRequest } from './api';
import { toAlerta } from '../adapters/alertaAdapter';
import { readStorage, writeStorage } from '../lib/storage';
import type { Alerta } from '../types/alerta';

export async function listarAlertas(): Promise<Alerta[]> {
  if (!isApiEnabled) return readStorage<Alerta>('alertas');
  try {
    const data = await apiRequest<Record<string, unknown>[]>('/alertas');
    const list = data.map(toAlerta);
    writeStorage('alertas', list);
    return list;
  } catch {
    return readStorage<Alerta>('alertas');
  }
}

export const listAlertas = listarAlertas;

export async function criarAlerta(input: Alerta): Promise<Alerta> {
  if (!isApiEnabled) {
    const list = [input, ...readStorage<Alerta>('alertas')];
    writeStorage('alertas', list);
    return input;
  }
  try {
    const raw = await apiRequest<Record<string, unknown>>('/alertas', { method: 'POST', body: JSON.stringify(input) });
    return toAlerta(raw);
  } catch {
    const list = [input, ...readStorage<Alerta>('alertas')];
    writeStorage('alertas', list);
    return input;
  }
}

export async function atualizarAlerta(id: string, input: Alerta): Promise<Alerta> {
  if (!isApiEnabled) {
    const list = readStorage<Alerta>('alertas').map(a => a.id === id ? input : a);
    writeStorage('alertas', list);
    return input;
  }
  try {
    const raw = await apiRequest<Record<string, unknown>>(`/alertas/${id}`, { method: 'PUT', body: JSON.stringify(input) });
    return toAlerta(raw);
  } catch {
    const list = readStorage<Alerta>('alertas').map(a => a.id === id ? input : a);
    writeStorage('alertas', list);
    return input;
  }
}

export async function patchAlerta(id: string, patch: Partial<Alerta>): Promise<Alerta | undefined> {
  if (!isApiEnabled) return undefined;
  try {
    const raw = await apiRequest<Record<string, unknown>>(`/alertas/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    return toAlerta(raw);
  } catch {
    return undefined;
  }
}

export async function removerAlerta(id: string): Promise<void> {
  if (!isApiEnabled) {
    writeStorage('alertas', readStorage<Alerta>('alertas').filter(a => a.id !== id));
    return;
  }
  try {
    await apiRequest<void>(`/alertas/${id}`, { method: 'DELETE' });
  } catch {
    writeStorage('alertas', readStorage<Alerta>('alertas').filter(a => a.id !== id));
  }
}

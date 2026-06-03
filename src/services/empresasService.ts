import { isApiEnabled, apiRequest } from './api';
import { toEmpresa } from '../adapters/empresaAdapter';
import { readStorage, writeStorage } from '../lib/storage';
import { empresaPayload } from '../lib/javaPayload';
import type { Empresa } from '../types/empresa';

export async function listarEmpresas(): Promise<Empresa[]> {
  if (!isApiEnabled) return readStorage<Empresa>('empresas');
  try {
    const data = await apiRequest<Record<string, unknown>[]>('/empresas');
    const list = data.map(toEmpresa);
    writeStorage('empresas', list);
    return list;
  } catch {
    return readStorage<Empresa>('empresas');
  }
}

export const listEmpresas = listarEmpresas;

export async function criarEmpresa(input: Empresa): Promise<Empresa> {
  if (!isApiEnabled) {
    const list = [input, ...readStorage<Empresa>('empresas')];
    writeStorage('empresas', list);
    return input;
  }
  try {
    const raw = await apiRequest<Record<string, unknown>>('/empresas', { method: 'POST', body: JSON.stringify(empresaPayload(input as unknown as Record<string, unknown>)) });
    return toEmpresa(raw);
  } catch {
    const list = [input, ...readStorage<Empresa>('empresas')];
    writeStorage('empresas', list);
    return input;
  }
}

export async function atualizarEmpresa(id: string, input: Empresa): Promise<Empresa> {
  if (!isApiEnabled) {
    const list = readStorage<Empresa>('empresas').map(e => e.id === id ? input : e);
    writeStorage('empresas', list);
    return input;
  }
  try {
    const raw = await apiRequest<Record<string, unknown>>(`/empresas/${id}`, { method: 'PUT', body: JSON.stringify(empresaPayload(input as unknown as Record<string, unknown>)) });
    return toEmpresa(raw);
  } catch {
    const list = readStorage<Empresa>('empresas').map(e => e.id === id ? input : e);
    writeStorage('empresas', list);
    return input;
  }
}

export async function removerEmpresa(id: string): Promise<void> {
  if (!isApiEnabled) {
    const list = readStorage<Empresa>('empresas').map(e => e.id === id ? { ...e, ativo: false } : e);
    writeStorage('empresas', list);
    return;
  }
  try {
    await apiRequest<void>(`/empresas/${id}`, { method: 'DELETE' });
  } catch {
    const list = readStorage<Empresa>('empresas').map(e => e.id === id ? { ...e, ativo: false } : e);
    writeStorage('empresas', list);
  }
}

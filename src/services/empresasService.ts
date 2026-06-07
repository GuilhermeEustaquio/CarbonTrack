import { apiRequest } from './api';
import { toEmpresa } from '../adapters/empresaAdapter';
import { readStorage, writeStorage } from '../lib/storage';
import { empresaPayload } from '../lib/javaPayload';
import type { Empresa } from '../types/empresa';

export async function listarEmpresas(): Promise<Empresa[]> {
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

export async function criarEmpresa(input: Empresa): Promise<void> {
  await apiRequest<unknown>('/empresas', {
    method: 'POST',
    body: JSON.stringify(empresaPayload(input as unknown as Record<string, unknown>)),
  });
}

export async function atualizarEmpresa(id: string, input: Empresa): Promise<void> {
  const numericId = Number(id);
  await apiRequest<unknown>(`/empresas/${Number.isFinite(numericId) && numericId > 0 ? numericId : id}`, {
    method: 'PUT',
    body: JSON.stringify(empresaPayload(input as unknown as Record<string, unknown>)),
  });
}

export async function removerEmpresa(id: string): Promise<void> {
  const numericId = Number(id);
  await apiRequest<unknown>(`/empresas/${Number.isFinite(numericId) && numericId > 0 ? numericId : id}`, { method: 'DELETE' });
}

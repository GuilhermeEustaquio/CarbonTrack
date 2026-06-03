import { isApiEnabled, apiRequest } from './api';
import { toAcao } from '../adapters/acaoAdapter';
import { readStorage, writeStorage } from '../lib/storage';
import type { AcaoMitigacao } from '../types/emissao';

export async function listarAcoes(): Promise<AcaoMitigacao[]> {
  if (!isApiEnabled) return readStorage<AcaoMitigacao>('acoes');
  try {
    const data = await apiRequest<Record<string, unknown>[]>('/acoes');
    const list = data.map(toAcao);
    writeStorage('acoes', list);
    return list;
  } catch {
    return readStorage<AcaoMitigacao>('acoes');
  }
}

export async function criarAcao(input: AcaoMitigacao): Promise<AcaoMitigacao> {
  if (!isApiEnabled) {
    const list = [input, ...readStorage<AcaoMitigacao>('acoes')];
    writeStorage('acoes', list);
    return input;
  }
  try {
    const raw = await apiRequest<Record<string, unknown>>('/acoes', { method: 'POST', body: JSON.stringify(input) });
    return toAcao(raw);
  } catch {
    const list = [input, ...readStorage<AcaoMitigacao>('acoes')];
    writeStorage('acoes', list);
    return input;
  }
}

export async function atualizarAcao(id: string, input: AcaoMitigacao): Promise<AcaoMitigacao> {
  if (!isApiEnabled) {
    const list = readStorage<AcaoMitigacao>('acoes').map(a => a.id === id ? input : a);
    writeStorage('acoes', list);
    return input;
  }
  try {
    const raw = await apiRequest<Record<string, unknown>>(`/acoes/${id}`, { method: 'PUT', body: JSON.stringify(input) });
    return toAcao(raw);
  } catch {
    const list = readStorage<AcaoMitigacao>('acoes').map(a => a.id === id ? input : a);
    writeStorage('acoes', list);
    return input;
  }
}

export async function removerAcao(id: string): Promise<void> {
  if (!isApiEnabled) {
    writeStorage('acoes', readStorage<AcaoMitigacao>('acoes').filter(a => a.id !== id));
    return;
  }
  try {
    await apiRequest<void>(`/acoes/${id}`, { method: 'DELETE' });
  } catch {
    writeStorage('acoes', readStorage<AcaoMitigacao>('acoes').filter(a => a.id !== id));
  }
}

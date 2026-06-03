import { isApiEnabled, apiRequest } from './api';
import { toEmissao } from '../adapters/emissaoAdapter';
import { readStorage, writeStorage } from '../lib/storage';
import type { Emissao } from '../types/emissao';

export async function listarEmissoes(): Promise<Emissao[]> {
  if (!isApiEnabled) return readStorage<Emissao>('emissoes');
  try {
    const data = await apiRequest<Record<string, unknown>[]>('/emissoes');
    const list = data.map(toEmissao);
    writeStorage('emissoes', list);
    return list;
  } catch {
    return readStorage<Emissao>('emissoes');
  }
}

export const listEmissoes = listarEmissoes;

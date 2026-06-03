import { isApiEnabled, apiRequest } from './api';
import { loadAllStorage } from '../lib/storage';

export async function obterRelatorios<T = unknown>(): Promise<T | null> {
  if (!isApiEnabled) return loadAllStorage() as T;
  try {
    return await apiRequest<T>('/relatorios');
  } catch {
    return loadAllStorage() as T;
  }
}

export const getRelatorios = obterRelatorios;

import { isApiEnabled, apiRequest } from './api';
import { loadAllStorage } from '../lib/storage';

export async function obterDashboard<T = unknown>(): Promise<T | null> {
  if (!isApiEnabled) return loadAllStorage() as T;
  try {
    return await apiRequest<T>('/dashboard');
  } catch {
    return loadAllStorage() as T;
  }
}

export const getDashboard = obterDashboard;

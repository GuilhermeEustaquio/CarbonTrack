export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const isApiEnabled = Boolean(API_BASE_URL);

export type ApiResult<T> = { data: T | null; error?: string; status?: number };

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Retorna true se o erro é causado por vínculo/dependência de dados (FK). */
export function isDependencyError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 409 || err.status >= 500);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!isApiEnabled) throw new Error('API indisponível: configure VITE_API_BASE_URL.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      signal: controller.signal,
      ...init,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      if (res.status === 409) {
        throw new ApiError('Não é possível excluir este item porque existem registros vinculados.', 409);
      }
      if (res.status >= 500) {
        throw new ApiError(
          'O servidor não concluiu a operação (erro ' + res.status + '). Pode haver registros vinculados impedindo a exclusão.',
          res.status,
        );
      }
      throw new Error(`Erro ${res.status} em ${path}${body ? ': ' + body : ''}`);
    }
    // API returns 201 (POST), 200 (PUT/DELETE) all with empty body — parse safely
    const text = await res.text();
    if (!text || !text.trim()) return undefined as T;
    return JSON.parse(text) as T;
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') throw new Error('Tempo limite atingido (35s). O servidor pode estar iniciando — tente novamente em alguns segundos.');
    throw err;
  }
}


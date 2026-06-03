export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const FORCE_MOCK = import.meta.env.VITE_FORCE_MOCK === 'true';
export const isApiEnabled = Boolean(API_BASE_URL) && !FORCE_MOCK;

// Alias retrocompatível — DataContext ainda usa USE_API até Phase 4
export const USE_API = isApiEnabled;

export type ApiResult<T> = { data: T | null; error?: string; status?: number; fromMock?: boolean };

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!isApiEnabled) throw new Error('API indisponível: configure VITE_API_BASE_URL.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...init,
    });
    clearTimeout(timer);
    if (res.status === 204) return undefined as T;
    if (!res.ok) throw new Error(`Erro ${res.status} ao acessar ${path}.`);
    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') throw new Error('Tempo limite atingido ao conectar na API.');
    throw err;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  if (!isApiEnabled) return { data: null, error: 'API Java indisponível: VITE_API_BASE_URL não configurada.', fromMock: true };
  try {
    const data = await apiRequest<T>(path, init);
    return { data, fromMock: false };
  } catch (err) {
    return { data: null, error: (err as Error).message, fromMock: true };
  }
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, b: unknown) => request<T>(p, { method: 'POST', body: JSON.stringify(b) }),
  put: <T>(p: string, b: unknown) => request<T>(p, { method: 'PUT', body: JSON.stringify(b) }),
  del: <T>(p: string) => request<T>(p, { method: 'DELETE' }),
  patch: <T>(p: string, b: unknown) => request<T>(p, { method: 'PATCH', body: JSON.stringify(b) }),
};

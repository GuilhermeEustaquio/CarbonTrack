import type { Alerta } from '../types/alerta';
import type { AcaoMitigacao, Emissao } from '../types/emissao';
import type { Empresa } from '../types/empresa';
import type { Unidade } from '../types/unidade';
import type { Caminhao } from '../types/caminhao';
import type { Motorista } from '../types/motorista';
import type { Rota } from '../types/rota';
import type { Viagem } from '../types/viagem';
import type { Combustivel } from '../types/combustivel';

export const COMBUSTIVEIS_SEED: Combustivel[] = [
  { id: '1', nome: 'Diesel S10', fatorEmissaoCarbono: 2.68 },
  { id: '2', nome: 'Diesel S500', fatorEmissaoCarbono: 2.68 },
  { id: '3', nome: 'Gasolina C', fatorEmissaoCarbono: 2.31 },
  { id: '4', nome: 'Etanol hidratado', fatorEmissaoCarbono: 1.51 },
  { id: '5', nome: 'GNV', fatorEmissaoCarbono: 2.00 },
];

/** Banco local — todas as coleções podem ser [] (sem seed). */
export interface Database {
  empresas: Empresa[];
  unidades: Unidade[];
  emissoes: Emissao[];
  alertas: Alerta[];
  acoes: AcaoMitigacao[];
  caminhoes: Caminhao[];
  motoristas: Motorista[];
  rotas: Rota[];
  viagens: Viagem[];
  combustiveis: Combustivel[];
}

const KEYS = {
  empresas:     'ct:empresas',
  unidades:     'ct:unidades',
  emissoes:     'ct:emissoes',
  alertas:      'ct:alertas',
  acoes:        'ct:acoes',
  caminhoes:    'ct:caminhoes',
  motoristas:   'ct:motoristas',
  rotas:        'ct:rotas',
  viagens:      'ct:viagens',
  combustiveis: 'ct:combustiveis',
} as const;

export type StorageKey = keyof typeof KEYS;

const can = () => typeof window !== 'undefined' && Boolean(window.localStorage);

export function readStorage<T>(key: StorageKey): T[] {
  if (!can()) return [];
  try {
    const raw = window.localStorage.getItem(KEYS[key]);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function writeStorage<T>(key: StorageKey, data: T[]): void {
  if (!can()) return;
  try {
    window.localStorage.setItem(KEYS[key], JSON.stringify(data));
  } catch { /* quota exceeded — ignorar */ }
}

export function loadAllStorage(): Database {
  return {
    empresas:     readStorage('empresas'),
    unidades:     readStorage('unidades'),
    emissoes:     readStorage('emissoes'),
    alertas:      readStorage('alertas'),
    acoes:        readStorage('acoes'),
    caminhoes:    readStorage('caminhoes'),
    motoristas:   readStorage('motoristas'),
    rotas:        readStorage('rotas'),
    viagens:      readStorage('viagens'),
    combustiveis: readStorage('combustiveis').length ? readStorage('combustiveis') : COMBUSTIVEIS_SEED,
  };
}

export function writeAllStorage(db: Database): void {
  (Object.keys(KEYS) as StorageKey[]).forEach(key => {
    writeStorage(key, db[key] as never[]);
  });
}

/** Apaga todo o cache local (ct: e chaves legadas carbontrack:). */
export function clearStorage(): void {
  if (!can()) return;
  Object.values(KEYS).forEach(k => window.localStorage.removeItem(k));
  // Limpar chaves legadas da versão anterior
  const legacy = ['carbontrack:empresas','carbontrack:unidades','carbontrack:emissoes',
    'carbontrack:alertas','carbontrack:acoes','carbontrack:caminhoes','carbontrack:motoristas',
    'carbontrack:rotas','carbontrack:viagens','carbontrack:initialized','carbontrack:dataVersion'];
  legacy.forEach(k => window.localStorage.removeItem(k));
}

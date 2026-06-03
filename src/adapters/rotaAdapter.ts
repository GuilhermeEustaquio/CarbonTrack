import { normalizeAtivo } from '../utils/validators';
import type { Rota } from '../types/rota';

type Raw = Record<string, unknown>;
const v = (raw: Raw, ...keys: string[]) => keys.map(k => raw[k]).find(x => x !== undefined && x !== null && String(x) !== '');
const num = (raw: Raw, ...keys: string[]) => { const n = Number(v(raw, ...keys)); return Number.isFinite(n) ? n : undefined; };

export function toRota(raw: Raw): Rota {
  const origem = String(v(raw, 'origem', 'ORIGEM') ?? '');
  const destino = String(v(raw, 'destino', 'DESTINO') ?? '');
  const nome = String(v(raw, 'nome', 'NOME', 'nomeRota', 'nome_rota', 'NOME_ROTA') ?? `${origem} → ${destino}`).trim();
  return {
    id: String(v(raw, 'id', 'ID', 'idRota', 'id_rota', 'ID_ROTA') ?? ''),
    nome,
    origem,
    destino,
    distanciaKm: num(raw, 'distanciaKm', 'distancia_km', 'DISTANCIA_KM', 'distancia') ?? 0,
    regiao: String(v(raw, 'regiao', 'REGIAO') ?? ''),
    origemLat: num(raw, 'origemLat', 'origem_lat', 'ORIGEM_LAT'),
    origemLon: num(raw, 'origemLon', 'origem_lon', 'ORIGEM_LON'),
    destinoLat: num(raw, 'destinoLat', 'destino_lat', 'DESTINO_LAT'),
    destinoLon: num(raw, 'destinoLon', 'destino_lon', 'DESTINO_LON'),
    ativo: normalizeAtivo(raw.ativo ?? true),
  };
}

import type { Viagem } from '../types/viagem';

type Raw = Record<string, unknown>;

export function toViagem(raw: Raw): Viagem {
  return {
    id: String(raw.id ?? raw.ID ?? raw.idViagem ?? raw.id_viagem ?? raw.ID_VIAGEM ?? ''),
    dataViagem: String(raw.dataViagem ?? raw.DATA_VIAGEM ?? raw.data_viagem ?? raw.data ?? new Date().toISOString().slice(0, 10)),
    cargaTransportadaKg: Number(raw.cargaTransportadaKg ?? raw.CARGA_TRANSPORTADA_KG ?? raw.carga_transportada_kg ?? raw.carga ?? 0),
    distanciaPercorridaKm: Number(raw.distanciaPercorridaKm ?? raw.DISTANCIA_PERCORRIDA_KM ?? raw.distancia_percorrida_km ?? raw.distancia ?? 0),
    caminhaoId: String(raw.caminhaoId ?? raw.caminhao_id ?? raw.CAMINHAO_ID ?? raw.ID_CAMINHAO ?? raw.id_caminhao ?? ''),
    motoristaId: String(raw.motoristaId ?? raw.motorista_id ?? raw.MOTORISTA_ID ?? raw.ID_MOTORISTA ?? raw.id_motorista ?? ''),
    rotaId: String(raw.rotaId ?? raw.rota_id ?? raw.ROTA_ID ?? raw.ID_ROTA ?? raw.id_rota ?? ''),
    combustivelId: String(raw.combustivelId ?? raw.combustivel_id ?? raw.COMBUSTIVEL_ID ?? raw.ID_COMBUSTIVEL ?? raw.id_combustivel ?? ''),
    placa: raw.placa ? String(raw.placa) : undefined,
    motorista: raw.motorista ? String(raw.motorista) : undefined,
    rota: raw.rota ? String(raw.rota) : undefined,
    empresa: raw.empresa ? String(raw.empresa) : undefined,
    empresaId: (raw.empresaId ?? raw.empresa_id ?? raw.EMPRESA_ID) ? String(raw.empresaId ?? raw.empresa_id ?? raw.EMPRESA_ID) : undefined,
    status: (raw.status as Viagem['status']) ?? 'planejada',
  };
}

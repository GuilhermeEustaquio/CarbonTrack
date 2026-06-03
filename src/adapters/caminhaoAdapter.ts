import { normalizeAtivo } from '../utils/validators';
import type { Caminhao } from '../types/caminhao';

type Raw = Record<string, unknown>;

export function toCaminhao(raw: Raw): Caminhao {
  return {
    id: String(raw.id ?? raw.ID ?? raw.idCaminhao ?? raw.id_caminhao ?? raw.ID_CAMINHAO ?? ''),
    placa: String(raw.placa ?? raw.PLACA ?? ''),
    modelo: String(raw.modelo ?? raw.MODELO ?? ''),
    anoFabricacao: Number(raw.anoFabricacao ?? raw.ANO_FABRICACAO ?? raw.ano_fabricacao ?? raw.ano ?? new Date().getFullYear()),
    capacidadeCarga: Number(raw.capacidadeCarga ?? raw.CAPACIDADE_CARGA ?? raw.capacidade_carga ?? 0),
    empresaId: String(raw.empresaId ?? raw.empresa_id ?? raw.EMPRESA_ID ?? raw.ID_EMPRESA ?? raw.id_empresa ?? ''),
    empresa: String(raw.empresa ?? raw.EMPRESA ?? ''),
    ativo: normalizeAtivo(raw.ativo ?? true),
  };
}

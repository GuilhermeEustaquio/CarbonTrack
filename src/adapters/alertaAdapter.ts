import type { Alerta } from '../types/alerta';
import type { NivelAlerta } from '../types/common';

type Raw = Record<string, unknown>;

export function toAlerta(raw: Raw): Alerta {
  return {
    id: String(raw.id ?? raw.ID ?? raw.idAlerta ?? raw.id_alerta ?? raw.ID_ALERTA ?? ''),
    tipo: String(raw.tipo ?? raw.TIPO ?? ''),
    descricao: String(raw.descricao ?? raw.DESCRICAO ?? raw.desc ?? ''),
    nivel: (raw.nivel ?? raw.NIVEL ?? 'info') as NivelAlerta,
    dataGeracao: String(raw.dataGeracao ?? raw.DATA_GERACAO ?? raw.data_geracao ?? raw.tempo ?? new Date().toISOString().slice(0, 10)),
    empresaId: String(raw.empresaId ?? raw.empresa_id ?? raw.EMPRESA_ID ?? raw.ID_EMPRESA ?? raw.id_empresa ?? ''),
    empresa: raw.empresa ? String(raw.empresa) : undefined,
    lido: Boolean(raw.lido ?? false),
    resolvido: Boolean(raw.resolvido ?? false),
  };
}

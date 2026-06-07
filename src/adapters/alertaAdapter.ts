import type { Alerta } from '../types/alerta';
import type { NivelAlerta } from '../types/common';

type Raw = Record<string, unknown>;

// Java sets nivel to "ALTO" — normalize to frontend keys critico/atencao/info
function normalizeNivel(v: unknown): NivelAlerta {
  const s = String(v ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (s === 'critico' || s.startsWith('crit') || s === 'alto' || s.startsWith('alt')) return 'critico';
  if (s === 'atencao' || s.startsWith('aten') || s === 'medio' || s.startsWith('med') || s === 'warn') return 'atencao';
  return 'info';
}

export function toAlerta(raw: Raw): Alerta {
  return {
    id: String(raw.id ?? raw.ID ?? raw.idAlerta ?? raw.id_alerta ?? raw.ID_ALERTA ?? ''),
    tipo: String(raw.tipo ?? raw.TIPO ?? 'Alerta ambiental'),
    descricao: String(raw.descricao ?? raw.DESCRICAO ?? raw.desc ?? ''),
    nivel: normalizeNivel(raw.nivel ?? raw.NIVEL ?? 'info'),
    dataGeracao: String(raw.dataGeracao ?? raw.DATA_GERACAO ?? raw.data_geracao ?? raw.tempo ?? new Date().toISOString().slice(0, 10)),
    empresaId: String(raw.empresaId ?? raw.empresa_id ?? raw.EMPRESA_ID ?? raw.ID_EMPRESA ?? raw.id_empresa ?? ''),
    empresa: raw.empresa ? String(raw.empresa) : undefined,
    viagemId: raw.viagemId ? String(raw.viagemId) : undefined,
    lido: Boolean(raw.lido ?? false),
    resolvido: Boolean(raw.resolvido ?? false),
  };
}

import { normalizeAtivo } from '../utils/validators';
import type { Unidade } from '../types/unidade';
import type { RiscoAmbiental } from '../types/common';

type Raw = Record<string, unknown>;

export function toUnidade(raw: Raw): Unidade {
  return {
    id: String(raw.id ?? raw.idUnidade ?? raw.ID_UNIDADE ?? ''),
    nome: String(raw.nome ?? raw.NOME ?? ''),
    empresaId: String(raw.empresaId ?? raw.EMPRESA_ID ?? raw.id_empresa ?? ''),
    empresa: String(raw.empresa ?? raw.EMPRESA ?? ''),
    tipo: String(raw.tipo ?? raw.TIPO ?? 'Fábrica'),
    lat: Number(raw.lat ?? raw.LAT ?? raw.latitude ?? raw.LATITUDE ?? 0),
    lon: Number(raw.lon ?? raw.LON ?? raw.longitude ?? raw.LONGITUDE ?? raw.lng ?? 0),
    area: Number(raw.area ?? raw.AREA ?? 0),
    coberturaVeg: Number(raw.coberturaVeg ?? raw.COBERTURA_VEG ?? raw.cobertura_vegetal ?? raw.COBERTURA_VEGETAL ?? 0),
    tempMedia: Number(raw.tempMedia ?? raw.TEMP_MEDIA ?? raw.temperatura_media ?? raw.TEMPERATURA_MEDIA ?? 0),
    risco: (raw.risco ?? raw.RISCO ?? 'medio') as RiscoAmbiental,
    emissaoMes: Number(raw.emissaoMes ?? raw.EMISSAO_MES ?? raw.emissao_mes ?? 0),
    uf: String(raw.uf ?? raw.UF ?? 'SP').toUpperCase().slice(0, 2),
    ativo: normalizeAtivo(raw.ativo ?? true),
  };
}

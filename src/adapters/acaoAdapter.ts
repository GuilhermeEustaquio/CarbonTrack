import type { AcaoMitigacao, StatusAcao } from '../types/emissao';

type Raw = Record<string, unknown>;

export function toAcao(raw: Raw): AcaoMitigacao {
  return {
    id: String(raw.id ?? raw.idAcao ?? raw.ID_ACAO ?? ''),
    empresaId: String(raw.empresaId ?? raw.EMPRESA_ID ?? raw.id_empresa ?? ''),
    unidadeId: String(raw.unidadeId ?? raw.UNIDADE_ID ?? raw.id_unidade ?? ''),
    tipo: String(raw.tipo ?? raw.TIPO ?? ''),
    descricao: String(raw.descricao ?? raw.DESCRICAO ?? ''),
    impactoEstimado: Number(raw.impactoEstimado ?? raw.IMPACTO_ESTIMADO ?? raw.impacto_estimado ?? 0),
    status: (raw.status ?? 'planejada') as StatusAcao,
    inicio: String(raw.inicio ?? raw.INICIO ?? raw.dataInicio ?? raw.DATA_INICIO ?? new Date().toISOString().slice(0, 10)),
    prazo: String(raw.prazo ?? raw.PRAZO ?? raw.dataPrazo ?? raw.DATA_PRAZO ?? new Date().toISOString().slice(0, 10)),
  };
}

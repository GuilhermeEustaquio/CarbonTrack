import type { Emissao } from '../types/emissao';

type Raw = Record<string, unknown>;

// Java returns "Baixo Impacto" / "Médio Impacto" / "Alto Impacto" — normalize to frontend keys
function normalizeImpacto(v: unknown): Emissao['indiceImpactoAmbiental'] {
  const s = String(v ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (s.startsWith('alt')) return 'alto';
  if (s.startsWith('med')) return 'medio';
  return 'baixo';
}

export function toEmissao(raw: Raw): Emissao {
  return {
    id: String(raw.id ?? raw.ID ?? raw.idEmissao ?? raw.id_emissao ?? raw.ID_EMISSAO ?? ''),
    viagemId: String(raw.viagemId ?? raw.viagem_id ?? raw.VIAGEM_ID ?? raw.ID_VIAGEM ?? raw.id_viagem ?? ''),
    consumoEstimadoLitros: Number(raw.consumoEstimadoLitros ?? raw.CONSUMO_ESTIMADO_LITROS ?? raw.consumo_estimado_litros ?? 0),
    co2EmitidoKg: Number(raw.co2EmitidoKg ?? raw.CO2_EMITIDO_KG ?? raw.co2_emitido_kg ?? raw.emissao ?? 0),
    indiceImpactoAmbiental: normalizeImpacto(raw.indiceImpactoAmbiental ?? raw.INDICE_IMPACTO_AMBIENTAL ?? raw.indice_impacto_ambiental ?? 'medio'),
    // Java Emissao has no dataCalculo — will be filled from viagem.dataViagem in DataContext.fetchAll
    dataCalculo: String(raw.dataCalculo ?? raw.DATA_CALCULO ?? raw.data_calculo ?? raw.data ?? ''),
  };
}

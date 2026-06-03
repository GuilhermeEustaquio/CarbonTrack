import type { Emissao } from '../types/emissao';

type Raw = Record<string, unknown>;

export function toEmissao(raw: Raw): Emissao {
  return {
    id: String(raw.id ?? raw.ID ?? raw.idEmissao ?? raw.id_emissao ?? raw.ID_EMISSAO ?? ''),
    viagemId: String(raw.viagemId ?? raw.viagem_id ?? raw.VIAGEM_ID ?? raw.ID_VIAGEM ?? raw.id_viagem ?? ''),
    consumoEstimadoLitros: Number(raw.consumoEstimadoLitros ?? raw.CONSUMO_ESTIMADO_LITROS ?? raw.consumo_estimado_litros ?? 0),
    co2EmitidoKg: Number(raw.co2EmitidoKg ?? raw.CO2_EMITIDO_KG ?? raw.co2_emitido_kg ?? raw.emissao ?? 0),
    indiceImpactoAmbiental: String(raw.indiceImpactoAmbiental ?? raw.INDICE_IMPACTO_AMBIENTAL ?? raw.indice_impacto_ambiental ?? 'medio'),
    dataCalculo: String(raw.dataCalculo ?? raw.DATA_CALCULO ?? raw.data_calculo ?? raw.data ?? new Date().toISOString().slice(0, 10)),
  };
}

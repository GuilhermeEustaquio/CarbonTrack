import type { Combustivel } from '../types/combustivel';

type Raw = Record<string, unknown>;

export function toCombustivel(raw: Raw): Combustivel {
  return {
    id: String(raw.id ?? raw.ID ?? raw.idCombustivel ?? raw.id_combustivel ?? raw.ID_COMBUSTIVEL ?? ''),
    nome: String(raw.nome ?? raw.NOME ?? ''),
    fatorEmissaoCarbono: Number(raw.fatorEmissaoCarbono ?? raw.FATOR_EMISSAO_CARBONO ?? raw.fator_emissao_carbono ?? 0),
  };
}

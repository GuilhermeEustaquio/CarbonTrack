import { normalizeAtivo } from '../utils/validators';
import type { Motorista } from '../types/motorista';

type Raw = Record<string, unknown>;

export function toMotorista(raw: Raw): Motorista {
  return {
    id: String(raw.id ?? raw.ID ?? raw.idMotorista ?? raw.id_motorista ?? raw.ID_MOTORISTA ?? ''),
    nome: String(raw.nome ?? raw.NOME ?? ''),
    cpf: String(raw.cpf ?? raw.CPF ?? ''),
    numeroCnh: String(raw.numeroCnh ?? raw.NUMERO_CNH ?? raw.numero_cnh ?? raw.cnh ?? raw.CNH ?? ''),
    validadeCnh: String(raw.validadeCnh ?? raw.VALIDADE_CNH ?? raw.validade_cnh ?? ''),
    empresaId: String(raw.empresaId ?? raw.empresa_id ?? raw.EMPRESA_ID ?? raw.ID_EMPRESA ?? raw.id_empresa ?? ''),
    empresa: String(raw.empresa ?? raw.EMPRESA ?? ''),
    ativo: normalizeAtivo(raw.ativo ?? true),
  };
}
